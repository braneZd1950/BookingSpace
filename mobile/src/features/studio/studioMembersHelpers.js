import { daysLeft } from '../../../../shared/dateRange.js';
import { isEmail } from '../../../../shared/isEmail.js';

export function monthLabelHr(from = new Date()) {
  const label = new Intl.DateTimeFormat('hr-HR', { month: 'long' }).format(from);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function statusLabel(status) {
  if (status === 'ACTIVE') return 'Aktivno';
  if (status === 'SUSPENDED') return 'Uklonjeno';
  if (status === 'EXPIRED') return 'Isteklo';
  return status || '—';
}

export function sessionsLabel(item) {
  if (item.sessionsIncluded == null) return 'Neograničeno';
  const used = Number(item.sessionsUsed) || 0;
  const total = Number(item.sessionsIncluded) || 0;
  return `${used} / ${total}`;
}

export function sessionsRatio(item) {
  if (item.sessionsIncluded == null) return 1;
  const total = Number(item.sessionsIncluded) || 0;
  if (total <= 0) return 0;
  return Math.min(1, (Number(item.sessionsUsed) || 0) / total);
}

export function expiryLabel(until) {
  const left = daysLeft(until);
  if (left == null) return null;
  if (left < 0) return 'Isteklo';
  if (left === 0) return 'Ističe danas';
  return `Još ${left} dana`;
}

export function isEndingSoon(until) {
  const left = daysLeft(until);
  return left != null && left >= 0 && left <= 7;
}

export function errorCode(failure) {
  if (failure && typeof failure === 'object' && 'code' in failure) {
    return String(failure.code || '');
  }
  return '';
}

export function errorStatus(failure) {
  if (failure && typeof failure === 'object' && 'status' in failure) {
    return Number(failure.status) || 0;
  }
  return 0;
}

export function inviteNotice(kind, email, result) {
  if (result.accountCreated && result.inviteSent) {
    return kind === 'member'
      ? `Član je dodan. Lozinka za prijavu poslana je na ${email}.`
      : `Trener je dodan. Lozinka je poslana na ${email}.`;
  }
  if (result.accountCreated && !result.inviteSent) {
    return kind === 'member'
      ? `Član je dodan, ali e-pošta s lozinkom nije poslana na ${email}. Provjerite SMTP ili javite se članu.`
      : `Trener je dodan, ali e-pošta s lozinkom nije poslana na ${email}.`;
  }
  return kind === 'member'
    ? 'Članarina je aktivirana za postojeći račun. Lozinka nije mijenjana.'
    : 'Trener je dodan u tim.';
}

/** Shared tenant/name/email gate for add-member / add-staff forms. */
export function validateInviteContact({
  tenantId,
  name,
  email,
  setFormError,
  nameMissing = 'Upišite ime.',
}) {
  if (!tenantId) {
    setFormError('Studio još nije učitan.');
    return null;
  }
  const displayName = String(name || '').trim();
  if (!displayName) {
    setFormError(nameMissing);
    return null;
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isEmail(cleanEmail)) {
    setFormError('Upišite ispravnu e-poštu.');
    return null;
  }
  return { cleanEmail, displayName };
}

export function filterMemberships(list, filter, query) {
  const active = list.filter((item) => item.status === 'ACTIVE');
  const archive = list.filter((item) => item.status !== 'ACTIVE');
  const base =
    filter === 'active' ? active : filter === 'archive' ? archive : list;
  const needle = String(query || '').trim().toLowerCase();
  const filtered = !needle
    ? base
    : base.filter((item) =>
        [
          item.user?.name,
          item.user?.email,
          item.user?.phone,
          item.planName,
          item.code,
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      );
  return [...filtered].sort((a, b) => {
    const aActive = a.status === 'ACTIVE' ? 0 : 1;
    const bActive = b.status === 'ACTIVE' ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return String(a.user?.name || '').localeCompare(String(b.user?.name || ''), 'hr');
  });
}
