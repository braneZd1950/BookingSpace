import { expect, test } from './fixtures.js';

test.describe('Auth screens', () => {
  test('login validates empty submit without calling the API', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Prijavite se', exact: true }).click();

    await expect(page.locator('.login__error').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login links to forgot password and register', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'Zaboravljena lozinka?' }).click();
    await expect(page).toHaveURL(/\/zaboravljena-lozinka$/);

    await page.goto('/login');
    await page.getByRole('link', { name: 'Registrirajte se' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('register page loads role chooser then partner signup', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Kako se želite registrirati/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nastavi kao partner/i })).toBeVisible();

    await page.getByRole('button', { name: /Nastavi kao partner/i }).click();
    await expect(page.getByRole('heading', { name: /Pokrenite svoj prostor/i })).toBeVisible();
    await expect(page.getByText(/Naziv, niša i račun/i)).toBeVisible();
  });
});
