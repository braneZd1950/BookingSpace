import { expect, test } from './fixtures.js';

test('unknown public route shows not-found state', async ({ page }) => {
  await page.goto('/nepostoji-ruta-xyz');
  await expect(page.getByRole('heading', { name: /nije u rasporedu/i })).toBeVisible();
  await expect(page.getByText(/Termin ne postoji/i)).toBeVisible();
});
