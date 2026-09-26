import { DateTime, IANAZone } from 'luxon';

export interface TimezoneInfo {
  abbreviation: string;
  offsetFormatted: string;
  offsetMinutes: number;
}

export interface SpringForwardCheck {
  isGap: boolean;
  adjustedDateTime?: DateTime;
  explanation?: string;
}

export interface FallBackCheck {
  isAmbiguous: boolean;
  earlierInstance?: DateTime;
  laterInstance?: DateTime;
}

/**
 * 1. Validate if string is a valid IANA timezone identifier
 */
export const isValidIanaTimezone = (tz: string): boolean => {
  if (!tz || typeof tz !== 'string') return false;
  // Reject fixed offsets or invalid names
  if (
    tz.startsWith('UTC+') ||
    tz.startsWith('UTC-') ||
    tz.startsWith('GMT+') ||
    tz.startsWith('GMT-')
  ) {
    return false;
  }
  return IANAZone.isValidZone(tz);
};

/**
 * 2. Convert UTC timestamp to parent local DateTime
 */
export const utcToParentLocal = (utcIsoOrDate: string | Date, parentTz: string): DateTime => {
  if (!isValidIanaTimezone(parentTz)) {
    throw new Error(`Invalid parent IANA timezone: ${parentTz}`);
  }
  const dt =
    typeof utcIsoOrDate === 'string'
      ? DateTime.fromISO(utcIsoOrDate, { zone: 'utc' })
      : DateTime.fromJSDate(utcIsoOrDate, { zone: 'utc' });
  return dt.setZone(parentTz);
};

/**
 * 3. Convert UTC timestamp to mentor local DateTime
 */
export const utcToMentorLocal = (utcIsoOrDate: string | Date, mentorTz: string): DateTime => {
  if (!isValidIanaTimezone(mentorTz)) {
    throw new Error(`Invalid mentor IANA timezone: ${mentorTz}`);
  }
  const dt =
    typeof utcIsoOrDate === 'string'
      ? DateTime.fromISO(utcIsoOrDate, { zone: 'utc' })
      : DateTime.fromJSDate(utcIsoOrDate, { zone: 'utc' });
  return dt.setZone(mentorTz);
};

/**
 * 4. Format local DateTime to formatted date-time string
 */
export const formatLocalDateTime = (
  dateTime: DateTime,
  formatStr: string = 'yyyy-MM-dd HH:mm ZZZZ'
): string => {
  return dateTime.toFormat(formatStr);
};

/**
 * 5. Get timezone abbreviation, offset string (+05:30), and offset in minutes
 */
export const getTimezoneInfo = (tz: string, dateTime?: DateTime): TimezoneInfo => {
  if (!isValidIanaTimezone(tz)) {
    throw new Error(`Invalid IANA timezone: ${tz}`);
  }
  const dt = (dateTime || DateTime.now()).setZone(tz);
  return {
    abbreviation: dt.offsetNameShort || dt.toFormat('ZZZZ'),
    offsetFormatted: dt.toFormat('ZZ'),
    offsetMinutes: dt.offset,
  };
};

/**
 * 6. Determine mentor-local calendar date (YYYY-MM-DD) for a given UTC instant
 */
export const getMentorLocalCalendarDate = (
  utcIsoOrDate: string | Date,
  mentorTz: string
): string => {
  const dt = utcToMentorLocal(utcIsoOrDate, mentorTz);
  return dt.toFormat('yyyy-MM-dd');
};

/**
 * 7. Detect nonexistent local wall-clock times during DST spring-forward gap
 */
export const detectSpringForwardGap = (
  localDateStr: string,
  localTimeStr: string,
  tz: string
): SpringForwardCheck => {
  if (!isValidIanaTimezone(tz)) {
    throw new Error(`Invalid IANA timezone: ${tz}`);
  }

  const dt = DateTime.fromFormat(`${localDateStr} ${localTimeStr}`, 'yyyy-MM-dd HH:mm', {
    zone: tz,
  });

  // Check if wall clock time formatted back matches original input
  const formattedBack = dt.toFormat('HH:mm');
  if (formattedBack !== localTimeStr) {
    return {
      isGap: true,
      adjustedDateTime: dt,
      explanation: `Wall-clock time ${localTimeStr} on ${localDateStr} in ${tz} falls into a DST spring-forward gap and was adjusted to ${dt.toFormat('yyyy-MM-dd HH:mm ZZZZ')}`,
    };
  }

  return {
    isGap: false,
    adjustedDateTime: dt,
  };
};

/**
 * 8. Detect ambiguous local wall-clock times during DST fall-back
 */
export const handleFallBackAmbiguity = (
  localDateStr: string,
  localTimeStr: string,
  tz: string
): FallBackCheck => {
  if (!isValidIanaTimezone(tz)) {
    throw new Error(`Invalid IANA timezone: ${tz}`);
  }

  // Parse wall-clock time in zone
  const dtBase = DateTime.fromFormat(`${localDateStr} ${localTimeStr}`, 'yyyy-MM-dd HH:mm', {
    zone: tz,
  });

  // Check offset 1 hour earlier and 1 hour later to see if DST transition occurs on this day
  const dtEarlier = dtBase.minus({ hours: 1 });
  const dtLater = dtBase.plus({ hours: 1 });

  // If offset changed between earlier and later, check if local time recurs
  if (dtEarlier.offset !== dtLater.offset) {
    // Construct earlier instance (before transition) and later instance (after transition)
    const earlierUtc = DateTime.fromObject(
      {
        year: dtBase.year,
        month: dtBase.month,
        day: dtBase.day,
        hour: dtBase.hour,
        minute: dtBase.minute,
      },
      { zone: tz }
    );

    // Later instance offset by transition difference
    const offsetDiffMinutes = dtEarlier.offset - dtLater.offset;
    if (offsetDiffMinutes > 0) {
      const laterUtc = earlierUtc.plus({ minutes: offsetDiffMinutes });

      return {
        isAmbiguous: true,
        earlierInstance: earlierUtc,
        laterInstance: laterUtc,
      };
    }
  }

  return {
    isAmbiguous: false,
    earlierInstance: dtBase,
  };
};

/**
 * 9. Detect overlapping UTC intervals
 */
export const doIntervalsOverlap = (
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string
): boolean => {
  const dtStartA =
    typeof startA === 'string'
      ? DateTime.fromISO(startA, { zone: 'utc' })
      : DateTime.fromJSDate(startA, { zone: 'utc' });
  const dtEndA =
    typeof endA === 'string'
      ? DateTime.fromISO(endA, { zone: 'utc' })
      : DateTime.fromJSDate(endA, { zone: 'utc' });
  const dtStartB =
    typeof startB === 'string'
      ? DateTime.fromISO(startB, { zone: 'utc' })
      : DateTime.fromJSDate(startB, { zone: 'utc' });
  const dtEndB =
    typeof endB === 'string'
      ? DateTime.fromISO(endB, { zone: 'utc' })
      : DateTime.fromJSDate(endB, { zone: 'utc' });

  return dtStartA < dtEndB && dtStartB < dtEndA;
};
