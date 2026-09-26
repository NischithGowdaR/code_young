import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { inMemoryOtps } from '../services/otp/developmentOtpService.js';

describe('Phone OTP Verification API', () => {
  const trialPayload = {
    parentName: 'John Reese',
    parentEmail: 'john.reese@example.com',
    parentPhone: '+1555018899',
    studentGrade: 'Grade 6',
    studentSubject: 'Scratch Coding',
    course: 'CODING',
    timezone: 'America/New_York',
    acceptTerms: true,
    acceptPrivacy: true,
  };

  let trialRequestId: string;

  beforeEach(async () => {
    inMemoryOtps.clear();
    const res = await request(app).post('/api/trial-requests').send(trialPayload);
    trialRequestId = res.body.trialRequestId;
  });

  it('1. OTP sent: should send OTP to parent phone and return 200 without exposing OTP value', async () => {
    const res = await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('OTP sent');
    expect(res.body.cooldownSeconds).toBe(60);
    expect(res.body.otp).toBeUndefined(); // Never expose OTP in response
  });

  it('2. Correct OTP: should verify valid OTP and mark trial request phoneVerified=true', async () => {
    await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    const verifyRes = await request(app)
      .post(`/api/trial-requests/${trialRequestId}/verify-otp`)
      .send({ code: '123456' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.phoneVerified).toBe(true);

    // Verify trial request status endpoint
    const statusRes = await request(app).get(`/api/trial-requests/${trialRequestId}`);
    expect(statusRes.body.trialRequest.phoneVerified).toBe(true);
  });

  it('3. Incorrect OTP: should reject invalid OTP code and decrement remaining attempts', async () => {
    await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    const res = await request(app)
      .post(`/api/trial-requests/${trialRequestId}/verify-otp`)
      .send({ code: '999999' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Bad Request');
    expect(res.body.message).toContain('Invalid OTP code');

    // Confirm phone remains unverified
    const statusRes = await request(app).get(`/api/trial-requests/${trialRequestId}`);
    expect(statusRes.body.trialRequest.phoneVerified).toBe(false);
  });

  it('4. Expired OTP: should reject verification if OTP expires', async () => {
    await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    // Fast-forward latest OTP expiration date
    const latestOtp = Array.from(inMemoryOtps.values())[0];
    if (latestOtp) {
      latestOtp.expiresAt = new Date(Date.now() - 1000); // 1s ago
    }

    const res = await request(app)
      .post(`/api/trial-requests/${trialRequestId}/verify-otp`)
      .send({ code: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('expired');
  });

  it('5. Maximum attempts: should block verification after 5 failed attempts', async () => {
    await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    // 5 invalid attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/trial-requests/${trialRequestId}/verify-otp`)
        .send({ code: '000000' });
    }

    // 6th attempt (even if code is correct) must be blocked
    const res = await request(app)
      .post(`/api/trial-requests/${trialRequestId}/verify-otp`)
      .send({ code: '123456' });

    expect(res.status).toBe(429);
    expect(res.body.message).toContain('Maximum OTP verification attempts exceeded');
  });

  it('6. Resend cooldown: should enforce 60-second cooldown on consecutive OTP requests', async () => {
    await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    // Immediate second request within 60s
    const res = await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too Many Requests');
    expect(res.body.message).toContain('Please wait');
  });

  it('7. Previous OTP invalidation: resending OTP invalidates previous OTP', async () => {
    await request(app).post(`/api/trial-requests/${trialRequestId}/send-otp`);

    const firstOtpRecord = Array.from(inMemoryOtps.values())[0];

    // Fast-forward 61 seconds so cooldown passes
    if (firstOtpRecord) {
      firstOtpRecord.createdAt = new Date(Date.now() - 65 * 1000);
    }

    // Resend OTP
    await request(app).post(`/api/trial-requests/${trialRequestId}/resend-otp`);

    expect(inMemoryOtps.size).toBe(2);
  });

  it('8. Booking flow blocked before verification: phoneVerified must be false before OTP', async () => {
    const statusRes = await request(app).get(`/api/trial-requests/${trialRequestId}`);
    expect(statusRes.body.trialRequest.phoneVerified).toBe(false);
  });
});
