import { describe, expect, it } from 'vitest';
import { detectContentType } from '@/core/smart-detect';

function ids(text: string): string[] {
  return detectContentType(text).map((s) => s.toolId);
}

describe('smart content detection', () => {
  it('returns nothing for blank input', () => {
    expect(detectContentType('   ')).toEqual([]);
  });

  it('routes oversized input to formatter/decode/hash', () => {
    expect(ids('x'.repeat(200_001))).toEqual([
      'json-formatter',
      'base64-encoder',
      'hash-generator',
    ]);
  });

  it('detects JWT plus base64 segments', () => {
    const token = 'eyJoZWFkZXIiOiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl';
    expect(ids(token)).toEqual(['jwt-decoder', 'base64-encoder']);
  });

  it('detects valid JSON with validator follow-up', () => {
    expect(ids('{"b":2,"a":1}')).toEqual(['json-formatter', 'json-validator']);
  });

  it('flags JSON-looking input with errors', () => {
    expect(ids('{"a":}')[0]).toBe('json-formatter');
    expect(detectContentType('{"a":}')[0].reason).toMatch(/may have errors/);
  });

  it('detects long base64 only when nothing else matched', () => {
    expect(ids('SGVsbG8sIFdvcmxkIQ==')).toEqual(['base64-encoder']);
  });

  it('detects URL-encoded text', () => {
    expect(ids('hello%20world')).toContain('url-encoder');
  });

  it('detects plain https URLs as encodable', () => {
    const found = detectContentType('https://example.com/x').find(
      (s) => s.toolId === 'url-encoder',
    );
    expect(found?.reason).toBe('Detected URL');
  });

  it('does not misread malformed URLs as YAML mappings', () => {
    // 'https://' used to match the `key: value` shape; it now falls back to text tools.
    expect(ids('https://')).toEqual(['hash-generator', 'base64-encoder', 'case-converter']);
  });

  it('detects cron and timestamps', () => {
    expect(ids('0 9 * * 1-5')).toContain('cron-parser');
    expect(ids('1790942400')).toContain('timestamp-converter');
  });

  it('detects HTML content', () => {
    expect(ids('<p>hi</p>')).toContain('html-escape');
  });

  it('detects CSS rules', () => {
    expect(ids('.btn { color: red; }')).toContain('css-formatter');
  });

  it('detects YAML mappings', () => {
    expect(ids('a: 1')).toContain('yaml-formatter');
  });

  it('detects SQL statements case-insensitively', () => {
    expect(ids('select id from users')).toContain('sql-formatter');
  });

  it('detects standalone XML declarations', () => {
    expect(ids('<?xml version="1.0"?>')).toContain('xml-formatter');
  });

  it('detects hex colors', () => {
    expect(ids('#3b82f6')).toContain('color-converter');
  });

  it('detects regex literals', () => {
    expect(ids('/ab+c/gi')).toContain('regex-tester');
  });

  it('detects UUIDs', () => {
    expect(ids('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toContain('uuid-generator');
  });

  it('detects consistent CSV and rejects ragged rows', () => {
    expect(ids('a,b\nc,d')).toContain('csv-to-json');
    expect(ids('a,b,c\nd')).not.toContain('csv-to-json');
  });

  it('detects markdown headings', () => {
    expect(ids('# Hello')).toContain('markdown-previewer');
  });

  it('detects git diffs and PEM certificates', () => {
    expect(ids('diff --git a/x b/x')).toContain('git-diff-viewer');
    expect(ids('-----BEGIN CERTIFICATE-----\nabc')).toContain('certificate-decoder');
  });

  it('falls back to general text tools', () => {
    expect(ids('just some words')).toEqual(['hash-generator', 'base64-encoder', 'case-converter']);
  });

  it('combines independent signals on one input', () => {
    expect(ids('{"a":"x%20y"}')).toEqual(['json-formatter', 'json-validator', 'url-encoder']);
  });
});
