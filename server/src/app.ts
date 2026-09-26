import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { authRouter } from './controllers/authController.js';
import { trialRouter } from './controllers/trialController.js';
import { parentRouter } from './controllers/parentController.js';
import { availabilityRouter } from './controllers/availabilityController.js';
import { bookingRouter } from './controllers/bookingController.js';
import { adminRouter } from './controllers/adminController.js';
import { authenticate, requireAdmin } from './middleware/authMiddleware.js';
import { AppError } from './utils/errors.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin (including localhost, vercel, render, railway, etc.)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Rate Limiter for Auth & Form endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/trial-requests', trialRouter);
app.use('/api/parent', parentRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);

// Health Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'codeyoung-api',
  });
});

// Admin-only test endpoint
app.get('/api/admin/dashboard', authenticate, requireAdmin, (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Admin Dashboard',
    user: req.user,
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
  });
});

// Centralized Error Handler
app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorName = err instanceof AppError ? err.errorName : undefined;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    error:
      errorName ||
      (statusCode === 409 ? 'Conflict' : statusCode === 401 ? 'Unauthorized' : 'Server Error'),
    message,
  });
});
