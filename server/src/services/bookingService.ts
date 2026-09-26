import { DateTime } from 'luxon';
import crypto from 'crypto';
import { Course } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { pendingTrialRequests, PendingTrialRequest } from '../controllers/trialController.js';
import { doIntervalsOverlap } from '../utils/timezone.js';
import { AppError } from '../utils/errors.js';
import { getEmailService } from './email/developmentEmailService.js';

export interface CreateBookingInput {
  trialRequestId: string;
  startUtc: string; // ISO 8601 string
  userId: string;
  userEmail: string;
}

export interface BookingResponse {
  id: string;
  parentId: string;
  mentorId: string;
  mentorName: string;
  course: string;
  studentGrade: string;
  startUtc: string;
  endUtc: string;
  parentTimezone: string;
  mentorTimezoneSnapshot: string;
  classLink: string;
  status: string;
  parentLocalDisplay: string;
  mentorLocalDisplay: string;
  createdAt: string;
}

/**
 * Creates a trial class booking inside a Prisma transaction.
 *
 * Checks & Validations:
 * 1. User is authenticated (passed via input).
 * 2. Trial request exists and belongs to the authenticated user (by email match).
 * 3. Phone verification is completed on trial request (`phoneVerified === true`).
 * 4. Trial request has not expired (must be within 24 hours of creation).
 * 5. Requested time is in the future.
 * 6. Slot duration is 45 minutes.
 * 7. Active mentor check, mentor availability, overlapping bookings, mentor local daily limit (< 2 classes).
 * 8. Selects the least-loaded eligible mentor.
 * 9. Generates a unique dummy class link (`https://meet.codeyoung.example/room/...`).
 * 10. Persists booking in UTC.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingResponse> {
  const { trialRequestId, startUtc, userId, userEmail } = input;

  // 1. Fetch pending trial request
  const trialRequest: PendingTrialRequest | undefined = pendingTrialRequests.get(trialRequestId);

  if (!trialRequest) {
    throw new AppError('Trial request not found', 404, 'NotFound');
  }

  // 2. Verify trial request belongs to authenticated user
  if (trialRequest.parentEmail.toLowerCase() !== userEmail.toLowerCase()) {
    throw new AppError('Trial request does not belong to the authenticated user', 403, 'Forbidden');
  }

  // 3. Verify phone verification is complete
  if (!trialRequest.phoneVerified) {
    throw new AppError(
      'Phone verification is required before booking a slot',
      400,
      'PhoneNotVerified'
    );
  }

  // 4. Verify trial request has not expired (24 hours limit)
  const trialAgeMs = Date.now() - new Date(trialRequest.createdAt).getTime();
  if (trialAgeMs > 24 * 60 * 60 * 1000) {
    throw new AppError(
      'Trial request has expired. Please submit a new trial request.',
      400,
      'TrialRequestExpired'
    );
  }

  // 5. Parse and validate startUtc
  const startDt = DateTime.fromISO(startUtc, { zone: 'utc' });
  if (!startDt.isValid) {
    throw new AppError('Invalid startUtc ISO timestamp', 400, 'InvalidTimestamp');
  }

  // Verify requested time is in the future
  if (startDt <= DateTime.utc()) {
    throw new AppError('Requested booking time must be in the future', 400, 'PastTimeNotAllowed');
  }

  // 6. Calculate endUtc (exactly 45 minutes duration)
  const endDt = startDt.plus({ minutes: 45 });
  const startJsDate = startDt.toJSDate();
  const endJsDate = endDt.toJSDate();

  // Perform final checks & booking creation inside a Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    // Fetch all active mentors with their active availability rules
    const mentors = await tx.mentor.findMany({
      where: { active: true },
      include: {
        availabilities: {
          where: { active: true },
        },
      },
    });

    if (mentors.length === 0) {
      throw new AppError(
        'No mentors are available for this time. Please choose another slot.',
        400,
        'NO_MENTOR_AVAILABLE'
      );
    }

    // Evaluate each mentor for eligibility
    const eligibleMentors: { mentor: (typeof mentors)[0]; dailyCount: number }[] = [];

    for (const mentor of mentors) {
      // a. Check weekly availability
      const slotStartMentor = startDt.setZone(mentor.timezone);
      const slotEndMentor = endDt.setZone(mentor.timezone);
      const dayOfWeek = slotStartMentor.weekday; // 1 (Mon) - 7 (Sun)

      const dayAvailabilities = mentor.availabilities.filter((a) => a.dayOfWeek === dayOfWeek);
      if (dayAvailabilities.length === 0) {
        continue;
      }

      const fitsAvailability = dayAvailabilities.some((avail) => {
        const [startH, startM] = avail.startLocalTime.split(':').map(Number);
        const [endH, endM] = avail.endLocalTime.split(':').map(Number);

        const availStart = slotStartMentor.set({
          hour: startH,
          minute: startM,
          second: 0,
          millisecond: 0,
        });
        const availEnd = slotStartMentor.set({
          hour: endH,
          minute: endM,
          second: 0,
          millisecond: 0,
        });

        return slotStartMentor >= availStart && slotEndMentor <= availEnd;
      });

      if (!fitsAvailability) {
        continue;
      }

      // b. Check overlapping bookings for this mentor (excluding CANCELLED)
      const existingMentorBookings = await tx.booking.findMany({
        where: {
          mentorId: mentor.id,
          status: { not: 'CANCELLED' },
        },
      });

      const hasOverlap = existingMentorBookings.some((b) =>
        doIntervalsOverlap(startJsDate, endJsDate, b.startUtc, b.endUtc)
      );

      if (hasOverlap) {
        continue;
      }

      // c. Check mentor local daily booking limit (< maxDailyBookings, max 2)
      const candidateMentorLocalDate = slotStartMentor.toFormat('yyyy-MM-dd');
      const dailyCount = existingMentorBookings.filter((b) => {
        const bStartMentor = DateTime.fromJSDate(b.startUtc, { zone: 'utc' }).setZone(
          mentor.timezone
        );
        return bStartMentor.toFormat('yyyy-MM-dd') === candidateMentorLocalDate;
      }).length;

      if (dailyCount >= mentor.maxDailyBookings) {
        continue;
      }

      eligibleMentors.push({ mentor, dailyCount });
    }

    if (eligibleMentors.length === 0) {
      throw new AppError(
        'No mentors are available for this time. Please choose another slot.',
        400,
        'NO_MENTOR_AVAILABLE'
      );
    }

    // Select the least-loaded eligible mentor (lowest daily booking count for that day)
    eligibleMentors.sort((a, b) => a.dailyCount - b.dailyCount);
    const selectedMentor = eligibleMentors[0].mentor;

    // Generate unique class link
    const classLink = `https://meet.codeyoung.example/room/cy-${crypto.randomUUID().slice(0, 8)}`;

    // Normalize course string to enum
    const courseEnum = (
      Object.values(Course).includes(trialRequest.course as Course)
        ? trialRequest.course
        : Course.CODING
    ) as Course;

    // Create booking record inside transaction
    const newBooking = await tx.booking.create({
      data: {
        parentId: userId,
        mentorId: selectedMentor.id,
        course: courseEnum,
        studentGrade: trialRequest.studentGrade,
        startUtc: startJsDate,
        endUtc: endJsDate,
        parentTimezone: trialRequest.timezone,
        mentorTimezoneSnapshot: selectedMentor.timezone,
        classLink,
        status: 'CONFIRMED',
      },
      include: {
        mentor: true,
      },
    });

    return newBooking;
  });

  // Remove pending trial request after successful booking creation
  pendingTrialRequests.delete(trialRequestId);

  const parentLocalDt = startDt.setZone(trialRequest.timezone);
  const mentorLocalDt = startDt.setZone(result.mentorTimezoneSnapshot);

  const parentLocalDisplay = parentLocalDt.toFormat('yyyy-MM-dd HH:mm ZZZZ');
  const mentorLocalDisplay = mentorLocalDt.toFormat('yyyy-MM-dd HH:mm ZZZZ');

  // Trigger post-transaction email notifications asynchronously
  // Note: Notification failures do not fail or roll back a confirmed booking
  try {
    const emailService = getEmailService();

    // 1. Send confirmation email to parent with parent-local time
    await emailService.sendBookingConfirmation({
      recipientEmail: trialRequest.parentEmail,
      recipientName: trialRequest.parentName,
      isParent: true,
      mentorName: result.mentor.name,
      course: result.course,
      studentGrade: result.studentGrade,
      localTimeFormatted: parentLocalDisplay,
      classLink: result.classLink!,
    });

    // 2. Send confirmation email to assigned mentor with mentor-local time
    await emailService.sendBookingConfirmation({
      recipientEmail: result.mentor.email,
      recipientName: result.mentor.name,
      isParent: false,
      parentName: trialRequest.parentName,
      course: result.course,
      studentGrade: result.studentGrade,
      localTimeFormatted: mentorLocalDisplay,
      classLink: result.classLink!,
    });
  } catch (notificationError) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to send booking confirmation notifications:', notificationError);
    }
  }

  return {
    id: result.id,
    parentId: result.parentId,
    mentorId: result.mentorId,
    mentorName: result.mentor.name,
    course: result.course,
    studentGrade: result.studentGrade,
    startUtc: result.startUtc.toISOString(),
    endUtc: result.endUtc.toISOString(),
    parentTimezone: result.parentTimezone,
    mentorTimezoneSnapshot: result.mentorTimezoneSnapshot,
    classLink: result.classLink!,
    status: result.status,
    parentLocalDisplay,
    mentorLocalDisplay,
    createdAt: result.createdAt.toISOString(),
  };
}
