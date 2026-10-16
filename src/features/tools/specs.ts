import {
  IconBinary,
  IconBraces,
  IconBrandTypescript,
  IconBrush,
  IconBrandJavascript,
  IconClock,
  IconCode,
  IconDatabase,
  IconEraser,
  IconFileCode,
  IconFileDigit,
  IconFileText,
  IconHtml,
  IconLink,
  IconTable,
} from '@tabler/icons-react';
import {
  DEFINITIONS,
  SQL_DIALECTS,
  base32Transform,
  base64Transform,
  convertTimestamp,
  cssTransform,
  formatJson,
  graphqlTransform,
  hexTransform,
  htmlTransform,
  jsMinifyTransform,
  jsonToTypeScript,
  normalizeText,
  sqlTransform,
  unicodeTransform,
  urlTransform,
  yamlTransform,
  type JsonValue,
} from '@/core/tool-contract';
import { queryJsonPath } from '@/core/json-path';
import {
  jsonErrorMessage,
  INVOICE_SAMPLE,
  type WorkbenchDocState,
  type WorkbenchToolSpec as Spec,
} from '@/shared/workbench';
import type { EditorLanguage } from '@/shared/editor-language';
import { useWorkspace } from '@/shared/workspace-store';

export type { Spec as WorkbenchToolSpec };

function emptyOk(input: string): { output: string; error: string } | null {
  return !input.trim() ? { output: '', error: 'Add some input to continue.' } : null;
}

const YAML_SAMPLE = 'event: invoice.paid\ninvoice:\n  id: inv_1042\n  amount: 24900\n';
const CSV_SAMPLE = 'name,age\nann,30\nbob,25';
const SQL_SAMPLE =
  'SELECT u.id, u.name FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.active = 1 ORDER BY o.total DESC LIMIT 10;';
const CSS_SAMPLE = 'body {\n  margin: 0;\n  color: #333;\n}';
const GRAPHQL_SAMPLE = 'query GetUser {\n  user(id: 1) {\n    name\n  }\n}';
const JS_SAMPLE = 'function greet(name) {\n  return "Hello, " + name;\n}';
const HTML_SAMPLE = '<p class="greeting">Hello & welcome</p>';
const TYPES_SAMPLE = `{
  "id": "inv_1042",
  "paid": true,
  "total": 24900,
  "customer": { "id": "cus_018", "name": "Ada", "vip": true },
  "lines": [
    { "sku": "A-1", "qty": 2, "price": 12450 },
    { "sku": "B-2", "qty": 1 }
  ]
}`;

function jsonRun(
  input: string,
  params: Record<string, string | boolean>,
  mode: string,
): { output: string; error: string; warning?: string } {
  const empty = emptyOk(input);
  if (empty) return empty;
  const indent =
    mode === 'minify' ? 0 : params.indent === 'tab' ? '\t' : Number(params.indent ?? 2);
  if (mode === 'query') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      return { output: '', error: jsonErrorMessage(input) };
    }
    const path = String(params.path ?? '').trim() || '$';
    const result = queryJsonPath(parsed, path);
    if (!result.ok) return { output: '', error: result.error };
    if (result.matches.length === 0) return { output: 'No matches.', error: '' };
    const matched =
      result.matches.length === 1
        ? result.matches[0].value
        : result.matches.map((match) => match.value);
    return { output: JSON.stringify(matched, null, indent === 0 ? 2 : indent), error: '' };
  }
  const result = formatJson(input, indent, params.sortKeys === true);
  if (!result.ok) return { output: '', error: jsonErrorMessage(input) };
  return {
    output: result.value,
    error: '',
    ...(result.warning ? { warning: result.warning } : {}),
  };
}

