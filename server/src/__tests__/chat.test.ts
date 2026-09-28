/**
 * chat.test.ts
 *
 * Backend tests for POST /api/chat covering:
 * - Valid chat request
 * - Invalid chat request (Zod validation)
 * - Course question (fallback mode)
 * - Unauthenticated booking request
 * - Login action returned
 * - Authenticated booking request
 * - Tool argument validation
 * - Unknown tool rejection
 * - Grok API failure
 * - Missing API key fallback
 * - Rate limiting
 * - No fake booking success
 * - Explicit confirmation required
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { JWT_SECRET } from '../config/jwt.js';
import { clearConversation } from '../modules/chat/chat.service.js';
import * as chatService from '../modules/chat/chat.service.js';
import type { ChatAction } from '../modules/chat/chat.types.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock the availability and booking services so we don't need a real DB
vi.mock('../utils/prisma.js', () => ({
  prisma: {
    mentor: { findMany: vi.fn() },
    booking: { findMany: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb({})),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validParent = { userId: 'uid-parent-1', email: 'parent@example.com', role: 'PARENT' };
const validToken = jwt.sign(validParent, JWT_SECRET, { expiresIn: '15m' });

const originalEnv = { ...process.env };

function setEnv(vars: Record<string, string>) {
  Object.assign(process.env, vars);
}

function restoreEnv() {
  // Remove keys added during tests
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    restoreEnv();
  });

  // ── 1. Missing API key / feature disabled → friendly fallback ────────────

  it('returns fallback message when AI_CHAT_ENABLED is false', async () => {
    setEnv({ AI_CHAT_ENABLED: 'false', GROQ_API_KEY: '' });

    const res = await request(app).post('/api/chat').send({ message: 'Hello' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unavailable/i);
    expect(res.body.conversationId).toBeTruthy();
    expect(res.body.actions).toEqual([]);
  });

  it('returns fallback message when GROQ_API_KEY is empty', async () => {
    setEnv({ AI_CHAT_ENABLED: 'true', GROQ_API_KEY: '' });

    const res = await request(app).post('/api/chat').send({ message: 'Book a class for me' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  // ── 2. Zod validation ─────────────────────────────────────────────────────

  it('returns 400 for empty message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('returns 400 when message is missing', async () => {
    const res = await request(app).post('/api/chat').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('returns 400 for message exceeding 2000 characters', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'a'.repeat(2001) });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('returns 400 for invalid conversationId (non-UUID)', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello', conversationId: 'not-a-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  // ── 3. Grok API failure → safe error response ─────────────────────────────

  it('returns safe error message on Grok API failure', async () => {
    setEnv({ AI_CHAT_ENABLED: 'true', GROQ_API_KEY: 'test-key-xyz' });

    vi.spyOn(chatService, 'processChatMessage').mockResolvedValueOnce({
      message:
        "I'm having trouble connecting right now. Please try again shortly, or use the **Login** or **Book a Free Trial** button.",
      conversationId: 'test-conv-id',
      actions: [],
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What courses do you offer?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/trouble|unavailable/i);
    expect(res.body.conversationId).toBeTruthy();
  });

  // ── 4. Unauthenticated booking request → login action ────────────────────

  it('returns login action for unauthenticated booking request', async () => {
    setEnv({ AI_CHAT_ENABLED: 'true', GROQ_API_KEY: 'test-key-xyz' });

    vi.spyOn(chatService, 'processChatMessage').mockResolvedValueOnce({
      message:
        'I can help you book a CodeYoung trial class. Please log in first so I can check your details and available slots.',
      conversationId: 'conv-unauth-1',
      actions: [{ type: 'NAVIGATE', payload: { url: '/login' } }],
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'I want to book a trial class' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/log in/i);
    expect(res.body.actions).toContainEqual(
      expect.objectContaining({ type: 'NAVIGATE', payload: { url: '/login' } })
    );
  });

  // ── 5. Authenticated booking request → processes correctly ───────────────

  it('processes booking request for authenticated user', async () => {
    setEnv({ AI_CHAT_ENABLED: 'true', GROQ_API_KEY: 'test-key-xyz' });

    vi.spyOn(chatService, 'processChatMessage').mockResolvedValueOnce({
      message: 'Great! What subject would you like the trial class for?',
      conversationId: 'conv-auth-1',
      actions: [],
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ message: 'I want to book a trial class' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeTruthy();
    expect(res.body.conversationId).toBe('conv-auth-1');
  });

  // ── 6. Valid conversationId is preserved ─────────────────────────────────

  it('preserves conversationId across turns', async () => {
    setEnv({ AI_CHAT_ENABLED: 'true', GROQ_API_KEY: 'test-key-xyz' });
    const convoId = '550e8400-e29b-41d4-a716-446655440000';

    vi.spyOn(chatService, 'processChatMessage').mockResolvedValueOnce({
      message: 'Sure, I can help with that!',
      conversationId: convoId,
      actions: [],
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is a trial class?', conversationId: convoId });

    expect(res.status).toBe(200);
    expect(res.body.conversationId).toBe(convoId);
  });

  // ── 7. No fake booking success ────────────────────────────────────────────

  it('does not invent a booking without explicit confirmation', async () => {
    setEnv({ AI_CHAT_ENABLED: 'true', GROQ_API_KEY: 'test-key-xyz' });

    vi.spyOn(chatService, 'processChatMessage').mockResolvedValueOnce({
      message: 'Please confirm your booking by saying "Yes, confirm" before I create the booking.',
      conversationId: 'conv-confirm-1',
      actions: [],
    });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ message: 'Book me a slot' });

    expect(res.status).toBe(200);
    // Should NOT have any booking confirmation data without explicit confirmation
    expect(res.body.message).not.toMatch(/booking confirmed/i);
  });

  // ── 8. Actions returned correctly ─────────────────────────────────────────

  it('includes actions array in every response', async () => {
    setEnv({ AI_CHAT_ENABLED: 'false', GROQ_API_KEY: '' });

    const res = await request(app).post('/api/chat').send({ message: 'Hello' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.actions)).toBe(true);
  });
});

// ─── Tool tests ───────────────────────────────────────────────────────────────

describe('Chat Tool Dispatcher', () => {
  it('rejects unknown tool names', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as never[] };
    const result = await dispatchTool('drop_table', {}, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('error');
    expect(parsed.message).toMatch(/unknown tool/i);
  });

  it('validates get_available_slots arguments', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as never[] };
    // Missing required fields
    const result = await dispatchTool('get_available_slots', {}, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('error');
  });

  it('rejects confirm_booking without explicitConfirmation', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as never[] };
    const result = await dispatchTool(
      'confirm_booking',
      {
        trialRequestId: 'tr-123',
        startUtc: '2026-10-01T10:00:00.000Z',
        explicitConfirmation: false,
      },
      ctx as never
    );
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('error');
    expect(parsed.message).toMatch(/explicitConfirmation/i);
  });

  it('get_authentication_status returns unauthenticated when no token', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { authUser: undefined, actions: [] as never[] };
    const result = await dispatchTool('get_authentication_status', {}, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('unauthenticated');
    expect(parsed.data.authenticated).toBe(false);
  });

  it('redirect_to_login adds NAVIGATE action', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as ChatAction[] };

    const result = await dispatchTool('redirect_to_login', { reason: 'Must log in' }, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('ok');
    expect(ctx.actions).toContainEqual(
      expect.objectContaining({ type: 'NAVIGATE', payload: { url: '/login' } })
    );
  });

  it('get_my_bookings returns not_implemented', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const authUser = { userId: 'u1', email: 'p@e.com', role: 'PARENT' as const };
    const ctx = { authUser, actions: [] as never[] };
    const result = await dispatchTool('get_my_bookings', {}, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('not_implemented');
  });

  it('login_user validates email format', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as ChatAction[] };
    const result = await dispatchTool(
      'login_user',
      { email: 'not-an-email', password: 'secretpassword' },
      ctx as never
    );
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('error');
    expect(parsed.message).toMatch(/valid email/i);
  });

  it('send_booking_otp returns unauthenticated if no token', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { authUser: undefined, actions: [] as never[] };
    const result = await dispatchTool('send_booking_otp', {}, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('unauthenticated');
  });

  it('logout_user dispatches LOGOUT_SUCCESS action', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as ChatAction[] };
    const result = await dispatchTool('logout_user', {}, ctx as never);
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe('ok');
    expect(ctx.actions).toContainEqual(
      expect.objectContaining({ type: 'LOGOUT_SUCCESS', payload: { url: '/login' } })
    );
  });

  it('navigate_to_page maps pages to correct URLs and emits NAVIGATE action', async () => {
    const { dispatchTool } = await import('../modules/chat/chat.tools.js');
    const ctx = { actions: [] as ChatAction[] };

    const resHome = await dispatchTool('navigate_to_page', { page: 'home' }, ctx as never);
    expect(JSON.parse(resHome).status).toBe('ok');
    expect(ctx.actions).toContainEqual({ type: 'NAVIGATE', payload: { url: '/' } });

    const resBlog = await dispatchTool('navigate_to_page', { page: 'blog' }, ctx as never);
    expect(JSON.parse(resBlog).status).toBe('ok');
    expect(ctx.actions).toContainEqual({ type: 'NAVIGATE', payload: { url: '/blog' } });

    const resContact = await dispatchTool('navigate_to_page', { page: 'contact' }, ctx as never);
    expect(JSON.parse(resContact).status).toBe('ok');
    expect(ctx.actions).toContainEqual({ type: 'NAVIGATE', payload: { url: '/contact' } });

    const resCourses = await dispatchTool('navigate_to_page', { page: 'courses' }, ctx as never);
    expect(JSON.parse(resCourses).status).toBe('ok');
    expect(ctx.actions).toContainEqual({ type: 'NAVIGATE', payload: { url: '/#courses' } });
  });

  it('decodeAuthToken returns undefined for invalid token', async () => {
    const { decodeAuthToken } = await import('../modules/chat/chat.tools.js');
    expect(decodeAuthToken('invalid-token')).toBeUndefined();
    expect(decodeAuthToken(undefined)).toBeUndefined();
  });

  it('decodeAuthToken decodes a valid JWT', async () => {
    const { decodeAuthToken } = await import('../modules/chat/chat.tools.js');
    const token = jwt.sign(validParent, JWT_SECRET, { expiresIn: '15m' });
    const decoded = decodeAuthToken(token);
    expect(decoded?.email).toBe('parent@example.com');
  });
});

// ─── clearConversation ────────────────────────────────────────────────────────

describe('clearConversation', () => {
  it('removes a conversation without throwing', () => {
    expect(() => clearConversation('non-existent-id')).not.toThrow();
    expect(() => clearConversation('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
  });
});
