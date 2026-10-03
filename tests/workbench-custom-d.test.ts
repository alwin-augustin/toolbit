import { describe, expect, it } from 'vitest';
import {
  minifyXml,
  prettifyXml,
  queryXPath,
  runXml,
  validateXml,
  XML_SAMPLE,
  xmlToJson,
} from '@/features/tools/xml-formatter/XmlScreen';
import { renderMarkdownToHtml } from '@/features/tools/markdown-previewer/MarkdownScreen';
import {
  buildHunkText,
  countFileChanges,
  getPatchFileName,
  GIT_DIFF_SAMPLE,
  normalizePatchInput,
  parseGitPatch,
  stripAnsiCodes,
} from '@/features/tools/git-diff-viewer/GitDiffScreen';
import {
  base64ToBytes,
  decodeProtobuf,
  decodeProtobufInput,
  decodeVarint,
  fieldsToJson,
  flattenFields,
  hexToBytes,
  PROTOBUF_SAMPLE_HEX,
} from '@/features/tools/protobuf-decoder/ProtobufScreen';

describe('xml helpers', () => {
  it('prettifies nested elements with indentation', () => {
    expect(prettifyXml('<a><b>x</b></a>')).toBe('<a>\n  <b>x\n</b>\n</a>');
  });

  it('minifies whitespace between tags', () => {
    expect(minifyXml('<a>\n  <b>x</b>\n</a>')).toBe('<a><b>x</b></a>');
  });

  it('converts attributes and text to JSON', () => {
    const json = JSON.parse(xmlToJson('<a k="v"><b>hi</b></a>')) as Record<string, unknown>;
    expect(json).toEqual({ a: { '@k': 'v', b: 'hi' } });
  });

  it('throws on invalid XML for xmlToJson', () => {
    expect(() => xmlToJson('<a><b></a>')).toThrow();
  });

  it('queries element nodes with XPath', () => {
    const results = queryXPath(XML_SAMPLE, "//book[@category='fiction']/title");
    expect(results).toHaveLength(2);
    expect(results[0]).toContain('The Great Gatsby');
    expect(results[1]).toContain('Le Petit Prince');
  });

  it('throws on invalid XPath', () => {
    expect(() => queryXPath(XML_SAMPLE, '///[')).toThrow(/Invalid XPath/);
  });

  it('validates well-formed and broken XML', () => {
    expect(validateXml('<a/>').valid).toBe(true);
    const bad = validateXml('<a><b></a>');
    expect(bad.valid).toBe(false);
    expect(bad.error).toBeTruthy();
  });

  it('returns empty output without error for empty input', () => {
    for (const mode of ['prettify', 'minify', 'json', 'xpath', 'validate'] as const) {
      expect(runXml('   ', mode, '//a')).toEqual({
        output: '',
        error: '',
        matchCount: 0,
        valid: null,
      });
    }
  });

  it('reports no matches for an XPath miss', () => {
    const outcome = runXml(XML_SAMPLE, 'xpath', '//does-not-exist');
    expect(outcome.matchCount).toBe(0);
    expect(outcome.error).toBe('No matches found');
  });

  it('confirms valid documents in validate mode', () => {
    expect(runXml('<a/>', 'validate')).toMatchObject({ output: 'XML is valid', valid: true });
    const bad = runXml('<a>', 'validate');
    expect(bad.valid).toBe(false);
    expect(bad.error).toBeTruthy();
  });
});

