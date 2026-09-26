import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '../utils/prisma.js';
import { pendingTrialRequests } from '../controllers/trialController.js';
import { JWT_SECRET } from '../config/jwt.js';

// Mock prisma
vi.mock('../utils/prisma.js', () => ({
  prisma: {
    mentor: {
      findMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
  },
}));

describe('POST /api/bookings Endpoint', () => {
  const jwtSecret = JWT_SECRET;

  const mockParentUser = {
    userId: 'user-parent-123',
    email: 'parent@example.com',
    role: 'PARENT',
  };

  const validToken = jwt.sign(mockParentUser, jwtSecret, { expiresIn: '15m' });

  const mockMentor1 = {
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
    ],
  };

  const mockMentor2 = {
    id: 'mentor-2',
    name: 'Priya Patel',
    email: 'priya.patel@codeyoung.example',
    timezone: 'Asia/Kolkata',
    active: true,
    maxDailyBookings: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    availabilities: [
      {
        id: 'av-2',
        mentorId: 'mentor-2',
        dayOfWeek: 1,
        startLocalTime: '09:00',
        endLocalTime: '17:00',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pendingTrialRequests.clear();
  });

  it('1. Successful booking creation with verified trial request', async () => {
    const trialRequestId = 'tr_test_success_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Jane Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019900',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'America/New_York',
      phoneVerified: true,
      verifiedAt: new Date(),
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor1]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.create as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue({
      id: 'booking-888',
      parentId: mockParentUser.userId,
      mentorId: mockMentor1.id,
      course: 'CODING',
      studentGrade: 'Grade 5',
      startUtc: new Date('2026-10-12T05:00:00Z'),
      endUtc: new Date('2026-10-12T05:45:00Z'),
      parentTimezone: 'America/New_York',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-12345678',
      status: 'CONFIRMED',
      createdAt: new Date(),
      mentor: mockMentor1,
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/booked successfully/i);
    expect(res.body.booking.id).toBe('booking-888');
    expect(res.body.booking.mentorId).toBe(mockMentor1.id);
    expect(res.body.booking.classLink).toMatch(/meet\.codeyoung\.example/);
    expect(res.body.booking.parentLocalDisplay).toMatch(/America\/New_York|EDT/);
    expect(res.body.booking.mentorLocalDisplay).toMatch(/Asia\/Kolkata|IST|GMT\+5:30|\+05:30/);

    // Verify trial request was cleaned up
    expect(pendingTrialRequests.has(trialRequestId)).toBe(false);
  });

  it('2. Mentor assignment: selects least-loaded eligible mentor', async () => {
    const trialRequestId = 'tr_least_loaded_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Jane Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019900',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    // Mock mentor1 has 1 existing booking on 2026-10-12, mentor2 has 0
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor1, mockMentor2]);
    (
      prisma.booking.findMany as unknown as {
        mockResolvedValue: (v: unknown) => void;
        mockImplementation: (fn: (args: unknown) => unknown) => void;
      }
    ).mockImplementation((args: unknown) => {
      const typedArgs = args as { where?: { mentorId?: string } };
      if (typedArgs?.where?.mentorId === 'mentor-1') {
        return Promise.resolve([
          {
            id: 'b-exist-1',
            mentorId: 'mentor-1',
            startUtc: new Date('2026-10-12T04:00:00Z'),
            endUtc: new Date('2026-10-12T04:45:00Z'),
            status: 'CONFIRMED',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    (
      prisma.booking.create as unknown as {
        mockResolvedValue: (v: unknown) => void;
        mockImplementation: (fn: (args: unknown) => unknown) => void;
      }
    ).mockImplementation((args: unknown) => {
      const typedArgs = args as {
        data: {
          mentorId: string;
          course: string;
          studentGrade: string;
          startUtc: Date;
          endUtc: Date;
          parentTimezone: string;
          mentorTimezoneSnapshot: string;
          classLink: string;
        };
      };
      return Promise.resolve({
        id: 'booking-least-loaded',
        parentId: mockParentUser.userId,
        mentorId: typedArgs.data.mentorId,
        course: typedArgs.data.course,
        studentGrade: typedArgs.data.studentGrade,
        startUtc: typedArgs.data.startUtc,
        endUtc: typedArgs.data.endUtc,
        parentTimezone: typedArgs.data.parentTimezone,
        mentorTimezoneSnapshot: typedArgs.data.mentorTimezoneSnapshot,
        classLink: typedArgs.data.classLink,
        status: 'CONFIRMED',
        createdAt: new Date(),
        mentor: typedArgs.data.mentorId === 'mentor-2' ? mockMentor2 : mockMentor1,
      });
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:00:00.000Z',
      });

    expect(res.status).toBe(201);
    // Should select mentor-2 because mentor-1 already has 1 booking that day
    expect(res.body.booking.mentorId).toBe('mentor-2');
  });

  it('3. Maximum 2 classes per day rejection when mentor daily limit reached', async () => {
    const trialRequestId = 'tr_max_daily_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Jane Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019900',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    // Mock mentor1 already has 2 existing bookings on 2026-10-12 (limit reached)
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor1]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([
      {
        id: 'b-1',
        mentorId: 'mentor-1',
        startUtc: new Date('2026-10-12T04:00:00Z'),
        endUtc: new Date('2026-10-12T04:45:00Z'),
        status: 'CONFIRMED',
      },
      {
        id: 'b-2',
        mentorId: 'mentor-1',
        startUtc: new Date('2026-10-12T06:00:00Z'),
        endUtc: new Date('2026-10-12T06:45:00Z'),
        status: 'CONFIRMED',
      },
    ]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T08:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('NO_MENTOR_AVAILABLE');
  });

  it('4. Overlap rejection when mentor has existing slot overlap', async () => {
    const trialRequestId = 'tr_overlap_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Jane Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019900',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor1]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([
      {
        id: 'b-1',
        mentorId: 'mentor-1',
        startUtc: new Date('2026-10-12T05:00:00Z'),
        endUtc: new Date('2026-10-12T05:45:00Z'),
        status: 'CONFIRMED',
      },
    ]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:30:00.000Z', // Overlaps with 05:00-05:45
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('NO_MENTOR_AVAILABLE');
  });

  it('5. Parent cannot access another parent trial request', async () => {
    const trialRequestId = 'tr_other_parent_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Other Parent',
      parentEmail: 'other.parent@example.com', // Different email!
      parentPhone: '+1555019999',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`) // Token email is parent@example.com
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:00:00.000Z',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/does not belong to the authenticated user/i);
  });

  it('6. No mentor available error response formatting', async () => {
    const trialRequestId = 'tr_no_mentor_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Jane Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019900',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 'NO_MENTOR_AVAILABLE',
      message: 'No mentors are available for this time. Please choose another slot.',
    });
  });

  it('7. Correct timezone displays for parent and mentor', async () => {
    const trialRequestId = 'tr_tz_display_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'UK Parent',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019900',
      studentGrade: 'Grade 6',
      studentSubject: 'Math',
      course: 'MATHEMATICS',
      timezone: 'Europe/London',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor1]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.create as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue({
      id: 'b-tz-123',
      parentId: mockParentUser.userId,
      mentorId: mockMentor1.id,
      course: 'MATHEMATICS',
      studentGrade: 'Grade 6',
      startUtc: new Date('2026-10-12T08:00:00Z'),
      endUtc: new Date('2026-10-12T08:45:00Z'),
      parentTimezone: 'Europe/London',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-tz123456',
      status: 'CONFIRMED',
      createdAt: new Date(),
      mentor: mockMentor1,
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T08:00:00.000Z',
      });

    expect(res.status).toBe(201);
    // 08:00 UTC in London (BST +01:00 in October) is 09:00 GMT+1 / BST
    expect(res.body.booking.parentLocalDisplay).toMatch(/Europe\/London|BST|GMT\+1|\+01:00/);
    // 08:00 UTC in Kolkata (IST +05:30) is 13:30 IST
    expect(res.body.booking.mentorLocalDisplay).toMatch(/Asia\/Kolkata|IST|GMT\+5:30|\+05:30/);
  });

  it('8. Concurrent booking requests handled safely via Prisma transaction mock', async () => {
    const trialRequestId1 = 'tr_conc_1';
    const trialRequestId2 = 'tr_conc_2';

    pendingTrialRequests.set(trialRequestId1, {
      id: trialRequestId1,
      parentName: 'Parent 1',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019901',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    pendingTrialRequests.set(trialRequestId2, {
      id: trialRequestId2,
      parentName: 'Parent 2',
      parentEmail: 'parent@example.com',
      parentPhone: '+1555019902',
      studentGrade: 'Grade 6',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'Asia/Kolkata',
      phoneVerified: true,
      createdAt: new Date(),
    });

    // Only 1 mentor exists with max 1 booking capacity remaining
    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([
      {
        ...mockMentor1,
        maxDailyBookings: 1,
      },
    ]);

    let bookingCount = 0;
    (
      prisma.booking.findMany as unknown as {
        mockResolvedValue: (v: unknown) => void;
        mockImplementation: (fn: (args: unknown) => unknown) => void;
      }
    ).mockImplementation(() => {
      if (bookingCount > 0) {
        return Promise.resolve([
          {
            id: 'b-first-booked',
            mentorId: 'mentor-1',
            startUtc: new Date('2026-10-12T05:00:00Z'),
            endUtc: new Date('2026-10-12T05:45:00Z'),
            status: 'CONFIRMED',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    (
      prisma.booking.create as unknown as {
        mockResolvedValue: (v: unknown) => void;
        mockImplementation: (fn: (args: unknown) => unknown) => void;
      }
    ).mockImplementation((args: unknown) => {
      const typedArgs = args as {
        data: {
          mentorId: string;
          course: string;
          studentGrade: string;
          startUtc: Date;
          endUtc: Date;
          parentTimezone: string;
          mentorTimezoneSnapshot: string;
          classLink: string;
        };
      };
      bookingCount++;
      return Promise.resolve({
        id: `booking-${bookingCount}`,
        parentId: mockParentUser.userId,
        mentorId: typedArgs.data.mentorId,
        course: typedArgs.data.course,
        studentGrade: typedArgs.data.studentGrade,
        startUtc: typedArgs.data.startUtc,
        endUtc: typedArgs.data.endUtc,
        parentTimezone: typedArgs.data.parentTimezone,
        mentorTimezoneSnapshot: typedArgs.data.mentorTimezoneSnapshot,
        classLink: typedArgs.data.classLink,
        status: 'CONFIRMED',
        createdAt: new Date(),
        mentor: mockMentor1,
      });
    });

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ trialRequestId: trialRequestId1, startUtc: '2026-10-12T05:00:00.000Z' }),
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ trialRequestId: trialRequestId2, startUtc: '2026-10-12T05:00:00.000Z' }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);
  });
});
