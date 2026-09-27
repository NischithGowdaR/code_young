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

interface TestTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

interface CreateUserData {
  name: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  role?: 'PARENT' | 'MENTOR' | 'ADMIN';
  timezone?: string;
}

interface CreateTokenData {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

// In-memory data store for testing auth without a live PostgreSQL database
const inMemoryUsers: TestUserRecord[] = [];
const inMemoryRefreshTokens: TestTokenRecord[] = [];

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
        create: vi.fn(async ({ data }: { data: CreateUserData }) => {
          const newUser: TestUserRecord = {
            id: `user-${Date.now()}-${Math.random()}`,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber || null,
            passwordHash: data.passwordHash,
            role: data.role || 'PARENT',
            timezone: data.timezone || 'Asia/Kolkata',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          inMemoryUsers.push(newUser);
          return newUser;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id?: string; email?: string };
            data: Partial<TestUserRecord>;
          }) => {
            const found = inMemoryUsers.find(
              (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email)
            );
            if (found) {
              Object.assign(found, data, { updatedAt: new Date() });
              return found;
            }
            throw new Error('Record not found');
          }
        ),
      },
      refreshToken: {
        create: vi.fn(async ({ data }: { data: CreateTokenData }) => {
          const newTok: TestTokenRecord = {
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
        findUnique: vi.fn(
          async ({
            where,
            include,
          }: {
            where: { tokenHash: string };
            include?: { user?: boolean };
          }) => {
            const found = inMemoryRefreshTokens.find((t) => t.tokenHash === where.tokenHash);
            if (!found) return null;
            if (include?.user) {
              const user = inMemoryUsers.find((u) => u.id === found.userId);
              return { ...found, user };
            }
            return found;
          }
        ),
        update: vi.fn(
          async ({ where, data }: { where: { id: string }; data: Partial<TestTokenRecord> }) => {
            const found = inMemoryRefreshTokens.find((t) => t.id === where.id);
            if (found) {
              Object.assign(found, data);
            }
            return found;
          }
        ),
        updateMany: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { tokenHash: string };
            data: Partial<TestTokenRecord>;
          }) => {
            let count = 0;
            inMemoryRefreshTokens.forEach((t) => {
              if (t.tokenHash === where.tokenHash) {
                Object.assign(t, data);
                count++;
              }
            });
            return { count };
          }
        ),
      },
    },
  };
});

