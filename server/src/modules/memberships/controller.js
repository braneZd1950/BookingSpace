import {
  activateMembership,
  createPlan,
  listMemberships,
  listMyMemberships,
  listPlans,
  suspendMembership,
  updatePlan,
} from './service.js';

export async function listPlanHandler(req, res) {
  const plans = await listPlans(req.user, req.input.params.tenantId);
  res.json({ plans });
}

export async function createPlanHandler(req, res) {
  const plan = await createPlan(req.user, req.input.params.tenantId, req.input.body);
  res.status(201).json({ plan });
}

export async function updatePlanHandler(req, res) {
  const plan = await updatePlan(req.user, req.input.params.id, req.input.body);
  res.json({ plan });
}

export async function createMembershipHandler(req, res) {
  const result = await activateMembership(req.user, req.input.params.tenantId, req.input.body);
  res.status(201).json(result);
}

export async function listMembershipHandler(req, res) {
  const memberships = await listMemberships(req.user, req.input.params.tenantId, req.input.query.limit);
  res.json({ memberships });
}

export async function myMembershipHandler(req, res) {
  const memberships = await listMyMemberships(req.user, req.input.query.limit);
  res.json({ memberships });
}

export async function suspendHandler(req, res) {
  const membership = await suspendMembership(req.user, req.input.params.id);
  res.json({ membership });
}