export const ALL_SPECS: Record<string, Spec> = {
  'json-formatter': {
    id: 'json-formatter',
    title: 'JSON',
    description: 'Format and inspect structured data',
    icon: IconBraces,
    sampleInput: '',
    defaultMode: 'format',
    actions: [
      { mode: 'format', label: 'Format' },
      { mode: 'minify', label: 'Minify' },
      { mode: 'query', label: 'Query' },
    ],
    options: [
      {
        key: 'indent',
        label: 'Indent:',
        type: 'select',
        inline: true,
        choices: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'tab', label: 'Tab' },
        ],
      },
      { key: 'sortKeys', label: 'Sort object keys', type: 'checkbox' },
      {
        key: 'path',
        label: 'Path:',
        type: 'text',
        inline: true,
        placeholder: '$.orders[*].id',
      },
    ],
    defaults: { indent: '2', sortKeys: false, path: '$' },
    run: jsonRun,
    resultLabel: 'Valid JSON',
    fileExt: 'json',
    language: 'json',
    note: 'Query accepts .key, [0], [*], slices, and ..key recursion. One match prints the value; several print an array.',
  },
  'base64-encoder': {
    id: 'base64-encoder',
    title: 'Base64',
    description: 'Encode or decode text',
    icon: IconFileCode,
    sampleInput: '',
    defaultMode: 'encode',
    actions: [
      { mode: 'encode', label: 'Encode' },
      { mode: 'decode', label: 'Decode' },
    ],
    options: [{ key: 'urlSafe', label: 'URL-safe alphabet', type: 'checkbox' }],
    defaults: { urlSafe: false },
    run(input, params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = base64Transform(input, mode, params.urlSafe === true);
      if (!result.ok)
        return {
          output: '',
          error:
            mode === 'decode'
              ? 'Enter valid Base64 text. Padding is optional; URL-safe characters are accepted.'
              : 'Could not encode this input as Base64.',
        };
      return { output: result.value, error: '' };
    },
    fileExt: 'txt',
  },
  'base32-encoder': {
    id: 'base32-encoder',
    title: 'Base32',
    description: 'Encode or decode Base32 text',
    icon: IconFileDigit,
    sampleInput: '',
    defaultMode: 'encode',
    actions: [
      { mode: 'encode', label: 'Encode' },
      { mode: 'decode', label: 'Decode' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = base32Transform(input, mode);
      if (!result.ok)
        return {
          output: '',
          error:
            mode === 'decode'
              ? 'Enter valid Base32 text (A–Z and 2–7). Case and padding are optional.'
              : 'Could not encode this input as Base32.',
        };
      return { output: result.value, error: '' };
    },
    fileExt: 'txt',
  },
  'hex-encoder': {
    id: 'hex-encoder',
    title: 'Hex',
    description: 'Hex and Unicode escape conversion',
    icon: IconBinary,
    sampleInput: 'Hello, 世界 👋',
    defaultMode: 'to-hex',
    actions: [
      { mode: 'to-hex', label: 'Text to hex' },
      { mode: 'from-hex', label: 'Hex to text' },
      { mode: 'unicode-escape', label: 'Escape Unicode' },
      { mode: 'unicode-unescape', label: 'Unescape' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result =
        mode === 'unicode-escape'
          ? unicodeTransform(input, 'escape')
          : mode === 'unicode-unescape'
            ? unicodeTransform(input, 'unescape')
            : hexTransform(input, mode === 'from-hex' ? 'from-hex' : 'to-hex');
      if (!result.ok)
        return {
          output: '',
          error:
            mode === 'from-hex'
              ? 'Enter an even number of hex digits (spaces, 0x, and separators are fine).'
              : 'Could not process this input.',
        };
      return {
        output: result.value,
        error: '',
        ...(result.warning ? { warning: result.warning } : {}),
      };
    },
    fileExt: 'txt',
  },
  'timestamp-converter': {
    id: 'timestamp-converter',
    title: 'Timestamp',
    description: 'Convert Unix timestamps and dates',
    icon: IconClock,
    sampleInput: '1790942400',
    defaultMode: 'format',
    actions: [{ mode: 'format', label: 'Convert' }],
    options: [
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        inline: true,
        choices: [
          { value: 'auto', label: 'Auto (10-digit s / 13-digit ms)' },
          { value: 'seconds', label: 'Seconds' },
          { value: 'milliseconds', label: 'Milliseconds' },
        ],
      },
      {
        key: 'zone',
        label: 'Zone',
        type: 'select',
        inline: true,
        choices: [
          { value: 'utc', label: 'UTC' },
          { value: 'local', label: 'Local' },
        ],
      },
    ],
    defaults: { unit: 'auto', zone: 'utc' },
    run(input, params, _mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = convertTimestamp(
        input,
        String(params.unit ?? 'auto'),
        String(params.zone ?? 'utc'),
      );
      if (!result.ok)
        return {
          output: '',
          error: 'Enter a Unix timestamp or an ISO date, such as 2026-10-02T12:00:00Z.',
        };
      return { output: result.value, error: '' };
    },
    fileExt: 'txt',
  },
  'url-encoder': {
    id: 'url-encoder',
    title: 'URL',
    description: 'Encode and decode URL components',
    icon: IconLink,
    sampleInput: '',
    defaultMode: 'decode',
    actions: [
      { mode: 'encode', label: 'Encode' },
      { mode: 'decode', label: 'Decode' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = urlTransform(input, mode);
      if (!result.ok)
        return { output: '', error: 'Enter valid percent-encoded text, such as hello%20world.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'txt',
  },
  'yaml-formatter': {
    id: 'yaml-formatter',
    title: 'YAML',
    description: 'Format YAML and convert to JSON',
    icon: IconFileText,
    sampleInput: YAML_SAMPLE,
    defaultMode: 'format',
    actions: [
      { mode: 'format', label: 'Format' },
      { mode: 'to-json', label: 'YAML to JSON' },
      { mode: 'from-json', label: 'JSON to YAML' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = yamlTransform(input, mode);
      if (!result.ok) return { output: '', error: 'Enter valid YAML or JSON input.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'yaml',
    language: { format: 'yaml', 'to-json': 'yaml', 'from-json': 'json' },
    // Formatting stays YAML; only the JSON conversion changes the result.
    resultLanguage: { format: 'yaml', 'to-json': 'json', 'from-json': 'yaml' },
  },
  'csv-to-json': {
    id: 'csv-to-json',
    title: 'CSV ↔ JSON',
    description: 'Convert between CSV and JSON',
    icon: IconTable,
    sampleInput: CSV_SAMPLE,
    defaultMode: 'convert',
    actions: [
      { mode: 'convert', label: 'CSV to JSON' },
      { mode: 'to-csv', label: 'JSON to CSV' },
    ],
    options: [
      {
        key: 'delimiter',
        label: 'Delimiter:',
        type: 'select',
        inline: true,
        choices: [
          { value: 'auto', label: 'Auto-detect' },
          { value: 'comma', label: 'Comma' },
          { value: 'tab', label: 'Tab' },
          { value: 'semicolon', label: 'Semicolon' },
        ],
      },
      { key: 'header', label: 'First row is a header', type: 'checkbox' },
    ],
    defaults: { delimiter: 'auto', header: true },
    run: async (input, params, mode) => {
      const empty = emptyOk(input);
      if (empty) return empty;
      const toCsv = mode === 'to-csv';
      const result = await DEFINITIONS['csv-to-json'].transform(input, {
        header: params.header !== false,
        mode: toCsv ? 'to-csv' : 'from-csv',
        delimiter: String(params.delimiter ?? 'auto'),
      });
      if (!result.ok)
        return {
          output: '',
          error: toCsv
            ? 'Enter a JSON array of flat objects.'
            : 'Enter valid CSV with a header row.',
        };
      return { output: result.value, error: '' };
    },
    fileExt: 'json',
    language: { convert: 'text', 'to-csv': 'json' },
    resultLanguage: { convert: 'json', 'to-csv': 'text' },
  },
  'json-to-typescript': {
    id: 'json-to-typescript',
    title: 'JSON to TypeScript',
    description: 'Generate interfaces from JSON',
    icon: IconBrandTypescript,
    sampleInput: TYPES_SAMPLE,
    defaultMode: 'interface',
    actions: [
      { mode: 'interface', label: 'Interfaces' },
      { mode: 'type', label: 'Type aliases' },
    ],
    options: [
      { key: 'rootName', label: 'Root name:', type: 'text', inline: true, placeholder: 'Root' },
    ],
    defaults: { rootName: 'Root' },
    run(input, params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = jsonToTypeScript(input, {
        rootName: String(params.rootName ?? 'Root'),
        mode: mode === 'type' ? 'type' : 'interface',
      });
      if (!result.ok) return { output: '', error: jsonErrorMessage(input) };
      return { output: result.value, error: '' };
    },
    fileExt: 'ts',
    language: 'json',
    resultLanguage: 'typescript',
    note: 'Keys missing from some array elements become optional; nested objects become separate declarations.',
  },
  'sql-formatter': {
    id: 'sql-formatter',
    title: 'SQL',
    description: 'Format SQL statements',
    icon: IconDatabase,
    sampleInput: SQL_SAMPLE,
    defaultMode: 'format',
    actions: [
      { mode: 'format', label: 'Format' },
      { mode: 'minify', label: 'Minify' },
      { mode: 'uppercase', label: 'Uppercase' },
    ],
    options: [
      {
        key: 'dialect',
        label: 'Dialect:',
        type: 'select',
        inline: true,
        choices: SQL_DIALECTS.map((dialect) => ({ value: dialect.value, label: dialect.label })),
      },
    ],
    defaults: { dialect: 'sql' },
    run(input, params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = sqlTransform(input, mode, String(params.dialect ?? 'sql'));
      if (!result.ok) return { output: '', error: 'Check the statement for syntax errors.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'sql',
    language: 'sql',
    note: 'Tokenized by sql-formatter, so quoted literals and identifiers are preserved exactly.',
  },
  'css-formatter': {
    id: 'css-formatter',
    title: 'CSS',
    description: 'Format and minify CSS',
    icon: IconCode,
    sampleInput: CSS_SAMPLE,
    defaultMode: 'format',
    actions: [
      { mode: 'format', label: 'Format' },
      { mode: 'minify', label: 'Minify' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = cssTransform(input, mode);
      if (!result.ok) return { output: '', error: 'Invalid CSS input.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'css',
    language: 'css',
  },
  'graphql-formatter': {
    id: 'graphql-formatter',
    title: 'GraphQL',
    description: 'Format GraphQL queries',
    icon: IconBrush,
    sampleInput: GRAPHQL_SAMPLE,
    defaultMode: 'format',
    actions: [
      { mode: 'format', label: 'Format' },
      { mode: 'minify', label: 'Minify' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = graphqlTransform(input, mode);
      if (!result.ok) return { output: '', error: 'Invalid GraphQL input.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'graphql',
    language: 'graphql',
  },
  'js-json-minifier': {
    id: 'js-json-minifier',
    title: 'JS Minifier',
    description: 'Minify JavaScript code',
    icon: IconBrandJavascript,
    sampleInput: JS_SAMPLE,
    defaultMode: 'minify',
    actions: [{ mode: 'minify', label: 'Minify' }],
    run: async (input) => {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = await jsMinifyTransform(input);
      if (!result.ok) return { output: '', error: 'Invalid JavaScript input.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'js',
    language: 'javascript',
    note: 'Minifies JavaScript; it does not process JSON.',
  },
  'html-escape': {
    id: 'html-escape',
    title: 'HTML Escape',
    description: 'Escape and unescape HTML entities',
    icon: IconHtml,
    sampleInput: HTML_SAMPLE,
    defaultMode: 'escape',
    actions: [
      { mode: 'escape', label: 'Escape' },
      { mode: 'unescape', label: 'Unescape' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = htmlTransform(input, mode);
      return result.ok
        ? { output: result.value, error: '' }
        : { output: '', error: 'Could not process.' };
    },
    fileExt: 'html',
    language: 'html',
  },
  'strip-whitespace': {
    id: 'strip-whitespace',
    title: 'Strip Whitespace',
    description: 'Clean up whitespace in text',
    icon: IconEraser,
    sampleInput: '  hello   world  \n\n  goodbye  ',
    defaultMode: 'normalize',
    actions: [
      { mode: 'normalize', label: 'Normalize' },
      { mode: 'strip-leading', label: 'Leading' },
      { mode: 'strip-trailing', label: 'Trailing' },
      { mode: 'strip-both', label: 'Both ends' },
      { mode: 'strip-all', label: 'Collapse all' },
      { mode: 'remove-empty', label: 'Empty lines' },
    ],
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      return { output: normalizeText(input, mode), error: '' };
    },
    fileExt: 'txt',
  },
};

/** Decode-then-format example recipe, executed through the canonical contracts. */
export function runExamplePipeline(input: string): { output: string; error: string } {
  const decoded = base64Transform(input, 'decode', false);
  if (!decoded.ok) return { output: '', error: 'Example input must be Base64-encoded JSON.' };
  const formatted = formatJson(decoded.value, 2, false);
  if (!formatted.ok) return { output: '', error: jsonErrorMessage(decoded.value) };
  return { output: formatted.value, error: '' };
}

export function getSpec(id: string): Spec | undefined {
  return ALL_SPECS[id];
}

/**
 * Map a workbench spec's mode + params onto its canonical contract, so large
 * inputs can run off the main thread through `executeTool`. Modes without a
 * contract entry (JSON Query) and tools without a definition return null and
 * stay on `spec.run`.
 */
export function specContractRoute(
  spec: Spec,
  params: Record<string, string | boolean>,
  mode: string,
): { id: string; options: Record<string, JsonValue> } | null {
  if (!DEFINITIONS[spec.id]) return null;
  switch (spec.id) {
    case 'json-formatter':
      if (mode === 'query') return null;
      return {
        id: spec.id,
        options: {
          indent:
            mode === 'minify' ? 0 : params.indent === 'tab' ? 'tab' : Number(params.indent ?? 2),
          sortKeys: params.sortKeys === true,
        },
      };
    case 'base64-encoder':
      return { id: spec.id, options: { mode, urlSafe: params.urlSafe === true } };
    case 'base32-encoder':
      return { id: spec.id, options: { mode } };
    case 'hex-encoder':
      return { id: spec.id, options: { mode } };
    case 'timestamp-converter':
      return {
        id: spec.id,
        options: { unit: String(params.unit ?? 'auto'), zone: String(params.zone ?? 'utc') },
      };
    case 'url-encoder':
      return { id: spec.id, options: { mode } };
    case 'yaml-formatter':
      return { id: spec.id, options: { mode } };
    case 'csv-to-json':
      return {
        id: spec.id,
        options: {
          mode: mode === 'to-csv' ? 'to-csv' : 'from-csv',
          header: params.header !== false,
          delimiter: String(params.delimiter ?? 'auto'),
        },
      };
    case 'json-to-typescript':
      return {
        id: spec.id,
        options: {
          rootName: String(params.rootName ?? 'Root'),
          mode: mode === 'type' ? 'type' : 'interface',
        },
      };
    case 'sql-formatter':
      return { id: spec.id, options: { mode, dialect: String(params.dialect ?? 'sql') } };
    case 'css-formatter':
    case 'graphql-formatter':
      return { id: spec.id, options: { mode } };
    case 'js-json-minifier':
      return { id: spec.id, options: { mode: 'minify' } };
    case 'html-escape':
      return { id: spec.id, options: { mode } };
    case 'strip-whitespace':
      return { id: spec.id, options: { action: mode } };
    default:
      return null;
  }
}

/**
 * Primary single-text field per custom screen, so landing smart-paste and
 * external entry points can seed the document that ToolRoute opens.
 * Tools without a text input (generators, builders, file tools) map to null.
 */
const SMART_PASTE_FIELDS: Record<string, string> = {
  'hash-generator': 'input',
  'case-converter': 'input',
  'word-counter': 'text',
  'jwt-decoder': 'input',
  'uuid-generator': 'inspectInput',
  'cron-parser': 'input',
  'crontab-generator': 'input',
  'diff-tool': 'original',
  'regex-tester': 'testString',
  'json-validator': 'jsonData',
  'xml-formatter': 'input',
  'markdown-previewer': 'markdown',
  'git-diff-viewer': 'input',
  'protobuf-decoder': 'input',
  'totp-generator': 'secret',
  'certificate-decoder': 'input',
  'qr-code-generator': 'text',
  'websocket-tester': 'url',
  'http-status-codes': 'query',
  'nginx-config-validator': 'input',
  notes: 'text',
};

/** Payload patch carrying smart-pasted text into the tool's primary field. */
export function smartPastePayload(
  toolId: string,
  text: string,
): Record<string, string | boolean> | null {
  if (!text.trim()) return null;
  if (toolId === 'api-request-builder')
    return /^https?:\/\/\S+$/i.test(text.trim()) ? { url: text } : { body: text };
  const field = SMART_PASTE_FIELDS[toolId];
  return field ? { [field]: text } : null;
}

/** Pending Smart paste, read without consuming it. */
export function peekSmartPaste(): string | null {
  try {
    const pasted = sessionStorage.getItem('toolbit:smart-paste');
    return pasted?.trim() ? pasted : null;
  } catch {
    return null;
  }
}

/** Drop a pending Smart paste once it has been applied. */
export function clearSmartPaste(): void {
  try {
    sessionStorage.removeItem('toolbit:smart-paste');
  } catch {
    /* session storage unavailable: nothing to clear */
  }
}

/** Pending Smart paste, consumed once so it never leaks into later docs. */
export function takeSmartPaste(): string | null {
  const pasted = peekSmartPaste();
  clearSmartPaste();
  return pasted;
}

export const WORKBENCH_TOOL_IDS: string[] = Object.keys(ALL_SPECS);

export type WorkbenchToolId = string;

export function isWorkbenchToolId(id: string): boolean {
  return id in ALL_SPECS;
}

/**
 * Custom screens that own a workspace document. Most bespoke screens keep their
 * state in component state and drop it on navigation; these open a Tab, so the
 * work survives moving between tools. It is still session-only — the persist
 * layer strips payloads — so the content is gone on refresh.
 */
export const DOCUMENT_BACKED_SCREENS = new Set<string>(['notes']);

/**
 * True when a tool owns a document: every workbench tool, plus the custom
 * screens that opt in above. Gate document creation on this rather than on
 * `isWorkbenchToolId`, so a document-backed screen gets a Tab in every entry
 * point a workbench tool does.
 */
export function ownsDocument(id: string): boolean {
  return isWorkbenchToolId(id) || DOCUMENT_BACKED_SCREENS.has(id);
}

export function specTitle(id: string, fallback: string): string {
  return ALL_SPECS[id]?.title ?? fallback;
}

export function specIcon(id: string): Spec['icon'] | undefined {
  return ALL_SPECS[id]?.icon;
}

export function workbenchSpecIds(): string[] {
  return WORKBENCH_TOOL_IDS;
}

export function specParams(doc: WorkbenchDocState, spec: Spec): Record<string, string | boolean> {
  return { ...spec.defaults, ...doc.params };
}

/**
 * What each pane of a tool holds, so the editor can highlight the matching
 * grammar. A converter names the modes whose result differs from its input;
 * every other mode reuses the input language.
 */
export function specLanguages(
  doc: WorkbenchDocState,
  spec: Spec,
): { input: EditorLanguage; result: EditorLanguage } {
  const rawInput = spec.language;
  const input: EditorLanguage =
    typeof rawInput === 'string'
      ? rawInput
      : (rawInput?.[doc.mode] ?? rawInput?.[spec.defaultMode] ?? 'text');
  const result = spec.resultLanguage;
  if (typeof result === 'string') return { input, result };
  return { input, result: result?.[doc.mode] ?? input };
}

export function defaultDocState(toolId: string, input?: string): WorkbenchDocState {
  const spec = ALL_SPECS[toolId];
  const sample = spec?.sampleInput ?? '';
  const resolved = input ?? sample;
  const base = {
    indent: '2',
    sortKeys: false,
    urlSafe: false,
    unit: 'auto',
    zone: 'utc',
    params: {} as Record<string, string | boolean>,
    error: '',
    warning: '',
  };
  if (toolId === 'json-formatter' && input === undefined) {
    const formatted = formatJson(INVOICE_SAMPLE, 2, false);
    return {
      ...base,
      input: INVOICE_SAMPLE,
      output: formatted.ok ? formatted.value : '',
      mode: 'format',
      dirty: false,
      label: spec?.title ?? toolId,
    };
  }
  return {
    ...base,
    input: resolved,
    output: '',
    mode: spec?.defaultMode ?? 'format',
    dirty: input !== undefined || resolved !== '',
    label: spec?.title ?? toolId,
  };
}

export function readDoc(tab: {
  toolId: string;
  payload?: Record<string, unknown>;
}): WorkbenchDocState {
  const payload = (tab.payload ?? {}) as Partial<WorkbenchDocState>;
  return { ...defaultDocState(tab.toolId), ...payload, label: (payload.label as string) || '' };
}

/** Merge a patch into the document payload stored in the workspace store. */
export function patchWorkbenchDoc(id: string, patch: Partial<WorkbenchDocState>): void {
  const { tabs, patchDocument } = useWorkspace.getState();
  const tab = tabs.find((t) => t.id === id);
  if (!tab) return;
  patchDocument(id, { payload: { ...readDoc(tab), ...patch } });
}
