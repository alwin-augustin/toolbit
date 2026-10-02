import { expect, test } from '@playwright/test';

test('install action handles native prompt and browser instructions', async ({ page }) => {
  await page.goto('/');
  const install = page.getByRole('button', { name: 'Install as PWA', exact: true });
  await install.click();
  await expect(page.getByRole('status').filter({ hasText: 'Add to Home Screen' })).toBeVisible();
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installPrompt = 'shown';
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await install.click();
  await expect(page.locator('html')).toHaveAttribute('data-install-prompt', 'shown');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(install).toHaveCount(0);
});
