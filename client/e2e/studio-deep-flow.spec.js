import { expect, test } from './fixtures.js';
import {
  apiHealthy,
  injectSession,
  seedStudioPair,
} from './helpers/liveApi.js';

/**
 * Deep owner UI shell — Termini / Članovi / Kalendar / Analitika / Postavke.
 */
test.describe.configure({ mode: 'serial' });

test.describe('Studio owner deep flow', () => {
  /** @type {Awaited<ReturnType<typeof seedStudioPair>> | null} */
  let seed = null;

  test.beforeAll(async () => {
    test.setTimeout(120_000);
    if (!(await apiHealthy())) return;
    try {
      seed = await seedStudioPair();
    } catch (error) {
      console.warn('[studio-deep-flow] seed failed', error);
      seed = null;
    }
  });

  test.beforeEach(async () => {
    test.skip(!seed, 'API not reachable — skipping deep studio flow');
  });

  test('owner can open every studio nav section', async ({ page }) => {
    await injectSession(page, seed.owner);
    await page.goto('/stranica');
    await expect(page.getByRole('heading', { name: 'Početna' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Studio' });

    await nav.getByRole('link', { name: 'Termini' }).click();
    await expect(page).toHaveURL(/\/stranica\/termini/);
    await expect(page.getByRole('heading', { name: 'Termini' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nova rezervacija' })).toBeVisible();

    await nav.getByRole('link', { name: 'Kalendar' }).click();
    await expect(page).toHaveURL(/\/stranica\/kalendar/);
    await expect(page.getByRole('heading', { name: /Kalendar/i })).toBeVisible();

    await nav.getByRole('link', { name: 'Članovi' }).click();
    await expect(page).toHaveURL(/\/stranica\/clanovi/);
    await expect(page.getByRole('heading', { name: 'Članovi' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dodajte člana' })).toBeVisible();
    await expect(page.getByText(seed.member.user.name)).toBeVisible();

    await nav.getByRole('link', { name: 'Analitika' }).click();
    await expect(page).toHaveURL(/\/stranica\/analitika/);
    await expect(page.getByRole('heading', { name: /Analitika/i })).toBeVisible();

    await nav.getByRole('link', { name: 'Postavke' }).click();
    await expect(page).toHaveURL(/\/stranica\/postavke/);
    // h1 is studio name; "Postavke" is the settings rail label.
    await expect(page.getByText('Postavke', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Grupe postavki' })).toBeVisible();
    await expect(page.getByRole('heading', { name: seed.tenant.name })).toBeVisible();
  });

  test('owner can open add-member dialog and see seeded member', async ({ page }) => {
    await injectSession(page, seed.owner);
    await page.goto('/stranica/clanovi');
    await expect(page.getByRole('heading', { name: 'Članovi' })).toBeVisible();
    await page.getByRole('button', { name: 'Dodajte člana' }).click();
    await expect(page.getByText(/ime|e-pošt|plan|član/i).first()).toBeVisible();
    await expect(page.getByText(seed.member.email, { exact: false }).or(
      page.getByText(seed.member.user.name),
    ).first()).toBeVisible();
  });

  test('XSS in studio description does not execute as script', async ({ page }) => {
    const alerts = [];
    page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    await injectSession(page, seed.owner);
    await page.goto('/stranica');
    await page.waitForTimeout(800);
    expect(alerts).toEqual([]);
    const html = await page.content();
    expect(html).not.toMatch(/<img[^>]+onerror\s*=/i);
  });
});
