import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import {
  confirmEmail,
  deleteMe,
  exportMe,
  forgotPassword,
  googleAuth,
  login,
  logout,
  logoutAll,
  me,
  register,
  resendEmail,
  resetPassword,
  updatePassword,
  updateProfile,
} from './controller.js';
import {
  changePasswordSchema,
  confirmEmailChangeSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
} from './schema.js';

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many attempts. Try again later.',
});
const forgotLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: 'Too many attempts. Try again later.',
});

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/email/confirm', authLimiter, validate(confirmEmailChangeSchema), confirmEmail);
router.post('/email/resend', requireAuth, authLimiter, resendEmail);
router.post('/logout', requireAuth, logout);
router.post('/logout-all', requireAuth, logoutAll);
router.get('/me', requireAuth, me);
router.get('/me/export', requireAuth, exportMe);
router.post('/me/delete', requireAuth, authLimiter, validate(deleteAccountSchema), deleteMe);
router.patch('/me', requireAuth, validate(updateMeSchema), updateProfile);
router.patch('/password', requireAuth, authLimiter, validate(changePasswordSchema), updatePassword);

export default router;
