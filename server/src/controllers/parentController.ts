import express, { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { prisma } from '../utils/prisma.js';
import { pendingTrialRequests } from './trialController.js';

export const parentRouter = express.Router();

interface BookingRecord {
  id: string;
  parentId: string;
  mentorId: string;
  course: string;
  studentGrade: string;
  studentSubject?: string;
  startUtc: Date;
  endUtc: Date;
  parentTimezone: string;
  mentorTimezoneSnapshot: string;
  status: string;
  createdAt: Date;
}

// GET /api/parent/dashboard
parentRouter.get(
  '/dashboard',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user.userId;

      // Fetch user from DB or in-memory
      let user;
      try {
        user = await prisma.user.findUnique({
          where: { id: userId },
        });
      } catch {
        // fallback
      }

      // Fetch bookings from Prisma DB
      let dbBookings: BookingRecord[] = [];
      try {
        dbBookings = (await prisma.booking.findMany({
          where: { parentId: userId },
          include: { mentor: true },
          orderBy: { startUtc: 'asc' },
        })) as unknown as BookingRecord[];
      } catch {
        // fallback
      }

      // Collect pending trial requests associated with parent email/phone
      const emailToMatch = req.user.email.toLowerCase();
      const pendingList = Array.from(pendingTrialRequests.values()).filter(
        (tr) => tr.parentEmail === emailToMatch
      );

      const now = new Date();

      const upcomingBookings = [
        ...dbBookings.filter((b) => new Date(b.startUtc) >= now),
        ...pendingList.map((tr) => ({
          id: tr.id,
          course: tr.course,
          studentGrade: tr.studentGrade,
          studentSubject: tr.studentSubject,
          status: tr.phoneVerified ? 'VERIFIED_PENDING_SLOT' : 'PENDING_OTP',
          startUtc: null,
          endUtc: null,
          parentTimezone: tr.timezone,
          mentor: null,
          createdAt: tr.createdAt,
        })),
      ];

      const previousBookings = dbBookings.filter((b) => new Date(b.startUtc) < now);

      const primaryCourse = pendingList[0]?.course || dbBookings[0]?.course || null;
      const grade = pendingList[0]?.studentGrade || dbBookings[0]?.studentGrade || null;

      res.status(200).json({
        user: {
          id: req.user.userId,
          name: user?.name || req.user.email.split('@')[0],
          email: req.user.email,
          phoneNumber: user?.phoneNumber || null,
          timezone: user?.timezone || 'Asia/Kolkata',
          role: req.user.role,
        },
        studentSummary: {
          totalTrialRequests: pendingList.length + dbBookings.length,
          primaryCourse,
          grade,
        },
        upcomingBookings,
        previousBookings,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parent/bookings
parentRouter.get(
  '/bookings',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user.userId;
      const emailToMatch = req.user.email.toLowerCase();

      let dbBookings: BookingRecord[] = [];
      try {
        dbBookings = (await prisma.booking.findMany({
          where: { parentId: userId },
          include: { mentor: true },
          orderBy: { startUtc: 'desc' },
        })) as unknown as BookingRecord[];
      } catch {
        // fallback
      }

      const pendingList = Array.from(pendingTrialRequests.values()).filter(
        (tr) => tr.parentEmail === emailToMatch
      );

      res.status(200).json({
        bookings: [
          ...dbBookings,
          ...pendingList.map((tr) => ({
            id: tr.id,
            course: tr.course,
            studentGrade: tr.studentGrade,
            studentSubject: tr.studentSubject,
            status: tr.phoneVerified ? 'VERIFIED_PENDING_SLOT' : 'PENDING_OTP',
            parentTimezone: tr.timezone,
            createdAt: tr.createdAt,
          })),
        ],
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/parent/profile
parentRouter.get(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { id: req.user.userId },
        });
      } catch {
        // fallback
      }

      res.status(200).json({
        profile: {
          id: req.user.userId,
          name: user?.name || req.user.email.split('@')[0],
          email: req.user.email,
          phoneNumber: user?.phoneNumber || null,
          timezone: user?.timezone || 'Asia/Kolkata',
          role: req.user.role,
          createdAt: user?.createdAt || new Date(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
