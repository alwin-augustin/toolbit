/**
 * Tool capability model.
 *
 * `tools.config.ts` says what a tool *is*; this file says what a user *means*
 * when they need it. Every tool gets natural-language intents, the data types
 * it consumes, the operations it performs, and ordered handoff edges to tools
 * that usefully follow it.
 *
 * This is content, not code: edit it when a tool gains capabilities or when
 * real queries reveal phrasing nobody thought of. `validateCapabilities()`
 * (surfaced through `validateToolRegistry()`) and `tests/tool-capabilities.test.ts`
 * keep it honest — every tool must have a record, and every id referenced by
 * `related` or a task cluster must exist.
 *
 * See `docs/intent-discovery.md` for how the graph consumes this data.
 */

/** Data families a tool consumes. Closed vocabulary — extend here, not inline. */
export const TOOL_DATA_TYPES = [
  'json',
  'yaml',
  'xml',
  'csv',
  'sql',
  'graphql',
  'css',
  'html',
  'markdown',
  'javascript',
  'text',
  'jwt',
  'certificate',
  'protobuf',
  'base64',
  'url',
  'diff',
  'regex',
  'cron',
  'timestamp',
  'uuid',
  'color',
  'hash',
  'password',
  'otp',
  'image',
  'pdf',
  'http',
  'websocket',
  'docker',
  'nginx',
] as const;

export type ToolDataType = (typeof TOOL_DATA_TYPES)[number];

/** Verbs a tool performs. Closed vocabulary — extend here, not inline. */
export const TOOL_OPERATIONS = [
  'format',
  'minify',
  'validate',
  'convert',
  'encode',
  'decode',
  'escape',
  'hash',
  'clean',
  'inspect',
  'compare',
  'count',
  'test',
  'preview',
  'parse',
  'calculate',
  'generate',
  'build',
  'send',
  'query',
  'merge',
  'split',
  'rotate',
  'reference',
] as const;

export type ToolOperation = (typeof TOOL_OPERATIONS)[number];

export interface ToolCapability {
  /** Natural phrasings a user might type when they need this tool. */
  readonly intents: readonly string[];
  /** Data families the tool consumes. May be empty for pure generators. */
  readonly inputTypes: readonly ToolDataType[];
  /** What the tool does, in the closed vocabulary. At least one. */
  readonly operations: readonly ToolOperation[];
  /**
   * Ordered handoff edges: tools that usefully follow this one. Sparse on
   * purpose — an empty list is honest where no sensible next step exists.
   */
  readonly related: readonly string[];
}

