import PushSubscription from '../../models/PushSubscription.js';
import env from '../../config/env.js';
import { webPushConfigured } from '../../utils/webPush.js';

export function getPushPublicConfig() {
  return {
    enabled: webPushConfigured(),
    publicKey: webPushConfigured() ? env.vapid.publicKey : '',
  };
}

export async function upsertSubscription(user, input, userAgent = '') {
  const doc = await PushSubscription.findOneAndUpdate(
    { endpoint: input.endpoint },
    {
      $set: {
        userId: user._id,
        keys: input.keys,
        userAgent: String(userAgent || '').slice(0, 400),
        client: input.client || 'web',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { id: String(doc._id), endpoint: doc.endpoint, client: doc.client };
}

export async function removeSubscription(user, endpoint) {
  const result = await PushSubscription.deleteOne({
    userId: user._id,
    endpoint,
  });
  return { removed: result.deletedCount > 0 };
}

export async function listMySubscriptions(user) {
  const rows = await PushSubscription.find({ userId: user._id })
    .select('endpoint client createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .lean();
  return rows.map((row) => ({
    id: String(row._id),
    endpoint: row.endpoint,
    client: row.client,
    updatedAt: row.updatedAt,
  }));
}
