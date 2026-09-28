/**
 * chat.schemas.ts
 *
 * Zod schemas for validating all chat-related requests and tool arguments.
 */
import { z } from 'zod';

// ─── HTTP request body ────────────────────────────────────────────────────────

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'message must not be empty')
    .max(2000, 'message must not exceed 2000 characters'),
  conversationId: z.string().uuid().optional(),
});

// ─── Tool argument schemas ────────────────────────────────────────────────────

export const getCourseInformationSchema = z.object({
  course: z.enum(['MATH', 'CODING', 'ENGLISH', 'SCIENCE']).nullable().optional(),
});

export const getTrialClassInformationSchema = z.object({
  topic: z
    .enum([
      'duration',
      'how_it_works',
      'mentor_assignment',
      'timezone_display',
      'class_link',
      'login_registration',
      'how_to_book',
    ])
    .nullable()
    .optional(),
});

export const getAuthenticationStatusSchema = z.object({});

export const redirectToLoginSchema = z.object({
  reason: z.string().nullable().optional(),
});

export const getAvailableSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  parentTimezone: z.string().min(1, 'parentTimezone is required'),
});

export const sendBookingOtpSchema = z.object({
  course: z.enum(['MATH', 'CODING', 'ENGLISH', 'SCIENCE']).nullable().optional(),
  studentGrade: z.string().nullable().optional(),
  startUtc: z.string().datetime({ message: 'startUtc must be a valid ISO 8601 UTC timestamp' }).nullable().optional(),
});

export const confirmBookingSchema = z.object({
  otpCode: z.string().min(4, 'A valid OTP code is required (e.g. 123456)').nullable().optional(),
  startUtc: z.string().datetime({ message: 'startUtc must be a valid ISO 8601 UTC timestamp' }),
  course: z.enum(['MATH', 'CODING', 'ENGLISH', 'SCIENCE']).nullable().optional(),
  studentGrade: z.string().nullable().optional(),
  parentTimezone: z.string().nullable().optional(),
  trialRequestId: z.string().nullable().optional(),
  explicitConfirmation: z.literal(true, {
    errorMap: () => ({ message: 'explicitConfirmation must be true to proceed with booking' }),
  }),
});

export const getMyBookingsSchema = z.object({});

export const loginUserSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const logoutUserSchema = z.object({});

export const navigateToPageSchema = z.object({
  page: z.enum([
    'home',
    'courses',
    'math',
    'coding',
    'english',
    'science',
    'blog',
    'contact',
    'terms',
    'privacy',
    'login',
    'register',
    'dashboard',
    'book_trial',
    'admin_dashboard',
    'admin_mentors',
    'admin_bookings',
  ]),
  reason: z.string().nullable().optional(),
});

export const redirectToBookingPageSchema = z.object({
  reason: z.string().nullable().optional(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type GetCourseInformationArgs = z.infer<typeof getCourseInformationSchema>;
export type GetTrialClassInformationArgs = z.infer<typeof getTrialClassInformationSchema>;
export type GetAvailableSlotsArgs = z.infer<typeof getAvailableSlotsSchema>;
export type ConfirmBookingArgs = z.infer<typeof confirmBookingSchema>;
export type LoginUserArgs = z.infer<typeof loginUserSchema>;
