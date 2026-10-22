import {
  getPushPublicConfig,
  listMySubscriptions,
  removeSubscription,
  upsertSubscription,
} from './service.js';

export function publicConfig(req, res) {
  res.json(getPushPublicConfig());
}

export async function subscribe(req, res) {
  const sub = await upsertSubscription(req.user, req.body, req.get('user-agent'));
  res.status(201).json({ subscription: sub });
}

export async function unsubscribe(req, res) {
  const result = await removeSubscription(req.user, req.body.endpoint);
  res.json(result);
}

export async function mine(req, res) {
  const subscriptions = await listMySubscriptions(req.user);
  res.json({ subscriptions });
}
