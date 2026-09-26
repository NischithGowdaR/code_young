import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OtpPurpose } from '@prisma/client';
import { IOtpService, SendOtpResult, VerifyOtpResult } from './otpService.interface.js';
import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/errors.js';

export interface OtpRecordInMemory {
  id: string;
  phoneNumber: string;
  purpose: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  verifiedAt?: Date | null;
  createdAt: Date;
}

// In-memory fallback for development & tests when live DB is bypassed
export const inMemoryOtps = new Map<string, OtpRecordInMemory>();

export class DevelopmentOtpService implements IOtpService {
  private OTP_EXPIRY_MINUTES = 10;
  private COOLDOWN_SECONDS = 60;
  private MAX_ATTEMPTS = 5;

  private generateCode(): string {
    if (process.env.NODE_ENV === 'test') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(phoneNumber: string, purpose: string): Promise<SendOtpResult> {
    const code = this.generateCode();
    const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    const codeHash = await bcrypt.hash(code, saltRounds);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
    const otpId = `otp_${crypto.randomUUID()}`;

    // Development logging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP SERVICE] Generated OTP for ${phoneNumber} (${purpose}): ${code}`);
    }

    let latestOtp: OtpRecordInMemory | null = null;

    if (process.env.NODE_ENV === 'test') {
      // In test mode, use in-memory store directly to avoid Prisma 5s DB connection timeouts
      const memMatches = Array.from(inMemoryOtps.values())
        .filter((o) => o.phoneNumber === phoneNumber && o.purpose === purpose)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      latestOtp = memMatches[0] || null;
    } else {
      try {
        const dbRecord = await prisma.otpVerification.findFirst({
          where: { phoneNumber, purpose: purpose as OtpPurpose },
          orderBy: { createdAt: 'desc' },
        });
        if (dbRecord) {
          latestOtp = {
            id: dbRecord.id,
            phoneNumber: dbRecord.phoneNumber,
            purpose: dbRecord.purpose,
            codeHash: dbRecord.codeHash,
            expiresAt: dbRecord.expiresAt,
            attempts: dbRecord.attempts,
            verifiedAt: dbRecord.verifiedAt,
            createdAt: dbRecord.createdAt,
          };
        }
      } catch {
        const memMatches = Array.from(inMemoryOtps.values())
          .filter((o) => o.phoneNumber === phoneNumber && o.purpose === purpose)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        latestOtp = memMatches[0] || null;
      }
    }

    if (latestOtp && !latestOtp.verifiedAt) {
      const secondsSinceLast = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
      if (secondsSinceLast < this.COOLDOWN_SECONDS) {
        const remainingCooldown = Math.ceil(this.COOLDOWN_SECONDS - secondsSinceLast);
        throw new AppError(
          `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
          429,
          'Too Many Requests'
        );
      }
    }

    const record: OtpRecordInMemory = {
      id: otpId,
      phoneNumber,
      purpose,
      codeHash,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    };

    inMemoryOtps.set(otpId, record);

    if (process.env.NODE_ENV !== 'test') {
      try {
        await prisma.otpVerification.create({
          data: {
            id: otpId,
            phoneNumber,
            purpose: purpose as OtpPurpose,
            codeHash,
            expiresAt,
            attempts: 0,
          },
        });
      } catch {
        // use in-memory
      }
    }

    return {
      otpId,
      expiresAt,
      cooldownSeconds: this.COOLDOWN_SECONDS,
      rawCode: code,
    };
  }

  async resendOtp(phoneNumber: string, purpose: string): Promise<SendOtpResult> {
    return this.sendOtp(phoneNumber, purpose);
  }

  async verifyOtp(phoneNumber: string, purpose: string, code: string): Promise<VerifyOtpResult> {
    let latestOtp: OtpRecordInMemory | null = null;
    let isFromDb = false;

    if (process.env.NODE_ENV === 'test') {
      const memMatches = Array.from(inMemoryOtps.values())
        .filter((o) => o.phoneNumber === phoneNumber && o.purpose === purpose)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      latestOtp = memMatches[0] || null;
    } else {
      try {
        const dbRecord = await prisma.otpVerification.findFirst({
          where: { phoneNumber, purpose: purpose as OtpPurpose },
          orderBy: { createdAt: 'desc' },
        });
        if (dbRecord) {
          isFromDb = true;
          latestOtp = {
            id: dbRecord.id,
            phoneNumber: dbRecord.phoneNumber,
            purpose: dbRecord.purpose,
            codeHash: dbRecord.codeHash,
            expiresAt: dbRecord.expiresAt,
            attempts: dbRecord.attempts,
            verifiedAt: dbRecord.verifiedAt,
            createdAt: dbRecord.createdAt,
          };
        }
      } catch {
        // fallback
      }

      if (!latestOtp) {
        const memMatches = Array.from(inMemoryOtps.values())
          .filter((o) => o.phoneNumber === phoneNumber && o.purpose === purpose)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        latestOtp = memMatches[0] || null;
      }
    }

    if (!latestOtp) {
      throw new AppError(
        'No OTP request found for this phone number. Please request a new OTP.',
        404,
        'Not Found'
      );
    }

    if (latestOtp.verifiedAt) {
      throw new AppError('This OTP has already been verified.', 400, 'Bad Request');
    }

    if (latestOtp.expiresAt < new Date()) {
      throw new AppError('OTP has expired. Please request a new OTP.', 400, 'Bad Request');
    }

    if (latestOtp.attempts >= this.MAX_ATTEMPTS) {
      throw new AppError(
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        429,
        'Too Many Requests'
      );
    }

    // Increment attempts
    latestOtp.attempts += 1;
    inMemoryOtps.set(latestOtp.id, latestOtp);

    if (isFromDb) {
      try {
        await prisma.otpVerification.update({
          where: { id: latestOtp.id },
          data: { attempts: latestOtp.attempts },
        });
      } catch {
        // ignore
      }
    }

    // Compare code
    const isMatch = await bcrypt.compare(code, latestOtp.codeHash);
    if (!isMatch) {
      const remainingAttempts = this.MAX_ATTEMPTS - latestOtp.attempts;
      if (remainingAttempts <= 0) {
        throw new AppError(
          'Maximum OTP verification attempts exceeded. Please request a new OTP.',
          429,
          'Too Many Requests'
        );
      }
      throw new AppError(
        `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
        400,
        'Bad Request'
      );
    }

    // Mark verified
    const now = new Date();
    latestOtp.verifiedAt = now;
    inMemoryOtps.set(latestOtp.id, latestOtp);

    if (isFromDb) {
      try {
        await prisma.otpVerification.update({
          where: { id: latestOtp.id },
          data: { verifiedAt: now },
        });
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      message: 'Phone number verified successfully.',
    };
  }
}
