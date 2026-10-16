/**
 * Tool Configuration
 * Central metadata for all tools - used to generate routes, navigation, and documentation
 */

import type { ComponentType } from 'react';
import { getToolPolicy, type ToolPolicy } from '@/core/tool-policy';
import { isDesktopBuild } from '@/platform/desktop';

export type ToolCategory =
  'format' | 'encode' | 'generate' | 'transform' | 'analyze' | 'build' | 'text';

/** Research-aligned categories for the navigation rail */
export type ResearchCategory =
  | 'json-data'
  | 'yaml-config'
  | 'csv-tables'
  | 'sql-code'
  | 'convert'
  | 'encode-decode'
  | 'text'
  | 'time-numbers'
  | 'utilities';

export interface ToolMetadata extends ToolPolicy {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  path: string;
  /**
   * Research-aligned category for navigation rail grouping.
   */
  researchCategory: ResearchCategory;
  /**
   * Fallback view for tools without a workbench spec or custom screen.
   * Workbench tools and custom screens render without it.
   */
  component?: ComponentType;
  keywords?: string[];
}

export const TOOL_CATEGORIES = {
  format: { name: 'Format & Validate', description: 'Make code pretty and verify structure' },
  encode: { name: 'Encode & Decode', description: 'Encode, decode, and inspect data formats' },
  generate: { name: 'Generate', description: 'Create identifiers, hashes, and sample data' },
  transform: { name: 'Transform', description: 'Convert data between formats' },
  analyze: { name: 'Analyze', description: 'Inspect, compare, and understand content' },
  build: { name: 'Build', description: 'Construct requests and developer artifacts' },
  text: { name: 'Text & Docs', description: 'Text utilities and document tools' },
} as const;

export const RESEARCH_CATEGORIES: Record<ResearchCategory, { name: string; icon: string }> = {
  'json-data': { name: 'JSON & Data', icon: '{}' },
  'yaml-config': { name: 'YAML & Config', icon: '<>' },
  'csv-tables': { name: 'CSV & Tables', icon: '▦' },
  'sql-code': { name: 'SQL & Code', icon: 'SQL' },
  convert: { name: 'Convert', icon: '↔' },
  'encode-decode': { name: 'Encode & Decode', icon: '⌁' },
  text: { name: 'Text', icon: '≡' },
  'time-numbers': { name: 'Time & Numbers', icon: '◷' },
  utilities: { name: 'Utilities', icon: '⚡' },
};

// Lazy-loaded tool components