describe('Authentication & Authorization API', () => {
  const testUser = {
    name: 'Parent User',
    email: 'test.parent@example.com',
    password: 'Password123!',
    phoneNumber: '+15550199',
    timezone: 'Asia/Kolkata',
  };

  const adminUser = {
    name: 'Admin User',
    email: 'admin.auth.test@example.com',
    password: 'AdminPassword123!',
    role: 'ADMIN' as const,
  };

  beforeEach(() => {
    inMemoryUsers.length = 0;
    inMemoryRefreshTokens.length = 0;
  });

  it('1. Registration: should register a new parent user and return access token + cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined(); // Never return password hash
    expect(res.body.accessToken).toBeDefined();

    const rawCookies = res.headers['set-cookie'];
    const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
    const hasRefreshCookie = cookies.some((c: string) => c.includes('refreshToken='));
    expect(hasRefreshCookie).toBe(true);
  });

  it('1b. Registration: should enforce strong password complexity rules', async () => {
    // Too short (< 8 characters)
    const shortRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      password: 'Pass1!',
    });
    expect(shortRes.status).toBe(400);
    expect(shortRes.body.message).toContain('at least 8 characters');

    // Missing lowercase letter
    const noLowerRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      password: 'PASSWORD123!',
    });
    expect(noLowerRes.status).toBe(400);
    expect(noLowerRes.body.message).toContain('lowercase');

    // Missing uppercase letter
    const noUpperRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      password: 'password123!',
    });
    expect(noUpperRes.status).toBe(400);
    expect(noUpperRes.body.message).toContain('uppercase');

    // Missing digit/number
    const noNumberRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      password: 'Password!',
    });
    expect(noNumberRes.status).toBe(400);
    expect(noNumberRes.body.message).toContain('number');

    // Missing special character
    const noSpecialRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      password: 'Password123',
    });
    expect(noSpecialRes.status).toBe(400);
    expect(noSpecialRes.body.message).toContain('special character');

    // Mismatched confirmPassword when provided
    const mismatchRes = await request(app).post('/api/auth/register').send({
      ...testUser,
      password: 'Password123!',
      confirmPassword: 'MismatchPassword123!',
    });
    expect(mismatchRes.status).toBe(400);
    expect(mismatchRes.body.message).toContain('Passwords do not match');
  });

  it('2. Duplicate email: should reject registration if email is already registered', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
    expect(res.body.message).toContain('already exists');
  });

  it('3. Login: should log in an existing user with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.accessToken).toBeDefined();
  });

  it('4. Invalid credentials: should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('5. Protected route: should return user profile for authenticated GET /api/auth/me', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const accessToken = regRes.body.accessToken;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email);
    expect(meRes.body.user.passwordHash).toBeUndefined();
  });

  it('6. Refresh Token Rotation: should issue new access and refresh tokens using cookie', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const cookies = regRes.headers['set-cookie'];

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.headers['set-cookie']).toBeDefined();
  });

  it('7. Logout: should revoke refresh token and clear cookie', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const cookies = regRes.headers['set-cookie'];

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookies);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toContain('Logged out');

    // Attempting refresh after logout should fail
    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookies);

    expect(refreshRes.status).toBe(401);
  });

  it('8. Admin authorization: should restrict admin-only endpoints to admin role', async () => {
    // 8a. Parent user -> 403 Forbidden
    const parentRes = await request(app).post('/api/auth/register').send(testUser);

    const forbiddenRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${parentRes.body.accessToken}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error).toBe('Forbidden');

    // 8b. Register admin user
    const bcrypt = await import('bcryptjs');
    const adminPasswordHash = await bcrypt.default.hash(adminUser.password, 10);
    inMemoryUsers.push({
      id: 'admin-1',
      name: adminUser.name,
      email: adminUser.email,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });

    const adminAccessRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminLoginRes.body.accessToken}`);

    expect(adminAccessRes.status).toBe(200);
    expect(adminAccessRes.body.message).toContain('Admin Dashboard');
  });

  describe('Forgot Password Flow', () => {
    beforeEach(async () => {
      // Clear in-memory OTPs
      const { inMemoryOtps } = await import('../services/otp/developmentOtpService.js');
      inMemoryOtps.clear();
      // Ensure test user exists
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('9. Send OTP: should return 404 for unregistered email', async () => {
      const res = await request(app).post('/api/auth/forgot-password/send-otp').send({
        email: 'nonexistent@example.com',
      });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('No account found');
    });

    it('10. Send OTP: should send OTP for registered user and return cooldown', async () => {
      const res = await request(app).post('/api/auth/forgot-password/send-otp').send({
        email: testUser.email,
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('OTP has been sent');
      expect(res.body.cooldownSeconds).toBe(60);
    });

    it('11. Verify OTP: should reject incorrect OTP code', async () => {
      // Send OTP first
      await request(app).post('/api/auth/forgot-password/send-otp').send({
        email: testUser.email,
      });

      const res = await request(app).post('/api/auth/forgot-password/verify-otp').send({
        email: testUser.email,
        otpCode: '000000',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid OTP');
    });

    it('12. Verify OTP: should verify valid OTP code and issue a reset token', async () => {
      await request(app).post('/api/auth/forgot-password/send-otp').send({
        email: testUser.email,
      });

      // '123456' is default in NODE_ENV === 'test'
      const res = await request(app).post('/api/auth/forgot-password/verify-otp').send({
        email: testUser.email,
        otpCode: '123456',
      });

      expect(res.status).toBe(200);
      expect(res.body.resetToken).toBeDefined();
      expect(res.body.message).toContain('verified successfully');
    });

    it('13. Reset Password: should validate matching passwords and update password successfully', async () => {
      await request(app).post('/api/auth/forgot-password/send-otp').send({
        email: testUser.email,
      });

      const verifyRes = await request(app).post('/api/auth/forgot-password/verify-otp').send({
        email: testUser.email,
        otpCode: '123456',
      });

      const resetToken = verifyRes.body.resetToken;

      // 13a. Reject weak newPassword
      const weakRes = await request(app).post('/api/auth/forgot-password/reset-password').send({
        email: testUser.email,
        resetToken,
        newPassword: 'weak',
        confirmPassword: 'weak',
      });
      expect(weakRes.status).toBe(400);
      expect(weakRes.body.message).toContain('at least 8 characters');

      // 13b. Reject mismatched password
      const mismatchRes = await request(app).post('/api/auth/forgot-password/reset-password').send({
        email: testUser.email,
        resetToken,
        newPassword: 'BrandNewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      });
      expect(mismatchRes.status).toBe(400);

      // 13c. Successful reset
      const newPassword = 'BrandNewPassword123!';
      const resetRes = await request(app).post('/api/auth/forgot-password/reset-password').send({
        email: testUser.email,
        resetToken,
        newPassword,
        confirmPassword: newPassword,
      });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.message).toContain('reset successfully');
      expect(resetRes.body.user.email).toBe(testUser.email);
      expect(resetRes.body.accessToken).toBeDefined();

      // 13c. Verify user can now log in with the new password
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: newPassword,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.email).toBe(testUser.email);

      // 13d. Old password should no longer work
      const oldLoginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(oldLoginRes.status).toBe(401);
    });
  });
});
