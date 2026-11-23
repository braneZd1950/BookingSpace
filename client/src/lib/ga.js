import { CONSENT_EVENT, hasValidLocalConsent } from './consent.js';

const MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();

let scriptRequested = false;

function canLoad() {
  return Boolean(MEASUREMENT_ID) && hasValidLocalConsent();
}

/** Load gtag only after privacy consent (GDPR). No-op without VITE_GA_MEASUREMENT_ID. */
export function ensureGoogleAnalytics() {
  if (typeof window === 'undefined' || !canLoad()) return false;
  if (scriptRequested) return true;
  scriptRequested = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
  return true;
}

export function trackGaPageView(path) {
  if (typeof window === 'undefined' || !MEASUREMENT_ID || !window.gtag) return;
  if (!hasValidLocalConsent()) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function armGaConsentListener(onReady) {
  if (typeof window === 'undefined') return () => {};
  const sync = () => {
    if (ensureGoogleAnalytics()) onReady?.();
  };
  sync();
  window.addEventListener(CONSENT_EVENT, sync);
  return () => window.removeEventListener(CONSENT_EVENT, sync);
}

export function gaMeasurementId() {
  return MEASUREMENT_ID || '';
}
