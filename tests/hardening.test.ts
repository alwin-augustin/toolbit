import { describe, expect, it } from 'vitest';
import { sanitizeMarkdownError, renderMarkdownToHtml } from '@/features/tools/markdown-previewer/MarkdownScreen';
import { buildWifiString, buildVCard } from '@/features/tools/qr-code-generator/QrScreen';
import { base64UrlDecode, decodeJwt } from '@/features/tools/jwt-decoder/JwtScreen';
import { findRegexMatches } from '@/features/tools/regex-tester/RegexScreen';
import { computeDiffLines } from '@/features/tools/diff-tool/DiffScreen';
import { detectContentType } from '@/core/smart-detect';
import { getUnifiedRegistry, validateToolRegistry } from '@/core/tool-registry';
import { MAX_OPEN_TABS } from '@/shared/workspace-store';

describe('hardening guarantees', () => {
  it('sanitizes markdown failure messages', async () => {
    const html = sanitizeMarkdownError('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('onerror');
    expect(html).toContain('Error rendering markdown');
    // Happy path stays sanitized.
    expect(await renderMarkdownToHtml('hello<script>alert(1)</script>')).not.toContain('<script');
  });

  it('escapes wifi and vcard delimiters', () => {
    expect(buildWifiString('a;b:c,d\\e', 'p;ss', 'WPA')).toBe('WIFI:T:WPA;S:a\\;b\\:c\\,d\\\\e;P:p\\;ss;;');
    expect(buildVCard('A\nB', '1;2', 'a,b')).toContain('FN:A\\nB');
  });

  it('decodes UTF-8 JWT claims and rejects non-objects', () => {
    const header = btoa(JSON.stringify({ alg: 'none' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payloadObj = { name: 'Ada 😀' };
    const payload = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payloadObj))))
      .replace(/\+/g, '-').replace(/\//g, '_');
    // base64UrlDecode handles UTF-8 via TextDecoder.
    expect(() => base64UrlDecode('!!!')).toThrow();
    const decoded = decodeJwt(`${header}.${payload}.sig`);
    expect(decoded.payload).toMatchObject({ name: 'Ada 😀' });
    expect(() => decodeJwt(`${btoa('[1]').replace(/=+$/, '')}.${payload}.s`)).toThrow();
  });

  it('bounds regex evaluation', () => {
    expect(findRegexMatches('a', 'gg', 'aaa').error).toMatch(/Invalid flags/);
    expect(findRegexMatches('a'.repeat(6000), 'g', 'aaa').error).toMatch(/too long/);
    expect(findRegexMatches('(a+)+$', 'g', 'a'.repeat(200_001)).error).toMatch(/too large/);
    // Path-like input is not a regex literal.
    expect(detectContentType('/path/to/file/').map((s) => s.toolId)).not.toContain('regex-tester');
    expect(detectContentType('/ab+c/gi').map((s) => s.toolId)).toContain('regex-tester');
  });

  it('bounds diff inputs', () => {
    expect(computeDiffLines('a'.repeat(600_000), 'b'.repeat(600_000))).toEqual([]);
  });

  it('rejects cron lookalikes and accepts real crons', () => {
    expect(detectContentType('1 2 3 4 5').map((s) => s.toolId)).not.toContain('cron-parser');
    expect(detectContentType('0 9 * * 1-5').map((s) => s.toolId)).toContain('cron-parser');
  });

  it('unified registry covers every catalog tool', () => {
    expect(validateToolRegistry()).toEqual([]);
    expect(getUnifiedRegistry().length).toBeGreaterThan(40);
  });

  it('tab cap is bounded', () => {
    expect(MAX_OPEN_TABS).toBeLessThanOrEqual(30);
  });
});
