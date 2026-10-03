import { describe, it, expect } from 'vitest';
import {
  base64Transform,
  convertTimestamp,
  cssTransform,
  urlTransform,
  formatJson,
  graphqlTransform,
  htmlTransform,
  jsMinifyTransform,
  normalizeText,
  sqlTransform,
  yamlTransform,
  DEFINITIONS,
} from '@/core/tool-contract';

/** Contract-level cases from the prototype design QA (design-qa.md). */
describe('workbench core transforms', () => {
  it('formats the invoice sample with 2-space indent', () => {
    const sample =
      '{"event":"invoice.paid","invoice":{"id":"inv_1042","amount":24900,"currency":"EUR"},"customer":{"id":"cus_018","active":true}}';
    const result = formatJson(sample, 2, false);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(JSON.stringify(JSON.parse(sample), null, 2));
      expect(result.value.split('\n')).toHaveLength(12);
    }
  });

  it('minifies JSON to zero-indent output', () => {
    const result = formatJson('{"b":2,"a":1}', 0, false);
    expect(result.ok && result.value).toBe('{"b":2,"a":1}');
  });

  it('sorts nested object keys recursively', () => {
    const result = formatJson('{"z":1,"a":{"d":4,"b":2}}', 2, true);
    expect(result.ok && result.value).toBe(JSON.stringify({ a: { b: 2, d: 4 }, z: 1 }, null, 2));
  });

  it('round-trips unicode Base64 from the QA check', () => {
    const encoded = base64Transform('café ☕', 'encode', false);
    expect(encoded).toEqual({ ok: true, value: 'Y2Fmw6kg4piV' });
    expect(base64Transform('Y2Fmw6kg4piV', 'decode', false)).toEqual({
      ok: true,
      value: 'café ☕',
    });
  });

  it('converts the QA timestamp in auto mode', () => {
    expect(convertTimestamp('1790942400')).toEqual({
      ok: true,
      value:
        'UTC: 2026-10-02T12:00:00.000Z\nUnix seconds: 1790942400\nUnix milliseconds: 1790942400000',
    });
  });

  it('converts 13-digit millisecond input in auto mode', () => {
    const result = convertTimestamp('1790942400000');
    expect(result.ok && result.value).toContain('UTC: 2026-10-02T12:00:00.000Z');
  });

  it('honors explicit seconds for 13-digit values', () => {
    // Same digits interpreted as seconds land far in the future.
    const result = convertTimestamp('1790942400000', 'seconds', 'utc');
    expect(result.ok && result.value).toContain('Unix seconds: 1790942400000');
  });

  it('parses ISO dates and appends the local line for the local zone', () => {
    const result = convertTimestamp('2026-10-02T12:00:00Z', 'auto', 'local');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain('Unix seconds: 1790942400');
      expect(result.value).toContain('Local: ');
    }
  });

  it('rejects partial numeric strings instead of coercing them', () => {
    for (const bad of ['', '   ', 'abc', '12.5', '1,000', '123abc', '0x10', '1e3']) {
      expect(convertTimestamp(bad)).toEqual({ ok: false, code: 'INVALID_INPUT' });
    }
  });

  it('decodes the QA URL sample', () => {
    expect(urlTransform('hello%20world%2F%E2%98%95', 'decode')).toEqual({
      ok: true,
      value: 'hello world/☕',
    });
  });

  it('round-trips URL encoding', () => {
    const encoded = urlTransform('hello world/☕', 'encode');
    expect(encoded).toEqual({ ok: true, value: 'hello%20world%2F%E2%98%95' });
  });

  it('rejects malformed percent sequences', () => {
    expect(urlTransform('%E0%A4%A', 'decode')).toEqual({ ok: false, code: 'INVALID_INPUT' });
  });

  it('exposes timestamp and url definitions with defaults', () => {
    expect(DEFINITIONS['timestamp-converter'].defaultOptions).toEqual({
      unit: 'auto',
      zone: 'utc',
    });
    expect(DEFINITIONS['url-encoder'].defaultOptions).toEqual({ mode: 'decode' });
  });

  it('runs the recipe example decode-then-format through definitions', async () => {
    const sample =
      '{"event":"invoice.paid","invoice":{"id":"inv_1042","amount":24900,"currency":"EUR"},"customer":{"id":"cus_018","active":true}}';
    const encoded = base64Transform(sample, 'encode', false);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = await DEFINITIONS['base64-encoder'].transform(encoded.value, {
      mode: 'decode',
      urlSafe: false,
    });
    expect(decoded).toEqual({ ok: true, value: sample });
    const formatted = await DEFINITIONS['json-formatter'].transform(
      decoded.ok ? decoded.value : '',
      { indent: 2, sortKeys: false, validateWhileTyping: true },
    );
    expect(formatted.ok && formatted.value).toBe(JSON.stringify(JSON.parse(sample), null, 2));
  });
});

