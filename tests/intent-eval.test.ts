/**
 * Intent evaluation harness — the lexical gate.
 *
 * Runs the golden set (`tests/intent-golden-cases.ts`) through the resolver
 * with no model: this is the CI floor. The semantic pass lives in
 * `tests/intent-eval-semantic.test.ts` (`npm run eval:intent`). Run both
 * whenever capability metadata, scoring weights, or synonyms change.
 */
import { describe, expect, it } from 'vitest';
import { CASES, OFF_CATALOGUE } from './intent-golden-cases';
import { resolveIntent } from '@/core/intent/resolver';

describe('intent evaluation (golden set)', () => {
  it('finds the right tool in the top 3', () => {
    const misses: string[] = [];
    for (const testCase of CASES) {
      const expected = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect];
      const top3 = resolveIntent(testCase.query, { limit: 3 }).suggestions.map((s) => s.toolId);
      if (!expected.some((id) => top3.includes(id)))
        misses.push(`“${testCase.query}” → ${top3.join(', ') || '(no results)'}`);
    }
    expect(misses, `hit@3 misses:\n${misses.join('\n')}`).toEqual([]);
  });

  it('never answers off-catalogue asks confidently', () => {
    for (const query of OFF_CATALOGUE) {
      const resolution = resolveIntent(query);
      expect(resolution.confident, `“${query}” → ${resolution.suggestions[0]?.toolId}`).toBe(false);
    }
  });

  it('covers the full catalogue across the golden set', () => {
    const covered = new Set<string>();
    for (const testCase of CASES) {
      const expected = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect];
      for (const id of expected) covered.add(id);
    }
    // Every tool family has at least one representative query. The threshold
    // guards against a shrinking set more than a precise count.
    expect(covered.size).toBeGreaterThanOrEqual(40);
  });
});
