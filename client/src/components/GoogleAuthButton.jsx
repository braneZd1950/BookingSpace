import { useCallback, useEffect, useRef, useState } from 'react';
import './GoogleAuthButton.scss';

const CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

function GoogleMark() {
  return (
    <svg className="google-auth__mark" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function loadGisScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-gis]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS load failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS load failed'));
    document.head.appendChild(script);
  });
}

function titleFor(intent) {
  return intent === 'register'
    ? 'Registrirajte se s Googleom'
    : 'Prijavite se s Googleom';
}

/**
 * Always-visible custom Google button(s) for login / register.
 * Needs VITE_GOOGLE_CLIENT_ID to complete the flow.
 */
export default function GoogleAuthButton({
  intent = 'login',
  intents,
  onCredential,
  onError,
  label,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const hiddenRef = useRef(null);
  const activeIntent = useRef(intent);
  const callbackRef = useRef({ onCredential, onError });

  const shown = intents?.length ? intents : [intent];

  useEffect(() => {
    callbackRef.current = { onCredential, onError };
  }, [onCredential, onError]);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;

    void (async () => {
      try {
        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            setBusy(false);
            const token = response?.credential;
            if (!token) {
              callbackRef.current.onError?.('Google nije vratio podatke.');
              return;
            }
            callbackRef.current.onCredential?.(token, activeIntent.current);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
        });

        if (hiddenRef.current) {
          hiddenRef.current.replaceChildren();
          window.google.accounts.id.renderButton(hiddenRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 280,
          });
        }
        if (!cancelled) setGisReady(true);
      } catch {
        if (!cancelled) {
          callbackRef.current.onError?.('Google gumb nije dostupan.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onClick = useCallback(async (nextIntent) => {
    if (disabled || busy) return;
    if (!CLIENT_ID) {
      onError?.(
        'Google prijava nije konfigurirana. U .env postavite VITE_GOOGLE_CLIENT_ID i GOOGLE_CLIENT_ID, pa restartajte app.',
      );
      return;
    }

    activeIntent.current = nextIntent;
    setBusy(true);
    try {
      if (!gisReady) await loadGisScript();
      if (!window.google?.accounts?.id) {
        throw new Error('Google skripta nije učitana.');
      }

      window.google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          const official = hiddenRef.current?.querySelector('div[role="button"]');
          if (official) {
            official.click();
            return;
          }
          setBusy(false);
          callbackRef.current.onError?.(
            'Google prozor nije prikazan. Provjerite Client ID i dozvoljene origins u Google Cloud konzoli.',
          );
          return;
        }
        if (notification?.isDismissedMoment?.()) {
          setBusy(false);
        }
      });
    } catch (err) {
      setBusy(false);
      onError?.(err instanceof Error ? err.message : 'Google prijava nije uspjela.');
    }
  }, [busy, disabled, gisReady, onError]);

  return (
    <div className="google-auth">
      {label ? <p className="google-auth__or">{label}</p> : (
        <p className="google-auth__or">ili</p>
      )}
      {shown.map((item, index) => (
        <div key={item} className="google-auth__row">
          {index > 0 ? <p className="google-auth__or">ili</p> : null}
          <button
            type="button"
            className="google-auth__btn"
            onClick={() => onClick(item)}
            disabled={disabled || busy}
          >
            <GoogleMark />
            <span>{busy && activeIntent.current === item ? 'Otvaramo Google…' : titleFor(item)}</span>
          </button>
        </div>
      ))}
      <div ref={hiddenRef} className="google-auth__hidden" aria-hidden="true" />
    </div>
  );
}

export function isGoogleAuthConfigured() {
  return Boolean(CLIENT_ID);
}
