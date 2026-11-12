const untilDay = new Intl.DateTimeFormat('hr-HR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Remaining sessions for an active membership pass. */
export function sessionsLeft(membership) {
  if (!membership || membership.sessionsIncluded == null) return null;
  return (
    membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0))
  );
}

/** Format membership valid-until for member home. */
export function formatValidUntil(value) {
  if (!value) return '';
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? new Date(`${raw.slice(0, 10)}T12:00:00`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return untilDay.format(date);
}

/**
 * Pick the membership for the current public tenant slug.
 * @param {Array} list
 * @param {{ slug: string, tenantId?: string, initial?: object | null }} opts
 */
export function resolveMembershipForSlug(list, { slug, tenantId, initial = null }) {
  const rows = Array.isArray(list) ? list : [];
  return (
    rows.find(
      (item) =>
        item?.status === 'ACTIVE'
        && (item?.tenant?.slug === slug || item?.tenantId === tenantId),
    )
    || rows.find((item) => item?.tenant?.slug === slug)
    || initial
    || null
  );
}
