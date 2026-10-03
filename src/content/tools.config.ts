/**
 * Tool Configuration
 * Central metadata for all tools - used to generate routes, navigation, and documentation
 */

import type { ComponentType } from 'react';
import { getToolPolicy, type ToolPolicy } from '@/core/tool-policy';

export type ToolCategory =
  'format' | 'encode' | 'generate' | 'transform' | 'analyze' | 'build' | 'text';

export interface ToolMetadata extends ToolPolicy {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  path: string;
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

// Lazy-loaded tool components

// Tool metadata configuration
const TOOL_CATALOG: Omit<ToolMetadata, keyof ToolPolicy>[] = [
  // JSON Tools
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, minify, and validate JSON data',
    category: 'format',
    path: '/json-formatter',
    keywords: ['json', 'format', 'minify', 'validate', 'pretty print'],
  },
  {
    id: 'json-validator',
    name: 'JSON Validator',
    description: 'Validate JSON against schemas',
    category: 'format',
    path: '/json-validator',
    keywords: ['json', 'validate', 'schema', 'ajv'],
  },
  {
    id: 'csv-to-json',
    name: 'CSV to JSON',
    description: 'Convert CSV files to JSON format',
    category: 'transform',
    path: '/csv-to-json',
    keywords: ['csv', 'json', 'convert', 'transform'],
  },
  // Encoding Tools
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder',
    description: 'Encode text to Base64 or decode Base64 to text',
    category: 'encode',
    path: '/base64-encoder',
    keywords: ['base64', 'encode', 'decode'],
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder',
    description: 'Encode text for URLs or decode URL-encoded text',
    category: 'encode',
    path: '/url-encoder',
    keywords: ['url', 'encode', 'decode', 'uri', 'percent encoding'],
  },
  {
    id: 'html-escape',
    name: 'HTML Escape',
    description: 'Escape and unescape HTML entities',
    category: 'encode',
    path: '/html-escape',
    keywords: ['html', 'escape', 'unescape', 'entities'],
  },
  {
    id: 'protobuf-decoder',
    name: 'Protobuf Decoder',
    description: 'Decode raw Protocol Buffer binary data into readable fields',
    category: 'encode',
    path: '/protobuf-decoder',
    keywords: ['protobuf', 'protocol buffer', 'decode', 'binary', 'grpc', 'wire format'],
  },
  // Text Tools
  {
    id: 'case-converter',
    name: 'Case Converter',
    description: 'Convert text between camelCase, snake_case, PascalCase, and more',
    category: 'transform',
    path: '/case-converter',
    keywords: ['case', 'convert', 'camel', 'snake', 'pascal', 'kebab'],
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, and sentences',
    category: 'analyze',
    path: '/word-counter',
    keywords: ['word', 'count', 'character', 'sentence', 'statistics'],
  },
  {
    id: 'strip-whitespace',
    name: 'Strip Whitespace',
    description: 'Remove unnecessary whitespace from text',
    category: 'text',
    path: '/strip-whitespace',
    keywords: ['whitespace', 'trim', 'strip', 'clean'],
  },
  {
    id: 'diff-tool',
    name: 'Diff Tool',
    description: 'Compare text and see differences side-by-side',
    category: 'analyze',
    path: '/diff-tool',
    keywords: ['diff', 'compare', 'difference', 'merge'],
  },
  {
    id: 'git-diff-viewer',
    name: 'Git Diff Viewer',
    description: 'Paste git diff output to view syntax-highlighted changes',
    category: 'analyze',
    path: '/git-diff-viewer',
    keywords: ['git', 'diff', 'patch', 'viewer', 'changes', 'commit'],
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regex patterns with real-time matching and replace',
    category: 'analyze',
    path: '/regex-tester',
    keywords: ['regex', 'regular expression', 'pattern', 'test', 'match', 'replace'],
  },
  {
    id: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text for designs and mockups',
    category: 'generate',
    path: '/lorem-ipsum-generator',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'generate', 'dummy'],
  },
  // Web Development
  {
    id: 'css-formatter',
    name: 'CSS Formatter',
    description: 'Format and minify CSS code',
    category: 'format',
    path: '/css-formatter',
    keywords: ['css', 'format', 'minify', 'beautify'],
  },
  {
    id: 'js-json-minifier',
    name: 'JS Minifier',
    description: 'Minify JavaScript code',
    category: 'transform',
    path: '/js-json-minifier',
    keywords: ['javascript', 'minify', 'compress', 'uglify'],
  },
  {
    id: 'markdown-previewer',
    name: 'Markdown Previewer',
    description: 'Live preview Markdown with syntax support',
    category: 'text',
    path: '/markdown-previewer',
    keywords: ['markdown', 'preview', 'md', 'render'],
  },
  {
    id: 'yaml-formatter',
    name: 'YAML Formatter',
    description: 'Format YAML and convert between YAML and JSON',
    category: 'format',
    path: '/yaml-formatter',
    keywords: ['yaml', 'json', 'format', 'convert', 'yml'],
  },
  {
    id: 'api-request-builder',
    name: 'API Request Builder',
    description: 'Send HTTP requests and inspect responses (Postman-lite)',
    category: 'build',
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
    id: 'xml-formatter',
    name: 'XML Formatter',
    description: 'Format, minify, convert XML to JSON, and query with XPath',
    category: 'format',
    path: '/xml-formatter',
    keywords: ['xml', 'format', 'minify', 'json', 'xpath', 'convert', 'prettify'],
  },
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    description: 'Format, minify, and uppercase SQL queries',
    category: 'format',
    path: '/sql-formatter',
    keywords: ['sql', 'format', 'query', 'database', 'minify', 'mysql', 'postgresql'],
  },
  {
    id: 'graphql-formatter',
    name: 'GraphQL Formatter',
    description: 'Format, validate, and minify GraphQL queries and schemas',
    category: 'format',
    path: '/graphql-formatter',
    keywords: ['graphql', 'gql', 'format', 'validate', 'query', 'mutation', 'schema'],
  },
  {
    id: 'websocket-tester',
    name: 'WebSocket Tester',
    description: 'Connect to WebSocket servers, send and receive messages in real-time',
    category: 'build',
    path: '/websocket-tester',
    keywords: ['websocket', 'ws', 'wss', 'real-time', 'socket', 'test', 'connect'],
  },
  {
    id: 'nginx-config-validator',
    name: 'Nginx Config Validator',
    description: 'Validate, format, and analyze Nginx configuration files',
    category: 'format',
    path: '/nginx-config-validator',
    keywords: ['nginx', 'config', 'validate', 'server', 'proxy', 'reverse proxy'],
  },
  // Security
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes',
    category: 'generate',
    path: '/hash-generator',
    keywords: ['hash', 'md5', 'sha', 'checksum', 'digest'],
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode and inspect JWT tokens',
    category: 'encode',
    path: '/jwt-decoder',
    keywords: ['jwt', 'token', 'decode', 'inspect', 'authentication'],
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate secure random passwords with strength meter',
    category: 'generate',
    path: '/password-generator',
    keywords: ['password', 'generate', 'random', 'secure', 'strength'],
  },
  {
    id: 'totp-generator',
    name: 'TOTP/2FA Generator',
    description: 'Generate time-based one-time passwords (TOTP) offline',
    category: 'generate',
    path: '/totp-generator',
    keywords: ['totp', '2fa', 'two-factor', 'authenticator', 'otp', 'mfa'],
  },
  {
    id: 'certificate-decoder',
    name: 'Certificate Decoder',
    description: 'Decode and inspect SSL/TLS certificates (PEM format)',
    category: 'encode',
    path: '/certificate-decoder',
    keywords: ['certificate', 'ssl', 'tls', 'x509', 'pem', 'decode', 'inspect'],
  },
  // Converters
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert between timestamps and human-readable dates',
    category: 'transform',
    path: '/timestamp-converter',
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time'],
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert between HEX, RGB, and HSL color formats',
    category: 'transform',
    path: '/color-converter',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert between different units of measurement',
    category: 'transform',
    path: '/unit-converter',
    keywords: ['unit', 'convert', 'measurement', 'length', 'weight'],
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert, resize, and optimize images between PNG, JPEG, and WebP',
    category: 'transform',
    path: '/image-converter',
    keywords: ['image', 'convert', 'resize', 'compress', 'png', 'jpg', 'webp', 'optimize'],
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, split, and rotate PDFs — all processing in your browser',
    category: 'text',
    path: '/pdf-tools',
    keywords: ['pdf', 'merge', 'split', 'rotate', 'extract', 'combine', 'pages'],
  },
  // Utilities
  {
    id: 'date-calculator',
    name: 'Date Calculator',
    description: 'Calculate date differences and add/subtract time',
    category: 'text',
    path: '/date-calculator',
    keywords: ['date', 'calculate', 'difference', 'add', 'subtract'],
  },
  {
    id: 'cron-parser',
    name: 'Cron Expression Parser',
    description: 'Parse and understand cron expressions',
    category: 'analyze',
    path: '/cron-parser',
    keywords: ['cron', 'parse', 'schedule', 'expression'],
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate UUIDs (v4 and time-ordered v7)',
    category: 'generate',
    path: '/uuid-generator',
    keywords: ['uuid', 'guid', 'generate', 'unique', 'identifier'],
  },
  {
    id: 'http-status-codes',
    name: 'HTTP Status Codes',
    description: 'Quick reference for HTTP status codes',
    category: 'analyze',
    path: '/http-status-codes',
    keywords: ['http', 'status', 'code', 'reference', 'error'],
  },
  {
    id: 'fake-data-generator',
    name: 'Fake Data Generator',
    description: 'Generate realistic test data with names, emails, and addresses',
    category: 'generate',
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
    path: '/qr-code-generator',
    keywords: ['qr', 'code', 'generate', 'barcode', 'wifi', 'vcard', 'url'],
  },
  {
    id: 'crontab-generator',
    name: 'Crontab Generator',
    description: 'Build cron expressions visually with real-time preview',
    category: 'build',
    path: '/crontab-generator',
    keywords: ['cron', 'crontab', 'schedule', 'build', 'visual', 'generator'],
  },
  {
    id: 'docker-command-builder',
    name: 'Docker Command Builder',
    description: 'Build docker run commands and docker-compose files visually',
    category: 'build',
    path: '/docker-command-builder',
    keywords: ['docker', 'container', 'compose', 'run', 'build', 'command'],
  },
];

export const TOOLS: ToolMetadata[] = TOOL_CATALOG.map((tool) => ({
  ...tool,
  ...getToolPolicy(tool.id),
}));
