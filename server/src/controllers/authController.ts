import express from 'express';
import { registerSchema, loginSchema, sendRegistrationOtpSchema } from '../schemas/authSchemas.js';
import {
  registerUser,
  sendRegistrationOtp,
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
  getUserById,
} from '../services/authService.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const authRouter = express.Router();

const COOKIE_NAME = 'refreshToken';

const setRefreshTokenCookie = (res: express.Response, refreshToken: string) => {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_ENVIRONMENT !== undefined ||
    process.env.RENDER !== undefined;

  res.cookie(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearRefreshTokenCookie = (res: express.Response) => {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_ENVIRONMENT !== undefined ||
    process.env.RENDER !== undefined;

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

// POST /api/auth/send-registration-otp
authRouter.post(
  '/send-registration-otp',
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const parseResult = sendRegistrationOtpSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
          details: parseResult.error.flatten(),
        });
        return;
      }

      const result = await sendRegistrationOtp(parseResult.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/register
authRouter.post(
  '/register',
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
          details: parseResult.error.flatten(),
        });
        return;
      }

      const { user, accessToken, refreshToken } = await registerUser(parseResult.data);
      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        user,
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
authRouter.post(
  '/login',
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation Error',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
          details: parseResult.error.flatten(),
        });
        return;
      }

      const { user, accessToken, refreshToken } = await loginUser(parseResult.data);
      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        user,
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/refresh
authRouter.post(
  '/refresh',
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (!refreshToken) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Refresh token cookie missing',
        });
        return;
      }

      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = await rotateRefreshToken(refreshToken);
      setRefreshTokenCookie(res, newRefreshToken);

      res.status(200).json({
        user,
        accessToken,
      });
    } catch (err) {
      clearRefreshTokenCookie(res);
      next(err);
    }
  }
);

// POST /api/auth/logout
authRouter.post(
  '/logout',
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }
      clearRefreshTokenCookie(res);

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
authRouter.get(
  '/me',
  authenticate,
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await getUserById(req.user.userId);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
);
