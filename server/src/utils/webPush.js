import webpush from 'web-push';
import env from '../config/env.js';
import PushSubscription from '../models/PushSubscription.js';

let configured = false;

export function webPushConfigured() {
  return Boolean(env.vapid.publicKey && env.vapid.privateKey && env.vapid.subject);
}

function ensureConfigured() {
  if (configured) return webPushConfigured();
  if (!webPushConfigured()) return false;
  webpush.setVapidDetails(
    env.vapid.subject,
    env.vapid.publicKey,
    env.vapid.privateKey,
  );
  configured = true;
  return true;
}

export async function sendPushToUser(userId, payload) {
  if (!userId || !ensureConfigured()) {
    return { sent: 0, skipped: true };
  }

  const subs = await PushSubscription.find({ userId }).lean();
  if (subs.length === 0) return { sent: 0, skipped: false };

  const body = JSON.stringify({
    title: payload.title || 'anyminutes',
    body: payload.body || '',
    data: payload.data || {},
  });

  let sent = 0;
  const stale = [];

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        body,
      );
      sent += 1;
    } catch (error) {
      const status = error?.statusCode || error?.status;
      if (status === 404 || status === 410) {
        stale.push(sub._id);
      } else {
        console.error('[web-push] send failed:', sub.endpoint?.slice(0, 48), error?.message || error);
      }
    }
  }));

  if (stale.length > 0) {
    await PushSubscription.deleteMany({ _id: { $in: stale } });
  }

  return { sent, skipped: false };
}
