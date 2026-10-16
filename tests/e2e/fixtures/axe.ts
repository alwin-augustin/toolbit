import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Shared axe fixture — WCAG A/AA only, serious+critical gate.
 * Usage: `import { test, expect } from './fixtures/axe'`
 */
export const test = base.extend<{
  makeAxeBuilder: () => AxeBuilder;
}>({
  makeAxeBuilder: async ({ page }, use) => {
    // Deterministic audits: the design system's entrance animations (e.g.
    // `.wb-empty`'s fade-in) render at partial opacity while they run, which
    // can trip the color-contrast rule when axe scans mid-animation (flake on
    // /image-converter, 2026-10-16). The app collapses every animation under
    // `prefers-reduced-motion` (globals.css), so emulate it and let axe see
    // the state the user ends up with.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const makeAxeBuilder = () =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    // `use` is the Playwright fixture mechanism, not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(makeAxeBuilder);
  },
});

export { expect } from '@playwright/test';

export function seriousViolations(result: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return result.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''));
}