export const CAPABILITIES: Record<string, ToolCapability> = {
  // JSON & Data
  'json-formatter': {
    intents: [
      'make json readable',
      'pretty print json',
      'format json',
      'clean up an api response',
      'fix json indentation',
      'minify json',
    ],
    inputTypes: ['json'],
    operations: ['format', 'minify', 'validate'],
    related: ['json-validator', 'diff-tool', 'yaml-formatter', 'js-json-minifier'],
  },
  'json-validator': {
    intents: [
      'validate json against a schema',
      'check a json schema',
      'why is my json invalid',
      'verify an api response shape',
      'json schema validation',
    ],
    inputTypes: ['json'],
    operations: ['validate'],
    related: ['json-formatter', 'diff-tool'],
  },
  // CSV & Tables
  'csv-to-json': {
    intents: [
      'convert csv to json',
      'turn a spreadsheet into json',
      'csv to json converter',
      'parse csv data',
    ],
    inputTypes: ['csv'],
    operations: ['convert'],
    related: ['json-formatter', 'json-validator', 'fake-data-generator'],
  },
  // Encode & Decode
  'base64-encoder': {
    intents: [
      'encode text to base64',
      'decode base64',
      'what does this base64 string say',
      'base64 converter',
    ],
    inputTypes: ['base64'],
    operations: ['encode', 'decode'],
    related: ['json-formatter', 'jwt-decoder'],
  },
  'url-encoder': {
    intents: [
      'encode a url',
      'decode a url',
      'url encode text',
      'percent encoding',
      'encode query parameters',
    ],
    inputTypes: ['url'],
    operations: ['encode', 'decode'],
    related: ['api-request-builder'],
  },
  'html-escape': {
    intents: [
      'escape html entities',
      'unescape html',
      'show html as plain text',
      'html entity converter',
    ],
    inputTypes: ['html'],
    operations: ['escape'],
    related: [],
  },
  'protobuf-decoder': {
    intents: [
      'decode protobuf',
      'read a binary grpc payload',
      'protobuf wire format decoder',
      'inspect protocol buffer data',
    ],
    inputTypes: ['protobuf'],
    operations: ['decode', 'inspect'],
    related: ['json-formatter'],
  },
  'jwt-decoder': {
    intents: [
      'decode a jwt',
      'inspect a token',
      'why is my token expired',
      'check jwt claims',
      'read a jwt payload',
      'debug an authentication token',
    ],
    inputTypes: ['jwt'],
    operations: ['decode', 'inspect', 'validate'],
    related: ['timestamp-converter', 'json-formatter'],
  },
  'certificate-decoder': {
    intents: [
      'decode a certificate',
      'inspect an ssl certificate',
      'check when a certificate expires',
      'read a pem file',
      'x509 certificate viewer',
    ],
    inputTypes: ['certificate'],
    operations: ['decode', 'inspect'],
    related: ['timestamp-converter'],
  },
  // Convert
  'case-converter': {
    intents: [
      'convert camel case to snake case',
      'change text case',
      'make text title case',
      'case converter',
    ],
    inputTypes: ['text'],
    operations: ['convert'],
    related: [],
  },
  'timestamp-converter': {
    intents: [
      'convert a unix timestamp to a date',
      'what time is this timestamp',
      'epoch to human readable date',
      'convert a date to a timestamp',
    ],
    inputTypes: ['timestamp'],
    operations: ['convert'],
    related: ['date-calculator'],
  },
  'color-converter': {
    intents: ['convert hex to rgb', 'color code converter', 'hsl to hex', 'look up color values'],
    inputTypes: ['color'],
    operations: ['convert'],
    related: [],
  },
  'js-json-minifier': {
    intents: ['minify javascript', 'compress js code', 'javascript minifier', 'minify json'],
    inputTypes: ['javascript', 'json'],
    operations: ['minify'],
    related: ['json-formatter'],
  },
  'image-converter': {
    intents: [
      'convert png to jpeg',
      'resize an image',
      'compress an image',
      'webp converter',
      'optimize images',
    ],
    inputTypes: ['image'],
    operations: ['convert'],
    related: [],
  },
  // SQL & Code
  'sql-formatter': {
    intents: [
      'format a sql query',
      'make sql readable',
      'beautify sql',
      'minify sql',
      'uppercase sql keywords',
    ],
    inputTypes: ['sql'],
    operations: ['format', 'minify'],
    related: ['diff-tool'],
  },
  'graphql-formatter': {
    intents: [
      'format a graphql query',
      'validate a graphql schema',
      'prettify gql',
      'minify graphql',
    ],
    inputTypes: ['graphql'],
    operations: ['format', 'minify', 'validate'],
    related: [],
  },
  'css-formatter': {
    intents: ['format css', 'minify css', 'beautify a stylesheet', 'prettify styles'],
    inputTypes: ['css'],
    operations: ['format', 'minify'],
    related: [],
  },
  // YAML & Config
  'yaml-formatter': {
    intents: [
      'format yaml',
      'convert yaml to json',
      'convert json to yaml',
      'fix yaml indentation',
      'validate yaml',
    ],
    inputTypes: ['yaml', 'json'],
    operations: ['format', 'convert'],
    related: ['json-formatter'],
  },
  'xml-formatter': {
    intents: [
      'format xml',
      'pretty print xml',
      'convert xml to json',
      'minify xml',
      'query xml with xpath',
    ],
    inputTypes: ['xml', 'json'],
    operations: ['format', 'minify', 'convert', 'query'],
    related: ['json-formatter'],
  },
  'nginx-config-validator': {
    intents: [
      'validate an nginx config',
      'check nginx configuration',
      'format nginx conf',
      'debug an nginx server block',
    ],
    inputTypes: ['nginx'],
    operations: ['validate', 'format', 'inspect'],
    related: [],
  },
  // Text
  'word-counter': {
    intents: ['count words', 'count characters', 'count sentences', 'text statistics'],
    inputTypes: ['text'],
    operations: ['count', 'inspect'],
    related: [],
  },
  'strip-whitespace': {
    intents: [
      'remove extra whitespace',
      'trim whitespace from text',
      'clean up spacing',
      'remove line breaks',
    ],
    inputTypes: ['text'],
    operations: ['clean'],
    related: [],
  },
  'diff-tool': {
    intents: [
      'compare two texts',
      'diff two strings',
      'find differences between documents',
      'text comparison',
    ],
    inputTypes: ['text', 'diff'],
    operations: ['compare'],
    related: [],
  },
  'git-diff-viewer': {
    intents: [
      'view a git diff',
      'read a patch file',
      'see changes in a commit',
      'inspect a git patch',
    ],
    inputTypes: ['diff'],
    operations: ['inspect'],
    related: [],
  },
  'regex-tester': {
    intents: [
      'test a regex',
      'debug a regular expression',
      'regex match checker',
      'try regex patterns',
    ],
    inputTypes: ['regex', 'text'],
    operations: ['test'],
    related: [],
  },
  'markdown-previewer': {
    intents: ['preview markdown', 'render a readme', 'see markdown as html', 'markdown viewer'],
    inputTypes: ['markdown'],
    operations: ['preview'],
    related: [],
  },
  'lorem-ipsum-generator': {
    intents: [
      'generate placeholder text',
      'lorem ipsum text',
      'dummy text for a design',
      'filler copy',
    ],
    inputTypes: [],
    operations: ['generate'],
    related: [],
  },
  'pdf-tools': {
    intents: [
      'merge pdf files',
      'split a pdf',
      'rotate pdf pages',
      'combine pdfs',
      'reorder pdf pages',
    ],
    inputTypes: ['pdf'],
    operations: ['merge', 'split', 'rotate'],
    related: [],
  },
  // Time & Numbers
  'date-calculator': {
    intents: [
      'days between two dates',
      'add days to a date',
      'subtract dates',
      'date difference calculator',
    ],
    inputTypes: ['timestamp'],
    operations: ['calculate'],
    related: ['timestamp-converter'],
  },
  'unit-converter': {
    intents: [
      'convert units of measure',
      'kg to lbs',
      'celsius to fahrenheit',
      'km to miles',
      'unit conversion',
    ],
    inputTypes: [],
    operations: ['convert'],
    related: [],
  },
  'cron-parser': {
    intents: [
      'explain a cron expression',
      'what does this cron schedule mean',
      'when will this cron run',
      'read a crontab entry',
    ],
    inputTypes: ['cron'],
    operations: ['parse', 'inspect'],
    related: ['crontab-generator'],
  },
  'crontab-generator': {
    intents: [
      'build a cron expression',
      'cron schedule generator',
      'create a crontab entry',
      'visual cron builder',
    ],
    inputTypes: ['cron'],
    operations: ['generate', 'build'],
    related: ['cron-parser'],
  },
  // Utilities
  'hash-generator': {
    intents: [
      'generate a sha256 hash',
      'md5 checksum',
      'hash text',
      'verify a checksum',
      'checksum a string',
    ],
    inputTypes: ['text', 'hash'],
    operations: ['hash'],
    related: [],
  },
  'uuid-generator': {
    intents: ['generate a uuid', 'create a guid', 'new random id', 'uuid v7'],
    inputTypes: ['uuid'],
    operations: ['generate'],
    related: [],
  },
  'password-generator': {
    intents: [
      'generate a strong password',
      'random password',
      'secure password generator',
      'create passwords in bulk',
    ],
    inputTypes: ['password'],
    operations: ['generate'],
    related: [],
  },
  'totp-generator': {
    intents: [
      'generate a 2fa code',
      'totp code offline',
      'authenticator code now',
      'verify a one-time password',
    ],
    inputTypes: ['otp'],
    operations: ['generate'],
    related: [],
  },
  'fake-data-generator': {
    intents: [
      'generate test data',
      'fake names and emails',
      'mock user records',
      'sample csv data',
      'seed a database',
    ],
    inputTypes: [],
    operations: ['generate'],
    related: ['csv-to-json', 'json-formatter'],
  },
  'qr-code-generator': {
    intents: ['generate a qr code', 'make a qr for a url', 'wifi qr code', 'share a link as qr'],
    inputTypes: ['url', 'text'],
    operations: ['generate'],
    related: [],
  },
  'http-status-codes': {
    intents: [
      'what does http 404 mean',
      'http status code reference',
      'look up an http error code',
      'status code meanings',
    ],
    inputTypes: ['http'],
    operations: ['reference'],
    related: ['api-request-builder'],
  },
  // Build / Network
  'api-request-builder': {
    intents: [
      'send an http request',
      'test an api endpoint',
      'postman alternative',
      'inspect an api response',
      'debug a rest api',
    ],
    inputTypes: ['http', 'json'],
    operations: ['send', 'build', 'inspect'],
    related: ['json-formatter', 'json-validator', 'http-status-codes'],
  },
  'websocket-tester': {
    intents: [
      'test a websocket connection',
      'connect to a ws server',
      'send websocket messages',
      'debug websockets',
    ],
    inputTypes: ['websocket', 'json'],
    operations: ['send', 'test', 'inspect'],
    related: [],
  },
  'docker-command-builder': {
    intents: [
      'build a docker run command',
      'docker compose generator',
      'docker cli helper',
      'turn docker options into a command',
    ],
    inputTypes: ['docker'],
    operations: ['build', 'generate'],
    related: [],
  },
};

