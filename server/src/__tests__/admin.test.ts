import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { prisma } from '../utils/prisma.js';
import { JWT_SECRET } from '../config/jwt.js';

// Mock Prisma for offline unit test execution
vi.mock('../utils/prisma.js', () => ({
  prisma: {
    mentor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Admin Management API & Authorization', () => {
  const parentToken = jwt.sign(
    { userId: 'u-parent-1', role: 'PARENT', email: 'parent@example.com' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const adminToken = jwt.sign(
    { userId: 'u-admin-1', role: 'ADMIN', email: 'admin@codeyoung.com' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const mockMentor = {
    id: 'm-101',
    name: 'Mentor Priya Sharma',
    email: 'priya@codeyoung.example',
    timezone: 'Asia/Kolkata',
    active: true,
    maxDailyBookings: 2,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    bookings: [
      {
        id: 'b-201',
        startUtc: new Date('2026-10-20T10:00:00Z'),
        endUtc: new Date('2026-10-20T10:45:00Z'),
        status: 'CONFIRMED',
      },
    ],
  };

  const mockBooking = {
    id: 'b-201',
    parentId: 'u-parent-1',
    mentorId: 'm-101',
    course: 'CODING',
    studentGrade: 'Grade 6',
    startUtc: new Date('2026-10-20T10:00:00Z'),
    endUtc: new Date('2026-10-20T10:45:00Z'),
    parentTimezone: 'America/New_York',
    mentorTimezoneSnapshot: 'Asia/Kolkata',
    classLink: 'https://meet.codeyoung.example/room/cy-testadmin123',
    status: 'CONFIRMED',
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    parent: {
      id: 'u-parent-1',
      name: 'Parent User',
      email: 'parent@example.com',
    },
    mentor: {
      id: 'm-101',
      name: 'Mentor Priya Sharma',
      email: 'priya@codeyoung.example',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Parent denied from admin APIs: should return 403 Forbidden for PARENT role', async () => {
    // Attempt GET /api/admin/mentors as PARENT
    const resMentors = await request(app)
      .get('/api/admin/mentors')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(resMentors.status).toBe(403);
    expect(resMentors.body.error).toBe('Forbidden');

    // Attempt GET /api/admin/bookings as PARENT
    const resBookings = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(resBookings.status).toBe(403);
    expect(resBookings.body.error).toBe('Forbidden');

    // Attempt PATCH /api/admin/mentors/:id/status as PARENT
    const resPatch = await request(app)
      .patch('/api/admin/mentors/m-101/status')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ active: false });

    expect(resPatch.status).toBe(403);
    expect(resPatch.body.error).toBe('Forbidden');
  });

  it('2. Admin can view mentors: should return all mentors with daily booking counts', async () => {
    vi.mocked(prisma.mentor.findMany).mockResolvedValue([mockMentor as unknown as never]);

    const res = await request(app)
      .get('/api/admin/mentors')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.mentors).toBeInstanceOf(Array);
    expect(res.body.mentors.length).toBe(1);

    const mentorItem = res.body.mentors[0];
    expect(mentorItem.id).toBe('m-101');
    expect(mentorItem.name).toBe('Mentor Priya Sharma');
    expect(mentorItem.email).toBe('priya@codeyoung.example');
    expect(mentorItem.timezone).toBe('Asia/Kolkata');
    expect(mentorItem.active).toBe(true);
    expect(typeof mentorItem.dailyBookingCount).toBe('number');
  });

  it('3. Admin can view bookings: should return bookings with parent-local and mentor-local display times', async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([mockBooking as unknown as never]);

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bookings).toBeInstanceOf(Array);
    expect(res.body.bookings.length).toBe(1);

    const bookingItem = res.body.bookings[0];
    expect(bookingItem.id).toBe('b-201');
    expect(bookingItem.parentName).toBe('Parent User');
    expect(bookingItem.mentorName).toBe('Mentor Priya Sharma');
    expect(bookingItem.course).toBe('CODING');
    expect(bookingItem.parentTimezone).toBe('America/New_York');
    expect(bookingItem.mentorTimezoneSnapshot).toBe('Asia/Kolkata');
    expect(bookingItem.parentLocalDisplay).toContain('2026-10-20');
    expect(bookingItem.mentorLocalDisplay).toContain('2026-10-20');
    expect(bookingItem.classLink).toBe('https://meet.codeyoung.example/room/cy-testadmin123');
    expect(bookingItem.status).toBe('CONFIRMED');
  });

  it('4. Admin can deactivate a mentor: should set active=false in database', async () => {
    vi.mocked(prisma.mentor.findUnique).mockResolvedValue(mockMentor as unknown as never);
    vi.mocked(prisma.mentor.update).mockResolvedValue({
      ...mockMentor,
      active: false,
    } as unknown as never);

    const res = await request(app)
      .patch('/api/admin/mentors/m-101/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.mentor.active).toBe(false);
    expect(prisma.mentor.update).toHaveBeenCalledWith({
      where: { id: 'm-101' },
      data: { active: false },
      include: expect.any(Object),
    });
  });

  it('5. Invalid admin request rejected: should reject invalid mentor ID or missing body fields with 400 or 404', async () => {
    // Missing active / isActive field
    const resMissingBody = await request(app)
      .patch('/api/admin/mentors/m-101/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(resMissingBody.status).toBe(400);

    // Non-existent mentor ID
    vi.mocked(prisma.mentor.findUnique).mockResolvedValue(null);

    const resNotFound = await request(app)
      .patch('/api/admin/mentors/non-existent-mentor-id/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    expect(resNotFound.status).toBe(404);
  });

  it('6. Admin can cancel a booking: should update booking status to CANCELLED', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as unknown as never);
    vi.mocked(prisma.booking.update).mockResolvedValue({
      ...mockBooking,
      status: 'CANCELLED',
    } as unknown as never);

    const res = await request(app)
      .post('/api/admin/bookings/b-201/cancel')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('CANCELLED');
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'b-201' },
      data: { status: 'CANCELLED' },
      include: expect.any(Object),
    });
  });
});
