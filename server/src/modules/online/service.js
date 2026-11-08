import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import env from '../../config/env.js';
import Membership from '../../models/Membership.js';
import OnlineWorkout from '../../models/OnlineWorkout.js';
import Tenant from '../../models/Tenant.js';
import User from '../../models/User.js';
import {
  cloudinaryReady,
  storeLocalUpload,
  uploadBufferToCloudinary,
} from '../../utils/cloudinaryUpload.js';
import { HttpError } from '../../utils/httpError.js';
import { assertVideoBuffer } from '../../utils/mediaMagic.js';
import { signMediaAccessToken, verifyMediaAccessToken } from '../../utils/mediaToken.js';
import { zonedNow } from '../../utils/time.js';
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

function videoExtension(mimetype) {
  if (mimetype === 'video/webm') return 'webm';
  if (mimetype === 'video/quicktime') return 'mov';
  if (mimetype === 'video/x-msvideo') return 'avi';
  if (mimetype === 'video/x-matroska') return 'mkv';
  return 'mp4';
}

function toManage(workout, actor) {
  const rawUrl = workout.videoUrl;
  return {
    id: workout._id,
    tenantId: workout.tenantId,
    title: workout.title,
    description: workout.description || '',
    videoUrl: isLocalUploadPath(rawUrl) && actor
      ? memberFacingVideoUrl(workout, actor)
      : rawUrl,
    videoPublicId: workout.videoPublicId || null,
    durationMinutes: workout.durationMinutes,
    price: workout.price,
    active: workout.active,
    createdAt: workout.createdAt,
  };
}

function isLocalUploadPath(url) {
  return String(url || '').startsWith('/uploads/') && String(url).includes('/video/');
}

function memberFacingVideoUrl(workout, actor) {
  const raw = workout.videoUrl || '';
  if (!isLocalUploadPath(raw)) return raw;
  if (!actor?._id) return null;
  const token = signMediaAccessToken({
    userId: actor._id,
    tenantId: workout.tenantId,
    workoutId: workout._id,
  });
  return `/api/tenants/${workout.tenantId}/online/${workout._id}/media?m=${encodeURIComponent(token)}`;
}

function remainingSessions(membership) {
  if (!membership) return 0;
  if (membership.sessionsIncluded == null) return Infinity;
  return Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
}

async function activeMembershipFor(userId, tenantId, onDate) {
  if (!userId) return null;
  const today = onDate || new Date().toISOString().slice(0, 10);
  const rows = await Membership.find({
    tenantId,
    userId,
    status: 'ACTIVE',
    validFrom: { $lte: today },
    validUntil: { $gte: today },
  }).sort({ validUntil: 1, createdAt: -1 });
  // Prefer a pack that still has sessions; fall back to the soonest-expiring valid pack.
  const withCredit = rows.find((row) => remainingSessions(row) > 0);
  return withCredit || rows[0] || null;
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

function toMemberCard(workout, access, actor) {
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
    videoUrl: unlocked ? memberFacingVideoUrl(workout, actor) : null,
    locked: !unlocked,
  };
}

export async function listManaged(actor, tenantId) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const rows = await OnlineWorkout.find({ tenantId }).sort({ createdAt: -1 });
  return rows.map((row) => toManage(row, actor));
}

async function readUploadBuffer(file) {
  if (file.buffer) return file.buffer;
  if (file.path) return fs.promises.readFile(file.path);
  throw new HttpError(400, 'Video file is required', { code: 'FILE_REQUIRED' });
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

  const buffer = await readUploadBuffer(file);
  assertVideoBuffer(buffer, file.mimetype);

  const tenant = await Tenant.findById(tenantId).select('_id');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const uploadFile = { ...file, buffer };

  if (cloudinaryReady()) {
    try {
      const uploaded = await uploadBufferToCloudinary(buffer, {
        folder: `bookingspace/${tenantId}/online`,
        resourceType: 'video',
      });
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

  const url = await storeLocalUpload(uploadFile, {
    tenantId,
    subdir: 'video',
    extension: videoExtension(file.mimetype),
  });
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
  return toManage(workout, actor);
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
  return toManage(workout, actor);
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
  const tenant = await Tenant.findById(tenantId).select('_id timezone');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const today = zonedNow(tenant.timezone || 'Europe/Zagreb').date;
  const membership = actor ? await activeMembershipFor(actor._id, tenantId, today) : null;
  const access = accessFor(membership);
  const rows = await OnlineWorkout.find({ tenantId, active: true }).sort({ createdAt: -1 });
  return {
    access: {
      freeCatalog: access.free,
      reason: access.reason,
      sessionsRemaining: access.sessionsRemaining ?? null,
    },
    workouts: rows.map((item) => toMemberCard(item, access, actor)),
  };
}

async function actorCanStreamWorkout(actor, tenantId, workout) {
  try {
    await requireMember(actor, tenantId, MANAGE_ROLES);
    return true;
  } catch {
    // fall through to membership check
  }
  const tenant = await Tenant.findById(tenantId).select('timezone');
  const today = zonedNow(tenant?.timezone || 'Europe/Zagreb').date;
  const membership = await activeMembershipFor(actor._id, tenantId, today);
  const access = accessFor(membership);
  return Boolean(access.free && workout.active);
}

function resolveLocalVideoPath(videoUrl, tenantId) {
  if (!isLocalUploadPath(videoUrl)) return null;
  const safeTenant = String(tenantId).replace(/[^a-f\d]/gi, '');
  const expectedPrefix = `/uploads/${safeTenant}/video/`;
  if (!String(videoUrl).startsWith(expectedPrefix)) return null;
  const filename = path.basename(videoUrl);
  if (!/^[a-f0-9]+\.(mp4|webm|mov|avi|mkv)$/i.test(filename)) return null;
  return path.resolve(process.cwd(), 'uploads', safeTenant, 'video', filename);
}

/**
 * Stream local online video after membership/staff check.
 * Accepts Bearer auth or short-lived `?m=` media token (for <video src>).
 */
export async function streamWorkoutMedia(actor, tenantId, workoutId, mediaToken) {
  let user = actor || null;
  if (!user && mediaToken) {
    const payload = verifyMediaAccessToken(mediaToken);
    if (String(payload.tenantId) !== String(tenantId) || String(payload.workoutId) !== String(workoutId)) {
      throw new HttpError(401, 'Unauthorized');
    }
    user = await User.findById(payload.sub);
  }
  if (!user) throw new HttpError(401, 'Unauthorized');

  const workout = await OnlineWorkout.findOne({ _id: workoutId, tenantId });
  if (!workout) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const allowed = await actorCanStreamWorkout(user, tenantId, workout);
  if (!allowed) throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });

  const absolute = resolveLocalVideoPath(workout.videoUrl, tenantId);
  if (!absolute) {
    // Cloudinary / external URL — clients should use videoUrl directly.
    throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  }
  if (!fs.existsSync(absolute)) {
    throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  }
  return absolute;
}
