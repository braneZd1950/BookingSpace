import User from '../../models/User.js';
import { isPlatformAdmin, isPlatformSuperAdmin } from '../../utils/analytics.js';
import {
  changePassword,
  confirmEmailChange,
  deleteMyAccount,
  exportMyData,
  loginUser,
  loginWithGoogle,
  registerUser,
  requestPasswordReset,
  resendEmailChange,
  resetPasswordWithToken,
  revokeAccessTokens,
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

export async function googleAuth(req, res) {
  const result = await loginWithGoogle(req.input.body);
  res.status(result.created ? 201 : 200).json(result);
}

export async function logout(req, res) {
  await revokeAccessTokens(req.user);
  res.status(204).send();
}

export async function logoutAll(req, res) {
  await revokeAccessTokens(req.user);
  res.status(204).send();
}

export async function me(req, res) {
  const fresh = await User.findById(req.user._id)
    .select('+passwordHash +pendingEmail');
  const user = fresh || req.user;
  res.json({
    user: toPublicUser(user, { hasPassword: Boolean(fresh?.passwordHash) }),
    platformAdmin: isPlatformAdmin(req.user),
    platformSuperAdmin: isPlatformSuperAdmin(req.user),
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

export async function confirmEmail(req, res) {
  const result = await confirmEmailChange(req.input.body);
  res.json(result);
}

export async function resendEmail(req, res) {
  const result = await resendEmailChange(req.user);
  res.json(result);
}

export async function exportMe(req, res) {
  const payload = await exportMyData(req.user);
  res.json(payload);
}

export async function deleteMe(req, res) {
  const result = await deleteMyAccount(req.user, req.input.body);
  res.json(result);
}
