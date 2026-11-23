import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  armGaConsentListener,
  ensureGoogleAnalytics,
  gaMeasurementId,
  trackGaPageView,
} from '../lib/ga.js';

const SITE_VERIFICATION = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || '').trim();

/**
 * Consent-gated GA4. Set VITE_GA_MEASUREMENT_ID (G-XXXXXXXX) on Render build.
 * Loads only after privacy consent; skips entirely when env is empty.
 */
export default function GoogleAnalytics() {
  const location = useLocation();
  const last = useRef('');

  useEffect(() => {
    if (!SITE_VERIFICATION) return;
    let el = document.head.querySelector('meta[name="google-site-verification"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'google-site-verification');
      document.head.appendChild(el);
    }
    el.setAttribute('content', SITE_VERIFICATION);
  }, []);

  useEffect(() => {
    if (!gaMeasurementId()) return undefined;
    return armGaConsentListener(() => {
      const path = `${location.pathname}${location.search || ''}`;
      trackGaPageView(path);
      last.current = path;
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!gaMeasurementId()) return;
    if (!ensureGoogleAnalytics()) return;
    const path = `${location.pathname}${location.search || ''}`;
    if (path === last.current) return;
    last.current = path;
    trackGaPageView(path);
  }, [location.pathname, location.search]);

  return null;
}
