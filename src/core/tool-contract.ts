import Papa from 'papaparse';
import * as yaml from 'js-yaml';
import cssbeautify from 'cssbeautify';
import { minify as minifyCss } from 'csso';
import { parse as parseGraphql, print as printGraphql } from 'graphql';
import { getToolPolicy, type ToolPolicy } from '@/core/tool-policy';
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type DataType = 'text' | 'json' | 'base64' | 'csv';
export type ToolErrorCode =
  'INVALID_INPUT' | 'INPUT_TOO_LARGE' | 'CANCELLED' | 'UNSUPPORTED_VERSION';
export type Result<T> =
  { ok: true; value: T; warning?: string } | { ok: false; code: ToolErrorCode };
export interface ToolDefinition extends ToolPolicy {
  id: string;
  version: number;
  inputType: DataType;
  outputType: DataType;
  maxInputBytes: number;
  defaultOptions: Record<string, JsonValue>;
  parse: (raw: string) => Result<string>;
  transform: (
    input: string,
    options: Record<string, JsonValue>,
    signal?: AbortSignal,
  ) => Promise<Result<string>>;
  serializeOptions: (options: Record<string, JsonValue>) => Record<string, JsonValue>;
}
export const INPUT_LIMIT = 10 * 1024 * 1024;
export function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => [key, sortJson(v)]),
    );
  return value;
}
export function formatJson(
  raw: string,
  indent: number | '\t' = 2,
  sortKeys = false,
): Result<string> {
  try {
    const value = JSON.parse(raw);
    // Match complete JSON tokens, skipping quoted strings. Warn for any numeric
    // token that exceeds safe integer precision, including exponent notation.
    let unsafe = false;
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === '"') {
        for (i++; i < raw.length; i++) {
          if (raw[i] === '\\') {
            i++;
            continue;
          }
          if (raw[i] === '"') break;
        }
        continue;
      }
      if (raw[i] === '-' || (raw[i] >= '0' && raw[i] <= '9')) {
        const start = i;
        while (i + 1 < raw.length && /[0-9.eE+-]/.test(raw[i + 1])) i++;
        const number = Number(raw.slice(start, i + 1));
        if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number)))
          unsafe = true;
      }
    }
    return {
      ok: true,
      value: JSON.stringify(sortKeys ? sortJson(value) : value, null, indent),
      warning: unsafe
        ? 'Some numbers exceed JavaScript’s safe integer precision. Output may be rounded; retain the original input.'
        : undefined,
    };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}
export function base64Transform(input: string, mode: string, urlSafe: boolean): Result<string> {
  try {
    if (mode === 'decode') {
      let normalized = input.trim().replace(/-/g, '+').replace(/_/g, '/');
      normalized += '='.repeat((4 - (normalized.length % 4)) % 4);
      const bytes = Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0));
      return { ok: true, value: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
    }
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 32768)
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    let value = btoa(binary);
    if (urlSafe) value = value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return { ok: true, value };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}
export function normalizeText(input: string, action = 'normalize') {
  if (action === 'strip-all') return input.replace(/\s+/g, ' ').trim();
  return input
    .split('\n')
    .map((line) =>
      action === 'strip-leading'
        ? line.replace(/^\s+/, '')
        : action === 'strip-trailing'
          ? line.replace(/\s+$/, '')
          : action === 'strip-both'
            ? line.trim()
            : action === 'remove-empty'
              ? line
              : line.replace(/\s+/g, ' ').trim(),
    )
    .filter((line) => !['normalize', 'remove-empty'].includes(action) || line.trim())
    .join('\n');
}
export type TimestampUnit = 'auto' | 'seconds' | 'milliseconds';
export type TimestampZone = 'utc' | 'local';

/**
 * Convert a Unix timestamp or date string into UTC/Unix lines. Numeric input
 * is strict: only whole digits (optional leading `-`) are accepted, so
 * partial values like `12.5` or `1,000` are rejected instead of coerced.
 * `auto` follows the 10-digit seconds / 13-digit milliseconds convention.
 */
export function convertTimestamp(
  raw: string,
  unit: string = 'auto',
  zone: string = 'utc',
): Result<string> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, code: 'INVALID_INPUT' };
  let millis: number;
  if (/^-?\d+$/.test(trimmed)) {
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return { ok: false, code: 'INVALID_INPUT' };
    const digits = trimmed.startsWith('-') ? trimmed.length - 1 : trimmed.length;
    millis =
      unit === 'milliseconds'
        ? value
        : unit === 'seconds'
          ? value * 1000
          : digits <= 10
            ? value * 1000
            : value;
  } else {
    // Reject number lookalikes (`12.5`, `1,000`, `0x10`, `1e3`) that the
    // legacy date parser would otherwise coerce into surprising dates.
    // Time separators (`12:30`) and ISO markers stay on the date path.
    if (/^[-+\d\s.,xXbBoOeE]+$/.test(trimmed)) return { ok: false, code: 'INVALID_INPUT' };
    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) return { ok: false, code: 'INVALID_INPUT' };
    millis = parsed;
  }
  if (!Number.isFinite(millis) || Math.abs(millis) > 8.64e15)
    return { ok: false, code: 'INVALID_INPUT' };
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return { ok: false, code: 'INVALID_INPUT' };
  const lines = [
    `UTC: ${date.toISOString()}`,
    `Unix seconds: ${Math.floor(date.getTime() / 1000)}`,
    `Unix milliseconds: ${date.getTime()}`,
  ];
  if (zone === 'local') lines.push(`Local: ${date.toString()}`);
  return { ok: true, value: lines.join('\n') };
}

