import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Trial Class Request API (POST /api/trial-requests)', () => {
  const validRequest = {
    parentName: 'Sarah Connor',
    parentEmail: 'sarah.connor@example.com',
    parentPhone: '+1555019922',
    studentGrade: 'Grade 5',
    studentSubject: 'Python Basics',
    course: 'CODING',
    timezone: 'America/New_York',
    acceptTerms: true,
    acceptPrivacy: true,
  };

  it('1. Valid form: should create a trial request and return trialRequestId', async () => {
    const res = await request(app).post('/api/trial-requests').send(validRequest);

    expect(res.status).toBe(201);
    expect(res.body.trialRequestId).toBeDefined();
    expect(res.body.trialRequestId).toMatch(/^tr_/);
    expect(res.body.message).toContain('submitted successfully');
    expect(res.body.data.parentEmail).toBe(validRequest.parentEmail.toLowerCase());
  });

  it('2. Missing fields: should reject request missing required fields (parentName, studentGrade)', async () => {
    const invalidData = {
      ...validRequest,
      parentName: '',
      studentGrade: '',
    };

    const res = await request(app).post('/api/trial-requests').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.message).toContain('Parent name is required');
  });

  it('3. Invalid email: should reject request with malformed email', async () => {
    const invalidData = {
      ...validRequest,
      parentEmail: 'not-an-email',
    };

    const res = await request(app).post('/api/trial-requests').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.message).toContain('Invalid email address');
  });

  it('4. Invalid phone: should reject request with invalid phone number', async () => {
    const invalidData = {
      ...validRequest,
      parentPhone: '123',
    };

    const res = await request(app).post('/api/trial-requests').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.message).toContain('Valid phone number is required');
  });

  it('5. Missing course: should reject request with invalid or missing course', async () => {
    const invalidData = {
      ...validRequest,
      course: 'INVALID_COURSE',
    };

    const res = await request(app).post('/api/trial-requests').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.message).toContain('Course is required');
  });

  it('6. Missing terms acceptance: should reject request when acceptTerms is false', async () => {
    const invalidData = {
      ...validRequest,
      acceptTerms: false,
    };

    const res = await request(app).post('/api/trial-requests').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.message).toContain('Terms of Use must be accepted');
  });

  it('7. Missing privacy acceptance: should reject request when acceptPrivacy is false', async () => {
    const invalidData = {
      ...validRequest,
      acceptPrivacy: false,
    };

    const res = await request(app).post('/api/trial-requests').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.message).toContain('Privacy Policy must be accepted');
  });
});
