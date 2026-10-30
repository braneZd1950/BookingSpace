/**
 * Demo podaci za lokalno testiranje:
 * - 1 fitness studio + vlasnik
 * - 1 član s aktivnim članstvom
 *
 * Pokretanje (iz root ili server):
 *   npm --prefix server run seed:demo
 *
 * NE pokretati na produkcijskoj / Render bazi s pravim korisnicima.
 */
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../src/config/db.js';
import env from '../src/config/env.js';
import Membership from '../src/models/Membership.js';
import MembershipPlan from '../src/models/MembershipPlan.js';
import Payment from '../src/models/Payment.js';
import Service from '../src/models/Service.js';
import Tenant from '../src/models/Tenant.js';
import TenantUser from '../src/models/TenantUser.js';
import User from '../src/models/User.js';
import { createWithCode } from '../src/utils/codes.js';
import { generateAllStudioLegal } from '../src/utils/studioLegal.js';

function demoLegal(studio) {
  return {
    ...generateAllStudioLegal(studio),
    updatedAt: new Date(),
  };
}

const BCRYPT_ROUNDS = 12;
const PASSWORD = 'lozinka1234';

const DEMO = {
  owner: {
    name: 'Ana Kovač',
    email: 'ana.kovac@demo.hr',
    phone: '+385 91 111 0001',
    role: 'BUSINESS_OWNER',
  },
  member: {
    name: 'Ivan Horvat',
    email: 'ivan.horvat@demo.hr',
    phone: '+385 91 222 0002',
    role: 'CUSTOMER',
  },
  studio: {
    name: 'Demo Fitness',
    slug: 'demo-fitness',
    niche: 'fitness',
    description: 'Demo fitness studio za lokalno testiranje rezervacija i članarina.',
    phone: '+385 23 555 010',
    email: 'studio@demo-fitness.hr',
    address: 'Ulica Ivana Meštrovića 1, Zadar',
    timezone: 'Europe/Zagreb',
  },
};

async function upsertUser(profile, passwordHash) {
  const existing = await User.findOne({ email: profile.email }).select('+passwordHash');
  if (existing) {
    existing.name = profile.name;
    existing.phone = profile.phone;
    existing.role = profile.role;
    existing.passwordHash = passwordHash;
    existing.privacyConsent = {
      accepted: true,
      version: '2026-10-13',
      acceptedAt: new Date(),
      source: 'register',
    };
    await existing.save();
    return existing;
  }

  return User.create({
    ...profile,
    passwordHash,
    privacyConsent: {
      accepted: true,
      version: '2026-10-13',
      acceptedAt: new Date(),
      source: 'register',
    },
  });
}

async function ensureTenantLink(tenantId, userId, role) {
  const existing = await TenantUser.findOne({ tenantId, userId });
  if (existing) {
    existing.role = role;
    existing.status = 'ACTIVE';
    await existing.save();
    return existing;
  }
  return TenantUser.create({
    tenantId,
    userId,
    role,
    status: 'ACTIVE',
    ...(role === 'BUSINESS_OWNER' ? { title: 'Trener' } : {}),
  });
}

async function upsertStudio(owner) {
  let tenant = await Tenant.findOne({ slug: DEMO.studio.slug });
  if (!tenant) {
    tenant = await Tenant.create({
      ...DEMO.studio,
      ownerId: owner._id,
      theme: {
        primaryColor: '#243056',
        secondaryColor: '#d9e0ef',
        fontFamily: 'Figtree, sans-serif',
        borderRadius: '0.5rem',
        buttonStyle: 'soft',
      },
      siteSettings: {
        template: 'fitness',
        layout: 'banner',
        paletteId: 'navy',
        visibleSections: {
          hero: true,
          about: true,
          services: true,
          schedule: true,
          gallery: true,
          contact: true,
          location: true,
          openingHours: true,
        },
        seo: {
          title: DEMO.studio.name,
          description: DEMO.studio.description,
        },
        legal: demoLegal(DEMO.studio),
      },
      bookingSettings: {
        capacityModel: 'PER_SLOT',
        workingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          day,
          closed: day === 0,
          open: '08:00',
          close: '20:00',
        })),
      },
    });
  } else {
    Object.assign(tenant, {
      name: DEMO.studio.name,
      niche: DEMO.studio.niche,
      description: DEMO.studio.description,
      phone: DEMO.studio.phone,
      email: DEMO.studio.email,
      address: DEMO.studio.address,
      timezone: DEMO.studio.timezone,
      ownerId: owner._id,
      active: true,
    });
    if (!tenant.siteSettings) tenant.siteSettings = {};
    if (!tenant.siteSettings.legal?.privacy) {
      tenant.siteSettings.legal = demoLegal(DEMO.studio);
      tenant.markModified('siteSettings');
    }
    await tenant.save();
  }

  await ensureTenantLink(tenant._id, owner._id, 'BUSINESS_OWNER');
  return tenant;
}

