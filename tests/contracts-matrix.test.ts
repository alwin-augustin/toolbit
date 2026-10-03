import { describe, expect, it } from 'vitest';
import { DEFINITIONS, compatible, inputType, outputType, INPUT_LIMIT } from '@/core/tool-contract';

/**
 * Phase 1 — contract matrix over every DEFINITION.
 * Extends contracts.test.ts (which covered json-formatter only) to all tools.
 */
describe('definition contract matrix', () => {
  it('exposes a definition for every generic workbench tool', () => {
    const ids = Object.keys(DEFINITIONS).sort();
    expect(ids).toEqual(
      [
        'base64-encoder',
        'css-formatter',
        'csv-to-json',
        'graphql-formatter',
        'hash-generator',
        'html-escape',
        'js-json-minifier',
        'json-formatter',
        'json-validator',
        'sql-formatter',
        'strip-whitespace',
        'timestamp-converter',
        'url-encoder',
        'yaml-formatter',
      ].sort(),
    );
    for (const def of Object.values(DEFINITIONS)) {
      expect(def.version).toBe(1);
      expect(def.maxInputBytes).toBe(INPUT_LIMIT);
      expect(def.id).toBeTruthy();
    }
  });

  it('honors cancellation for every definition', async () => {
    const controller = new AbortController();
    controller.abort();
    for (const [id, def] of Object.entries(DEFINITIONS)) {
      const result = await def.transform('{}', def.defaultOptions, controller.signal);
      expect(result, id).toEqual({ ok: false, code: 'CANCELLED' });
    }
  });

  it('rejects oversized input in parse for every definition', () => {
    const big = 'x'.repeat(INPUT_LIMIT + 1);
    for (const [id, def] of Object.entries(DEFINITIONS)) {
      expect(def.parse(big), id).toEqual({ ok: false, code: 'INPUT_TOO_LARGE' });
      expect(def.parse('{}').ok, id).toBe(true);
    }
  });

  it('serializes options with type-safe fallbacks', () => {
    for (const [id, def] of Object.entries(DEFINITIONS)) {
      const serialized = def.serializeOptions({ ...def.defaultOptions, bogus: 'x' } as never);
      expect(serialized, id).toEqual(def.defaultOptions);
      // Wrong-typed option falls back to default
      const firstKey = Object.keys(def.defaultOptions)[0];
      if (firstKey) {
        const wrong = { ...def.defaultOptions, [firstKey]: { not: 'a-primitive' } };
        expect(def.serializeOptions(wrong)[firstKey], `${id}:${firstKey}`).toBe(
          def.defaultOptions[firstKey],
        );
      }
    }
  });
});

describe('recipe type compatibility', () => {
  it('allows text as universal donor/acceptor', () => {
    expect(compatible('text', 'json')).toBe(true);
    expect(compatible('json', 'text')).toBe(true);
    expect(compatible('base64', 'base64')).toBe(true);
    expect(compatible('csv', 'json')).toBe(false);
    expect(compatible('json', 'json')).toBe(true);
  });

  it('resolves base64 direction from mode', () => {
    expect(inputType({ toolId: 'base64-encoder', options: { mode: 'decode' } })).toBe('base64');
    expect(inputType({ toolId: 'base64-encoder', options: { mode: 'encode' } })).toBe('text');
    expect(outputType({ toolId: 'base64-encoder', options: { mode: 'encode' } })).toBe('base64');
    expect(outputType({ toolId: 'base64-encoder', options: { mode: 'decode' } })).toBe('text');
  });

  it('falls back to text for unknown tools', () => {
    expect(inputType({ toolId: 'nope', options: {} })).toBe('text');
    expect(outputType({ toolId: 'nope', options: {} })).toBe('text');
  });
});
