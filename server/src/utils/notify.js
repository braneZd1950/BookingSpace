import Tenant from '../models/Tenant.js';
import TenantUser from '../models/TenantUser.js';
import User from '../models/User.js';
import StaffNotification from '../models/StaffNotification.js';
import { sendPushToUser } from './webPush.js';

const DEFAULT_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  memberEmail: true,
  weeklyDigest: false,
  marketing: false,
  bookingPush: true,
  cancelPush: true,
  memberPush: true,
  reminderPush: false,
};

export function notificationPrefsOf(user) {
  return { ...DEFAULT_PREFS, ...(user?.notificationPrefs?.toObject?.() || user?.notificationPrefs || {}) };
}

async function resolveStaffRecipients(tenantId, excludeUserId) {
  const tenant = await Tenant.findById(tenantId).select('name slug email ownerId');
  if (!tenant) return { tenant: null, recipients: [] };

  const links = await TenantUser.find({
    tenantId,
    status: 'ACTIVE',
    role: { $in: ['BUSINESS_OWNER', 'STAFF'] },
  }).select('userId');

  const ids = new Set(links.map((link) => String(link.userId)));
  if (tenant.ownerId) ids.add(String(tenant.ownerId));

  if (excludeUserId) ids.delete(String(excludeUserId));

  const users = await User.find({ _id: { $in: [...ids] } }).select('name email notificationPrefs');
  const byEmail = new Map();

  for (const user of users) {
    if (!user.email) continue;
    byEmail.set(user.email.toLowerCase(), user);
  }

  // Studio contact inbox as fallback when no staff users (or extra copy).
  if (tenant.email) {
    const key = tenant.email.toLowerCase();
    if (!byEmail.has(key)) {
      byEmail.set(key, {
        _id: tenant.ownerId || null,
        name: tenant.name,
        email: tenant.email,
        notificationPrefs: DEFAULT_PREFS,
      });
    }
  }

  return { tenant, recipients: [...byEmail.values()] };
}

/**
 * Email + queued push for studio owners/trainers.
 * Never throws to callers — booking flow must stay intact if mail fails.
 */
export async function notifyTenantStaff({
  tenantId,
  excludeUserId,
  emailPrefKey,
  pushPrefKey,
  type,
  title,
  body,
  data = {},
  sendEmail,
}) {
  try {
    const { tenant, recipients } = await resolveStaffRecipients(tenantId, excludeUserId);
    if (!tenant || recipients.length === 0) return { emailed: 0, queued: 0 };

    let emailed = 0;
    let queued = 0;

    for (const recipient of recipients) {
      const prefs = notificationPrefsOf(recipient);
      const wantsEmail = emailPrefKey ? prefs[emailPrefKey] !== false : true;
      const wantsPush = pushPrefKey ? prefs[pushPrefKey] !== false : true;

      if (wantsEmail && recipient.email && typeof sendEmail === 'function') {
        try {
          await sendEmail({
            to: recipient.email,
            contactName: recipient.name || 'tim',
            studioName: tenant.name,
            studioSlug: tenant.slug,
          });
          emailed += 1;
        } catch (error) {
          console.error('[notify] email failed:', recipient.email, error?.message || error);
        }
      }

      if (wantsPush && recipient._id) {
        const payloadData = { ...data, studioSlug: tenant.slug };
        try {
          await StaffNotification.create({
            tenantId,
            userId: recipient._id,
            type,
            title,
            body,
            data: payloadData,
            channel: 'push',
          });
          queued += 1;
          console.info('[notify:push-queued]', {
            to: recipient.email,
            type,
            title,
          });
        } catch (error) {
          console.error('[notify] push queue failed:', error?.message || error);
        }

        try {
          const delivered = await sendPushToUser(recipient._id, {
            title,
            body,
            data: payloadData,
          });
          if (delivered.sent > 0) {
            console.info('[notify:push-sent]', {
              to: recipient.email,
              sent: delivered.sent,
              type,
            });
          }
        } catch (error) {
          console.error('[notify] push send failed:', error?.message || error);
        }
      }
    }

    return { emailed, queued };
  } catch (error) {
    console.error('[notify] staff notify failed:', error?.message || error);
    return { emailed: 0, queued: 0 };
  }
}