export function urlTransform(input: string, mode: string): Result<string> {
  try {
    return {
      ok: true,
      value: mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input),
    };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

export function yamlTransform(input: string, mode: string): Result<string> {
  try {
    if (mode === 'to-json') return { ok: true, value: JSON.stringify(yaml.load(input), null, 2) };
    if (mode === 'from-json')
      return { ok: true, value: yaml.dump(JSON.parse(input), { indent: 2 }) };
    return { ok: true, value: yaml.dump(yaml.load(input), { indent: 2 }) };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'IN',
  'ON',
  'AS',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'CROSS',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'ALTER',
  'DROP',
  'INDEX',
  'VIEW',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION',
  'ALL',
  'DISTINCT',
  'BETWEEN',
  'LIKE',
  'IS',
  'NULL',
  'EXISTS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'ASC',
  'DESC',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'PRIMARY',
  'KEY',
  'FOREIGN',
  'REFERENCES',
  'CONSTRAINT',
  'IF',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'TRANSACTION',
  'WITH',
  'RECURSIVE',
  'EXCEPT',
  'INTERSECT',
];

// Major clauses that get their own line
const MAJOR_CLAUSES = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'OUTER JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
  'UNION',
  'UNION ALL',
  'EXCEPT',
  'INTERSECT',
  'WITH',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
];

function uppercaseSqlKeywords(sql: string): string {
  let result = sql;
  for (const keyword of SQL_KEYWORDS) {
    result = result.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), keyword.toUpperCase());
  }
  return result;
}

function formatSql(sql: string): string {
  let formatted = sql.trim().replace(/\s+/g, ' ');
  for (const clause of [...MAJOR_CLAUSES].sort((a, b) => b.length - a.length)) {
    formatted = formatted.replace(
      new RegExp(`\\b(${clause})\\b`, 'gi'),
      `\n${clause.toUpperCase()}`,
    );
  }
  const lines = formatted.split('\n').filter((l) => l.trim());
  const result: string[] = [];
  let indent = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('END')) indent = Math.max(0, indent - 1);
    const isSubClause =
      upper.startsWith('AND ') ||
      upper.startsWith('OR ') ||
      upper.startsWith('ON ') ||
      upper.startsWith('WHEN ') ||
      upper.startsWith('THEN ') ||
      upper.startsWith('ELSE ');
    result.push('  '.repeat(isSubClause ? indent + 1 : indent) + trimmed);
    if (upper.startsWith('CASE')) indent++;
  }
  return result.join('\n');
}

