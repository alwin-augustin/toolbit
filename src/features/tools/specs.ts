import {
  IconBraces,
  IconBrush,
  IconBrandJavascript,
  IconClock,
  IconCode,
  IconDatabase,
  IconEraser,
  IconFileCode,
  IconFileText,
  IconHtml,
  IconLink,
  IconTable,
} from '@tabler/icons-react';
import {
  DEFINITIONS,
  base64Transform,
  convertTimestamp,
  cssTransform,
  formatJson,
  graphqlTransform,
  htmlTransform,
  jsMinifyTransform,
  normalizeText,
  sqlTransform,
  urlTransform,
  yamlTransform,
} from '@/core/tool-contract';
import {
  jsonErrorMessage,
  INVOICE_SAMPLE,
  type WorkbenchDocState,
  type WorkbenchToolSpec as Spec,
} from '@/shared/workbench';
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

function jsonRun(
  input: string,
  params: Record<string, string | boolean>,
  mode: string,
): { output: string; error: string } {
  const empty = emptyOk(input);
  if (empty) return empty;
  const indent =
    mode === 'minify' ? 0 : params.indent === 'tab' ? '\t' : Number(params.indent ?? 2);
  const result = formatJson(input, indent, params.sortKeys === true);
  if (!result.ok) return { output: '', error: jsonErrorMessage(input) };
  return { output: result.value, error: '' };
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
    ],
    defaults: { indent: '2', sortKeys: false },
    run: jsonRun,
    resultLabel: 'Valid JSON',
    fileExt: 'json',
    language: 'json',
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
        label: 'Unit:',
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
        label: 'Zone:',
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
  },
  'csv-to-json': {
    id: 'csv-to-json',
    title: 'CSV to JSON',
    description: 'Convert CSV data to JSON',
    icon: IconTable,
    sampleInput: CSV_SAMPLE,
    defaultMode: 'convert',
    actions: [{ mode: 'convert', label: 'Convert' }],
    run: async (input) => {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = await DEFINITIONS['csv-to-json'].transform(input, { header: true });
      if (!result.ok) return { output: '', error: 'Enter valid CSV with a header row.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'json',
    language: 'json',
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
    run(input, _params, mode) {
      const empty = emptyOk(input);
      if (empty) return empty;
      const result = sqlTransform(input, mode);
      if (!result.ok) return { output: '', error: 'Add some input to continue.' };
      return { output: result.value, error: '' };
    },
    fileExt: 'sql',
    note: 'Heuristic formatting; verify quoted literals in the output before running statements.',
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

/** Pending landing-demo paste, consumed once so it never leaks into later docs. */
export function takeSmartPaste(): string | null {
  try {
    const pasted = sessionStorage.getItem('toolbit:smart-paste');
    sessionStorage.removeItem('toolbit:smart-paste');
    return pasted?.trim() ? pasted : null;
  } catch {
    return null;
  }
}

export const WORKBENCH_TOOL_IDS: string[] = Object.keys(ALL_SPECS);

export type WorkbenchToolId = string;

export function isWorkbenchToolId(id: string): boolean {
  return id in ALL_SPECS;
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
