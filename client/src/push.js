const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
const TOKEN_KEY = 'bookingspace.token';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported() {
  return Boolean(
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window,
  );
}

export async function registerPushServiceWorker() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return reg;
}

async function fetchVapidPublicKey() {
  const res = await fetch(`${API_BASE}/push/vapid-public-key`);
  if (!res.ok) throw new Error('Push konfiguracija nije dostupna.');
  return res.json();
}

async function postJson(path, body) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Push zahtjev nije uspio.');
  }
  return res.json();
}

export async function enableWebPush({ client = 'web' } = {}) {
  if (!pushSupported()) {
    return { ok: false, reason: 'unsupported' };
  }

  const config = await fetchVapidPublicKey();
  if (!config.enabled || !config.publicKey) {
    return { ok: false, reason: 'not_configured' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied' };
  }

  const reg = await registerPushServiceWorker();
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(config.publicKey),
  });

  const json = subscription.toJSON();
  await postJson('/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
    client,
  });

  return { ok: true, subscription: json };
}

export async function disableWebPush() {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager?.getSubscription();
  if (!sub) return { ok: true, removed: false };

  const endpoint = sub.endpoint;
  try {
    await postJson('/push/unsubscribe', { endpoint });
  } catch {
    /* still unsubscribe locally */
  }
  await sub.unsubscribe();
  return { ok: true, removed: true };
}

export async function getPushStatus() {
  if (!pushSupported()) {
    return { supported: false, permission: 'unsupported', subscribed: false };
  }
  const permission = Notification.permission;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager?.getSubscription();
  return {
    supported: true,
    permission,
    subscribed: Boolean(sub),
  };
}
