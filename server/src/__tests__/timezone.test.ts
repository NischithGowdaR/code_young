import { describe, it, expect } from 'vitest';
import {
  isValidIanaTimezone,
  utcToParentLocal,
  utcToMentorLocal,
  formatLocalDateTime,
  getTimezoneInfo,
  getMentorLocalCalendarDate,
  detectSpringForwardGap,
  handleFallBackAmbiguity,
  doIntervalsOverlap,
} from '../utils/timezone.js';

describe('Timezone Domain Module (Luxon)', () => {
  const ASIA_KOLKATA = 'Asia/Kolkata';
  const AMERICA_NEW_YORK = 'America/New_York';
  const EUROPE_LONDON = 'Europe/London';

  describe('1. IANA Timezone Validation', () => {
    it('should validate standard IANA timezone strings', () => {
      expect(isValidIanaTimezone(ASIA_KOLKATA)).toBe(true);
      expect(isValidIanaTimezone(AMERICA_NEW_YORK)).toBe(true);
      expect(isValidIanaTimezone(EUROPE_LONDON)).toBe(true);
    });

    it('should reject invalid timezone identifiers or fixed offsets', () => {
      expect(isValidIanaTimezone('UTC+5:30')).toBe(false);
      expect(isValidIanaTimezone('GMT-4')).toBe(false);
      expect(isValidIanaTimezone('Invalid/Zone_Name')).toBe(false);
      expect(isValidIanaTimezone('')).toBe(false);
    });
  });

  describe('2. India Timezone (Asia/Kolkata)', () => {
    it('should convert UTC to India local time (+05:30 offset)', () => {
      const utcIso = '2026-09-25T10:00:00.000Z';
      const dtLocal = utcToParentLocal(utcIso, ASIA_KOLKATA);

      expect(formatLocalDateTime(dtLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-09-25 15:30');
      expect(getTimezoneInfo(ASIA_KOLKATA, dtLocal).offsetFormatted).toBe('+05:30');
    });
  });

  describe('3. US Timezone (America/New_York)', () => {
    it('should convert UTC to New York local time during EDT (-04:00 offset)', () => {
      const utcIso = '2026-09-25T14:00:00.000Z'; // EDT in September
      const dtLocal = utcToMentorLocal(utcIso, AMERICA_NEW_YORK);

      expect(formatLocalDateTime(dtLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-09-25 10:00');
      expect(getTimezoneInfo(AMERICA_NEW_YORK, dtLocal).offsetFormatted).toBe('-04:00');
    });

    it('should convert UTC to New York local time during EST (-05:00 offset)', () => {
      const utcIso = '2026-12-25T15:00:00.000Z'; // EST in December
      const dtLocal = utcToMentorLocal(utcIso, AMERICA_NEW_YORK);

      expect(formatLocalDateTime(dtLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-12-25 10:00');
      expect(getTimezoneInfo(AMERICA_NEW_YORK, dtLocal).offsetFormatted).toBe('-05:00');
    });
  });

  describe('4. UK Timezone (Europe/London)', () => {
    it('should convert UTC to London local time during BST (+01:00 offset)', () => {
      const utcIso = '2026-06-15T12:00:00.000Z'; // BST in June
      const dtLocal = utcToParentLocal(utcIso, EUROPE_LONDON);

      expect(formatLocalDateTime(dtLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-06-15 13:00');
      expect(getTimezoneInfo(EUROPE_LONDON, dtLocal).offsetFormatted).toBe('+01:00');
    });

    it('should convert UTC to London local time during GMT (+00:00 offset)', () => {
      const utcIso = '2026-01-15T12:00:00.000Z'; // GMT in January
      const dtLocal = utcToParentLocal(utcIso, EUROPE_LONDON);

      expect(formatLocalDateTime(dtLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-01-15 12:00');
      expect(getTimezoneInfo(EUROPE_LONDON, dtLocal).offsetFormatted).toBe('+00:00');
    });
  });

  describe('5. DST Spring-Forward (Gap Detection)', () => {
    it('should detect nonexistent wall-clock time in America/New_York on 2026-03-08 at 02:30', () => {
      // In US New York on March 8, 2026, 02:00 skips to 03:00
      const result = detectSpringForwardGap('2026-03-08', '02:30', AMERICA_NEW_YORK);

      expect(result.isGap).toBe(true);
      expect(result.adjustedDateTime).toBeDefined();
      expect(result.explanation).toContain('falls into a DST spring-forward gap');
    });

    it('should return isGap=false for valid wall-clock time during spring-forward day', () => {
      const result = detectSpringForwardGap('2026-03-08', '03:30', AMERICA_NEW_YORK);

      expect(result.isGap).toBe(false);
    });
  });

  describe('6. DST Fall-Back (Ambiguity Handling)', () => {
    it('should detect ambiguous wall-clock time in America/New_York on 2026-11-01 at 01:30', () => {
      // In US New York on Nov 1, 2026, 01:00 to 01:59 occurs twice
      const result = handleFallBackAmbiguity('2026-11-01', '01:30', AMERICA_NEW_YORK);

      expect(result.isAmbiguous).toBe(true);
      expect(result.earlierInstance).toBeDefined();
      expect(result.laterInstance).toBeDefined();
    });

    it('should return isAmbiguous=false for unambiguous wall-clock time', () => {
      const result = handleFallBackAmbiguity('2026-09-25', '10:00', AMERICA_NEW_YORK);

      expect(result.isAmbiguous).toBe(false);
    });
  });

  describe('7. Cross-Midnight Conversion', () => {
    it('should convert evening in New York to early morning next day in Kolkata', () => {
      // 2026-09-25 21:00 EDT (01:00 UTC on 2026-09-26)
      const utcInstant = '2026-09-26T01:00:00.000Z';

      const nyLocal = utcToMentorLocal(utcInstant, AMERICA_NEW_YORK);
      const kolkataLocal = utcToParentLocal(utcInstant, ASIA_KOLKATA);

      expect(formatLocalDateTime(nyLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-09-25 21:00');
      expect(getMentorLocalCalendarDate(utcInstant, AMERICA_NEW_YORK)).toBe('2026-09-25');

      expect(formatLocalDateTime(kolkataLocal, 'yyyy-MM-dd HH:mm')).toBe('2026-09-26 06:30');
    });
  });

  describe('8. Overlap Detection', () => {
    it('should detect overlapping UTC intervals', () => {
      const startA = '2026-09-25T10:00:00Z';
      const endA = '2026-09-25T11:00:00Z';

      const startB = '2026-09-25T10:30:00Z';
      const endB = '2026-09-25T11:30:00Z';

      expect(doIntervalsOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('should return false for back-to-back non-overlapping UTC intervals', () => {
      const startA = '2026-09-25T10:00:00Z';
      const endA = '2026-09-25T11:00:00Z';

      const startB = '2026-09-25T11:00:00Z';
      const endB = '2026-09-25T12:00:00Z';

      expect(doIntervalsOverlap(startA, endA, startB, endB)).toBe(false);
    });
  });
});
