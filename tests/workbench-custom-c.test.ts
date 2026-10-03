import { describe, expect, it } from 'vitest';
import {
  computeDiffLines,
  diffStats,
  formatSideBySideText,
  formatUnifiedText,
  pairDiffLines,
} from '@/features/tools/diff-tool/DiffScreen';
import { applyRegexReplace, findRegexMatches } from '@/features/tools/regex-tester/RegexScreen';
import { validateJsonAgainstSchema } from '@/features/tools/json-validator/JsonSchemaScreen';

describe('diff helpers', () => {
  it('marks removed, added, and unchanged lines with line numbers', () => {
    const lines = computeDiffLines('a\nb\nc', 'a\nx\nc');
    expect(lines.map((l) => l.type)).toEqual(['unchanged', 'removed', 'added', 'unchanged']);
    expect(lines[0]).toMatchObject({ value: 'a', lineNumOld: 1, lineNumNew: 1 });
    expect(lines[1]).toMatchObject({ value: 'b', lineNumOld: 2 });
    expect(lines[2]).toMatchObject({ value: 'x', lineNumNew: 2 });
  });

  it('treats whitespace-only changes as unchanged when ignoring whitespace', () => {
    const strict = computeDiffLines('a  b', 'a b');
    expect(strict.some((l) => l.type !== 'unchanged')).toBe(true);
    const relaxed = computeDiffLines('a  b', 'a b', true);
    expect(relaxed.every((l) => l.type === 'unchanged')).toBe(true);
  });

  it('counts hunks and formats unified text with prefixes', () => {
    const lines = computeDiffLines('a\nb', 'a\nc');
    expect(diffStats(lines)).toEqual({ added: 1, removed: 1, unchanged: 1 });
    expect(formatUnifiedText(lines)).toBe('  a\n- b\n+ c');
  });

  it('pairs removed/added lines for side-by-side text', () => {
    const lines = computeDiffLines('a\nb', 'a\nc');
    const pairs = pairDiffLines(lines);
    expect(pairs).toHaveLength(2);
    expect(pairs[1]).toMatchObject({ left: { value: 'b' }, right: { value: 'c' } });
    const text = formatSideBySideText(pairs);
    expect(text).toContain('|');
    expect(text).toContain('- b');
    expect(text).toContain('+ c');
  });
});

describe('regex helpers', () => {
  it('finds matches with capture groups', () => {
    const { matches, error } = findRegexMatches('(\\w+)@([\\w.]+)', 'g', 'a@x.dev and b@y.org');
    expect(error).toBeNull();
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({ fullMatch: 'a@x.dev', groups: ['a', 'x.dev'] });
    expect(matches[1].index).toBeGreaterThan(matches[0].index);
  });

  it('captures named groups', () => {
    const { matches, error } = findRegexMatches('(?<user>\\w+)@(?<host>[\\w.]+)', 'g', 'a@x.dev');
    expect(error).toBeNull();
    expect(matches[0].namedGroups).toEqual({ user: 'a', host: 'x.dev' });
  });

  it('returns an error for an invalid pattern', () => {
    const { matches, error } = findRegexMatches('([', 'g', 'text');
    expect(matches).toEqual([]);
    expect(error).toBeTruthy();
  });

  it('returns an error for invalid flags', () => {
    const { matches, error } = findRegexMatches('a', 'z', 'text');
    expect(matches).toEqual([]);
    expect(error).toBeTruthy();
  });

  it('applies replacement references', () => {
    expect(applyRegexReplace('(\\w+)@(\\w+)', 'g', 'a@b', '$2@$1')).toEqual({
      result: 'b@a',
      error: null,
    });
  });

  it('returns empty matches for an empty pattern', () => {
    expect(findRegexMatches('', 'g', 'text')).toEqual({ matches: [], error: null });
  });
});

describe('json schema validation', () => {
  const schema = JSON.stringify({
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer', minimum: 0 },
    },
    required: ['name'],
    additionalProperties: false,
  });

  it('passes valid data', () => {
    const result = validateJsonAgainstSchema('{"name": "Ada", "age": 36}', schema);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails missing required properties', () => {
    const result = validateJsonAgainstSchema('{"age": 36}', schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.join('\n')).toContain('name');
  });

  it('fails wrong types and formats', () => {
    const formatSchema = JSON.stringify({ type: 'string', format: 'email' });
    expect(validateJsonAgainstSchema('"not-an-email"', formatSchema).valid).toBe(false);
    const badAge = validateJsonAgainstSchema('{"name": "Ada", "age": "old"}', schema);
    expect(badAge.valid).toBe(false);
    expect(badAge.errors.join('\n')).toContain('/age');
  });

  it('reports malformed data and schema JSON', () => {
    expect(validateJsonAgainstSchema('{bad', schema).valid).toBe(false);
    expect(validateJsonAgainstSchema('{"name": "Ada"}', '{bad').valid).toBe(false);
    expect(validateJsonAgainstSchema('', '').errors).toHaveLength(1);
  });
});
