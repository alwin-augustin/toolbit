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
