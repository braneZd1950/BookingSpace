import { getCustomer, listCustomers } from './service.js';

export async function list(req, res) {
  const customers = await listCustomers(req.user, req.input.params.tenantId, req.input.query);
  res.json({ customers });
}

export async function detail(req, res) {
  const result = await getCustomer(req.user, req.input.params.tenantId, req.input.params.userId);
  res.json(result);
}
