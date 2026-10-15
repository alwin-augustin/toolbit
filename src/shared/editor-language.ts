import type { Extension } from '@codemirror/state';

/**
 * Every grammar a workbench editor can highlight.
 *
 * A language id names the data a tool handles, not a file extension: the tool
 * declares which language it speaks, and the editor loads the matching scheme.
 * `text` is the deliberate no-grammar default — passing plain text off as JSON
 * reads worse than leaving it uncoloured, so nothing is guessed.
 */
export type EditorLanguage =
  | 'text'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'graphql'
  | 'markdown'
  | 'shell'
  | 'nginx'
  | 'diff';

/** Language name for the status bar, so the pane says what it is highlighting. */
export const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  text: 'Plain text',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  sql: 'SQL',
  graphql: 'GraphQL',
  markdown: 'Markdown',
  shell: 'Shell',
  nginx: 'Nginx',
  diff: 'Diff',
};

export function languageLabel(language: EditorLanguage): string {
  return LANGUAGE_LABELS[language] ?? LANGUAGE_LABELS.text;
}

/** Narrows untrusted values (saved documents, deep links) to a known language. */
export function isEditorLanguage(value: unknown): value is EditorLanguage {
  return typeof value === 'string' && Object.hasOwn(LANGUAGE_LABELS, value);
}

/**
 * GraphQL tokenizer.
 *
 * GraphQL has no published CodeMirror 6 grammar short of the full language
 * service, which drags in completion and linting a formatter view never uses.
 * A stream tokenizer over comments, strings, keywords and punctuation is
 * enough colour to read a query, and it costs one small module.
 */
const graphqlMode = () =>
  import('@codemirror/legacy-modes/mode/simple-mode').then(({ simpleMode }) =>
    simpleMode({
      start: [
        { regex: /#.*/, token: 'comment' },
        // Block strings first: they also start with a quote.
        { regex: /"""(?:[^"]|"(?!""))*"""/, token: 'string' },
        { regex: /"(?:[^"\\]|\\.)*"/, token: 'string' },
        { regex: /\$[A-Za-z_][A-Za-z0-9_]*/, token: 'variable' },
        {
          regex:
            /\b(?:query|mutation|subscription|fragment|on|type|interface|union|enum|input|scalar|schema|directive|extend|implements|repeatable)\b/,
          token: 'keyword',
        },
        { regex: /\b(?:true|false|null)\b/, token: 'atom' },
        { regex: /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/, token: 'number' },
        { regex: /[A-Za-z_][A-Za-z0-9_]*/, token: 'property' },
        { regex: /[{}()[\]:!@=|&,.]+/, token: 'punctuation' },
      ],
    }),
  );

/**
 * Colour a document with a CodeMirror 5-era stream parser.
 *
 * `@codemirror/legacy-modes` types its parsers against `@codemirror/streamparser`,
 * which declares its own copy of `StringStream`. The two classes are identical
 * but nominal — private members stop TypeScript unifying them — so the parser
 * crosses here as `unknown` before it is handed to the stream API it satisfies
 * at runtime. The alternative is declaring the upstream packages' types by hand.
 */
async function streamSupport(mode: Promise<unknown>): Promise<Extension[]> {
  const [parser, { StreamLanguage }] = await Promise.all([mode, import('@codemirror/language')]);
  return [StreamLanguage.define(parser as Parameters<typeof StreamLanguage.define>[0])];
}

type LanguageLoader = () => Promise<Extension[]>;

/**
 * One loader per language, each importing a static specifier so the bundler
 * splits every grammar into its own chunk. `diff` needs none: its colouring is
 * line decoration the editor owns.
 */
const LOADERS: Record<EditorLanguage, LanguageLoader> = {
  text: async () => [],
  diff: async () => [],
  json: async () => {
    const { json } = await import('@codemirror/lang-json');
    return [json()];
  },
  yaml: async () => {
    const { yaml } = await import('@codemirror/lang-yaml');
    return [yaml()];
  },
  xml: async () => {
    const { xml } = await import('@codemirror/lang-xml');
    return [xml()];
  },
  html: async () => {
    const { html } = await import('@codemirror/lang-html');
    return [html()];
  },
  css: async () => {
    const { css } = await import('@codemirror/lang-css');
    return [css()];
  },
  javascript: async () => {
    const { javascript } = await import('@codemirror/lang-javascript');
    return [javascript()];
  },
  typescript: async () => {
    const { javascript } = await import('@codemirror/lang-javascript');
    return [javascript({ typescript: true })];
  },
  sql: async () => {
    const { sql } = await import('@codemirror/lang-sql');
    return [sql()];
  },
  markdown: async () => {
    const { markdown } = await import('@codemirror/lang-markdown');
    return [markdown()];
  },
  graphql: () => streamSupport(graphqlMode()),
  shell: () =>
    streamSupport(import('@codemirror/legacy-modes/mode/shell').then(({ shell }) => shell)),
  nginx: () =>
    streamSupport(import('@codemirror/legacy-modes/mode/nginx').then(({ nginx }) => nginx)),
};

/** One in-flight load per language, so panes sharing a grammar share the work. */
const pending = new Map<EditorLanguage, Promise<Extension[]>>();

/**
 * Extensions that highlight `language`, loaded on demand.
 *
 * A grammar that fails to load degrades to uncoloured text rather than taking
 * the pane down: on a machine that never reached the chunk, an editor you can
 * still type in beats an empty panel.
 */
export function loadLanguageSupport(language: EditorLanguage): Promise<Extension[]> {
  const cached = pending.get(language);
  if (cached) return cached;
  const loading = (LOADERS[language] ?? LOADERS.text)().catch(() => []);
  pending.set(language, loading);
  return loading;
}