describe('markdown rendering', () => {
  it('renders headings and emphasis to HTML', async () => {
    const html = await renderMarkdownToHtml('# Hi\n\n**bold** and *italic*');
    expect(html).toContain('<h1');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('sanitizes script tags from output', async () => {
    const html = await renderMarkdownToHtml('hello<script>alert(1)</script>');
    expect(html).not.toContain('<script');
    expect(html).toContain('hello');
  });

  it('returns empty HTML for empty input', async () => {
    await expect(renderMarkdownToHtml('   ')).resolves.toBe('');
  });
});

describe('git patch parsing', () => {
  it('parses the sample into two files with line counts', () => {
    const parsed = parseGitPatch(GIT_DIFF_SAMPLE);
    expect(parsed.files).toHaveLength(2);
    expect(parsed.stats).toEqual({ files: 2, additions: 16, deletions: 3 });
  });

  it('names files without the a/ b/ prefixes', () => {
    const parsed = parseGitPatch(GIT_DIFF_SAMPLE);
    expect(getPatchFileName(parsed.files[0])).toBe('src/utils/auth.ts');
    expect(getPatchFileName(parsed.files[1])).toBe('src/config.ts');
  });

  it('counts per-file additions and deletions', () => {
    const parsed = parseGitPatch(GIT_DIFF_SAMPLE);
    expect(countFileChanges(parsed.files[0])).toEqual({ add: 14, del: 3 });
    expect(countFileChanges(parsed.files[1])).toEqual({ add: 2, del: 0 });
  });

  it('builds hunk text with headers and +/- prefixes', () => {
    const parsed = parseGitPatch(GIT_DIFF_SAMPLE);
    const text = buildHunkText(parsed.files[1]);
    expect(text).toContain('@@');
    expect(text).toContain("+  logLevel: 'info'");
  });

  it('returns zero files for empty input', () => {
    expect(parseGitPatch('   ')).toEqual({
      files: [],
      stats: { files: 0, additions: 0, deletions: 0 },
    });
  });

  it('strips ANSI codes and CRLF before parsing', () => {
    expect(stripAnsiCodes('[31m+x[0m')).toBe('+x');
    expect(normalizePatchInput('a\r\nb')).toBe('a\nb');
  });
});

describe('protobuf decoding', () => {
  it('parses hex with spaces and odd lengths', () => {
    expect(Array.from(hexToBytes('08 96 01'))).toEqual([8, 150, 1]);
    expect(Array.from(hexToBytes('abc'))).toEqual([10, 188]);
  });

  it('rejects empty hex input', () => {
    expect(() => hexToBytes('   ')).toThrow('Invalid hex string length');
  });

  it('decodes a single-byte varint', () => {
    expect(decodeVarint(new Uint8Array([0x96, 0x01]), 0)).toEqual({ value: 150, bytesRead: 2 });
  });

  it('decodes the sample message fields', () => {
    const fields = decodeProtobuf(hexToBytes(PROTOBUF_SAMPLE_HEX));
    expect(fields[0]).toMatchObject({ fieldNumber: 1, wireType: 0, value: 150 });
    expect(fields[1]).toMatchObject({ fieldNumber: 2, value: 'Hello World' });
    expect(fields[2]).toMatchObject({ fieldNumber: 3, value: 1 });
    expect(Array.isArray(fields[3].value)).toBe(true);
  });

  it('maps fields to field_N JSON keys', () => {
    const fields = decodeProtobuf(hexToBytes(PROTOBUF_SAMPLE_HEX));
    const json = fieldsToJson(fields);
    expect(json['field_1']).toBe(150);
    expect(json['field_2']).toBe('Hello World');
  });

  it('round-trips through base64 bytes', () => {
    const bytes = hexToBytes(PROTOBUF_SAMPLE_HEX);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    const fields = decodeProtobuf(base64ToBytes(btoa(binary)));
    expect(fields[0]).toMatchObject({ fieldNumber: 1, value: 150 });
  });

  it('flattens nested fields with dotted labels', () => {
    const fields = decodeProtobuf(hexToBytes(PROTOBUF_SAMPLE_HEX));
    const rows = flattenFields(fields);
    expect(rows[0]).toEqual({ label: 'field_1', detail: 'Varint = 150' });
    expect(rows.some((r) => r.label.startsWith('field_4.'))).toBe(true);
  });

  it('returns null fields without error for empty input', () => {
    expect(decodeProtobufInput('   ', 'hex')).toEqual({ fields: null, error: '', valid: null });
  });

  it('reports an error for undecodable input', () => {
    const outcome = decodeProtobufInput('!!!', 'hex');
    expect(outcome.fields).toBeNull();
    expect(outcome.valid).toBe(false);
    expect(outcome.error).toBeTruthy();
  });
});
