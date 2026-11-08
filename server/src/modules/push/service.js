import PushSubscription from '../../models/PushSubscription.js';
import env from '../../config/env.js';
import { HttpError } from '../../utils/httpError.js';
import { assertSafePushEndpoint } from '../../utils/pushEndpoint.js';
import { webPushConfigured } from '../../utils/webPush.js';

export { assertSafePushEndpoint } from '../../utils/pushEndpoint.js';

export function getPushPublicConfig() {
  return {
    enabled: webPushConfigured(),
    publicKey: webPushConfigured() ? env.vapid.publicKey : '',
  };
}

export async function upsertSubscription(user, input, userAgent = '') {
  const endpoint = assertSafePushEndpoint(input.endpoint);
  const existing = await PushSubscription.findOne({ endpoint: { $eq: endpoint } });
  if (existing && String(existing.userId) !== String(user._id)) {
    throw new HttpError(409, 'Push endpoint already registered', { code: 'PUSH_ENDPOINT_TAKEN' });
  }

  const doc = await PushSubscription.findOneAndUpdate(
    { endpoint: { $eq: endpoint }, userId: { $eq: user._id } },
    {
      $set: {
        userId: user._id,
        keys: input.keys,
        userAgent: String(userAgent || '').slice(0, 400),
        client: input.client || 'web',
      },
      $setOnInsert: { endpoint },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { id: String(doc._id), endpoint: doc.endpoint, client: doc.client };
}

export async function removeSubscription(user, endpointInput) {
  const endpoint = assertSafePushEndpoint(endpointInput);
  const result = await PushSubscription.deleteOne({
    userId: { $eq: user._id },
    endpoint: { $eq: endpoint },
  });
  return { removed: result.deletedCount > 0 };
}

export async function listMySubscriptions(user) {
  const rows = await PushSubscription.find({ userId: { $eq: user._id } })
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
