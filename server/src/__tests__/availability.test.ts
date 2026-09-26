import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../utils/prisma.js';
import { DateTime } from 'luxon';

// Mock prisma
vi.mock('../utils/prisma.js', () => ({
  prisma: {
    mentor: {
      findMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/availability Endpoint', () => {
  const mockMentors = [
    {
      id: 'mentor-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@codeyoung.example',
      timezone: 'Asia/Kolkata',
      active: true,
      maxDailyBookings: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      availabilities: [
        {
          id: 'av-1',
          mentorId: 'mentor-1',
          dayOfWeek: 1,
          startLocalTime: '09:00',
          endLocalTime: '17:00',
          active: true,
        },
        {
          id: 'av-2',
          mentorId: 'mentor-1',
          dayOfWeek: 2,
          startLocalTime: '09:00',
          endLocalTime: '17:00',
          active: true,
        },
        {
          id: 'av-3',
          mentorId: 'mentor-1',
          dayOfWeek: 3,
          startLocalTime: '09:00',
          endLocalTime: '17:00',
          active: true,
        },
        {
          id: 'av-4',
          mentorId: 'mentor-1',
          dayOfWeek: 4,
          startLocalTime: '09:00',
          endLocalTime: '17:00',
          active: true,
        },
        {
          id: 'av-5',
          mentorId: 'mentor-1',
          dayOfWeek: 5,
          startLocalTime: '09:00',
          endLocalTime: '17:00',
          active: true,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Normal day availability for India parent and India mentor', async () => {
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue(mockMentors);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    // Query for 2026-10-12 (a Monday)
    const res = await request(app)
      .get('/api/availability')
      .query({ date: '2026-10-12', timezone: 'Asia/Kolkata' });

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2026-10-12');
    expect(res.body.timezone).toBe('Asia/Kolkata');
    expect(res.body.slots.length).toBeGreaterThan(0);

    // Verify slot properties
    const firstSlot = res.body.slots[0];
    expect(firstSlot).toHaveProperty('startUtc');
    expect(firstSlot).toHaveProperty('endUtc');
    expect(firstSlot).toHaveProperty('parentLocalDisplay');
    expect(firstSlot.durationMinutes).toBe(45);
    expect(firstSlot.available).toBe(true);

    // Verify slots start from 09:00 IST to 16:00 IST (since mentor works 09:00 to 17:00)
    const firstSlotStartIst = DateTime.fromISO(firstSlot.startUtc).setZone('Asia/Kolkata');
    expect(firstSlotStartIst.hour).toBe(9);
    expect(firstSlotStartIst.minute).toBe(0);

    const lastSlot = res.body.slots[res.body.slots.length - 1];
    const lastSlotStartIst = DateTime.fromISO(lastSlot.startUtc).setZone('Asia/Kolkata');
    expect(lastSlotStartIst.hour).toBe(16);
    expect(lastSlotStartIst.minute).toBe(0);
  });

  it('2. US parent (America/New_York) and India mentor (Asia/Kolkata)', async () => {
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue(mockMentors);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    // Query for US parent local date 2026-10-12 (Monday)
    const res = await request(app)
      .get('/api/availability')
      .query({ date: '2026-10-12', timezone: 'America/New_York' });

    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('America/New_York');
    expect(res.body.slots.length).toBeGreaterThan(0);

    // Check each returned slot converts back to mentor's local working hours (09:00 - 17:00 IST)
    res.body.slots.forEach((slot: { startUtc: string; endUtc: string }) => {
      const slotStartMentor = DateTime.fromISO(slot.startUtc).setZone('Asia/Kolkata');
      const slotEndMentor = DateTime.fromISO(slot.endUtc).setZone('Asia/Kolkata');

      expect(slotStartMentor.hour).toBeGreaterThanOrEqual(9);
      expect(slotEndMentor.hour * 60 + slotEndMentor.minute).toBeLessThanOrEqual(17 * 60);
    });
  });

  it('3. UK parent (Europe/London) and India mentor (Asia/Kolkata)', async () => {
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue(mockMentors);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/availability')
      .query({ date: '2026-10-12', timezone: 'Europe/London' });

    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('Europe/London');
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('4. DST date handling (US Spring Forward transition date)', async () => {
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue(mockMentors);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    // March 9, 2026 is a Monday right after US Spring Forward DST transition (March 8, 2026)
    // We pass nowUtc to ensure 2026-03-09 is evaluated as future
    const slots = await (
      await import('../services/availabilityService.js')
    ).getAvailableSlots({
      dateStr: '2026-03-09',
      parentTz: 'America/New_York',
      nowUtc: DateTime.fromISO('2026-03-01T00:00:00Z'),
    });

    expect(slots.length).toBeGreaterThan(0);
    // Verify times are correctly formatted in EDT (-04:00)
    expect(slots[0].parentLocalDisplay).toMatch(/EDT|-04:00/);
  });

  it('5. No available mentor (when all mentors inactive or booked out)', async () => {
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/availability')
      .query({ date: '2026-10-12', timezone: 'Asia/Kolkata' });

    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([]);
  });

  it('6. Past slot exclusion', async () => {
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue(mockMentors);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    // Query for a past date
    const res = await request(app)
      .get('/api/availability')
      .query({ date: '2020-01-01', timezone: 'Asia/Kolkata' });

    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([]);
  });

  it('7. Invalid timezone error response', async () => {
    const res = await request(app)
      .get('/api/availability')
      .query({ date: '2026-10-12', timezone: 'Invalid/Timezone_Name' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.message).toMatch(/Invalid IANA timezone/i);
  });
});