/**
 * Task-shaped entry points for the Start screen. Grouped around what a user is
 * trying to do — not around how tools are implemented — and every id is
 * validated against the catalogue.
 */
export interface TaskCluster {
  readonly id: string;
  readonly title: string;
  readonly toolIds: readonly string[];
}

export const TASK_CLUSTERS: readonly TaskCluster[] = [
  {
    id: 'api-data',
    title: 'Inspect & debug API data',
    toolIds: [
      'api-request-builder',
      'json-formatter',
      'json-validator',
      'jwt-decoder',
      'http-status-codes',
    ],
  },
  {
    id: 'encode-convert',
    title: 'Encode, decode & convert',
    toolIds: [
      'base64-encoder',
      'url-encoder',
      'html-escape',
      'yaml-formatter',
      'xml-formatter',
      'csv-to-json',
      'timestamp-converter',
      'unit-converter',
    ],
  },
  {
    id: 'validate-config',
    title: 'Validate configuration',
    toolIds: [
      'json-validator',
      'yaml-formatter',
      'xml-formatter',
      'nginx-config-validator',
      'graphql-formatter',
    ],
  },
  {
    id: 'generate-test-data',
    title: 'Generate IDs, hashes & test data',
    toolIds: [
      'uuid-generator',
      'hash-generator',
      'fake-data-generator',
      'password-generator',
      'qr-code-generator',
    ],
  },
];
