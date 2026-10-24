import { createStaff, listStaff, suspendStaff } from './service.js';

export async function list(req, res) {
  const staff = await listStaff(req.user, req.input.params.tenantId);
  res.json({ staff });
}

export async function create(req, res) {
  const result = await createStaff(req.user, req.input.params.tenantId, req.input.body);
  res.status(201).json(result);
}

export async function suspend(req, res) {
  const staff = await suspendStaff(req.user, req.input.params.tenantId, req.input.params.userId);
  res.json({ staff });
}
