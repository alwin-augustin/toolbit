import { describe, expect, it } from 'vitest';
import { DEFINITIONS } from '@/core/tool-contract';

/**
 * Phase 4 — perf budget (warn-only gate).
 * 100KB transform must complete well under the 1s interaction budget.
 */
describe('transform perf budget (100KB)', () => {
  for (const id of ['json-formatter', 'base64-encoder', 'hash-generator'] as const) {
    it(`${id} completes 100KB in under 1s`, async () => {
      const input =
        id === 'json-formatter' ? `"${'x'.repeat(100 * 1024 - 2)}"` : 'x'.repeat(100 * 1024);
      const start = performance.now();
      const result = await DEFINITIONS[id].transform(input, DEFINITIONS[id].defaultOptions);
      const elapsed = performance.now() - start;
      expect(result.ok).toBe(true);
      expect(elapsed).toBeLessThan(1000);
    }, 10000);
  }
});
