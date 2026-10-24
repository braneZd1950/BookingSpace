import {
  createWorkout,
  listForMember,
  listManaged,
  removeWorkout,
  updateWorkout,
  uploadVideo,
} from './service.js';

export async function list(req, res) {
  const workouts = await listManaged(req.user, req.input.params.tenantId);
  res.json({ workouts });
}

export async function upload(req, res) {
  const video = await uploadVideo(req.user, req.input.params.tenantId, req.file);
  res.status(201).json({ video });
}

export async function create(req, res) {
  const workout = await createWorkout(req.user, req.input.params.tenantId, req.input.body);
  res.status(201).json({ workout });
}

export async function update(req, res) {
  const workout = await updateWorkout(
    req.user,
    req.input.params.tenantId,
    req.input.params.workoutId,
    req.input.body,
  );
  res.json({ workout });
}

export async function remove(req, res) {
  const result = await removeWorkout(
    req.user,
    req.input.params.tenantId,
    req.input.params.workoutId,
  );
  res.json(result);
}

export async function catalog(req, res) {
  const result = await listForMember(req.user || null, req.input.params.tenantId);
  res.json(result);
}
