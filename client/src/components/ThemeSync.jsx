import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetMeQuery } from '../api/authApi.js';
import {
  applyPublicLightTheme,
  normalizeUiTheme,
  readStoredUiTheme,
  shouldApplyUserTheme,
  syncUiTheme,
} from '../lib/uiTheme.js';

const TOKEN_KEY = 'bookingspace.token';

/**
 * User theme (light/dark/system) applies only while signed in on app shells
 * (`/stranica`, `/s/…`, admin/platform/setup).
 * Landing and other public pages are always forced light; the saved preference
 * stays in localStorage for the next signed-in session.
 */
export default function ThemeSync() {
  const location = useLocation();
  const token = typeof localStorage !== 'undefined'
    ? localStorage.getItem(TOKEN_KEY)
    : null;
  const { data } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (!shouldApplyUserTheme(location.pathname, token)) {
      applyPublicLightTheme();
      return;
    }
    if (!data?.user) {
      /* Token present but /me still loading — use last local choice. */
      syncUiTheme(readStoredUiTheme());
      return;
    }
    const fromAccount = data.user.uiTheme;
    const next = fromAccount
      ? normalizeUiTheme(fromAccount)
      : readStoredUiTheme();
    syncUiTheme(next);
  }, [token, data?.user?.uiTheme, location.pathname]);

  return null;
}
