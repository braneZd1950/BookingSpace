import { listPayments, recordPayment } from './service.js';

export async function list(req, res) {
  const payments = await listPayments(req.user, req.input.params.tenantId, req.input.query.limit);
  res.json({ payments });
}

export async function create(req, res) {
  const payment = await recordPayment(req.user, req.input.params.tenantId, req.input.body);
  res.status(201).json({ payment });
}
