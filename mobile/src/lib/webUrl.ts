/** Pure URL join — safe for Node unit tests. */
export function joinWebUrl(origin: string, path: string): string {
  const base = String(origin || '').replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