// Tool metadata configuration
const TOOL_CATALOG: Omit<ToolMetadata, keyof ToolPolicy>[] = [
  // JSON & Data
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, minify, and validate JSON data',
    category: 'format',
    researchCategory: 'json-data',
    path: '/json-formatter',
    keywords: ['json', 'format', 'minify', 'validate', 'pretty print'],
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description: 'Validate JSON against schemas',
    category: 'format',
    researchCategory: 'json-data',
    path: '/json-validator',
    keywords: ['json', 'validate', 'schema', 'ajv'],
  },
  // CSV & Tables
  {
    id: 'csv-to-json',
    name: 'CSV to JSON',
    description: 'Convert CSV files to JSON format',
    category: 'transform',
    researchCategory: 'csv-tables',
    path: '/csv-to-json',
    keywords: ['csv', 'json', 'convert', 'transform'],
  },
  // Encode & Decode
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder',
    description: 'Encode text to Base64 or decode Base64 to text',
    category: 'encode',
    researchCategory: 'encode-decode',
    path: '/base64-encoder',
    keywords: ['base64', 'encode', 'decode'],
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder',
    description: 'Encode text for URLs or decode URL-encoded text',
    category: 'encode',
    researchCategory: 'encode-decode',
    path: '/url-encoder',
    keywords: ['url', 'encode', 'decode', 'uri', 'percent encoding'],
  },
  {
    id: 'html-escape',
    name: 'HTML Escape',
    description: 'Escape and unescape HTML entities',
    category: 'encode',
    researchCategory: 'encode-decode',
    path: '/html-escape',
    keywords: ['html', 'escape', 'unescape', 'entities'],
  },
  {
    id: 'protobuf-decoder',
    name: 'Protobuf Decoder',
    description: 'Decode raw Protocol Buffer binary data into readable fields',
    category: 'encode',
    researchCategory: 'encode-decode',
    path: '/protobuf-decoder',
    keywords: ['protobuf', 'protocol buffer', 'decode', 'binary', 'grpc', 'wire format'],
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JWT tokens',
    category: 'encode',
    researchCategory: 'encode-decode',
    path: '/jwt-decoder',
    keywords: ['jwt', 'token', 'decode', 'inspect', 'authentication'],
  },
  {
    id: 'certificate-decoder',
    name: 'Certificate Decoder',
    description: 'Decode and inspect SSL/TLS certificates (PEM format)',
    category: 'encode',
    researchCategory: 'encode-decode',
    path: '/certificate-decoder',
    keywords: ['certificate', 'ssl', 'tls', 'x509', 'pem', 'decode', 'inspect'],
  },
  // Convert
  {
    id: 'case-converter',
    name: 'Case Converter',
    description: 'Convert text between camelCase, snake_case, PascalCase, and more',
    category: 'transform',
    researchCategory: 'convert',
    path: '/case-converter',
    keywords: ['case', 'convert', 'camel', 'snake', 'pascal', 'kebab'],
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert between timestamps and human-readable dates',
    category: 'transform',
    researchCategory: 'convert',
    path: '/timestamp-converter',
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time'],
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert between HEX, RGB, and HSL color formats',
    category: 'transform',
    researchCategory: 'convert',
    path: '/color-converter',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
  },
  {
    id: 'js-json-minifier',
    name: 'JS Minifier',
    description: 'Minify JavaScript code',
    category: 'transform',
    researchCategory: 'convert',
    path: '/js-json-minifier',
    keywords: ['javascript', 'minify', 'compress', 'uglify'],
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert, resize, and optimize images between PNG, JPEG, and WebP',
    category: 'transform',
    researchCategory: 'convert',
    path: '/image-converter',
    keywords: ['image', 'convert', 'resize', 'compress', 'png', 'jpg', 'webp', 'optimize'],
  },
  // SQL & Code
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    description: 'Format, minify, and uppercase SQL queries',
    category: 'format',
    researchCategory: 'sql-code',
    path: '/sql-formatter',
    keywords: ['sql', 'format', 'query', 'database', 'minify', 'mysql', 'postgresql'],
  },
  {
    id: 'graphql-formatter',
    name: 'GraphQL Formatter',
    description: 'Format, validate, and minify GraphQL queries and schemas',
    category: 'format',
    researchCategory: 'sql-code',
    path: '/graphql-formatter',
    keywords: ['graphql', 'gql', 'format', 'validate', 'query', 'mutation', 'schema'],
  },
  {
    id: 'css-formatter',
    name: 'CSS Formatter',
    description: 'Format and minify CSS code',
    category: 'format',
    researchCategory: 'sql-code',
    path: '/css-formatter',
    keywords: ['css', 'format', 'minify', 'beautify'],
  },
  // YAML & Config
  {
    id: 'yaml-formatter',
    name: 'YAML Formatter',
    description: 'Format YAML and convert between YAML and JSON',
    category: 'format',
    researchCategory: 'yaml-config',
    path: '/yaml-formatter',
    keywords: ['yaml', 'json', 'format', 'convert', 'yml'],
  },
  {
    id: 'xml-formatter',
    name: 'XML Formatter',
    description: 'Format, minify, convert XML to JSON, and query with XPath',
    category: 'format',
    researchCategory: 'yaml-config',
    path: '/xml-formatter',
    keywords: ['xml', 'format', 'minify', 'json', 'xpath', 'convert', 'prettify'],
  },
  {
    id: 'nginx-config-validator',
    name: 'Nginx Config Validator',
    description: 'Validate, format, and analyze Nginx configuration files',
    category: 'format',
    researchCategory: 'yaml-config',
    path: '/nginx-config-validator',
    keywords: ['nginx', 'config', 'validate', 'server', 'proxy', 'reverse proxy'],
  },
  // Text
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, and sentences',
    category: 'analyze',
    researchCategory: 'text',
    path: '/word-counter',
    keywords: ['word', 'count', 'character', 'sentence', 'statistics'],
  },
  {
    id: 'strip-whitespace',
    name: 'Strip Whitespace',
    description: 'Remove unnecessary whitespace from text',
    category: 'text',
    researchCategory: 'text',
    path: '/strip-whitespace',
    keywords: ['whitespace', 'trim', 'strip', 'clean'],
  },
  {
    id: 'diff-tool',
    name: 'Diff Tool',
    description: 'Compare text and see differences side-by-side',
    category: 'analyze',
    researchCategory: 'text',
    path: '/diff-tool',
    keywords: ['diff', 'compare', 'difference', 'merge'],
  },
  {
    id: 'git-diff-viewer',
    name: 'Git Diff Viewer',
    description: 'Paste git diff output to view syntax-highlighted changes',
    category: 'analyze',
    researchCategory: 'text',
    path: '/git-diff-viewer',
    keywords: ['git', 'diff', 'patch', 'viewer', 'changes', 'commit'],
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regex patterns with real-time matching and replace',
    category: 'analyze',
    researchCategory: 'text',
    path: '/regex-tester',
    keywords: ['regex', 'regular expression', 'pattern', 'test', 'match', 'replace'],
  },
  {
    id: 'markdown-previewer',
    name: 'Markdown Previewer',
    description: 'Live preview Markdown with syntax support',
    category: 'text',
    researchCategory: 'text',
    path: '/markdown-previewer',
    keywords: ['markdown', 'preview', 'md', 'render'],
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'A private scratchpad for pasting and previewing text',
    category: 'text',
    researchCategory: 'text',
    path: '/notes',
    keywords: ['notes', 'notepad', 'scratchpad', 'markdown', 'paste', 'text', 'draft'],
  },
  {
    id: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text for designs and mockups',
    category: 'generate',
    researchCategory: 'text',
    path: '/lorem-ipsum-generator',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'generate', 'dummy'],
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, split, and rotate PDFs — all processing in your browser',
    category: 'text',
    researchCategory: 'text',
    path: '/pdf-tools',
    keywords: ['pdf', 'merge', 'split', 'rotate', 'extract', 'combine', 'pages'],
  },
  // Time & Numbers
  {
    id: 'date-calculator',
    name: 'Date Calculator',
    description: 'Calculate date differences and add/subtract time',
    category: 'text',
    researchCategory: 'time-numbers',
    path: '/date-calculator',
    keywords: ['date', 'calculate', 'difference', 'add', 'subtract'],
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert between different units of measurement',
    category: 'transform',
    researchCategory: 'time-numbers',
    path: '/unit-converter',
    keywords: ['unit', 'convert', 'measurement', 'length', 'weight'],
  },
  {
    id: 'cron-parser',
    name: 'Cron Expression Parser',
    description: 'Parse and understand cron expressions',
    category: 'analyze',
    researchCategory: 'time-numbers',
    path: '/cron-parser',
    keywords: ['cron', 'parse', 'schedule', 'expression'],
  },
  {
    id: 'crontab-generator',
    name: 'Crontab Generator',
    description: 'Build cron expressions visually with real-time preview',
    category: 'build',
    researchCategory: 'time-numbers',
    path: '/crontab-generator',
    keywords: ['cron', 'crontab', 'schedule', 'build', 'visual', 'generator'],
  },
  // Utilities
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes',
    category: 'generate',
    researchCategory: 'utilities',
    path: '/hash-generator',
    keywords: ['hash', 'md5', 'sha', 'checksum', 'digest'],
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate UUIDs (v4 and time-ordered v7)',
    category: 'generate',
    researchCategory: 'utilities',
    path: '/uuid-generator',
    keywords: ['uuid', 'guid', 'generate', 'unique', 'identifier'],
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate secure random passwords with strength meter',
    category: 'generate',
    researchCategory: 'utilities',
    path: '/password-generator',
    keywords: ['password', 'generate', 'random', 'secure', 'strength'],
  },
  {
    id: 'totp-generator',
    name: 'TOTP/2FA Generator',
    description: 'Generate time-based one-time passwords (TOTP) offline',
    category: 'generate',
    researchCategory: 'utilities',
    path: '/totp-generator',
    keywords: ['totp', '2fa', 'two-factor', 'authenticator', 'otp', 'mfa'],
  },
  {
    id: 'fake-data-generator',
    name: 'Fake Data Generator',
    description: 'Generate realistic test data with names, emails, and addresses',
    category: 'generate',
    researchCategory: 'utilities',
    path: '/fake-data-generator',
    keywords: [
      'fake',
      'data',
      'generate',
      'mock',
      'test',
      'name',
      'email',
      'address',
      'csv',
      'sql',
    ],
  },
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes for text, URLs, WiFi, and contacts',
    category: 'generate',
    researchCategory: 'utilities',
    path: '/qr-code-generator',
    keywords: ['qr', 'code', 'generate', 'barcode', 'wifi', 'vcard', 'url'],
  },
  {
    id: 'http-status-codes',
    name: 'HTTP Status Codes',
    description: 'Quick reference for HTTP status codes',
    category: 'analyze',
    researchCategory: 'utilities',
    path: '/http-status-codes',
    keywords: ['http', 'status', 'code', 'reference', 'error'],
  },
  // Build / Network tools
  {
    id: 'api-request-builder',
    name: 'API Request Builder',
    description: 'Send HTTP requests and inspect responses (Postman-lite)',
    category: 'build',
    researchCategory: 'utilities',
    path: '/api-request-builder',
    keywords: [
      'api',
      'http',
      'request',
      'postman',
      'rest',
      'fetch',
      'get',
      'post',
      'put',
      'delete',
    ],
  },
  {
    id: 'websocket-tester',
    name: 'WebSocket Tester',
    description: 'Connect to WebSocket servers, send and receive messages in real-time',
    category: 'build',
    researchCategory: 'utilities',
    path: '/websocket-tester',
    keywords: ['websocket', 'ws', 'wss', 'real-time', 'socket', 'test', 'connect'],
  },
  {
    id: 'docker-command-builder',
    name: 'Docker Command Builder',
    description: 'Build docker run commands and docker-compose files visually',
    category: 'build',
    researchCategory: 'utilities',
    path: '/docker-command-builder',
    keywords: ['docker', 'container', 'compose', 'run', 'build', 'command'],
  },
];

