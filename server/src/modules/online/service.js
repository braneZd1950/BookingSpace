import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import env from '../../config/env.js';
import Membership from '../../models/Membership.js';
import OnlineWorkout from '../../models/OnlineWorkout.js';
import Tenant from '../../models/Tenant.js';
import { HttpError } from '../../utils/httpError.js';
import { MANAGE_ROLES, requireMember } from '../access.js';

const VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]);
/** Free Cloudinary-friendly ceiling for MVP uploads. */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function cloudinaryReady() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

function videoExtension(mimetype) {
  if (mimetype === 'video/webm') return 'webm';
  if (mimetype === 'video/quicktime') return 'mov';
  if (mimetype === 'video/x-msvideo') return 'avi';
  if (mimetype === 'video/x-matroska') return 'mkv';
  return 'mp4';
}

function toManage(workout) {
  return {
    id: workout._id,
    tenantId: workout.tenantId,
    title: workout.title,
    description: workout.description || '',
    videoUrl: workout.videoUrl,
    videoPublicId: workout.videoPublicId || null,
    durationMinutes: workout.durationMinutes,
    price: workout.price,
    active: workout.active,
    createdAt: workout.createdAt,
  };
}

async function storeLocalVideo(file, tenantId) {
  const safeId = String(tenantId).replace(/[^a-f\d]/gi, '');
  const filename = `${randomBytes(12).toString('hex')}.${videoExtension(file.mimetype)}`;
  const dir = path.resolve(process.cwd(), 'uploads', safeId, 'video');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), file.buffer);
  return `/uploads/${safeId}/video/${filename}`;
}

function uploadToCloudinary(file, tenantId) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `bookingspace/${tenantId}/online`,
        resource_type: 'video',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(file.buffer);
  });
}

function remainingSessions(membership) {
  if (!membership) return 0;
  if (membership.sessionsIncluded == null) return Infinity;
  return Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
}

async function activeMembershipFor(userId, tenantId) {
  if (!userId) return null;
  return Membership.findOne({
    tenantId,
    userId,
    status: 'ACTIVE',
  }).sort({ createdAt: -1 });
}

function accessFor(membership) {
  if (!membership) {
    return { free: false, reason: 'MEMBERSHIP_REQUIRED' };
  }
  const left = remainingSessions(membership);
  if (left > 0) {
    return { free: true, reason: 'SESSION_CREDIT', sessionsRemaining: left === Infinity ? null : left };
  }
  return { free: false, reason: 'NO_SESSIONS', sessionsRemaining: 0 };
}

function toMemberCard(workout, access) {
  const unlocked = access.free;
  return {
    id: workout._id,
    title: workout.title,
    description: workout.description || '',
    durationMinutes: workout.durationMinutes,
    price: workout.price,
    free: unlocked,
    accessReason: access.reason,
    sessionsRemaining: access.sessionsRemaining,
    videoUrl: unlocked ? workout.videoUrl : null,
    locked: !unlocked,
  };
}

export async function listManaged(actor, tenantId) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const rows = await OnlineWorkout.find({ tenantId }).sort({ createdAt: -1 });
  return rows.map(toManage);
}

export async function uploadVideo(actor, tenantId, file) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  if (!file) throw new HttpError(400, 'Video file is required', { code: 'FILE_REQUIRED' });
  if (!VIDEO_TYPES.has(file.mimetype)) {
    throw new HttpError(400, 'Unsupported video type', { code: 'UNSUPPORTED_MEDIA' });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new HttpError(413, 'Video is too large (max 100 MB)', { code: 'PAYLOAD_TOO_LARGE' });
  }

  const tenant = await Tenant.findById(tenantId).select('_id');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  if (cloudinaryReady()) {
    try {
      const uploaded = await uploadToCloudinary(file, tenantId);
      const durationMinutes = uploaded.duration
        ? Math.max(1, Math.round(uploaded.duration / 60))
        : null;
      return {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        durationMinutes,
        provider: 'cloudinary',
      };
    } catch (error) {
      console.error('[online] Cloudinary video upload failed:', error?.message || error);
      throw new HttpError(502, 'Video upload failed', { code: 'UPLOAD_FAILED' });
    }
  }

  const url = await storeLocalVideo(file, tenantId);
  return {
    url,
    publicId: url,
    durationMinutes: null,
    provider: 'local',
  };
}

export async function createWorkout(actor, tenantId, input) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const tenant = await Tenant.findById(tenantId).select('_id');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const workout = await OnlineWorkout.create({
    tenantId,
    title: input.title.trim(),
    description: input.description?.trim() || '',
    videoUrl: input.videoUrl.trim(),
    videoPublicId: input.videoPublicId?.trim() || undefined,
    durationMinutes: input.durationMinutes ?? 30,
    price: input.price ?? 0,
    active: input.active !== false,
    createdBy: actor._id,
  });
  return toManage(workout);
}

export async function updateWorkout(actor, tenantId, workoutId, input) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const workout = await OnlineWorkout.findOne({ _id: workoutId, tenantId });
  if (!workout) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  if (input.title != null) workout.title = input.title.trim();
  if (input.description != null) workout.description = input.description.trim();
  if (input.videoUrl != null) workout.videoUrl = input.videoUrl.trim();
  if (input.videoPublicId != null) workout.videoPublicId = input.videoPublicId.trim();
  if (input.durationMinutes != null) workout.durationMinutes = input.durationMinutes;
  if (input.price != null) workout.price = input.price;
  if (input.active != null) workout.active = input.active;
  await workout.save();
  return toManage(workout);
}

export async function removeWorkout(actor, tenantId, workoutId) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const workout = await OnlineWorkout.findOneAndDelete({ _id: workoutId, tenantId });
  if (!workout) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  if (workout.videoPublicId && cloudinaryReady() && !String(workout.videoPublicId).startsWith('/')) {
    try {
      const { cloudName, apiKey, apiSecret } = env.cloudinary;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      await cloudinary.uploader.destroy(workout.videoPublicId, { resource_type: 'video' });
    } catch (error) {
      console.error('[online] Cloudinary delete failed:', error?.message || error);
    }
  }

  return { id: workoutId };
}

export async function listForMember(actor, tenantId) {
  const tenant = await Tenant.findById(tenantId).select('_id');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const membership = actor ? await activeMembershipFor(actor._id, tenantId) : null;
  const access = accessFor(membership);
  const rows = await OnlineWorkout.find({ tenantId, active: true }).sort({ createdAt: -1 });
  return {
    access: {
      freeCatalog: access.free,
      reason: access.reason,
      sessionsRemaining: access.sessionsRemaining ?? null,
    },
    workouts: rows.map((item) => toMemberCard(item, access)),
  };
}
