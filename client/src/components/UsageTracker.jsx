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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bookingspace:analytics-tenant', {
      detail: { tenantId: String(tenantId) },
    }));
  }
}

function sendPageView(track, path, tenantId) {
  track({
    type: 'page_view',
    path,
    ...(tenantId ? { tenantId } : {}),
  });
}

export default function UsageTracker() {
  const location = useLocation();
  const [track] = useTrackPageViewMutation();
  const last = useRef('');
  const pendingStudioPath = useRef('');

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`.slice(0, 200);
    if (!path || path === last.current) return;

    const onStudioSurface = location.pathname.startsWith('/s/')
      || location.pathname.startsWith('/stranica');
    const tenantId = onStudioSurface ? readTenantId() : undefined;

    // Wait briefly for MemberLayout/StudioLayout to set tenant before counting.
    if (onStudioSurface && !tenantId) {
      pendingStudioPath.current = path;
      const timer = window.setTimeout(() => {
        if (pendingStudioPath.current !== path) return;
        const lateId = readTenantId();
        last.current = path;
        pendingStudioPath.current = '';
        sendPageView(track, path, lateId);
      }, 400);
      return () => window.clearTimeout(timer);
    }

    last.current = path;
    pendingStudioPath.current = '';
    sendPageView(track, path, tenantId);
    return undefined;
  }, [location.pathname, location.search, track]);

  useEffect(() => {
    function onTenantReady(event) {
      const path = pendingStudioPath.current;
      if (!path) return;
      const tenantId = event?.detail?.tenantId || readTenantId();
      if (!tenantId) return;
      pendingStudioPath.current = '';
      last.current = path;
      sendPageView(track, path, tenantId);
    }
    window.addEventListener('bookingspace:analytics-tenant', onTenantReady);
    return () => window.removeEventListener('bookingspace:analytics-tenant', onTenantReady);
  }, [track]);

  return null;
}
