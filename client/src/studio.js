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
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  const origin = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}