async function upsertService(tenantId) {
  let service = await Service.findOne({ tenantId, name: 'Grupni trening' });
  if (!service) {
    service = await Service.create({
      tenantId,
      name: 'Grupni trening',
      description: 'Fitness grupni termin, 60 minuta.',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 12,
      cancellationWindowMinutes: 60,
      price: 12,
      membershipRequired: true,
      active: true,
    });
  }
  return service;
}

async function upsertPlan(tenantId, serviceId) {
  let plan = await MembershipPlan.findOne({ tenantId, name: '12 treninga' });
  if (!plan) {
    plan = await MembershipPlan.create({
      tenantId,
      name: '12 treninga',
      description: 'Mjesečni paket za demo člana.',
      price: 120,
      validityDays: 30,
      sessionsIncluded: 12,
      allowedServiceIds: [serviceId],
      active: true,
    });
  } else {
    plan.allowedServiceIds = [serviceId];
    plan.active = true;
    await plan.save();
  }
  return plan;
}

async function upsertMembership(tenant, member, plan, owner) {
  await ensureTenantLink(tenant._id, member._id, 'CUSTOMER');

  let membership = await Membership.findOne({
    tenantId: tenant._id,
    userId: member._id,
    status: 'ACTIVE',
  });

  const today = new Date();
  const validFrom = today.toISOString().slice(0, 10);
  const validUntil = new Date(today.getTime() + 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  if (membership) {
    membership.membershipPlanId = plan._id;
    membership.validFrom = validFrom;
    membership.validUntil = validUntil;
    membership.sessionsIncluded = plan.sessionsIncluded;
    membership.sessionsUsed = 1;
    membership.status = 'ACTIVE';
    await membership.save();
    return membership;
  }

  const payment = await createWithCode(Payment, 'PAY', {
    tenantId: tenant._id,
    userId: member._id,
    amount: plan.price,
    currency: 'EUR',
    method: 'CASH',
    status: 'PAID',
    paidAt: new Date(),
    note: 'Demo seed',
    createdBy: owner._id,
  });

  membership = await createWithCode(Membership, 'MEM', {
    tenantId: tenant._id,
    userId: member._id,
    membershipPlanId: plan._id,
    paymentId: payment._id,
    validFrom,
    validUntil,
    sessionsIncluded: plan.sessionsIncluded,
    sessionsUsed: 1,
    status: 'ACTIVE',
  });

  payment.membershipId = membership._id;
  await payment.save();
  return membership;
}

async function main() {
  if (env.nodeEnv === 'production') {
    throw new Error(
      'seed:demo je zabranjen kad je NODE_ENV=production. '
      + 'Koristite samo lokalnu / test bazu — ne Render produkciju s pravim korisnicima.',
    );
  }

  await connectDb();
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  const owner = await upsertUser(DEMO.owner, passwordHash);
  const member = await upsertUser(DEMO.member, passwordHash);
  const tenant = await upsertStudio(owner);
  const service = await upsertService(tenant._id);
  const plan = await upsertPlan(tenant._id, service._id);
  const membership = await upsertMembership(tenant, member, plan, owner);

  console.log('\nDemo seed spreman.\n');
  console.log('Studio');
  console.log(`  naziv:  ${tenant.name}`);
  console.log(`  slug:   ${tenant.slug}`);
  console.log(`  javno:  /s/${tenant.slug}  (ili subdomain ako je podešen)`);
  console.log('\nVlasnik (studio)');
  console.log(`  email:  ${DEMO.owner.email}`);
  console.log(`  lozinka: ${PASSWORD}`);
  console.log('\nČlan');
  console.log(`  email:  ${DEMO.member.email}`);
  console.log(`  lozinka: ${PASSWORD}`);
  console.log(`  članstvo: ${membership.code} (${membership.sessionsUsed}/${membership.sessionsIncluded} iskorišteno)`);
  console.log('');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb().catch(() => {});
  });
