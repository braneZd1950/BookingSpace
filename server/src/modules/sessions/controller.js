import { getTenantOccupancy } from './occupancy.js';
import { getAvailability } from './service.js';

export async function availability(req, res) {
  const result = await getAvailability(
    req.input.params.tenantId,
    req.input.params.serviceId,
    req.input.query,
  );
  res.json(result);
}

export async function occupancy(req, res) {
  const result = await getTenantOccupancy(
    req.input.params.tenantId,
    req.input.query,
  );
  res.json(result);
}
