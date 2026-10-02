import { v2 as cloudinary } from 'cloudinary';
import env from '../../config/env.js';
import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import TenantUser from '../../models/TenantUser.js';
import User from '../../models/User.js';
import { HttpError } from '../../utils/httpError.js';
import { createDoc, withTransaction } from '../../utils/transaction.js';
import { requireMember } from '../access.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function slugify(name) {
  const slug = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug;
}

async function uniqueSlug(base) {
  let slug = base;
  let suffix = 2;
  while (await Tenant.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function publicService(service) {
  return {
    id: service._id,
    name: service.name,
    description: service.description || '',
    durationMinutes: service.durationMinutes,
    slotIntervalMinutes: service.slotIntervalMinutes,
    capacity: service.capacity,
    cancellationWindowMinutes: service.cancellationWindowMinutes,
    price: service.price,
    membershipRequired: service.membershipRequired,
  };
}

export function toTenant(tenant) {
  return {
    id: tenant._id,
    name: tenant.name,
    slug: tenant.slug,
    niche: tenant.niche,
    description: tenant.description || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    address: tenant.address || '',
    timezone: tenant.timezone,
    logoUrl: tenant.logoUrl || '',
    heroImageUrl: tenant.heroImageUrl || '',
    theme: tenant.theme,
    siteSettings: tenant.siteSettings,
    bookingSettings: tenant.bookingSettings,
    active: tenant.active,
  };
}

export async function listMyTenants(user) {
  const links = await TenantUser.find({ userId: user._id, status: 'ACTIVE' });
  const tenants = await Tenant.find({ _id: { $in: links.map((link) => link.tenantId) } });
  const byId = new Map(tenants.map((tenant) => [String(tenant._id), tenant]));

  return links.flatMap((link) => {
    const tenant = byId.get(String(link.tenantId));
    if (!tenant) return [];
    return [{ role: link.role, tenant: toTenant(tenant) }];
  });
}

export async function createTenant(user, input) {
  const base = slugify(input.name);
  if (!base) throw new HttpError(400, 'Name cannot be turned into a slug', { code: 'INVALID_SLUG' });

  const tenant = await withTransaction(async (session) => {
    const slug = await uniqueSlug(base);
    const created = await createDoc(Tenant, {
      name: input.name,
      slug,
      niche: input.niche,
      ownerId: user._id,
      description: input.description,
      phone: input.phone,
      email: input.email,
      address: input.address,
      timezone: input.timezone || 'Europe/Zagreb',
      siteSettings: { template: input.template || 'generic' },
    }, session);

    await createDoc(TenantUser, {
      tenantId: created._id,
      userId: user._id,
      role: 'BUSINESS_OWNER',
      status: 'ACTIVE',
    }, session);

    if (user.role === 'CUSTOMER') {
      await User.updateOne({ _id: user._id }, { role: 'BUSINESS_OWNER' }, session ? { session } : {});
    }

    return created;
  });

  return toTenant(tenant);
}

export async function getPublicTenant(slug) {
  const tenant = await Tenant.findOne({ slug, active: true });
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const services = await Service.find({ tenantId: tenant._id, active: true }).sort({ name: 1 });
  const profile = toTenant(tenant);
  return {
    ...profile,
    bookingSettings: { workingHours: tenant.bookingSettings?.workingHours || [] },
    services: services.map(publicService),
  };
}

export async function updateTenant(user, tenantId, input) {
  await requireMember(user, tenantId, ['BUSINESS_OWNER']);
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const { bookingSettings, ...rest } = input;
  Object.assign(tenant, rest);
  if (bookingSettings) {
    tenant.bookingSettings = {
      ...tenant.bookingSettings.toObject(),
      ...bookingSettings,
    };
    if (bookingSettings.workingHours) {
      tenant.markModified('bookingSettings');
    }
  }
  await tenant.save();
  return toTenant(tenant);
}

export async function updateSite(user, tenantId, input) {
  await requireMember(user, tenantId, ['BUSINESS_OWNER']);
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  if (input.template) tenant.siteSettings.template = input.template;
  if (input.theme) tenant.theme = { ...tenant.theme.toObject(), ...input.theme };
  if (input.visibleSections) {
    tenant.siteSettings.visibleSections = {
      ...tenant.siteSettings.visibleSections.toObject(),
      ...input.visibleSections,
    };
  }
  if (input.socialLinks) {
    tenant.siteSettings.socialLinks = {
      ...tenant.siteSettings.socialLinks.toObject(),
      ...input.socialLinks,
    };
  }
  if (input.seo) {
    tenant.siteSettings.seo = { ...tenant.siteSettings.seo.toObject(), ...input.seo };
  }
  tenant.markModified('theme');
  tenant.markModified('siteSettings');
  await tenant.save();
  return toTenant(tenant);
}

function assertCloudinary() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new HttpError(503, 'Image storage is not configured', { code: 'CLOUDINARY_NOT_CONFIGURED' });
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export async function uploadImage(user, tenantId, file, purpose) {
  await requireMember(user, tenantId, ['BUSINESS_OWNER']);
  if (!file) throw new HttpError(400, 'Image file is required', { code: 'FILE_REQUIRED' });
  if (!IMAGE_TYPES.has(file.mimetype)) {
    throw new HttpError(400, 'Unsupported image type', { code: 'UNSUPPORTED_MEDIA' });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new HttpError(413, 'Image is too large', { code: 'PAYLOAD_TOO_LARGE' });
  }

  assertCloudinary();
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const uploaded = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    { folder: `bookingspace/${tenantId}`, resource_type: 'image' },
  );

  if (purpose === 'logo') tenant.logoUrl = uploaded.secure_url;
  if (purpose === 'hero') tenant.heroImageUrl = uploaded.secure_url;
  if (purpose === 'gallery') {
    tenant.siteSettings.gallery.push({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
    tenant.markModified('siteSettings');
  }
  await tenant.save();
  return toTenant(tenant);
}
