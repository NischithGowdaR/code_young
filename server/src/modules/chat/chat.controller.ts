/**
 * chat.controller.ts
 *
 * Handles POST /api/chat requests.
 *
 * Security:
 * - Auth token is extracted from the Authorization header (not sent by the model).
 * - XAI_API_KEY is never exposed in responses.
 * - All input is validated with Zod before reaching the service.
 */

import { Request, Response, NextFunction } from 'express';
import { chatRequestSchema } from './chat.schemas.js';
import { processChatMessage } from './chat.service.js';

export async function chatController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: parseResult.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    // Extract auth token from Authorization header (optional — chat is public)
    const authHeader = req.headers.authorization;
    const authToken =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    const result = await processChatMessage({
      message: parseResult.data.message,
      conversationId: parseResult.data.conversationId,
      authToken,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
