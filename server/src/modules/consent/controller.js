import { setConsentPublic } from './service.js';

export async function recordConsent(req, res) {
  const result = await setConsentPublic(req.user || null, req.input.body);
  res.json(result);
}
