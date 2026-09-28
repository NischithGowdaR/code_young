/**
 * chat.routes.ts
 *
 * Express router for the chat module.
 * Rate-limited independently from the auth limiter.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chatController } from './chat.controller.js';

export const chatRouter = Router();

/**
 * Dedicated rate limiter for the chat endpoint.
 * Allows up to 30 chat messages per 5 minutes per IP.
 */
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many chat requests. Please wait a moment before sending another message.',
  },
});

/**
 * POST /api/chat
 *
 * Body:
 *   { message: string, conversationId?: string }
 *
 * Authorization header is optional (used to pass JWT for authenticated features).
 */
chatRouter.post('/', chatLimiter, chatController);
