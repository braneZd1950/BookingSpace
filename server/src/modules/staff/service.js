import bcrypt from 'bcryptjs';
import Tenant from '../../models/Tenant.js';
import TenantUser from '../../models/TenantUser.js';
import User from '../../models/User.js';
import { HttpError } from '../../utils/httpError.js';
import { sendMemberInviteEmail } from '../../utils/mail.js';
import { generateMemberPassword } from '../../utils/password.js';
import { createDoc, sessionOptions, withTransaction } from '../../utils/transaction.js';
import { requireMember } from '../access.js';

const BCRYPT_ROUNDS = 10;
const BOOKABLE_ROLES = ['BUSINESS_OWNER', 'STAFF'];

function bind(query, session) {
  return session ? query.session(session) : query;
}

function toStaff(link, user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    title: link.title || (link.role === 'BUSINESS_OWNER' ? 'Vlasnik' : 'Trener'),
    role: link.role,
    status: link.status,
  };
}

export async function listStaff(actor, tenantId) {
  await requireMember(actor, tenantId, ['BUSINESS_OWNER', 'STAFF']);
  const links = await TenantUser.find({
    tenantId,
    role: { $in: BOOKABLE_ROLES },
  }).sort({ role: 1, createdAt: 1 });

  const users = await User.find({ _id: { $in: links.map((item) => item.userId) } })
    .select('name email phone');
  const byId = new Map(users.map((user) => [String(user._id), user]));

  return links
    .map((link) => {
      const user = byId.get(String(link.userId));
      return user ? toStaff(link, user) : null;
    })
    .filter(Boolean);
}

export async function listPublicTrainers(tenantId) {
  const links = await TenantUser.find({
    tenantId,
    role: { $in: BOOKABLE_ROLES },
    status: 'ACTIVE',
  }).sort({ role: 1, createdAt: 1 });

  const users = await User.find({ _id: { $in: links.map((item) => item.userId) } })
    .select('name');
  const byId = new Map(users.map((user) => [String(user._id), user]));

  return links
    .map((link) => {
      const user = byId.get(String(link.userId));
      if (!user) return null;
      return {
        id: String(user._id),
        name: user.name,
        title: link.title || (link.role === 'BUSINESS_OWNER' ? 'Vlasnik' : 'Trener'),
      };
    })
    .filter(Boolean);
}

export async function assertBookableStaff(tenantId, staffId) {
  if (!staffId) return null;
  const link = await TenantUser.findOne({
    tenantId,
    userId: staffId,
    role: { $in: BOOKABLE_ROLES },
    status: 'ACTIVE',
  });
  if (!link) throw new HttpError(400, 'Trainer not available', { code: 'STAFF_UNAVAILABLE' });
  return link.userId;
}

export async function createStaff(actor, tenantId, input) {
  await requireMember(actor, tenantId, ['BUSINESS_OWNER']);
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const email = input.email.trim().toLowerCase();
  const title = input.title?.trim() || 'Trener';

  const result = await withTransaction(async (session) => {
    let user = await bind(User.findOne({ email }).select('+passwordHash name email phone role'), session);
    let accountCreated = false;
    let temporaryPassword = null;

    if (!user) {
      temporaryPassword = generateMemberPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
      user = await createDoc(User, {
        name: input.name.trim(),
        email,
        phone: input.phone,
        passwordHash,
        role: 'STAFF',
      }, session);
      accountCreated = true;
    } else {
      const existing = await bind(TenantUser.findOne({ tenantId, userId: user._id }), session);
      if (existing) {
        if (existing.role === 'STAFF' || existing.role === 'BUSINESS_OWNER') {
          if (existing.status !== 'ACTIVE') {
            existing.status = 'ACTIVE';
            existing.title = title;
            await existing.save(sessionOptions(session));
            return {
              staff: toStaff(existing, user),
              accountCreated: false,
              temporaryPassword: null,
              inviteEmail: user.email,
              memberName: user.name,
            };
          }
          throw new HttpError(409, 'Already on the team', { code: 'STAFF_EXISTS' });
        }
        throw new HttpError(409, 'Email belongs to a member', { code: 'EMAIL_IS_MEMBER' });
      }
      if (user.role === 'CUSTOMER') {
        user.role = 'STAFF';
        await user.save(sessionOptions(session));
      }
    }

    const link = await createDoc(TenantUser, {
      tenantId,
      userId: user._id,
      role: 'STAFF',
      status: 'ACTIVE',
      title,
    }, session);

    return {
      staff: toStaff(link, user),
      accountCreated,
      temporaryPassword,
      inviteEmail: user.email,
      memberName: user.name,
    };
  });

  let inviteSent = false;
  if (result.accountCreated && result.temporaryPassword) {
    try {
      const mail = await sendMemberInviteEmail({
        to: result.inviteEmail,
        memberName: result.memberName || result.staff.name,
        studioName: tenant.name,
        studioSlug: tenant.slug,
        password: result.temporaryPassword,
      });
      inviteSent = Boolean(mail.delivered);
    } catch (error) {
      console.error('[mail] Pozivnica treneru nije poslana:', error?.message || error);
    }
  }

  return {
    staff: result.staff,
    accountCreated: result.accountCreated,
    inviteSent,
  };
}

export async function suspendStaff(actor, tenantId, userId) {
  await requireMember(actor, tenantId, ['BUSINESS_OWNER']);
  const link = await TenantUser.findOne({ tenantId, userId, role: 'STAFF' });
  if (!link) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  if (String(userId) === String(actor._id)) {
    throw new HttpError(400, 'Cannot remove yourself', { code: 'CANNOT_REMOVE_SELF' });
  }
  link.status = 'SUSPENDED';
  await link.save();
  const user = await User.findById(userId).select('name email phone');
  return toStaff(link, user);
}
