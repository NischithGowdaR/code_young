import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authMiddleware.js';
import { createBooking } from '../services/bookingService.js';
import { AppError } from '../utils/errors.js';

export const bookingRouter = Router();

const createBookingSchema = z.object({
  trialRequestId: z.string().min(1, 'trialRequestId is required'),
  startUtc: z
    .string()
    .datetime({ message: 'startUtc must be a valid ISO 8601 UTC timestamp string' }),
});

/**
 * POST /api/bookings
 * Requires parent authentication.
 *
 * Body:
 * - trialRequestId: string
 * - startUtc: string (ISO 8601)
 */
bookingRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
        return;
      }

      const parseResult = createBookingSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        });
        return;
      }

      const { trialRequestId, startUtc } = parseResult.data;

      const booking = await createBooking({
        trialRequestId,
        startUtc,
        userId: req.user.userId,
        userEmail: req.user.email,
      });

      res.status(201).json({
        message: 'Trial class booked successfully',
        booking,
      });
    } catch (err) {
      if (err instanceof AppError && err.errorName === 'NO_MENTOR_AVAILABLE') {
        res.status(400).json({
          code: 'NO_MENTOR_AVAILABLE',
          message: err.message,
        });
        return;
      }
      next(err);
    }
  }
);
