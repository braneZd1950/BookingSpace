export const STUDIO_KEY = 'bookingspace.studio';

export function loadStudio() {
  try {
    const raw = localStorage.getItem(STUDIO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStudio(studio) {
  localStorage.setItem(STUDIO_KEY, JSON.stringify(studio));
}

export function mediaUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  // Block CSS url("…") breakout and non-http(s) remote schemes in production media.
  if (/["')\\\s]/.test(raw)) return '';
  if (/^(https:|blob:|data:image\/)/i.test(raw)) return raw;
  if (/^http:/i.test(raw) && !import.meta.env.PROD) return raw;
  if (/^https?:/i.test(raw)) return '';
  const origin = (import.meta.env.VITE_API_URL || 'http://localhost:4001/api').replace(/\/api\/?$/, '');
  return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
}
