import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTrackPageViewMutation } from '../api/analyticsApi.js';

const REAL_ID = /^[a-f\d]{24}$/i;
const ANALYTICS_TENANT_KEY = 'bookingspace.analyticsTenant';

function readTenantId() {
  try {
    const stored = sessionStorage.getItem(ANALYTICS_TENANT_KEY);
    if (stored && REAL_ID.test(stored)) return stored;
  } catch {
    // ignore
  }
  try {
    const studio = JSON.parse(localStorage.getItem('bookingspace.studio') || 'null');
    if (studio?.id && REAL_ID.test(String(studio.id))) return String(studio.id);
  } catch {
    // ignore
  }
  return undefined;
}

export function rememberAnalyticsTenant(tenantId) {
  if (!tenantId || !REAL_ID.test(String(tenantId))) return;
  try {
    sessionStorage.setItem(ANALYTICS_TENANT_KEY, String(tenantId));
  } catch {
    // ignore
  }
}

export default function UsageTracker() {
  const location = useLocation();
  const [track] = useTrackPageViewMutation();
  const last = useRef('');

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`.slice(0, 200);
    if (!path || path === last.current) return;
    last.current = path;

    const onStudioSurface = location.pathname.startsWith('/s/')
      || location.pathname.startsWith('/stranica');
    const tenantId = onStudioSurface ? readTenantId() : undefined;

    track({
      type: 'page_view',
      path,
      ...(tenantId ? { tenantId } : {}),
    });
  }, [location.pathname, location.search, track]);

  return null;
}
