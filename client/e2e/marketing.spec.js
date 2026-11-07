import { expect, test } from './fixtures.js';

const pages = [
  { path: '/o-nama', heading: /o nama|anyminutes/i },
  { path: '/kontakt', heading: /kontakt/i },
  { path: '/povratna-informacija', heading: /povrat|feedback|informacij/i },
];

test.describe('Marketing pages', () => {
  for (const item of pages) {
    test(`loads ${item.path}`, async ({ page }) => {
      await page.goto(item.path);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await expect(page.locator('body')).toContainText(item.heading);
    });
  }
});
