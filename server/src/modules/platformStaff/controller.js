import {
  createPlatformStaff,
  listPlatformStaff,
  removePlatformStaff,
  updatePlatformStaff,
} from './service.js';

export async function listHandler(req, res) {
  const data = await listPlatformStaff(req.user);
  res.json(data);
}

export async function createHandler(req, res) {
  const data = await createPlatformStaff(req.user, req.input.body);
  res.status(201).json(data);
}

export async function updateHandler(req, res) {
  const data = await updatePlatformStaff(req.user, req.input.params.staffId, req.input.body);
  res.json(data);
}

export async function removeHandler(req, res) {
  const data = await removePlatformStaff(req.user, req.input.params.staffId);
  res.json(data);
}
