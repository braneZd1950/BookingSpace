import { test as base, expect } from '@playwright/test';

/**
 * Dismiss privacy banner before each test so assertions see the page, not the dialog.
 * "Samo pregledavam" only touches sessionStorage (no API).
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('bookingspace.consentBannerDismissed', '1');
      } catch {
        /* ignore */
      }
    });
    await use(page);
  },
});

export { expect };
