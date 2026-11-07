import { expect, test } from './fixtures.js';

test.describe('Legal pages', () => {
  for (const path of ['/privatnost', '/uvjeti', '/kolacici']) {
    test(`loads ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('main, article, .legal, h1').first()).toBeVisible();
      await expect(page).not.toHaveURL(/\/greska$/);
    });
  }
});
