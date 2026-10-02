import { createService, deactivateService, listServices, updateService } from './service.js';

export async function list(req, res) {
  const services = await listServices(req.user, req.input.params.tenantId);
  res.json({ services });
}

export async function create(req, res) {
  const service = await createService(req.user, req.input.params.tenantId, req.input.body);
  res.status(201).json({ service });
}

export async function update(req, res) {
  const service = await updateService(req.user, req.input.params.serviceId, req.input.body);
  res.json({ service });
}

export async function remove(req, res) {
  const service = await deactivateService(req.user, req.input.params.serviceId);
  res.json({ service });
}
