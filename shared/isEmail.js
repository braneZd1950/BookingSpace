/**
 * Linear-time email shape check (no nested quantifiers / backtracking).
 * Server still validates with Zod; this is for client UX only.
 */
export function isEmail(value) {
  const email = String(value || '').trim();
  if (!email || email.length > 254) return false;
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@')) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || local.length > 64 || !domain || domain.length > 253) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  if (domain.startsWith('-') || domain.endsWith('-')) return false;
  if (!domain.includes('.')) return false;
  for (let i = 0; i < email.length; i += 1) {
    const code = email.charCodeAt(i);
    if (code <= 32 || code === 127) return false;
  }
  return true;
}