/**
 * Tools that only work where a page may reach the network. The installed app
 * runs under a CSP that allows bundled assets and the Tauri IPC channel only,
 * so these two can never complete a connection — they are hidden from every
 * desktop surface (rail, palette, paste detection, capability graph) rather
 * than offered and always failing. The web build keeps them.
 */
export const DESKTOP_HIDDEN_TOOL_IDS: readonly string[] = [
  'api-request-builder',
  'websocket-tester',
];

/** The catalogue minus the tools the target cannot run. Pure; test both. */
export function toolsForTarget<T extends { id: string }>(
  tools: readonly T[],
  target: 'web' | 'desktop',
): T[] {
  if (target === 'web') return [...tools];
  const hidden = new Set(DESKTOP_HIDDEN_TOOL_IDS);
  return tools.filter((tool) => !hidden.has(tool.id));
}

/** The full catalogue, with policies — the capability corpus and validation use it. */
export const ALL_TOOLS: ToolMetadata[] = TOOL_CATALOG.map((tool) => ({
  ...tool,
  ...getToolPolicy(tool.id),
}));

/**
 * The tools this build can run: what routes, the rail, search and the
 * capability graph are built from. Data that must stay stable across targets
 * (the embedding corpus, validation) reads `ALL_TOOLS` instead.
 */
export const TOOLS: ToolMetadata[] = toolsForTarget(ALL_TOOLS, isDesktopBuild ? 'desktop' : 'web');
