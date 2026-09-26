import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { trialRequestSchema } from '../schemas/trialSchemas.js';
import { getOtpService } from '../services/otp/otpServiceFactory.js';
import { getEmailService } from '../services/email/developmentEmailService.js';
import { AppError } from '../utils/errors.js';
import { z } from 'zod';

export const trialRouter = express.Router();

export interface PendingTrialRequest {
  id: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentGrade: string;
  studentSubject: string;
  course: string;
  timezone: string;
  phoneVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

// In-memory pending trial requests store (prepared for phone OTP verification step)
export const pendingTrialRequests = new Map<string, PendingTrialRequest>();

const verifyCodeSchema = z.object({
  code: z.string().trim().min(4, 'OTP code is required'),
});

// POST /api/trial-requests
trialRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = trialRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: parseResult.error.errors.map((e) => e.message).join(', '),
        details: parseResult.error.flatten(),
      });
      return;
    }

    const data = parseResult.data;
    const trialRequestId = `tr_${crypto.randomUUID()}`;

    const record: PendingTrialRequest = {
      id: trialRequestId,
      parentName: data.parentName,
      parentEmail: data.parentEmail.toLowerCase(),
      parentPhone: data.parentPhone,
      studentGrade: data.studentGrade,
      studentSubject: data.studentSubject,
      course: data.course,
      timezone: data.timezone,
      phoneVerified: false,
      createdAt: new Date(),
    };

    pendingTrialRequests.set(trialRequestId, record);

    res.status(201).json({
      trialRequestId,
      message: 'Trial request submitted successfully. Proceeding to phone OTP verification.',
      data: {
        trialRequestId,
        parentName: record.parentName,
        parentEmail: record.parentEmail,
        parentPhone: record.parentPhone,
        course: record.course,
        timezone: record.timezone,
        phoneVerified: record.phoneVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trial-requests/:id/send-otp
trialRouter.post('/:id/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trialRequestId = req.params.id;
    const record = pendingTrialRequests.get(trialRequestId);

    if (!record) {
      throw new AppError('Trial request not found', 404, 'Not Found');
    }

    const otpService = getOtpService();
    const result = await otpService.sendOtp(record.parentPhone, 'PHONE_VERIFICATION');

    if (result.rawCode && record.parentEmail) {
      const emailService = getEmailService();
      try {
        await emailService.sendOtpEmail(record.parentEmail, record.parentName, result.rawCode);
      } catch (err) {
        console.error('[TRIAL OTP EMAIL ERROR]:', err);
      }
    }

    res.status(200).json({
      message: 'OTP sent successfully to parent email address',
      expiresAt: result.expiresAt,
      cooldownSeconds: result.cooldownSeconds,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trial-requests/:id/resend-otp
trialRouter.post('/:id/resend-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trialRequestId = req.params.id;
    const record = pendingTrialRequests.get(trialRequestId);

    if (!record) {
      throw new AppError('Trial request not found', 404, 'Not Found');
    }

    const otpService = getOtpService();
    const result = await otpService.resendOtp(record.parentPhone, 'PHONE_VERIFICATION');

    if (result.rawCode && record.parentEmail) {
      const emailService = getEmailService();
      try {
        await emailService.sendOtpEmail(record.parentEmail, record.parentName, result.rawCode);
      } catch (err) {
        console.error('[TRIAL OTP RESEND EMAIL ERROR]:', err);
      }
    }

    res.status(200).json({
      message: 'OTP resent successfully to parent email address',
      expiresAt: result.expiresAt,
      cooldownSeconds: result.cooldownSeconds,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trial-requests/:id/verify-otp
trialRouter.post('/:id/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trialRequestId = req.params.id;
    const record = pendingTrialRequests.get(trialRequestId);

    if (!record) {
      throw new AppError('Trial request not found', 404, 'Not Found');
    }

    const parseResult = verifyCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: parseResult.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const otpService = getOtpService();
    const result = await otpService.verifyOtp(
      record.parentPhone,
      'PHONE_VERIFICATION',
      parseResult.data.code
    );

    // Mark trial request as phoneVerified
    record.phoneVerified = true;
    record.verifiedAt = new Date();
    pendingTrialRequests.set(trialRequestId, record);

    res.status(200).json({
      message: result.message,
      phoneVerified: true,
      trialRequestId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/trial-requests/:id
trialRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const trialRequestId = req.params.id;
    const record = pendingTrialRequests.get(trialRequestId);

    if (!record) {
      throw new AppError('Trial request not found', 404, 'Not Found');
    }

    res.status(200).json({
      trialRequest: record,
    });
  } catch (err) {
    next(err);
  }
});
