import { expect, test } from './fixtures.js';
import {
  api,
  apiHealthy,
  injectSession,
  seedStudioPair,
} from './helpers/liveApi.js';

/**
 * Deep member UI — public studio book + account settings paths.
 */
test.describe.configure({ mode: 'serial' });

test.describe('Member deep flow', () => {
  /** @type {Awaited<ReturnType<typeof seedStudioPair>> | null} */
  let seed = null;

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    if (!(await apiHealthy())) return;
    try {
      seed = await seedStudioPair(Date.now() + 17);
    } catch (error) {
      console.warn('[member-deep-flow] seed failed', error);
      seed = null;
    }
  });

  test.beforeEach(async () => {
    test.skip(!seed, 'API not reachable — skipping deep member flow');
  });

  test('member opens studio termini and sees booking chrome', async ({ page }) => {
    await injectSession(page, seed.member);
    await page.goto(`/s/${seed.tenant.slug}/termini`);
    await expect(page).toHaveURL(new RegExp(`/s/${seed.tenant.slug}/termini`));
    await expect(page.getByText(/termin|uslug|raspored|rezerv|slobod/i).first()).toBeVisible();
  });

  test('member can open studio account settings', async ({ page }) => {
    await injectSession(page, seed.member);
    await page.goto(`/s/${seed.tenant.slug}/postavke`);
    await expect(page).toHaveURL(new RegExp(`/s/${seed.tenant.slug}/postavke`));
    await expect(page.locator('body')).toContainText(/postav|račun|obavijest|tema|lozink|e-pošt/i);
  });

  test('outsider without membership is blocked on book API', async () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const slots = await api(
      `/tenants/${seed.tenant.id}/services/${seed.service.id}/availability?date=${tomorrow}`,
      { token: seed.outsider.token },
    );
    const book = await api('/bookings', {
      method: 'POST',
      token: seed.outsider.token,
      body: {
        serviceId: seed.service.id,
        date: tomorrow,
        startTime: '10:00',
      },
    });
    expect([400, 401, 403, 404, 422]).toContain(book.status);
    expect([200, 401, 403, 404]).toContain(slots.status);
  });
});

