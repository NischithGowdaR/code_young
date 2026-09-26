import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

interface TestUserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  passwordHash: string;
  role: 'PARENT' | 'MENTOR' | 'ADMIN';
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryUsers: TestUserRecord[] = [];
const inMemoryRefreshTokens: Record<string, unknown>[] = [];

vi.mock('../utils/prisma.js', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) {
            return inMemoryUsers.find((u) => u.email === where.email) || null;
          }
          if (where.id) {
            return inMemoryUsers.find((u) => u.id === where.id) || null;
          }
          return null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const newUser: TestUserRecord = {
            id: `user-${Date.now()}-${Math.random()}`,
            name: data.name as string,
            email: data.email as string,
            phoneNumber: (data.phoneNumber as string) || null,
            passwordHash: data.passwordHash as string,
            role: (data.role as 'PARENT' | 'MENTOR' | 'ADMIN') || 'PARENT',
            timezone: (data.timezone as string) || 'Asia/Kolkata',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          inMemoryUsers.push(newUser);
          return newUser;
        }),
      },
      refreshToken: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const newTok = {
            id: `token-${Date.now()}-${Math.random()}`,
            tokenHash: data.tokenHash,
            userId: data.userId,
            revoked: false,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
          };
          inMemoryRefreshTokens.push(newTok);
          return newTok;
        }),
      },
      booking: {
        findMany: vi.fn(async () => []),
      },
    },
  };
});

describe('Parent Dashboard & Profile API', () => {
  const testUser = {
    name: 'Parent User',
    email: 'parent.dashboard@example.com',
    password: 'Password123!',
    phoneNumber: '+15550199',
    timezone: 'Asia/Kolkata',
  };

  let accessToken: string;

  beforeEach(async () => {
    inMemoryUsers.length = 0;
    inMemoryRefreshTokens.length = 0;

    const regRes = await request(app).post('/api/auth/register').send(testUser);
    accessToken = regRes.body.accessToken;
  });

  it('1. Unauthenticated user: should reject unauthenticated GET /api/parent/dashboard with 401', async () => {
    const res = await request(app).get('/api/parent/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('2. Authenticated dashboard: should return parent name, student summary, upcoming & previous bookings', async () => {
    const res = await request(app)
      .get('/api/parent/dashboard')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.studentSummary).toBeDefined();
    expect(Array.isArray(res.body.upcomingBookings)).toBe(true);
    expect(Array.isArray(res.body.previousBookings)).toBe(true);
  });

  it('3. Parent booking list: should return all bookings for parent', async () => {
    const res = await request(app)
      .get('/api/parent/bookings')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bookings)).toBe(true);
  });

  it('4. Profile display: should return parent profile details (name, email, phone, timezone, role)', async () => {
    const res = await request(app)
      .get('/api/parent/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.email).toBe(testUser.email.toLowerCase());
    expect(res.body.profile.timezone).toBe(testUser.timezone);
  });
});
