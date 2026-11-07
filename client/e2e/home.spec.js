import { expect, test } from './fixtures.js';

test.describe('Public home', () => {
  test('shows brand and primary CTA paths', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#home-brand')).toHaveText('anyminutes');
    await expect(page.getByRole('heading', { level: 1, name: /Vaši termini/i })).toBeVisible();

    await expect(page.getByRole('navigation', { name: 'Navigacija' }).getByRole('link', { name: 'Prijava' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navigacija' }).getByRole('link', { name: 'Registracija' })).toBeVisible();
  });

  test('navigates to login from header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Navigacija' }).getByRole('link', { name: 'Prijava' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Prijavite se/i })).toBeVisible();
  });
});
