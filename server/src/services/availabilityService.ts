import { DateTime } from 'luxon';
import { prisma } from '../utils/prisma.js';
import { isValidIanaTimezone, doIntervalsOverlap } from '../utils/timezone.js';
import { AppError } from '../utils/errors.js';

export interface SlotAvailabilityResponse {
  startUtc: string;
  endUtc: string;
  parentLocalDisplay: string;
  parentTimezone: string;
  durationMinutes: number;
  available: boolean;
}

export interface GetAvailabilityOptions {
  dateStr: string; // YYYY-MM-DD in parent local timezone
  parentTz: string;
  nowUtc?: DateTime; // For testing / overriding current time
}

/**
 * Service function to calculate available trial class slots for a requested date and parent timezone.
 *
 * Rules:
 * - Trial class duration = 45 minutes.
 * - Buffer = 15 minutes (Total slot duration = 60 minutes).
 * - Slots start on 1-hour boundaries in parent local time for the requested calendar date.
 * - Exclude slots in the past.
 * - Exclude slots where no eligible mentor is available (considering mentor weekly availability,
 *   overlapping existing bookings, and mentor daily booking limits in mentor's local timezone).
 * - Do NOT assign a mentor to the slot when listing.
 */
export async function getAvailableSlots(
  options: GetAvailabilityOptions
): Promise<SlotAvailabilityResponse[]> {
  const { dateStr, parentTz, nowUtc = DateTime.utc() } = options;

  // 1. Validate parent timezone
  if (!isValidIanaTimezone(parentTz)) {
    throw new AppError('Invalid IANA timezone identifier', 400, 'InvalidTimezone');
  }

  // 2. Validate date format (YYYY-MM-DD)
  const requestedDate = DateTime.fromISO(dateStr, { zone: parentTz });
  if (!requestedDate.isValid) {
    throw new AppError('Invalid date format. Expected YYYY-MM-DD.', 400, 'InvalidDate');
  }

  // 3. Fetch active mentors and their weekly availabilities
  const mentors = await prisma.mentor.findMany({
    where: { active: true },
    include: {
      availabilities: {
        where: { active: true },
      },
    },
  });

  if (mentors.length === 0) {
    return [];
  }

  // Generate hourly candidate start times across parent local requested date (00:00 to 23:00)
  // Construct parent local date start at 00:00
  const startOfDayParent = DateTime.fromObject(
    {
      year: requestedDate.year,
      month: requestedDate.month,
      day: requestedDate.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    { zone: parentTz }
  );

  // Determine global UTC window covered by this parent date (to query existing bookings efficiently)
  // Parent 00:00 to parent 24:00 + buffer
  const dayStartUtc = startOfDayParent.toUTC();
  const dayEndUtc = startOfDayParent.plus({ days: 1, hours: 2 }).toUTC();

  // Fetch all existing bookings in this UTC window (excluding CANCELLED)
  const existingBookings = await prisma.booking.findMany({
    where: {
      status: { not: 'CANCELLED' },
      startUtc: { lte: dayEndUtc.toJSDate() },
      endUtc: { gte: dayStartUtc.toJSDate() },
    },
  });

  // Also fetch all bookings for active mentors on their mentor-local calendar dates to check daily limits
  const allMentorBookings = await prisma.booking.findMany({
    where: {
      status: { not: 'CANCELLED' },
      mentorId: { in: mentors.map((m) => m.id) },
    },
  });

  const slots: SlotAvailabilityResponse[] = [];

  // Generate 24 slots (one every hour starting from 00:00 parent local time)
  for (let hour = 0; hour < 24; hour++) {
    const slotStartParent = startOfDayParent.plus({ hours: hour });
    const slotEndParent = slotStartParent.plus({ minutes: 45 });

    const slotStartUtc = slotStartParent.toUTC();
    const slotEndUtc = slotEndParent.toUTC();

    // Rule: Exclude past times
    if (slotStartUtc <= nowUtc) {
      continue;
    }

    // Check if at least ONE active mentor is eligible and available for this 45-minute slot
    let eligibleMentorFound = false;

    for (const mentor of mentors) {
      // 1. Check if slot falls within mentor's weekly recurring availability
      // Convert slot start and end to mentor local time
      const slotStartMentor = slotStartUtc.setZone(mentor.timezone);
      const slotEndMentor = slotEndUtc.setZone(mentor.timezone);

      // Luxon weekday: 1 (Monday) - 7 (Sunday)
      const mentorDayOfWeek = slotStartMentor.weekday;

      // Find matching availability rule for mentor's day of week
      const matchingAvailabilities = mentor.availabilities.filter(
        (a) => a.dayOfWeek === mentorDayOfWeek
      );

      if (matchingAvailabilities.length === 0) {
        continue;
      }

      const fitsInAvailability = matchingAvailabilities.some((avail) => {
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

      if (!fitsInAvailability) {
        continue;
      }

      // 2. Check overlapping bookings for this mentor
      const mentorOverlaps = existingBookings.some((booking) => {
        if (booking.mentorId !== mentor.id) return false;
        return doIntervalsOverlap(
          slotStartUtc.toJSDate(),
          slotEndUtc.toJSDate(),
          booking.startUtc,
          booking.endUtc
        );
      });

      if (mentorOverlaps) {
        continue;
      }

      // 3. Check mentor's local daily booking limit
      // Determine candidate slot date in mentor's local timezone (YYYY-MM-DD)
      const candidateMentorLocalDate = slotStartMentor.toFormat('yyyy-MM-dd');

      // Count existing bookings for this mentor on candidateMentorLocalDate
      const mentorDailyBookingCount = allMentorBookings.filter((b) => {
        if (b.mentorId !== mentor.id) return false;
        const bStartMentor = DateTime.fromJSDate(b.startUtc, { zone: 'utc' }).setZone(
          mentor.timezone
        );
        return bStartMentor.toFormat('yyyy-MM-dd') === candidateMentorLocalDate;
      }).length;

      if (mentorDailyBookingCount >= mentor.maxDailyBookings) {
        continue;
      }

      // If mentor passes all checks, slot is valid!
      eligibleMentorFound = true;
      break;
    }

    if (eligibleMentorFound) {
      slots.push({
        startUtc: slotStartUtc.toISO()!,
        endUtc: slotEndUtc.toISO()!,
        parentLocalDisplay: slotStartParent.toFormat('yyyy-MM-dd HH:mm ZZZZ'),
        parentTimezone: parentTz,
        durationMinutes: 45,
        available: true,
      });
    }
  }

  return slots;
}
