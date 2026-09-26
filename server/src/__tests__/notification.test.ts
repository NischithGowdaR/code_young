import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '../utils/prisma.js';
import { pendingTrialRequests } from '../controllers/trialController.js';
import { JWT_SECRET } from '../config/jwt.js';
import {
  getEmailService,
  DevelopmentEmailService,
} from '../services/email/developmentEmailService.js';

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

describe('Notification Service & Email Templates', () => {
  const jwtSecret = JWT_SECRET;

  const mockParentUser = {
    userId: 'user-parent-999',
    email: 'parent.notification@example.com',
    role: 'PARENT',
  };

  const validToken = jwt.sign(mockParentUser, jwtSecret, { expiresIn: '15m' });

  const mockMentor = {
    id: 'mentor-notification-1',
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
        mentorId: 'mentor-notification-1',
        dayOfWeek: 1,
        startLocalTime: '09:00',
        endLocalTime: '17:00',
        active: true,
      },
    ],
  };

  let emailService: DevelopmentEmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    pendingTrialRequests.clear();
    emailService = getEmailService() as DevelopmentEmailService;
    emailService.sentEmails = [];
  });

  it('1. Parent notification: sends booking confirmation email to parent with parent-local time', async () => {
    const trialRequestId = 'tr_notif_parent_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Alice Parent',
      parentEmail: 'parent.notification@example.com',
      parentPhone: '+1555019911',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'America/New_York',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.create as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue({
      id: 'b-notif-1',
      parentId: mockParentUser.userId,
      mentorId: mockMentor.id,
      course: 'CODING',
      studentGrade: 'Grade 5',
      startUtc: new Date('2026-10-12T05:00:00Z'),
      endUtc: new Date('2026-10-12T05:45:00Z'),
      parentTimezone: 'America/New_York',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-notif123',
      status: 'CONFIRMED',
      createdAt: new Date(),
      mentor: mockMentor,
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:00:00.000Z',
      });

    expect(res.status).toBe(201);

    // Verify parent email was logged
    const parentEmail = emailService.sentEmails.find(
      (e) => e.to === 'parent.notification@example.com'
    );
    expect(parentEmail).toBeDefined();
    expect(parentEmail?.type).toBe('CONFIRMATION');
    expect(parentEmail?.params.isParent).toBe(true);
    expect(parentEmail?.params.course).toBe('CODING');
    expect(parentEmail?.params.studentGrade).toBe('Grade 5');
    expect(parentEmail?.params.mentorName).toBe('Aarav Sharma');
    expect(parentEmail?.params.classLink).toBe('https://meet.codeyoung.example/room/cy-notif123');
    // Parent local time (05:00 UTC = 01:00 EDT in America/New_York)
    expect(parentEmail?.params.localTimeFormatted).toMatch(/America\/New_York|EDT/);
  });

  it('2. Mentor notification: sends booking confirmation email to mentor with mentor-local time', async () => {
    const trialRequestId = 'tr_notif_mentor_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Alice Parent',
      parentEmail: 'parent.notification@example.com',
      parentPhone: '+1555019911',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'America/New_York',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.create as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue({
      id: 'b-notif-2',
      parentId: mockParentUser.userId,
      mentorId: mockMentor.id,
      course: 'CODING',
      studentGrade: 'Grade 5',
      startUtc: new Date('2026-10-12T05:00:00Z'),
      endUtc: new Date('2026-10-12T05:45:00Z'),
      parentTimezone: 'America/New_York',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-notif123',
      status: 'CONFIRMED',
      createdAt: new Date(),
      mentor: mockMentor,
    });

    await request(app).post('/api/bookings').set('Authorization', `Bearer ${validToken}`).send({
      trialRequestId,
      startUtc: '2026-10-12T05:00:00.000Z',
    });

    // Verify mentor email was logged
    const mentorEmail = emailService.sentEmails.find(
      (e) => e.to === 'aarav.sharma@codeyoung.example'
    );
    expect(mentorEmail).toBeDefined();
    expect(mentorEmail?.type).toBe('CONFIRMATION');
    expect(mentorEmail?.params.isParent).toBe(false);
    expect(mentorEmail?.params.parentName).toBe('Alice Parent');
    expect(mentorEmail?.params.course).toBe('CODING');
    expect(mentorEmail?.params.studentGrade).toBe('Grade 5');
    expect(mentorEmail?.params.classLink).toBe('https://meet.codeyoung.example/room/cy-notif123');
    // Mentor local time (05:00 UTC = 10:30 IST in Asia/Kolkata)
    expect(mentorEmail?.params.localTimeFormatted).toMatch(/Asia\/Kolkata|IST|GMT\+5:30|\+05:30/);
  });

  it('3. Same class link in both parent and mentor emails', async () => {
    const trialRequestId = 'tr_same_link_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Alice Parent',
      parentEmail: 'parent.notification@example.com',
      parentPhone: '+1555019911',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'America/New_York',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.create as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue({
      id: 'b-same-link',
      parentId: mockParentUser.userId,
      mentorId: mockMentor.id,
      course: 'CODING',
      studentGrade: 'Grade 5',
      startUtc: new Date('2026-10-12T05:00:00Z'),
      endUtc: new Date('2026-10-12T05:45:00Z'),
      parentTimezone: 'America/New_York',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-unique-link-777',
      status: 'CONFIRMED',
      createdAt: new Date(),
      mentor: mockMentor,
    });

    await request(app).post('/api/bookings').set('Authorization', `Bearer ${validToken}`).send({
      trialRequestId,
      startUtc: '2026-10-12T05:00:00.000Z',
    });

    const parentEmail = emailService.sentEmails.find(
      (e) => e.to === 'parent.notification@example.com'
    );
    const mentorEmail = emailService.sentEmails.find(
      (e) => e.to === 'aarav.sharma@codeyoung.example'
    );

    expect(parentEmail?.params.classLink).toBe(
      'https://meet.codeyoung.example/room/cy-unique-link-777'
    );
    expect(mentorEmail?.params.classLink).toBe(
      'https://meet.codeyoung.example/room/cy-unique-link-777'
    );
    expect(parentEmail?.params.classLink).toEqual(mentorEmail?.params.classLink);
  });

  it('4. Notification failure handling: booking transaction succeeds even if email sending throws', async () => {
    const trialRequestId = 'tr_notif_fail_123';
    pendingTrialRequests.set(trialRequestId, {
      id: trialRequestId,
      parentName: 'Alice Parent',
      parentEmail: 'parent.notification@example.com',
      parentPhone: '+1555019911',
      studentGrade: 'Grade 5',
      studentSubject: 'Coding',
      course: 'CODING',
      timezone: 'America/New_York',
      phoneVerified: true,
      createdAt: new Date(),
    });

    (
      prisma.mentor.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([mockMentor]);
    (
      prisma.booking.findMany as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue([]);
    (
      prisma.booking.create as unknown as { mockResolvedValue: (v: unknown) => void }
    ).mockResolvedValue({
      id: 'b-notif-fail',
      parentId: mockParentUser.userId,
      mentorId: mockMentor.id,
      course: 'CODING',
      studentGrade: 'Grade 5',
      startUtc: new Date('2026-10-12T05:00:00Z'),
      endUtc: new Date('2026-10-12T05:45:00Z'),
      parentTimezone: 'America/New_York',
      mentorTimezoneSnapshot: 'Asia/Kolkata',
      classLink: 'https://meet.codeyoung.example/room/cy-fail-test',
      status: 'CONFIRMED',
      createdAt: new Date(),
      mentor: mockMentor,
    });

    // Mock sendBookingConfirmation to throw an intentional error
    vi.spyOn(emailService, 'sendBookingConfirmation').mockRejectedValue(
      new Error('SMTP Connection Timeout')
    );

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        trialRequestId,
        startUtc: '2026-10-12T05:00:00.000Z',
      });

    // Booking must still succeed (201 Created)
    expect(res.status).toBe(201);
    expect(res.body.booking.id).toBe('b-notif-fail');
  });
});
