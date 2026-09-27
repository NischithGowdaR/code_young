import { z } from 'zod';

export const SPECIAL_CHARACTERS_REGEX = /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~`]/;

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(SPECIAL_CHARACTERS_REGEX, 'Password must contain at least one special character');

export const sendRegistrationOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: strongPasswordSchema,
    confirmPassword: z.string().optional(),
    phoneNumber: z.string().optional(),
    timezone: z.string().optional().default('Asia/Kolkata'),
    otpCode: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== null && data.confirmPassword !== '') {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

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
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
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

