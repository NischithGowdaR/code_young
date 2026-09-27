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

      // Fetch bookings from Prisma DB for this parent
      const emailToMatch = req.user.email.toLowerCase();
      let dbBookings: BookingRecord[] = [];
      try {
        dbBookings = (await prisma.booking.findMany({
          where: {
            OR: [
              { parentId: userId },
              { parent: { email: { equals: emailToMatch, mode: 'insensitive' } } },
            ],
          },
          include: { mentor: true },
          orderBy: { createdAt: 'desc' },
        })) as unknown as BookingRecord[];
      } catch {
        // fallback
      }

      // Collect pending trial requests associated with parent email/phone
      const pendingList = Array.from(pendingTrialRequests.values()).filter(
        (tr) => tr.parentEmail.toLowerCase() === emailToMatch
      );

      const now = new Date();

      const upcomingBookings = [
        ...dbBookings.filter((b) => new Date(b.startUtc) >= now && b.status !== 'CANCELLED'),
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

      const previousBookings = dbBookings.filter(
        (b) => new Date(b.startUtc) < now || b.status === 'CANCELLED'
      );

      // Determine latest active course and grade from the most recent booking or trial request
      const latestBooking = dbBookings[0]; // already ordered by createdAt desc
      const sortedPending = [...pendingList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestPending = sortedPending[0];

      let primaryCourse: string | null = null;
      let grade: string | null = null;

      if (latestBooking && latestPending) {
        if (new Date(latestBooking.createdAt).getTime() >= new Date(latestPending.createdAt).getTime()) {
          primaryCourse = latestBooking.course;
          grade = latestBooking.studentGrade;
        } else {
          primaryCourse = latestPending.course;
          grade = latestPending.studentGrade;
        }
      } else if (latestBooking) {
        primaryCourse = latestBooking.course;
        grade = latestBooking.studentGrade;
      } else if (latestPending) {
        primaryCourse = latestPending.course;
        grade = latestPending.studentGrade;
      }

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
          where: {
            OR: [
              { parentId: userId },
              { parent: { email: { equals: emailToMatch, mode: 'insensitive' } } },
            ],
          },
          include: { mentor: true },
          orderBy: { createdAt: 'desc' },
        })) as unknown as BookingRecord[];
      } catch {
        // fallback
      }

      const pendingList = Array.from(pendingTrialRequests.values()).filter(
        (tr) => tr.parentEmail.toLowerCase() === emailToMatch
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
