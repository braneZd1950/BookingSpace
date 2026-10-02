import { loginUser, registerUser, toPublicUser } from './service.js';

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
  res.json({ user: toPublicUser(req.user) });
}
