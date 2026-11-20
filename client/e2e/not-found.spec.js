import { expect, test } from './fixtures.js';

test('unknown public route shows not-found state', async ({ page }) => {
  await page.goto('/nepostoji-ruta-xyz');
  await expect(page.getByRole('heading', { name: /nije u rasporedu/i })).toBeVisible();
  await expect(page.getByText(/Stranica nije pronađena/i)).toBeVisible();
  await expect(page.getByText(/nije dio Blizarija/i)).toBeVisible();
});
