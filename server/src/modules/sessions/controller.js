import { getAvailability } from './service.js';

export async function availability(req, res) {
  const result = await getAvailability(
    req.input.params.tenantId,
    req.input.params.serviceId,
    req.input.query,
  );
  res.json(result);
}