function minifySql(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Heuristic regex-based SQL formatting, ported from the legacy formatter.
 * Known limitation: keyword matching runs over the whole string, so quoted
 * string literals containing keywords can be rewritten. Verify literals in
 * the output before running statements.
 */
export function sqlTransform(input: string, mode: string): Result<string> {
  if (!input.trim()) return { ok: false, code: 'INVALID_INPUT' };
  if (mode === 'minify') return { ok: true, value: minifySql(input) };
  if (mode === 'uppercase') return { ok: true, value: uppercaseSqlKeywords(input) };
  return { ok: true, value: formatSql(uppercaseSqlKeywords(input)) };
}

export function cssTransform(input: string, mode: string): Result<string> {
  try {
    if (!input.trim()) return { ok: false, code: 'INVALID_INPUT' };
    if (mode === 'minify') return { ok: true, value: minifyCss(input).css };
    return { ok: true, value: cssbeautify(input, { indent: '  ', autosemicolon: true }) };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

export function graphqlTransform(input: string, mode: string): Result<string> {
  try {
    if (!input.trim()) return { ok: false, code: 'INVALID_INPUT' };
    const printed = printGraphql(parseGraphql(input));
    if (mode === 'minify')
      return {
        ok: true,
        value: printed
          .replace(/\s+/g, ' ')
          .replace(/\s*([{}():,])\s*/g, '$1')
          .trim(),
      };
    return { ok: true, value: printed };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

export async function jsMinifyTransform(input: string): Promise<Result<string>> {
  try {
    if (!input.trim()) return { ok: false, code: 'INVALID_INPUT' };
    // Loaded on demand so the Node-oriented minifier stays out of the main chunk.
    const { minify } = await import('terser');
    const result = await minify(input);
    if (typeof result.code !== 'string') return { ok: false, code: 'INVALID_INPUT' };
    return { ok: true, value: result.code };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

export function htmlTransform(input: string, mode: string): Result<string> {
  if (mode === 'unescape') {
    return {
      ok: true,
      value: input
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&'),
    };
  }
  return {
    ok: true,
    value: input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'),
  };
}

function define(
  id: string,
  inputType: DataType,
  outputType: DataType,
  defaults: Record<string, JsonValue>,
  run: (
    raw: string,
    options: Record<string, JsonValue>,
  ) => Result<string> | Promise<Result<string>>,
): ToolDefinition {
  return {
    id,
    version: 1,
    inputType,
    outputType,
    maxInputBytes: INPUT_LIMIT,
    ...getToolPolicy(id),
    defaultOptions: defaults,
    parse: (raw) =>
      new TextEncoder().encode(raw).length > INPUT_LIMIT
        ? { ok: false, code: 'INPUT_TOO_LARGE' }
        : { ok: true, value: raw },
    serializeOptions: (options) =>
      Object.fromEntries(
        Object.entries(defaults).map(([key, fallback]) => [
          key,
          typeof options[key] === typeof fallback ? options[key] : fallback,
        ]),
      ),
    async transform(raw, options, signal) {
      if (signal?.aborted) return { ok: false, code: 'CANCELLED' };
      const result = await run(raw, options);
      return signal?.aborted ? { ok: false, code: 'CANCELLED' } : result;
    },
  };
}
export const DEFINITIONS: Record<string, ToolDefinition> = {
  'json-formatter': define(
    'json-formatter',
    'text',
    'json',
    { indent: 2, sortKeys: false, validateWhileTyping: true },
    (raw, o) => formatJson(raw, Number(o.indent), Boolean(o.sortKeys)),
  ),
  'json-validator': define('json-validator', 'json', 'json', {}, (raw) => formatJson(raw)),
  'base64-encoder': define(
    'base64-encoder',
    'text',
    'text',
    { mode: 'encode', urlSafe: false },
    (raw, o) => base64Transform(raw, String(o.mode), Boolean(o.urlSafe)),
  ),
  'timestamp-converter': define(
    'timestamp-converter',
    'text',
    'text',
    { unit: 'auto', zone: 'utc' },
    (raw, o) => convertTimestamp(raw, String(o.unit), String(o.zone)),
  ),
  'url-encoder': define('url-encoder', 'text', 'text', { mode: 'decode' }, (raw, o) =>
    urlTransform(raw, String(o.mode) === 'encode' ? 'encode' : 'decode'),
  ),
  'yaml-formatter': define('yaml-formatter', 'text', 'text', { mode: 'format' }, (raw, o) =>
    yamlTransform(raw, String(o.mode)),
  ),
  'sql-formatter': define('sql-formatter', 'text', 'text', { mode: 'format' }, (raw, o) =>
    sqlTransform(raw, String(o.mode)),
  ),
  'css-formatter': define('css-formatter', 'text', 'text', { mode: 'format' }, (raw, o) =>
    cssTransform(raw, String(o.mode)),
  ),
  'graphql-formatter': define('graphql-formatter', 'text', 'text', { mode: 'format' }, (raw, o) =>
    graphqlTransform(raw, String(o.mode)),
  ),
  'js-json-minifier': define('js-json-minifier', 'text', 'text', { mode: 'minify' }, (raw) =>
    jsMinifyTransform(raw),
  ),
  'html-escape': define('html-escape', 'text', 'text', { mode: 'escape' }, (raw, o) =>
    htmlTransform(raw, String(o.mode)),
  ),
  'strip-whitespace': define(
    'strip-whitespace',
    'text',
    'text',
    { action: 'normalize' },
    (raw, o) => ({ ok: true, value: normalizeText(raw, String(o.action)) }),
  ),
  'csv-to-json': define('csv-to-json', 'csv', 'json', { header: true }, (raw) => {
    const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
    return parsed.errors.length
      ? { ok: false, code: 'INVALID_INPUT' }
      : { ok: true, value: JSON.stringify(parsed.data, null, 2) };
  }),
  'hash-generator': define(
    'hash-generator',
    'text',
    'text',
    { algorithm: 'SHA-256' },
    async (raw) => ({
      ok: true,
      value: Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
      )
        .map((n) => n.toString(16).padStart(2, '0'))
        .join(''),
    }),
  ),
};
export function inputType(step: { toolId: string; options: Record<string, JsonValue> }): DataType {
  return step.toolId === 'base64-encoder' && step.options.mode === 'decode'
    ? 'base64'
    : DEFINITIONS[step.toolId]?.inputType || 'text';
}
export function outputType(step: { toolId: string; options: Record<string, JsonValue> }): DataType {
  return step.toolId === 'base64-encoder' && step.options.mode !== 'decode'
    ? 'base64'
    : DEFINITIONS[step.toolId]?.outputType || 'text';
}
export function compatible(from: DataType, to: DataType) {
  return to === 'text' || from === 'text' || from === to;
}
