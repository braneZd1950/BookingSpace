import { expect, test } from './fixtures.js';

/**
 * Authenticated API-backed smoke — runs only when a live API is reachable
 * (local `npm start` on :4001 or CI with PW_API_URL).
 */
const apiBase = (process.env.PW_API_URL || 'http://127.0.0.1:4001/api').replace(/\/$/, '');

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function apiHealthy() {
  try {
    const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

test.describe('Owner + member API shell (live API)', () => {
  test.beforeEach(async () => {
    test.skip(!(await apiHealthy()), `API not reachable at ${apiBase}`);
  });

  test('register owner → create studio → open /stranica after login storage', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-owner-${stamp}@example.com`;
    const password = 'SecurePass1!';

    const reg = await api('/auth/register', {
      method: 'POST',
      body: { name: 'E2E Owner', email, password, role: 'BUSINESS_OWNER' },
    });
    expect(reg.status).toBe(201);

    await api('/consent', {
      method: 'POST',
      token: reg.body.token,
      body: { action: 'accept', version: '2026-10-13', source: 'settings' },
    });

    const tenant = await api('/tenants', {
      method: 'POST',
      token: reg.body.token,
      body: { name: `E2E Studio ${stamp}`, niche: 'fitness' },
    });
    expect(tenant.status).toBe(201);

    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('bookingspace.token', token);
      localStorage.setItem('bookingspace.session', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role,
      }));
      sessionStorage.setItem('bookingspace.consentBannerDismissed', '1');
    }, { token: reg.body.token, user: reg.body.user });

    await page.goto('/stranica');
    await expect(page).toHaveURL(/\/stranica/);
    await expect(page.getByRole('navigation', { name: 'Studio' }).getByRole('link', { name: 'Termini' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Početna' })).toBeVisible();
  });

  test('member with membership can open /s/:slug/termini', async ({ page }) => {
    const stamp = Date.now();
    const ownerEmail = `e2e-own2-${stamp}@example.com`;
    const password = 'SecurePass1!';

    const owner = await api('/auth/register', {
      method: 'POST',
      body: { name: 'E2E Own2', email: ownerEmail, password, role: 'BUSINESS_OWNER' },
    });
    expect(owner.status).toBe(201);
    await api('/consent', {
      method: 'POST',
      token: owner.body.token,
      body: { action: 'accept', version: '2026-10-13', source: 'settings' },
    });

    const tenant = await api('/tenants', {
      method: 'POST',
      token: owner.body.token,
      body: { name: `E2E Mem Studio ${stamp}`, niche: 'fitness' },
    });
    expect(tenant.status).toBe(201);
    const tenantId = tenant.body.tenant.id;
    const slug = tenant.body.tenant.slug;

    const service = await api(`/tenants/${tenantId}/services`, {
      method: 'POST',
      token: owner.body.token,
      body: {
        name: 'PT',
        durationMinutes: 60,
        slotIntervalMinutes: 60,
        capacity: 4,
        price: 0,
        membershipRequired: true,
      },
    });
    expect(service.status).toBe(201);

    const plan = await api(`/tenants/${tenantId}/membership-plans`, {
      method: 'POST',
      token: owner.body.token,
      body: {
        name: 'Pack',
        price: 0,
        validityDays: 30,
        sessionsIncluded: 8,
        allowedServiceIds: [service.body.service.id],
      },
    });
    expect(plan.status).toBe(201);

    const memberEmail = `e2e-mem-${stamp}@example.com`;
    const memberPassword = 'SecurePass1!';
    const memberReg = await api('/auth/register', {
      method: 'POST',
      body: {
        name: 'E2E Member',
        email: memberEmail,
        password: memberPassword,
        role: 'CUSTOMER',
      },
    });
    expect(memberReg.status).toBe(201);

    const invite = await api(`/tenants/${tenantId}/memberships`, {
      method: 'POST',
      token: owner.body.token,
      body: {
        membershipPlanId: plan.body.plan.id,
        method: 'CASH',
        customer: { name: 'E2E Member', email: memberEmail },
      },
    });
    expect(invite.status).toBe(201);

    await api('/consent', {
      method: 'POST',
      token: memberReg.body.token,
      body: { action: 'accept', version: '2026-10-13', source: 'settings' },
    });

    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('bookingspace.token', token);
      localStorage.setItem('bookingspace.session', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role,
      }));
      sessionStorage.setItem('bookingspace.consentBannerDismissed', '1');
    }, { token: memberReg.body.token, user: memberReg.body.user });

    await page.goto(`/s/${slug}/termini`);
    await expect(page).toHaveURL(new RegExp(`/s/${slug}/termini`));
    await expect(page.getByText(/termin|uslug|raspored|rezerv/i).first()).toBeVisible();
  });
});
