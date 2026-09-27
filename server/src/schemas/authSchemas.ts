import { z } from 'zod';

export const sendRegistrationOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional().default('Asia/Kolkata'),
  otpCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const sendForgotPasswordOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyForgotPasswordOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otpCode: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SendRegistrationOtpInput = z.infer<typeof sendRegistrationOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendForgotPasswordOtpInput = z.infer<typeof sendForgotPasswordOtpSchema>;
export type VerifyForgotPasswordOtpInput = z.infer<typeof verifyForgotPasswordOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
