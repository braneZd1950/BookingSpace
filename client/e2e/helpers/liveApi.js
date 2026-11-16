/**
 * Shared live-API helpers for Playwright deep / security specs.
 * Targets the ephemeral e2e API (MongoMemory) on :4001 by default.
 */

export const apiBase = (process.env.PW_API_URL || 'http://127.0.0.1:4001/api').replace(/\/$/, '');

export async function api(path, { method = 'GET', token, body, headers: extra } = {}) {
  const headers = { ...(extra || {}) };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { status: res.status, body: parsed, text };
}

export async function apiHealthy() {
  try {
    const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function acceptConsent(token) {
  return api('/consent', {
    method: 'POST',
    token,
    body: { action: 'accept', version: '2026-10-13', source: 'settings' },
  });
}

export async function registerUser({
  name,
  email,
  password = 'SecurePass1!',
  role = 'CUSTOMER',
} = {}) {
  const reg = await api('/auth/register', {
    method: 'POST',
    body: { name, email, password, role },
  });
  return { ...reg, password };
}

const OPEN_WEEK = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  closed: false,
  open: '07:00',
  close: '21:00',
}));

/**
 * Full studio seed: owner + tenant + service + plan + optional member with membership.
 */
export async function seedStudioPair(stamp = Date.now()) {
  const password = 'SecurePass1!';
  const owner = await registerUser({
    name: `Deep Owner ${stamp}`,
    email: `deep-owner-${stamp}@example.com`,
    password,
    role: 'BUSINESS_OWNER',
  });
  if (owner.status !== 201) {
    throw new Error(`owner register failed: ${owner.status} ${JSON.stringify(owner.body)}`);
  }
  await acceptConsent(owner.body.token);

  const tenantRes = await api('/tenants', {
    method: 'POST',
    token: owner.body.token,
    body: {
      name: `Deep Studio ${stamp}`,
      niche: 'fitness',
      description: '<img src=x onerror=alert(1)> Deep XSS probe',
    },
  });
  if (tenantRes.status !== 201) {
    throw new Error(`tenant create failed: ${tenantRes.status} ${JSON.stringify(tenantRes.body)}`);
  }
  const tenant = tenantRes.body.tenant;

  await api(`/tenants/${tenant.id}`, {
    method: 'PATCH',
    token: owner.body.token,
    body: {
      bookingSettings: {
        capacityModel: 'PER_SLOT',
        workingHours: OPEN_WEEK,
      },
    },
  });

  const serviceRes = await api(`/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: owner.body.token,
    body: {
      name: 'PT Deep',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 4,
      cancellationWindowMinutes: 60,
      price: 0,
      membershipRequired: true,
    },
  });
  if (serviceRes.status !== 201) {
    throw new Error(`service create failed: ${serviceRes.status} ${JSON.stringify(serviceRes.body)}`);
  }
  const service = serviceRes.body.service;

  const planRes = await api(`/tenants/${tenant.id}/membership-plans`, {
    method: 'POST',
    token: owner.body.token,
    body: {
      name: 'Deep Pack',
      price: 0,
      validityDays: 30,
      sessionsIncluded: 12,
      allowedServiceIds: [service.id],
    },
  });
  if (planRes.status !== 201) {
    throw new Error(`plan create failed: ${planRes.status} ${JSON.stringify(planRes.body)}`);
  }
  const plan = planRes.body.plan;

  const member = await registerUser({
    name: `Deep Member ${stamp}`,
    email: `deep-member-${stamp}@example.com`,
    password,
    role: 'CUSTOMER',
  });
  if (member.status !== 201) {
    throw new Error(`member register failed: ${member.status} ${JSON.stringify(member.body)}`);
  }
  await acceptConsent(member.body.token);

  const membership = await api(`/tenants/${tenant.id}/memberships`, {
    method: 'POST',
    token: owner.body.token,
    body: {
      membershipPlanId: plan.id,
      method: 'CASH',
      customer: {
        name: member.body.user.name,
        email: member.body.user.email,
      },
    },
  });
  if (membership.status !== 201) {
    throw new Error(`membership failed: ${membership.status} ${JSON.stringify(membership.body)}`);
  }

  const outsider = await registerUser({
    name: `Deep Outsider ${stamp}`,
    email: `deep-out-${stamp}@example.com`,
    password,
    role: 'CUSTOMER',
  });
  if (outsider.status !== 201) {
    throw new Error(`outsider register failed: ${outsider.status}`);
  }
  await acceptConsent(outsider.body.token);

  const ownerB = await registerUser({
    name: `Deep OwnerB ${stamp}`,
    email: `deep-owner-b-${stamp}@example.com`,
    password,
    role: 'BUSINESS_OWNER',
  });
  if (ownerB.status !== 201) {
    throw new Error(`ownerB register failed: ${ownerB.status}`);
  }
  await acceptConsent(ownerB.body.token);
  const tenantB = await api('/tenants', {
    method: 'POST',
    token: ownerB.body.token,
    body: { name: `Deep Studio B ${stamp}`, niche: 'yoga' },
  });
  if (tenantB.status !== 201) {
    throw new Error(`tenantB create failed: ${tenantB.status}`);
  }

  return {
    stamp,
    password,
    owner: { token: owner.body.token, user: owner.body.user, email: owner.body.user.email },
    member: { token: member.body.token, user: member.body.user, email: member.body.user.email },
    outsider: { token: outsider.body.token, user: outsider.body.user },
    ownerB: { token: ownerB.body.token, user: ownerB.body.user },
    tenant,
    tenantB: tenantB.body.tenant,
    service,
    plan,
    membership: membership.body,
  };
}

/** Inject auth into the browser before navigation. */
export async function injectSession(page, { token, user }) {
  await page.addInitScript(({ token: t, user: u }) => {
    localStorage.setItem('bookingspace.token', t);
    localStorage.setItem(
      'bookingspace.session',
      JSON.stringify({
        name: u.name,
        email: u.email,
        role: u.role,
      }),
    );
    sessionStorage.setItem('bookingspace.consentBannerDismissed', '1');
  }, { token, user });
}
