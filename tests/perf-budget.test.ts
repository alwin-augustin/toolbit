import { describe, expect, it } from 'vitest';
import { DEFINITIONS } from '@/core/tool-contract';

/**
 * Phase 4 — perf budget (warn-only gate).
 * 100KB transform must complete well under the 1s interaction budget.
 */
describe('transform perf budget (100KB)', () => {
  const tools = [
    'json-formatter',
    'base64-encoder',
    'hash-generator',
    'strip-whitespace',
    'url-encoder',
    'html-escape',
    'js-json-minifier',
    'css-formatter',
  ] as const;

  for (const id of tools) {
    it(`${id} completes 100KB in under 1s`, async () => {
      const def = DEFINITIONS[id];
      const input =
        id === 'json-formatter'
          ? `"${'x'.repeat(100 * 1024 - 2)}"`
          : id === 'css-formatter'
            ? `body { margin: 0; color: red; } /* ${'x'.repeat(100 * 1024 - 40)} */`
            : 'x'.repeat(100 * 1024);
      const start = performance.now();
      const result = await def.transform(input, def.defaultOptions);
      const elapsed = performance.now() - start;
      expect(result.ok).toBe(true);
      expect(elapsed).toBeLessThan(1000);
    }, 10000);
  }
});
