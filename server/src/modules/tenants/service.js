import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import env from '../../config/env.js';
import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import TenantUser from '../../models/TenantUser.js';
import User from '../../models/User.js';
import { trackUsage } from '../../utils/analytics.js';
import { defaultTrialBilling } from '../../utils/billing.js';
import { HttpError } from '../../utils/httpError.js';
import { generateAllStudioLegal } from '../../utils/studioLegal.js';
import { createDoc, withTransaction } from '../../utils/transaction.js';
import { requireMember } from '../access.js';
import { listPublicTrainers } from '../staff/service.js';

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

const DISCOVER_CATEGORY_NICHES = {
  fitness: ['fitness', 'pilates', 'yoga', 'powerplate'],
  services: ['services'],
  playroom: ['playroom'],
  generic: ['generic'],
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function categoryForNiche(niche) {
  if (DISCOVER_CATEGORY_NICHES.fitness.includes(niche)) return 'fitness';
  if (niche === 'services') return 'services';
  if (niche === 'playroom') return 'playroom';
  return 'generic';
}

function cityFromAddress(address) {
  const raw = String(address || '').trim();
  if (!raw) return '';
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
}

function toDiscoverPlace(tenant) {
  const niche = tenant.niche || 'generic';
  const city = (tenant.city || '').trim() || cityFromAddress(tenant.address);
  return {
    id: String(tenant._id),
    categoryId: categoryForNiche(niche),
    name: tenant.name,
    city,
    area: '',
    note: (tenant.description || '').trim().slice(0, 160)
      || (tenant.nicheCustom || '').trim()
      || 'Studio na anyminutesu.',
    tags: [niche, tenant.nicheCustom, city].filter(Boolean),
    slug: tenant.slug,
    logoUrl: tenant.logoUrl || '',
    live: true,
    source: 'live',
  };
}

/** Javni popis aktivnih studija za Otkrij (pretraga + kategorija). */
export async function discoverTenants({ q = '', category = 'all', limit = 60 } = {}) {
  const filter = { active: true };
  const needle = String(q || '').trim();
  if (needle) {
    const rx = new RegExp(escapeRegex(needle), 'i');
    filter.$or = [
      { name: rx },
      { slug: rx },
      { description: rx },
      { address: rx },
      { city: rx },
      { nicheCustom: rx },
      { niche: rx },
    ];
  }

  const rows = await Tenant.find(filter)
    .select('name slug niche nicheCustom description address city logoUrl')
    .sort({ name: 1 })
    .limit(200)
    .lean();

  const places = rows.map(toDiscoverPlace);
  const counts = {
    all: places.length,
    fitness: 0,
    services: 0,
    playroom: 0,
    generic: 0,
  };
  for (const place of places) {
    counts[place.categoryId] = (counts[place.categoryId] || 0) + 1;
  }

  const filtered = category && category !== 'all'
    ? places.filter((place) => place.categoryId === category)
    : places;

  return {
    places: filtered.slice(0, limit),
    counts,
    total: filtered.length,
    source: 'live',
  };
}

export function toTenant(tenant) {
  return {
    id: tenant._id,
    name: tenant.name,
    slug: tenant.slug,
    niche: tenant.niche,
    nicheCustom: tenant.nicheCustom || '',
    description: tenant.description || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    address: tenant.address || '',
    city: tenant.city || '',
    oib: tenant.oib || '',
    timezone: tenant.timezone,
    logoUrl: tenant.logoUrl || '',
    heroImageUrl: tenant.heroImageUrl || '',
    theme: tenant.theme,
    siteSettings: tenant.siteSettings,
    bookingSettings: tenant.bookingSettings,
    active: tenant.active,
  };
}

/** Dopuni prazna pravila gotovim predloškom i spremi u bazu (stariji studiji). */
async function ensureTenantLegal(tenant) {
  const current = tenant.siteSettings?.legal || {};
  const privacy = typeof current.privacy === 'string' ? current.privacy.trim() : '';
  const terms = typeof current.terms === 'string' ? current.terms.trim() : '';
  const cookies = typeof current.cookies === 'string' ? current.cookies.trim() : '';
  if (privacy && terms && cookies) return tenant;

  const generated = generateAllStudioLegal({
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
  });
  tenant.siteSettings = tenant.siteSettings || {};
  tenant.siteSettings.legal = {
    privacy: privacy || generated.privacy,
    terms: terms || generated.terms,
    cookies: cookies || generated.cookies,
    updatedAt: current.updatedAt || new Date(),
  };
  tenant.markModified('siteSettings');
  await tenant.save();
  return tenant;
}

export async function listMyTenants(user) {
  const links = await TenantUser.find({ userId: user._id, status: 'ACTIVE' });
  const tenants = await Tenant.find({ _id: { $in: links.map((link) => link.tenantId) } });
  const ensured = await Promise.all(tenants.map((tenant) => ensureTenantLegal(tenant)));
  const byId = new Map(ensured.map((tenant) => [String(tenant._id), tenant]));

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
    const generatedLegal = generateAllStudioLegal({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    });
    const legalSeed = {
      privacy: input.legal?.privacy?.trim() || generatedLegal.privacy,
      terms: input.legal?.terms?.trim() || generatedLegal.terms,
      cookies: input.legal?.cookies?.trim() || generatedLegal.cookies,
      updatedAt: new Date(),
    };
    const created = await createDoc(Tenant, {
      name: input.name,
      slug,
      niche: input.niche,
      nicheCustom: input.niche === 'generic' ? (input.nicheCustom || '').trim() : '',
      ownerId: user._id,
      description: input.description,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city || '',
      oib: input.oib || '',
      timezone: input.timezone || 'Europe/Zagreb',
      siteSettings: {
        template: input.template || 'generic',
        ...(input.layout ? { layout: input.layout } : {}),
        ...(input.paletteId ? { paletteId: input.paletteId } : {}),
        ...(input.visibleSections ? { visibleSections: input.visibleSections } : {}),
        legal: legalSeed,
      },
      billing: defaultTrialBilling(),
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

  trackUsage({
    type: 'tenant_created',
    tenantId: tenant._id,
    userId: user._id,
    role: user.role,
    path: '/tenants',
  });

  return toTenant(tenant);
}

export async function getPublicTenant(slug) {
  let tenant = await Tenant.findOne({ slug, active: true });
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  tenant = await ensureTenantLegal(tenant);

  const services = await Service.find({ tenantId: tenant._id, active: true }).sort({ name: 1 });
  const trainers = await listPublicTrainers(tenant._id);
  const profile = toTenant(tenant);
  const { oib: _oib, ...publicProfile } = profile;
  return {
    ...publicProfile,
    bookingSettings: { workingHours: tenant.bookingSettings?.workingHours || [] },
    services: services.map(publicService),
    trainers,
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
  if (input.layout) tenant.siteSettings.layout = input.layout;
  if (input.paletteId !== undefined) tenant.siteSettings.paletteId = input.paletteId;
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
  if (input.legal) {
    const current = tenant.siteSettings.legal?.toObject?.() || tenant.siteSettings.legal || {};
    tenant.siteSettings.legal = {
      ...current,
      ...input.legal,
      updatedAt: new Date(),
    };
  }
  tenant.markModified('theme');
  tenant.markModified('siteSettings');
  await tenant.save();
  return toTenant(tenant);
}

function imageExtension(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function cloudinaryReady() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

async function storeLocalImage(file, tenantId) {
  const safeId = String(tenantId).replace(/[^a-f\d]/gi, '');
  const filename = `${randomBytes(12).toString('hex')}.${imageExtension(file.mimetype)}`;
  const dir = path.resolve(process.cwd(), 'uploads', safeId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), file.buffer);
  return `/uploads/${safeId}/${filename}`;
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

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  let url = '';
  let publicId = '';
  if (cloudinaryReady()) {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const uploaded = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      { folder: `bookingspace/${tenantId}`, resource_type: 'image' },
    );
    url = uploaded.secure_url;
    publicId = uploaded.public_id;
  } else {
    url = await storeLocalImage(file, tenantId);
    publicId = url;
  }

  if (purpose === 'logo') tenant.logoUrl = url;
  if (purpose === 'hero') tenant.heroImageUrl = url;
  if (purpose === 'gallery') {
    if (!tenant.siteSettings) tenant.siteSettings = {};
    if (!Array.isArray(tenant.siteSettings.gallery)) tenant.siteSettings.gallery = [];
    if (tenant.siteSettings.gallery.length >= 24) {
      throw new HttpError(400, 'Gallery limit reached (24)', { code: 'GALLERY_LIMIT' });
    }
    tenant.siteSettings.gallery.push({ url, publicId, alt: '' });
    if (!tenant.siteSettings.visibleSections) {
      tenant.siteSettings.visibleSections = {};
    }
    tenant.siteSettings.visibleSections.gallery = true;
    tenant.markModified('siteSettings');
  }
  await tenant.save();
  return toTenant(tenant);
}

export async function removeGalleryImage(user, tenantId, publicId) {
  await requireMember(user, tenantId, ['BUSINESS_OWNER']);
  const key = String(publicId || '').trim();
  if (!key) throw new HttpError(400, 'Image id is required', { code: 'IMAGE_REQUIRED' });

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const gallery = Array.isArray(tenant.siteSettings?.gallery)
    ? [...tenant.siteSettings.gallery]
    : [];
  const next = gallery.filter((item) => item.publicId !== key && item.url !== key);
  if (next.length === gallery.length) {
    throw new HttpError(404, 'Gallery image not found', { code: 'NOT_FOUND' });
  }

  tenant.siteSettings.gallery = next;
  if (next.length === 0 && tenant.siteSettings.visibleSections) {
    tenant.siteSettings.visibleSections.gallery = false;
  }
  tenant.markModified('siteSettings');
  await tenant.save();
  return toTenant(tenant);
}
