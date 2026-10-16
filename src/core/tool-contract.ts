import Papa from 'papaparse';
import * as yaml from 'js-yaml';
import cssbeautify from 'cssbeautify';
import { minify as minifyCss } from 'csso';
import { parse as parseGraphql, print as printGraphql } from 'graphql';
import { format as formatSqlText, supportedDialects, type SqlLanguage } from 'sql-formatter';
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

export type TypeScriptDeclarationMode = 'interface' | 'type';

export interface JsonToTypeScriptOptions {
  rootName?: string;
  mode?: TypeScriptDeclarationMode;
}

interface TsField {
  key: string;
  type: string;
  optional: boolean;
}

interface TsContext {
  rootName: string;
  /** Declaration name → fields, in emission order (root first). */
  interfaces: Map<string, Map<string, TsField>>;
  /** Declaration name → canonical path, so different shapes cannot collide. */
  names: Map<string, string>;
}

const TS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function tsNameSegment(segment: string): string {
  const words = segment.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (words.length === 0) return 'Item';
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function tsTypeNameFor(context: TsContext, path: string[]): string {
  const base = [context.rootName, ...path.map(tsNameSegment)].join('');
  const canonical = path.join('\u0000');
  const existing = context.names.get(base);
  if (existing === undefined) {
    context.names.set(base, canonical);
    return base;
  }
  if (existing === canonical) return base;
  let suffix = 2;
  while (context.names.has(`${base}${suffix}`)) suffix++;
  context.names.set(`${base}${suffix}`, canonical);
  return `${base}${suffix}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeObjectValue(
  objects: Record<string, unknown>[],
  path: string[],
  context: TsContext,
): string {
  const name = tsTypeNameFor(context, path);
  let fields = context.interfaces.get(name);
  if (!fields) {
    fields = new Map();
    context.interfaces.set(name, fields);
  }
  const keys: string[] = [];
  for (const object of objects) {
    for (const key of Object.keys(object)) if (!keys.includes(key)) keys.push(key);
  }
  for (const key of keys) {
    const present = objects.filter((object) => Object.prototype.hasOwnProperty.call(object, key));
    const type = describeJsonValue(
      present.map((object) => object[key]),
      [...path, key],
      context,
    );
    const existing = fields.get(key);
    fields.set(key, {
      key,
      type: existing && existing.type !== type ? `${existing.type} | ${type}` : type,
      optional: (existing?.optional ?? false) || present.length < objects.length,
    });
  }
  return name;
}

/**
 * Infer a TypeScript type for one or more sample values at the same location.
 * Multiple values merge: array elements with differing shapes widen to a union
 * and keys missing from some elements become optional.
 */
function describeJsonValue(values: unknown[], path: string[], context: TsContext): string {
  const kinds = new Set<'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'>();
  for (const value of values) {
    if (value === null) kinds.add('null');
    else if (Array.isArray(value)) kinds.add('array');
    else if (typeof value === 'object') kinds.add('object');
    else if (typeof value === 'string') kinds.add('string');
    else if (typeof value === 'number') kinds.add('number');
    else if (typeof value === 'boolean') kinds.add('boolean');
  }
  const members: string[] = [];
  if (kinds.has('string')) members.push('string');
  if (kinds.has('number')) members.push('number');
  if (kinds.has('boolean')) members.push('boolean');
  if (kinds.has('null')) members.push('null');
  if (kinds.has('array')) {
    const items = values.filter(Array.isArray).flat();
    if (items.length === 0) {
      members.push('unknown[]');
    } else {
      const itemType = describeJsonValue(items, [...path, 'Item'], context);
      members.push(itemType.includes(' | ') ? `(${itemType})[]` : `${itemType}[]`);
    }
  }
  if (kinds.has('object')) {
    members.push(describeObjectValue(values.filter(isPlainObject), path, context));
  }
  return members.length ? members.join(' | ') : 'unknown';
}

function emitTsDeclaration(
  name: string,
  fields: Map<string, TsField>,
  mode: TypeScriptDeclarationMode,
): string {
  const members = [...fields.values()].map((field) => {
    const key = TS_IDENTIFIER.test(field.key) ? field.key : JSON.stringify(field.key);
    return `  ${key}${field.optional ? '?' : ''}: ${field.type};`;
  });
  if (mode === 'interface')
    return members.length
      ? `export interface ${name} {\n${members.join('\n')}\n}`
      : `export interface ${name} {}`;
  return members.length
    ? `export type ${name} = {\n${members.join('\n')}\n};`
    : `export type ${name} = Record<string, never>;`;
}

/**
 * Generate TypeScript declarations from a JSON sample. Nested objects become
 * their own declarations, named after the path that reached them
 * (`Root`, `RootInvoice`, `RootOrdersItem`), so the result compiles as-is.
 */
export function jsonToTypeScript(raw: string, options: JsonToTypeScriptOptions = {}): Result<string> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  const rootName = tsNameSegment(options.rootName?.trim() || 'Root');
  const context: TsContext = { rootName, interfaces: new Map(), names: new Map() };
  const rootType = describeJsonValue([value], [], context);
  const mode: TypeScriptDeclarationMode = options.mode === 'type' ? 'type' : 'interface';
  const blocks: string[] = [];
  if (!context.interfaces.has(rootName)) {
    blocks.push(`export type ${rootName} = ${rootType};`);
  }
  for (const [name, fields] of context.interfaces) {
    blocks.push(emitTsDeclaration(name, fields, mode));
  }
  return { ok: true, value: blocks.join('\n\n') };
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** RFC 4648 Base32, with mandatory padding on encode and optional on decode. */
export function base32Transform(input: string, mode: string): Result<string> {
  if (mode === 'decode') {
    const cleaned = input
      .trim()
      .replace(/[\s-]/g, '')
      .replace(/=+$/, '')
      .toUpperCase();
    if (!/^[A-Z2-7]*$/.test(cleaned)) return { ok: false, code: 'INVALID_INPUT' };
    const bytes: number[] = [];
    let bits = 0;
    let buffer = 0;
    for (const char of cleaned) {
      buffer = (buffer << 5) | BASE32_ALPHABET.indexOf(char);
      bits += 5;
      if (bits >= 8) {
        bytes.push((buffer >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    // The leftover bits of a well-formed encoding are zero padding.
    if (bits > 0 && (buffer & ((1 << bits) - 1)) !== 0) return { ok: false, code: 'INVALID_INPUT' };
    try {
      return {
        ok: true,
        value: new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes)),
      };
    } catch {
      return { ok: false, code: 'INVALID_INPUT' };
    }
  }
  const bytes = new TextEncoder().encode(input);
  let value = '';
  let bits = 0;
  let buffer = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      value += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) value += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  while (value.length % 8 !== 0) value += '=';
  return { ok: true, value };
}

/** UTF-8 text ↔ hex, tolerating 0x prefixes and common separators on decode. */
export function hexTransform(input: string, mode: string): Result<string> {
  if (mode === 'to-hex') {
    return {
      ok: true,
      value: Array.from(new TextEncoder().encode(input), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(''),
    };
  }
  const cleaned = input
    .trim()
    .replace(/^0x/i, '')
    .replace(/[\s:_-]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0)
    return { ok: false, code: 'INVALID_INPUT' };
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  try {
    return {
      ok: true,
      value: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

const SIMPLE_ESCAPES: Record<string, string> = { n: '\n', r: '\r', t: '\t', '0': '\0', '\\': '\\' };

/**
 * Escape non-ASCII and control characters as `\uXXXX` (astral characters use
 * `\u{...}`), or decode `\uXXXX`, `\u{...}`, `\xXX`, and the common short
 * escapes. Invalid sequences are left as written and reported as a warning.
 */
export function unicodeTransform(input: string, mode: string): Result<string> {
  if (mode === 'escape') {
    let value = '';
    for (const char of input) {
      const code = char.codePointAt(0) ?? 0;
      if (code > 0xffff) value += `\\u{${code.toString(16)}}`;
      else if (code > 126 || (code < 32 && char !== '\n' && char !== '\r' && char !== '\t'))
        value += `\\u${code.toString(16).padStart(4, '0')}`;
      else value += char;
    }
    return { ok: true, value };
  }
  let invalid = false;
  const value = input.replace(
    /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\\([nrt0\\])|\\u|\\x/g,
    (
      match,
      braced: string | undefined,
      quad: string | undefined,
      hex: string | undefined,
      simple: string | undefined,
    ) => {
      if (braced) return String.fromCodePoint(parseInt(braced, 16));
      if (quad) return String.fromCharCode(parseInt(quad, 16));
      if (hex) return String.fromCharCode(parseInt(hex, 16));
      if (simple) return SIMPLE_ESCAPES[simple] ?? simple;
      invalid = true;
      return match;
    },
  );
  return invalid
    ? { ok: true, value, warning: 'Invalid escape sequences were left as written.' }
    : { ok: true, value };
}

function csvDelimiter(name: string): string | undefined {
  if (name === 'comma') return ',';
  if (name === 'tab') return '\t';
  if (name === 'semicolon') return ';';
  return undefined;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * JSON → CSV/TSV. The input must be an array of flat objects (or one object);
 * columns are the union of keys in first-seen order. Nested values are
 * serialized as JSON text rather than flattened.
 */
export function jsonToCsv(raw: string, delimiter = ','): Result<string> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  const rows: unknown[] = Array.isArray(value) ? value : [value];
  if (rows.length === 0 || !rows.every(isPlainObject)) return { ok: false, code: 'INVALID_INPUT' };
  const fields: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) if (!fields.includes(key)) fields.push(key);
  }
  const data = rows.map((row) => fields.map((field) => csvCell(row[field])));
  return { ok: true, value: Papa.unparse({ fields, data }, { delimiter }) };
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

/**
 * Strip comments and collapse whitespace outside string literals and quoted
 * identifiers. A naive `.replace(/\s+/g, ' ')` would corrupt literals, so the
 * scanner tracks single/double quotes, backticks, brackets, and both comment
 * forms, and copies quoted spans verbatim.
 */
export function minifySql(sql: string): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    const next = sql[i + 1];
    if (char === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }
    if (char === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      out += char;
      i++;
      while (i < sql.length) {
        out += sql[i];
        if (sql[i] === '\\' && i + 1 < sql.length) {
          i++;
          out += sql[i];
          i++;
          continue;
        }
        if (sql[i] === char) {
          // A doubled quote is an escaped quote, not a terminator.
          if (sql[i + 1] === char) {
            out += sql[i + 1];
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (char === '[') {
      const close = sql.indexOf(']', i);
      const end = close === -1 ? sql.length : close + 1;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (/\s/.test(char)) {
      if (out.length > 0 && !out.endsWith(' ')) out += ' ';
      i++;
      continue;
    }
    out += char;
    i++;
  }
  return out.trim();
}

function resolveSqlDialect(dialect: string): SqlLanguage {
  return (supportedDialects as readonly string[]).includes(dialect)
    ? (dialect as SqlLanguage)
    : 'sql';
}

/**
 * Format, minify, or keyword-case SQL via the `sql-formatter` library, which
 * tokenizes statements so quoted literals and identifiers are never rewritten.
 * `minify` is the local scanner above; the library has no compact mode.
 */
export function sqlTransform(input: string, mode: string, dialect = 'sql'): Result<string> {
  if (!input.trim()) return { ok: false, code: 'INVALID_INPUT' };
  if (mode === 'minify') return { ok: true, value: minifySql(input) };
  try {
    const language = resolveSqlDialect(dialect);
    if (mode === 'uppercase')
      return { ok: true, value: formatSqlText(input, { language, keywordCase: 'upper' }) };
    // Format preserves the author's keyword casing; `uppercase` is opt-in.
    return {
      ok: true,
      value: formatSqlText(input, {
        language,
        keywordCase: 'preserve',
        tabWidth: 2,
        linesBetweenQueries: 1,
      }),
    };
  } catch {
    return { ok: false, code: 'INVALID_INPUT' };
  }
}

/** Dialect choices for the SQL formatter's options select. */
export const SQL_DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server (T-SQL)' },
  { value: 'plsql', label: 'Oracle (PL/SQL)' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'duckdb', label: 'DuckDB' },
  { value: 'trino', label: 'Trino' },
  { value: 'redshift', label: 'Redshift' },
] as const;


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
    (raw, o) => {
      const numeric = Number(o.indent);
      const indent = o.indent === 'tab' ? '\t' : Number.isFinite(numeric) ? numeric : 2;
      return formatJson(raw, indent, Boolean(o.sortKeys));
    },
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
  'sql-formatter': define(
    'sql-formatter',
    'text',
    'text',
    { mode: 'format', dialect: 'sql' },
    (raw, o) => sqlTransform(raw, String(o.mode), String(o.dialect)),
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
  'csv-to-json': define(
    'csv-to-json',
    'csv',
    'json',
    { header: true, mode: 'from-csv', delimiter: 'auto' },
    (raw, o) => {
      if (String(o.mode) === 'to-csv') return jsonToCsv(raw, csvDelimiter(String(o.delimiter)) ?? ',');
      const parsed = Papa.parse(raw, {
        header: o.header !== false,
        skipEmptyLines: true,
        delimiter: csvDelimiter(String(o.delimiter)),
      });
      return parsed.errors.length
        ? { ok: false, code: 'INVALID_INPUT' }
        : { ok: true, value: JSON.stringify(parsed.data, null, 2) };
    },
  ),
  'json-to-typescript': define(
    'json-to-typescript',
    'json',
    'text',
    { rootName: 'Root', mode: 'interface' },
    (raw, o) =>
      jsonToTypeScript(raw, {
        rootName: String(o.rootName),
        mode: String(o.mode) === 'type' ? 'type' : 'interface',
      }),
  ),
  'base32-encoder': define('base32-encoder', 'text', 'text', { mode: 'encode' }, (raw, o) =>
    base32Transform(raw, String(o.mode)),
  ),
  'hex-encoder': define('hex-encoder', 'text', 'text', { mode: 'to-hex' }, (raw, o) => {
    const mode = String(o.mode);
    return mode === 'unicode-escape'
      ? unicodeTransform(raw, 'escape')
      : mode === 'unicode-unescape'
        ? unicodeTransform(raw, 'unescape')
        : hexTransform(raw, mode === 'from-hex' ? 'from-hex' : 'to-hex');
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
