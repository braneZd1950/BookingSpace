import { expect, test } from './fixtures.js';

test.describe('Platform gates (unauthenticated)', () => {
  test('admin route asks for login when logged out', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Administracija/i })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Prijava' })).toBeVisible();
  });

  test('analytics route denies access when logged out', async ({ page }) => {
    await page.goto('/analitika');
    await expect(page.getByRole('heading', { name: 'Platforma' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Prijava' })).toBeVisible();
  });
});
