import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../config/jwt.js';
import {
  RegisterInput,
  LoginInput,
  SendRegistrationOtpInput,
  SendForgotPasswordOtpInput,
  VerifyForgotPasswordOtpInput,
  ResetPasswordInput,
} from '../schemas/authSchemas.js';
import { getEmailService } from './email/developmentEmailService.js';
import { DevelopmentOtpService } from './otp/developmentOtpService.js';
import { AppError } from '../utils/errors.js';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const generateTokens = async (userId: string, email: string, role: UserRole) => {
  const accessToken = jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ userId, email, role }, JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

export const sendRegistrationOtp = async (data: SendRegistrationOtpInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'Conflict');
  }

  const emailOtpStore = new DevelopmentOtpService();
  const result = await emailOtpStore.sendOtp(normalizedEmail, 'EMAIL_VERIFICATION');

  if (result.rawCode) {
    const emailService = getEmailService();
    try {
      await emailService.sendOtpEmail(normalizedEmail, data.name || 'Parent', result.rawCode);
    } catch (err) {
      console.error('[EMAIL OTP DISPATCH ERROR]:', err);
    }
  }

  return {
    message: 'Verification OTP has been sent to your email address.',
    cooldownSeconds: result.cooldownSeconds,
  };
};

export const registerUser = async (data: RegisterInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'Conflict');
  }

  const cleanPhone =
    data.phoneNumber && data.phoneNumber.trim() !== '' ? data.phoneNumber.trim() : null;

  if (cleanPhone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });
    if (existingPhone) {
      throw new AppError(
        'A user with this phone number is already registered. Please use another phone number or leave it blank.',
        409,
        'Conflict'
      );
    }
  }

  // If OTP code is provided, verify it
  if (data.otpCode) {
    const emailOtpStore = new DevelopmentOtpService();
    await emailOtpStore.verifyOtp(normalizedEmail, 'EMAIL_VERIFICATION', data.otpCode.trim());
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        phoneNumber: cleanPhone,
        passwordHash,
        role: UserRole.PARENT,
        timezone: data.timezone || 'Asia/Kolkata',
      },
    });

    const { accessToken, refreshToken } = await generateTokens(user.id, user.email, user.role);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      const target = (err as { meta?: { target?: string[] } }).meta?.target;
      if (target && target.includes('phoneNumber')) {
        throw new AppError(
          'This phone number is already registered to another account. Please provide a different number or leave it blank.',
          409,
          'Conflict'
        );
      }
      throw new AppError('An account with this email or phone number already exists.', 409, 'Conflict');
    }
    throw err;
  }
};

export const loginUser = async (data: LoginInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'Unauthorized');
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401, 'Unauthorized');
  }

  const { accessToken, refreshToken } = await generateTokens(user.id, user.email, user.role);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

export const rotateRefreshToken = async (oldRefreshToken: string) => {
  try {
    jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'Unauthorized');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token revoked or invalid', 401, 'Unauthorized');
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // Issue new tokens
  const { accessToken, refreshToken } = await generateTokens(
    storedToken.user.id,
    storedToken.user.email,
    storedToken.user.role
  );

  return {
    user: sanitizeUser(storedToken.user),
    accessToken,
    refreshToken,
  };
};

export const revokeRefreshToken = async (refreshToken: string) => {
  try {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true },
    });
  } catch {
    // Ignore invalid tokens on logout
  }
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'Not Found');
  }

  return sanitizeUser(user);
};

export const sendForgotPasswordOtp = async (data: SendForgotPasswordOtpInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(
      'No account found with this email address. Please make sure you have registered first.',
      404,
      'Not Found'
    );
  }

  const otpService = new DevelopmentOtpService();
  const result = await otpService.sendOtp(normalizedEmail, 'PASSWORD_RESET');

  if (result.rawCode) {
    const emailService = getEmailService();
    try {
      await emailService.sendPasswordResetOtpEmail(normalizedEmail, user.name, result.rawCode);
    } catch (err) {
      console.error('[PASSWORD RESET EMAIL ERROR]:', err);
    }
  }

  return {
    message: 'A 6-digit OTP has been sent to your email.',
    cooldownSeconds: result.cooldownSeconds,
  };
};

export const verifyForgotPasswordOtp = async (data: VerifyForgotPasswordOtpInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('No account found with this email address.', 404, 'Not Found');
  }

  const otpService = new DevelopmentOtpService();
  await otpService.verifyOtp(normalizedEmail, 'PASSWORD_RESET', data.otpCode.trim());

  // Generate a signed temporary reset token valid for 15 minutes
  const resetToken = jwt.sign(
    {
      email: normalizedEmail,
      userId: user.id,
      purpose: 'PASSWORD_RESET',
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return {
    message: 'OTP verified successfully.',
    resetToken,
  };
};

export const resetPasswordWithToken = async (data: ResetPasswordInput) => {
  const normalizedEmail = data.email.toLowerCase().trim();

  let decoded: { email: string; userId?: string; purpose: string };
  try {
    decoded = jwt.verify(data.resetToken, JWT_SECRET) as {
      email: string;
      userId?: string;
      purpose: string;
    };
  } catch {
    throw new AppError(
      'Invalid or expired password reset session. Please request a new OTP.',
      400,
      'Bad Request'
    );
  }

  if (
    !decoded ||
    decoded.purpose !== 'PASSWORD_RESET' ||
    decoded.email.toLowerCase().trim() !== normalizedEmail
  ) {
    throw new AppError('Invalid password reset token.', 400, 'Bad Request');
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('User not found.', 404, 'Not Found');
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Revoke all existing refresh tokens for this user for security
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true },
  });

  // Automatically generate fresh tokens so the user can be logged in
  const { accessToken, refreshToken } = await generateTokens(
    updatedUser.id,
    updatedUser.email,
    updatedUser.role
  );

  return {
    message: 'Your password has been reset successfully.',
    user: sanitizeUser(updatedUser),
    accessToken,
    refreshToken,
  };
};
