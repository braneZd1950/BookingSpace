/** Javna putanja studija (stvarni share link, ne marketplace katalog). */
export function studioPublicPath(slug) {
  const clean = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return clean ? `/s/${clean}` : '/s/vas-studio';
}

export function studioPublicUrl(slug, origin = typeof window !== 'undefined' ? window.location.origin : '') {
  const base = String(origin || '').replace(/\/$/, '');
  const path = studioPublicPath(slug);
  return base ? `${base}${path}` : path;
}

export async function copyText(value) {
  const text = String(value || '');
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
