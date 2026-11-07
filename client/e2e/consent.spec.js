import { expect, test } from '@playwright/test';

test.describe('Consent banner', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows privacy dialog and allows browse-only dismiss', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: /Privola/i })).toBeVisible();
    await page.getByRole('button', { name: 'Samo pregledavam' }).click();
    await expect(page.getByRole('dialog', { name: /Privola/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Privola za rezervacije/i })).toBeVisible();
  });
});
