import { expect, test } from './fixtures.js';
import {
  api,
  apiHealthy,
  injectSession,
  seedStudioPair,
} from './helpers/liveApi.js';

test.describe.configure({ mode: 'serial' });

/**
 * Defensive security boundaries — authz, IDOR, session gates (no exploit payloads).
 */
test.describe('Security boundaries', () => {
  /** @type {Awaited<ReturnType<typeof seedStudioPair>> | null} */
  let seed = null;

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    if (!(await apiHealthy())) return;
    try {
      seed = await seedStudioPair(Date.now() + 91);
    } catch (error) {
      console.warn('[security-boundaries] seed failed', error);
      seed = null;
    }
  });

  test('unauthenticated /stranica redirects to login', async ({ page }) => {
    // StudioLayout briefly shows "Prijava je potrebna", then navigates to /login.
    // Assert the stable end state so CI timing does not flake.
    await page.goto('/stranica');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /Prijava|Prijavite se/i }).or(
        page.getByRole('button', { name: /Prijavite se/i }),
      ).first(),
    ).toBeVisible();
  });

  test('garbage Bearer token is rejected on /auth/me', async () => {
    test.skip(!(await apiHealthy()), 'API not reachable');
    const res = await api('/auth/me', { token: 'not.a.real.jwt' });
    expect(res.status).toBe(401);
  });

  test('login rejects operator-shaped email object', async () => {
    test.skip(!(await apiHealthy()), 'API not reachable');
    const res = await api('/auth/login', {
      method: 'POST',
      body: { email: { $gt: '' }, password: 'x' },
    });
    expect([400, 401, 422, 429]).toContain(res.status);
  });

  test('health endpoint does not leak secrets', async () => {
    test.skip(!(await apiHealthy()), 'API not reachable');
    const res = await api('/health');
    expect(res.status).toBe(200);
    const raw = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    expect(raw).not.toMatch(/JWT_SECRET|MONGO_URI|password|private[_-]?key/i);
  });

  test('logout invalidates session token', async () => {
    test.skip(!(await apiHealthy()), 'API not reachable');
    const stamp = Date.now();
    const reg = await api('/auth/register', {
      method: 'POST',
      body: {
        name: 'Logout Probe',
        email: `logout-probe-${stamp}@example.com`,
        password: 'SecurePass1!',
        role: 'CUSTOMER',
      },
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token;
    const before = await api('/auth/me', { token });
    expect(before.status).toBe(200);
    const logout = await api('/auth/logout', { method: 'POST', token });
    expect([200, 204]).toContain(logout.status);
    const after = await api('/auth/me', { token });
    expect(after.status).toBe(401);
  });

  test('customer cannot stay on owner /stranica shell', async ({ page }) => {
    test.skip(!seed, 'seed unavailable');
    await injectSession(page, seed.member);
    await page.goto('/stranica');
    await page.waitForTimeout(1500);
    const navCount = await page.getByRole('navigation', { name: 'Studio' }).count();
    expect(navCount).toBe(0);
  });

  test('cross-tenant owner cannot PATCH foreign studio', async () => {
    test.skip(!seed, 'seed unavailable');
    const res = await api(`/tenants/${seed.tenant.id}`, {
      method: 'PATCH',
      token: seed.ownerB.token,
      body: { name: 'Hijack attempt' },
    });
    expect([403, 404]).toContain(res.status);
  });

  test('outsider cannot list foreign memberships', async () => {
    test.skip(!seed, 'seed unavailable');
    const res = await api(`/tenants/${seed.tenant.id}/memberships`, {
      token: seed.outsider.token,
    });
    expect([401, 403, 404]).toContain(res.status);
  });

  test('owner B cannot read owner A members', async () => {
    test.skip(!seed, 'seed unavailable');
    const res = await api(`/tenants/${seed.tenant.id}/memberships`, {
      token: seed.ownerB.token,
    });
    expect([401, 403, 404]).toContain(res.status);
  });
});
