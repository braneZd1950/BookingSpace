import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';
import TenantUser from '../models/TenantUser.js';
import UsageEvent from '../models/UsageEvent.js';
import User from '../models/User.js';
import env from '../config/env.js';
import { smtpConfigured, verifyMail } from './mail.js';

/** Pristup platformi (/analitika, /admin): super admin, djelatnik ili ADMIN_EMAILS. */
export function isPlatformAdmin(user) {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'PLATFORM_STAFF') return true;
  const allowed = env.adminEmails;
  if (!allowed.length) return false;
  return allowed.includes(String(user.email || '').toLowerCase());
}

/** Upravljanje djelatnicima: samo ADMIN u bazi (ili bootstrap e-pošta iz ADMIN_EMAILS). */
export function isPlatformSuperAdmin(user) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const allowed = env.adminEmails;
  if (!allowed.length) return false;
  return allowed.includes(String(user.email || '').toLowerCase());
}

function asObjectId(value) {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  // Avoid ObjectId.id (Buffer) — prefer string form.
  return String(value);
}

export function trackUsage(input) {
  const doc = {
    type: input.type,
    path: input.path ? String(input.path).slice(0, 200) : undefined,
    tenantId: asObjectId(input.tenantId),
    userId: asObjectId(input.userId),
    role: input.role || undefined,
  };

  UsageEvent.create(doc).catch((error) => {
    console.error('[analytics] track failed:', error?.message || error);
  });
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

export async function summarizeUsage({ tenantId = null, days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filter = { createdAt: { $gte: since } };
  if (tenantId) filter.tenantId = tenantId;

  const [byType, byDay, topPaths, total] = await Promise.all([
    UsageEvent.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    UsageEvent.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]),
    UsageEvent.aggregate([
      { $match: { ...filter, type: 'page_view', path: { $exists: true, $ne: '' } } },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    UsageEvent.countDocuments(filter),
  ]);

  const counts = Object.fromEntries(byType.map((row) => [row._id, row.count]));
  const daysMap = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    daysMap.set(dayKey(d), {
      date: dayKey(d),
      page_view: 0,
      login_success: 0,
      booking_created: 0,
      booking_cancelled: 0,
      booking_completed: 0,
      member_created: 0,
      register_success: 0,
      tenant_created: 0,
    });
  }
  for (const row of byDay) {
    const bucket = daysMap.get(row._id.day);
    if (!bucket) continue;
    if (row._id.type in bucket) bucket[row._id.type] = row.count;
  }

  return {
    days,
    since: since.toISOString(),
    totalEvents: total,
    counts: {
      page_view: counts.page_view || 0,
      login_success: counts.login_success || 0,
      register_success: counts.register_success || 0,
      tenant_created: counts.tenant_created || 0,
      member_created: counts.member_created || 0,
      booking_created: counts.booking_created || 0,
      booking_cancelled: counts.booking_cancelled || 0,
      booking_completed: counts.booking_completed || 0,
      booking_no_show: counts.booking_no_show || 0,
      password_reset_requested: counts.password_reset_requested || 0,
    },
    series: [...daysMap.values()],
    topPaths: topPaths.map((row) => ({ path: row._id, count: row.count })),
  };
}

export async function listPlatformStudios({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const tenants = await Tenant.find({})
    .sort({ createdAt: -1 })
    .select('name slug niche nicheCustom email phone active createdAt');

  const ids = tenants.map((item) => item._id);
  const [members, bookings, views] = await Promise.all([
    Membership.aggregate([
      { $match: { tenantId: { $in: ids }, status: 'ACTIVE' } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      {
        $match: {
          tenantId: { $in: ids },
          createdAt: { $gte: since },
          status: { $in: ['CONFIRMED', 'COMPLETED', 'CANCELLED'] },
        },
      },
      {
        $group: {
          _id: { tenantId: '$tenantId', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]),
    UsageEvent.aggregate([
      {
        $match: {
          tenantId: { $in: ids },
          type: 'page_view',
          createdAt: { $gte: since },
        },
      },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]),
  ]);

  const memberMap = new Map(members.map((row) => [String(row._id), row.count]));
  const viewMap = new Map(views.map((row) => [String(row._id), row.count]));
  const bookingMap = new Map();
  for (const row of bookings) {
    const key = String(row._id.tenantId);
    const current = bookingMap.get(key) || { confirmed: 0, cancelled: 0, completed: 0 };
    if (row._id.status === 'CONFIRMED') current.confirmed = row.count;
    if (row._id.status === 'CANCELLED') current.cancelled = row.count;
    if (row._id.status === 'COMPLETED') current.completed = row.count;
    bookingMap.set(key, current);
  }

  const studios = tenants.map((tenant) => {
    const id = String(tenant._id);
    const book = bookingMap.get(id) || { confirmed: 0, cancelled: 0, completed: 0 };
    return {
      id,
      name: tenant.name,
      slug: tenant.slug,
      niche: tenant.niche,
      nicheCustom: tenant.nicheCustom || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      active: Boolean(tenant.active),
      createdAt: tenant.createdAt,
      activeMembers: memberMap.get(id) || 0,
      pageViews: viewMap.get(id) || 0,
      bookings: book.confirmed + book.completed,
      cancellations: book.cancelled,
    };
  });

  return {
    days,
    since: since.toISOString(),
    summary: {
      total: studios.length,
      active: studios.filter((item) => item.active).length,
      inactive: studios.filter((item) => !item.active).length,
      withMembers: studios.filter((item) => item.activeMembers > 0).length,
    },
    studios,
  };
}

export async function listPlatformUsers({ days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .select('name email phone role createdAt');

  const ids = users.map((item) => item._id);
  const [links, logins] = await Promise.all([
    TenantUser.aggregate([
      { $match: { userId: { $in: ids }, status: 'ACTIVE' } },
      {
        $group: {
          _id: '$userId',
          studios: { $sum: 1 },
          asOwner: {
            $sum: { $cond: [{ $eq: ['$role', 'BUSINESS_OWNER'] }, 1, 0] },
          },
          asCustomer: {
            $sum: { $cond: [{ $eq: ['$role', 'CUSTOMER'] }, 1, 0] },
          },
        },
      },
    ]),
    UsageEvent.aggregate([
      {
        $match: {
          userId: { $in: ids },
          type: 'login_success',
          createdAt: { $gte: since },
        },
      },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]),
  ]);

  const linkMap = new Map(links.map((row) => [String(row._id), row]));
  const loginMap = new Map(logins.map((row) => [String(row._id), row.count]));

  const rows = users.map((user) => {
    const id = String(user._id);
    const link = linkMap.get(id) || { studios: 0, asOwner: 0, asCustomer: 0 };
    return {
      id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      createdAt: user.createdAt,
      linkedStudios: link.studios || 0,
      ownsStudios: link.asOwner || 0,
      memberOfStudios: link.asCustomer || 0,
      logins: loginMap.get(id) || 0,
    };
  });

  return {
    days,
    since: since.toISOString(),
    summary: {
      total: rows.length,
      owners: rows.filter((item) => item.role === 'BUSINESS_OWNER').length,
      customers: rows.filter((item) => item.role === 'CUSTOMER').length,
      admins: rows.filter((item) => item.role === 'ADMIN').length,
      staff: rows.filter((item) => item.role === 'STAFF').length,
      newInPeriod: rows.filter((item) => new Date(item.createdAt) >= since).length,
    },
    users: rows,
  };
}

export async function listPlatformActivity({
  days = 7,
  type = 'actions',
  limit = 100,
} = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const base = { createdAt: { $gte: since } };

  const feedFilter = { ...base };
  if (type === 'actions') {
    feedFilter.type = { $ne: 'page_view' };
  } else if (type && type !== 'all') {
    feedFilter.type = type;
  }

  const [byType, events] = await Promise.all([
    UsageEvent.aggregate([
      { $match: base },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    UsageEvent.find(feedFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('tenantId', 'name slug')
      .populate('userId', 'name email role')
      .lean(),
  ]);

  const counts = Object.fromEntries(byType.map((row) => [row._id, row.count]));
  const actionTotal = byType
    .filter((row) => row._id !== 'page_view')
    .reduce((sum, row) => sum + row.count, 0);

  return {
    days,
    since: since.toISOString(),
    filter: type,
    summary: {
      total: byType.reduce((sum, row) => sum + row.count, 0),
      actions: actionTotal,
      page_view: counts.page_view || 0,
      login_success: counts.login_success || 0,
      register_success: counts.register_success || 0,
      tenant_created: counts.tenant_created || 0,
      member_created: counts.member_created || 0,
      booking_created: counts.booking_created || 0,
      booking_cancelled: counts.booking_cancelled || 0,
      booking_completed: counts.booking_completed || 0,
      booking_no_show: counts.booking_no_show || 0,
      password_reset_requested: counts.password_reset_requested || 0,
    },
    events: events.map((item) => ({
      id: String(item._id),
      type: item.type,
      path: item.path || '',
      role: item.role || item.userId?.role || '',
      createdAt: item.createdAt,
      studio: item.tenantId ? {
        id: String(item.tenantId._id),
        name: item.tenantId.name,
        slug: item.tenantId.slug,
      } : null,
      user: item.userId ? {
        id: String(item.userId._id),
        name: item.userId.name,
        email: item.userId.email,
      } : null,
    })),
  };
}

async function countTypesBetween(from, to) {
  const rows = await UsageEvent.aggregate([
    { $match: { createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

function metric(current, previous) {
  const cur = current || 0;
  const prev = previous || 0;
  let deltaPct = null;
  if (prev > 0) deltaPct = Math.round(((cur - prev) / prev) * 100);
  else if (cur > 0) deltaPct = 100;
  return { current: cur, previous: prev, deltaPct };
}

export async function buildPlatformReports({ days = 30 } = {}) {
  const now = new Date();
  const currentFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(currentFrom.getTime() - days * 24 * 60 * 60 * 1000);

  const [currentCounts, previousCounts, topStudios, newStudios, newUsers] = await Promise.all([
    countTypesBetween(currentFrom, now),
    countTypesBetween(previousFrom, currentFrom),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: currentFrom },
          status: { $in: ['CONFIRMED', 'COMPLETED'] },
        },
      },
      { $group: { _id: '$tenantId', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'tenants',
          localField: '_id',
          foreignField: '_id',
          as: 'tenant',
        },
      },
      { $unwind: { path: '$tenant', preserveNullAndEmptyArrays: true } },
    ]),
    Tenant.countDocuments({ createdAt: { $gte: currentFrom } }),
    User.countDocuments({ createdAt: { $gte: currentFrom } }),
  ]);

  const keys = [
    'page_view',
    'login_success',
    'register_success',
    'tenant_created',
    'member_created',
    'booking_created',
    'booking_cancelled',
    'booking_completed',
    'booking_no_show',
  ];

  const comparison = Object.fromEntries(
    keys.map((key) => [key, metric(currentCounts[key], previousCounts[key])]),
  );

  const bookings = comparison.booking_created.current;
  const cancels = comparison.booking_cancelled.current;
  const cancelRate = bookings + cancels > 0
    ? Math.round((cancels / (bookings + cancels)) * 100)
    : 0;

  return {
    days,
    currentFrom: currentFrom.toISOString(),
    previousFrom: previousFrom.toISOString(),
    comparison,
    highlights: {
      newStudios,
      newUsers,
      cancelRate,
      bookings,
      logins: comparison.login_success.current,
      pageViews: comparison.page_view.current,
    },
    topStudios: topStudios.map((row) => ({
      id: String(row._id),
      name: row.tenant?.name || 'Nepoznat studio',
      slug: row.tenant?.slug || '',
      bookings: row.bookings,
    })),
  };
}

export async function getPlatformSystem() {
  const mail = await verifyMail();
  const [tenants, users, events, memberships, bookings] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(),
    UsageEvent.countDocuments(),
    Membership.countDocuments({ status: 'ACTIVE' }),
    Booking.countDocuments({ status: 'CONFIRMED' }),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    environment: {
      nodeEnv: env.nodeEnv,
      port: env.port,
      clientOrigin: env.clientOrigin,
      adminEmailsConfigured: env.adminEmails.length,
    },
    database: {
      ok: mongoose.connection.readyState === 1,
      name: mongoose.connection.name || '',
      host: mongoose.connection.host || '',
    },
    mail: {
      configured: smtpConfigured(),
      ok: Boolean(mail.ok),
      mode: mail.mode,
      message: mail.message,
      fromSet: Boolean(env.smtp.from),
      host: env.smtp.host || '',
    },
    cloudinary: {
      configured: Boolean(
        env.cloudinary.cloudName
        && env.cloudinary.apiKey
        && env.cloudinary.apiSecret,
      ),
    },
    inventory: {
      tenants,
      users,
      events,
      activeMemberships: memberships,
      confirmedBookings: bookings,
    },
  };
}
