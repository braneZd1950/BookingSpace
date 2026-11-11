import { getApiBaseUrl } from '../api/config.js';

/**
 * Resolve tenant media (Cloudinary /uploads/… ili absolute URL) za Image.
 */
export function mediaUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  if (/["')\\\s]/.test(raw)) return '';
  if (/^(https:|blob:|data:image\/)/i.test(raw)) return raw;
  if (/^http:/i.test(raw)) return raw;
  if (/^https?:/i.test(raw)) return '';
  const origin = getApiBaseUrl().replace(/\/api\/?$/, '');
  return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
}
