import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getMentorsAdmin,
  toggleMentorStatusAdmin,
  getBookingsAdmin,
  cancelBookingAdmin,
} from '../services/adminService.js';
import { AppError } from '../utils/errors.js';

export const adminRouter = Router();

// Protect all admin endpoints with authenticate and requireAdmin middleware
adminRouter.use(authenticate, requireAdmin);

const toggleStatusSchema = z
  .object({
    active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => typeof data.active === 'boolean' || typeof data.isActive === 'boolean', {
    message: 'Either "active" or "isActive" boolean field is required',
  });

/**
 * GET /api/admin/mentors
 * Returns all mentors with active status, timezone, and daily booking count.
 */
adminRouter.get('/mentors', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const mentors = await getMentorsAdmin();
    res.status(200).json({ mentors });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/mentors/:id/status
 * Activate or deactivate a mentor.
 */
adminRouter.patch(
  '/mentors/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new AppError('Mentor ID is required', 400, 'InvalidRequest');
      }

      const parseResult = toggleStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError(
          parseResult.error.errors[0]?.message || 'Invalid request body',
          400,
          'InvalidRequest'
        );
      }

      const targetActive = parseResult.data.active ?? parseResult.data.isActive ?? true;

      const mentor = await toggleMentorStatusAdmin(id, targetActive);
      res.status(200).json({
        message: `Mentor ${mentor.name} has been ${mentor.active ? 'activated' : 'deactivated'}`,
        mentor,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/bookings
 * Returns all bookings with parent-local and mentor-local display times.
 */
adminRouter.get('/bookings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await getBookingsAdmin();
    res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/bookings/:id/cancel
 * Cancel a booking as admin.
 */
adminRouter.post(
  '/bookings/:id/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        throw new AppError('Booking ID is required', 400, 'InvalidRequest');
      }

      const booking = await cancelBookingAdmin(id);
      res.status(200).json({
        message: 'Booking cancelled successfully',
        booking,
      });
    } catch (err) {
      next(err);
    }
  }
);
