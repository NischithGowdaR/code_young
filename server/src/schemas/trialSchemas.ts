import { z } from 'zod';
import { IANAZone } from 'luxon';
import { Course } from '@prisma/client';

export const trialRequestSchema = z.object({
  parentName: z.string().trim().min(2, 'Parent name is required'),
  parentEmail: z.string().trim().email('Invalid email address'),
  parentPhone: z
    .string()
    .trim()
    .min(7, 'Valid phone number is required')
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format'),
  studentGrade: z.string().trim().min(1, 'Student grade is required'),
  studentSubject: z.string().trim().optional().default('General'),
  course: z.nativeEnum(Course, {
    errorMap: () => ({ message: 'Course is required' }),
  }),
  timezone: z
    .string()
    .trim()
    .refine((tz) => IANAZone.isValidZone(tz), {
      message: 'Invalid IANA timezone',
    }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Terms of Use must be accepted' }),
  }),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Privacy Policy must be accepted' }),
  }),
});

export type TrialRequestInput = z.infer<typeof trialRequestSchema>;
