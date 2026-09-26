import { DateTime } from 'luxon';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { getEmailService } from './email/developmentEmailService.js';

export interface AdminMentorResponse {
  id: string;
  name: string;
  email: string;
  timezone: string;
  active: boolean;
  maxDailyBookings: number;
  dailyBookingCount: number;
  totalBookingsCount?: number;
  createdAt: string;
}

export interface AdminBookingResponse {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  course: string;
  studentGrade: string;
  startUtc: string;
  endUtc: string;
  parentTimezone: string;
  mentorTimezoneSnapshot: string;
  parentLocalDisplay: string;
  mentorLocalDisplay: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  classLink: string | null;
  status: string;
  createdAt: string;
}

/**
 * Fetch all mentors with active status, timezone, max daily limit, and current daily booking count.
 */
export async function getMentorsAdmin(): Promise<AdminMentorResponse[]> {
  const mentors = await prisma.mentor.findMany({
    orderBy: { name: 'asc' },
    include: {
      bookings: {
        where: { status: { not: 'CANCELLED' } },
      },
    },
  });

  return mentors.map((m) => {
    // Count active non-cancelled bookings for today in mentor's local timezone
    const nowMentor = DateTime.utc().setZone(m.timezone);
    const todayStr = nowMentor.toFormat('yyyy-MM-dd');

    const dailyBookingCount = m.bookings.filter((b) => {
      const bMentorDt = DateTime.fromJSDate(b.startUtc, { zone: 'utc' }).setZone(m.timezone);
      return bMentorDt.toFormat('yyyy-MM-dd') === todayStr;
    }).length;

    return {
      id: m.id,
      name: m.name,
      email: m.email,
      timezone: m.timezone,
      active: m.active,
      maxDailyBookings: m.maxDailyBookings,
      dailyBookingCount,
      totalBookingsCount: m.bookings.length,
      createdAt: m.createdAt.toISOString(),
    };
  });
}

/**
 * Toggle active status of a mentor.
 */
export async function toggleMentorStatusAdmin(
  mentorId: string,
  active: boolean
): Promise<AdminMentorResponse> {
  const existing = await prisma.mentor.findUnique({
    where: { id: mentorId },
  });

  if (!existing) {
    throw new AppError('Mentor not found', 404, 'NotFound');
  }

  const updated = await prisma.mentor.update({
    where: { id: mentorId },
    data: { active },
    include: {
      bookings: {
        where: { status: { not: 'CANCELLED' } },
      },
    },
  });

  const nowMentor = DateTime.utc().setZone(updated.timezone);
  const todayStr = nowMentor.toFormat('yyyy-MM-dd');
  const dailyBookingCount = updated.bookings.filter((b) => {
    const bMentorDt = DateTime.fromJSDate(b.startUtc, { zone: 'utc' }).setZone(updated.timezone);
    return bMentorDt.toFormat('yyyy-MM-dd') === todayStr;
  }).length;

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    timezone: updated.timezone,
    active: updated.active,
    maxDailyBookings: updated.maxDailyBookings,
    dailyBookingCount,
    totalBookingsCount: updated.bookings.length,
    createdAt: updated.createdAt.toISOString(),
  };
}

/**
 * Fetch all bookings formatted with parent-local and mentor-local display times.
 */
export async function getBookingsAdmin(): Promise<AdminBookingResponse[]> {
  const bookings = await prisma.booking.findMany({
    orderBy: { startUtc: 'desc' },
    include: {
      parent: true,
      mentor: true,
    },
  });

  return bookings.map((b) => {
    const startDt = DateTime.fromJSDate(b.startUtc, { zone: 'utc' });
    const parentLocalDt = startDt.setZone(b.parentTimezone);
    const mentorLocalDt = startDt.setZone(b.mentorTimezoneSnapshot);

    const parentLocalDisplay = parentLocalDt.isValid
      ? parentLocalDt.toFormat('yyyy-MM-dd HH:mm ZZZZ')
      : b.startUtc.toISOString();

    const mentorLocalDisplay = mentorLocalDt.isValid
      ? mentorLocalDt.toFormat('yyyy-MM-dd HH:mm ZZZZ')
      : b.startUtc.toISOString();

    return {
      id: b.id,
      parentId: b.parentId,
      parentName: b.parent ? b.parent.name : 'Unknown Parent',
      parentEmail: b.parent ? b.parent.email : 'N/A',
      course: b.course,
      studentGrade: b.studentGrade,
      startUtc: b.startUtc.toISOString(),
      endUtc: b.endUtc.toISOString(),
      parentTimezone: b.parentTimezone,
      mentorTimezoneSnapshot: b.mentorTimezoneSnapshot,
      parentLocalDisplay,
      mentorLocalDisplay,
      mentorId: b.mentorId,
      mentorName: b.mentor ? b.mentor.name : 'Unknown Mentor',
      mentorEmail: b.mentor ? b.mentor.email : 'N/A',
      classLink: b.classLink,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    };
  });
}

/**
 * Cancel a booking as admin and send notification emails.
 */
export async function cancelBookingAdmin(bookingId: string): Promise<AdminBookingResponse> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      parent: true,
      mentor: true,
    },
  });

  if (!existing) {
    throw new AppError('Booking not found', 404, 'NotFound');
  }

  if (existing.status === 'CANCELLED') {
    throw new AppError('Booking is already cancelled', 400, 'AlreadyCancelled');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
    include: {
      parent: true,
      mentor: true,
    },
  });

  const startDt = DateTime.fromJSDate(updated.startUtc, { zone: 'utc' });
  const parentLocalDt = startDt.setZone(updated.parentTimezone);
  const mentorLocalDt = startDt.setZone(updated.mentorTimezoneSnapshot);

  const parentLocalDisplay = parentLocalDt.toFormat('yyyy-MM-dd HH:mm ZZZZ');
  const mentorLocalDisplay = mentorLocalDt.toFormat('yyyy-MM-dd HH:mm ZZZZ');

  // Trigger post-cancellation email notifications
  try {
    const emailService = getEmailService();

    if (updated.parent) {
      await emailService.sendBookingCancellation({
        recipientEmail: updated.parent.email,
        recipientName: updated.parent.name,
        isParent: true,
        course: updated.course,
        studentGrade: updated.studentGrade,
        localTimeFormatted: parentLocalDisplay,
        reason: 'Cancelled by CodeYoung Admin',
      });
    }

    if (updated.mentor) {
      await emailService.sendBookingCancellation({
        recipientEmail: updated.mentor.email,
        recipientName: updated.mentor.name,
        isParent: false,
        course: updated.course,
        studentGrade: updated.studentGrade,
        localTimeFormatted: mentorLocalDisplay,
        reason: 'Cancelled by CodeYoung Admin',
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to send cancellation notification:', err);
    }
  }

  return {
    id: updated.id,
    parentId: updated.parentId,
    parentName: updated.parent ? updated.parent.name : 'Unknown Parent',
    parentEmail: updated.parent ? updated.parent.email : 'N/A',
    course: updated.course,
    studentGrade: updated.studentGrade,
    startUtc: updated.startUtc.toISOString(),
    endUtc: updated.endUtc.toISOString(),
    parentTimezone: updated.parentTimezone,
    mentorTimezoneSnapshot: updated.mentorTimezoneSnapshot,
    parentLocalDisplay,
    mentorLocalDisplay,
    mentorId: updated.mentorId,
    mentorName: updated.mentor ? updated.mentor.name : 'Unknown Mentor',
    mentorEmail: updated.mentor ? updated.mentor.email : 'N/A',
    classLink: updated.classLink,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
  };
}
