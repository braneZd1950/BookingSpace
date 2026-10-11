import { isPlatformAdmin } from '../../utils/analytics.js';
import {
  changePassword,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  toPublicUser,
  updateMe,
} from './service.js';

export async function register(req, res) {
  const result = await registerUser(req.input.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await loginUser(req.input.body);
  res.json(result);
}

export function logout(req, res) {
  res.status(204).send();
}

export function me(req, res) {
  res.json({
    user: toPublicUser(req.user),
    platformAdmin: isPlatformAdmin(req.user),
  });
}

export async function updateProfile(req, res) {
  const user = await updateMe(req.user, req.input.body);
  res.json({ user });
}

export async function updatePassword(req, res) {
  const result = await changePassword(req.user, req.input.body);
  res.json(result);
}

export async function forgotPassword(req, res) {
  const result = await requestPasswordReset(req.input.body);
  res.json(result);
}

export async function resetPassword(req, res) {
  const result = await resetPasswordWithToken(req.input.body);
  res.json(result);
}
