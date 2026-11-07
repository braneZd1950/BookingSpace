import { expect, test } from './fixtures.js';

test.describe('Password recovery UI', () => {
  test('forgot password validates empty/invalid email locally', async ({ page }) => {
    await page.goto('/zaboravljena-lozinka');
    await expect(page.getByRole('heading', { name: /Zaboravljena lozinka/i })).toBeVisible();
    await page.getByRole('button', { name: /Pošaljite link/i }).click();
    await expect(page.getByText(/ispravnu e-poštu/i)).toBeVisible();
  });

  test('reset page without token shows invalid link state', async ({ page }) => {
    await page.goto('/nova-lozinka');
    await expect(page.getByRole('heading', { name: /Link nije valjan/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Zaboravljena lozinka/i })).toBeVisible();
  });

  test('reset page with token validates short password', async ({ page }) => {
    await page.goto('/nova-lozinka?token=test-token-value');
    await page.locator('input[name="password"]').fill('short');
    await page.locator('input[name="passwordAgain"]').fill('short');
    await page.getByRole('button', { name: 'Spremi lozinku' }).click();
    await expect(page.getByText(/najmanje 8/i)).toBeVisible();
  });
});
