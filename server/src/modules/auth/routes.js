import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../utils/httpError.js';
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  updatePassword,
  updateProfile,
} from './controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
} from './schema.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next) {
    next(new HttpError(429, 'Too many attempts. Try again later.', {
      code: 'TOO_MANY_REQUESTS',
    }));
  },
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next) {
    next(new HttpError(429, 'Too many attempts. Try again later.', {
      code: 'TOO_MANY_REQUESTS',
    }));
  },
});

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validate(updateMeSchema), updateProfile);
router.patch('/password', requireAuth, authLimiter, validate(changePasswordSchema), updatePassword);

export default router;