describe('generic-batch transforms', () => {
  it('formats YAML and converts both ways', () => {
    const yaml = 'a: 1\nb:\n  - 2\n';
    expect(yamlTransform(yaml, 'format')).toEqual({ ok: true, value: 'a: 1\nb:\n  - 2\n' });
    expect(yamlTransform(yaml, 'to-json')).toEqual({
      ok: true,
      value: JSON.stringify({ a: 1, b: [2] }, null, 2),
    });
    expect(yamlTransform('{"a": 1}', 'from-json')).toEqual({ ok: true, value: 'a: 1\n' });
    expect(yamlTransform('{bad', 'format')).toEqual({ ok: false, code: 'INVALID_INPUT' });
  });

  it('formats, minifies and uppercases SQL', () => {
    const formatted = sqlTransform('select id from users where active = 1;', 'format');
    expect(formatted.ok && formatted.value).toBe('SELECT id\nFROM users\nWHERE active = 1;');
    expect(sqlTransform('select  1  -- note\n', 'minify')).toEqual({
      ok: true,
      value: 'select 1',
    });
    expect(sqlTransform('select 1', 'uppercase')).toEqual({ ok: true, value: 'SELECT 1' });
  });

  it('formats and minifies CSS', () => {
    const result = cssTransform('body{margin:0}', 'format');
    expect(result.ok && result.value).toContain('margin: 0;');
    expect(cssTransform('body { margin: 0; }', 'minify')).toEqual({
      ok: true,
      value: 'body{margin:0}',
    });
  });

  it('formats and minifies GraphQL', () => {
    const result = graphqlTransform('{ user { name } }', 'format');
    expect(result.ok && result.value).toContain('user');
    expect(graphqlTransform('{ user { name } }', 'minify')).toEqual({
      ok: true,
      value: '{user{name}}',
    });
    expect(graphqlTransform('{ bad', 'format')).toEqual({ ok: false, code: 'INVALID_INPUT' });
  });

  it('minifies JavaScript', async () => {
    const result = await jsMinifyTransform('function add(a, b) {\n  return a + b;\n}');
    expect(result).toEqual({ ok: true, value: 'function add(n,d){return n+d}' });
    expect(await jsMinifyTransform('function broken(')).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
    });
  });

  it('escapes and unescapes HTML entities', () => {
    expect(htmlTransform('<p>&</p>', 'escape')).toEqual({
      ok: true,
      value: '&lt;p&gt;&amp;&lt;/p&gt;',
    });
    expect(htmlTransform('&lt;p&gt;&amp;&lt;/p&gt;', 'unescape')).toEqual({
      ok: true,
      value: '<p>&</p>',
    });
  });

  it('strips whitespace per action', () => {
    expect(normalizeText('  a   b  ', 'strip-all')).toBe('a b');
    expect(normalizeText('  a  \n  b  ', 'strip-leading')).toBe('a  \nb  ');
    expect(normalizeText('  a  \n  b  ', 'strip-both')).toBe('a\nb');
  });

  it('converts CSV rows to JSON objects', async () => {
    const convert = DEFINITIONS['csv-to-json'].transform;
    const result = await convert('name,age\nann,30\nbob,25', { header: true });
    expect(result).toEqual({
      ok: true,
      value: JSON.stringify(
        [
          { name: 'ann', age: '30' },
          { name: 'bob', age: '25' },
        ],
        null,
        2,
      ),
    });
  });

  it('rejects malformed CSV input', async () => {
    const convert = DEFINITIONS['csv-to-json'].transform;
    expect(await convert('a,b\n"unterminated', { header: true })).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
    });
  });
});
