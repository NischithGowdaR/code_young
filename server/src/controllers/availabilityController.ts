import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getAvailableSlots } from '../services/availabilityService.js';
import { AppError } from '../utils/errors.js';

export const availabilityRouter = Router();

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timezone: z.string().min(1, 'Timezone is required'),
});

/**
 * GET /api/availability?date=YYYY-MM-DD&timezone=IANA_TIMEZONE
 *
 * Query params:
 * - date: YYYY-MM-DD in parent local timezone
 * - timezone: IANA timezone identifier (e.g. Asia/Kolkata, America/New_York)
 */
availabilityRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = availabilityQuerySchema.safeParse(req.query);

      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map((e) => e.message).join(', ');
        throw new AppError(errorMsg, 400, 'InvalidQueryParams');
      }

      const { date, timezone } = parseResult.data;

      const slots = await getAvailableSlots({
        dateStr: date,
        parentTz: timezone,
      });

      res.status(200).json({
        date,
        timezone,
        totalSlots: slots.length,
        slots,
      });
    } catch (err) {
      next(err);
    }
  }
);
