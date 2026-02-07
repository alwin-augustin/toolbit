/**
 * Tool Configuration
 * Central metadata for all tools - used to generate routes, navigation, and documentation
 */

import { lazy, ComponentType } from 'react';

export interface ToolMetadata {
    id: string;
    name: string;
    description: string;
    category: 'json' | 'encoding' | 'text' | 'web' | 'security' | 'converters' | 'utilities';
    path: string;
    component: ComponentType;
    keywords?: string[];
}

export const TOOL_CATEGORIES = {
    json: { name: 'JSON Tools', description: 'Tools for working with JSON data' },
    encoding: { name: 'Encoding Tools', description: 'Tools for encoding and decoding data' },
    text: { name: 'Text Tools', description: 'Tools for text manipulation and analysis' },
    web: { name: 'Web Development', description: 'Tools for web development tasks' },
    security: { name: 'Security Tools', description: 'Tools for security and cryptography' },
    converters: { name: 'Converter Tools', description: 'Tools for converting between different formats' },
    utilities: { name: 'Utility Tools', description: 'General utility and helper tools' }
} as const;

// Lazy-loaded tool components
const JsonFormatter = lazy(() => import("@/components/tools/json/JsonFormatter"));
const JsonValidator = lazy(() => import("@/components/tools/json/JsonValidator"));
const CsvToJsonConverter = lazy(() => import("@/components/tools/json/CsvToJsonConverter"));

const Base64Encoder = lazy(() => import("@/components/tools/encoding/Base64Encoder"));
const UrlEncoder = lazy(() => import("@/components/tools/encoding/UrlEncoder"));
const HtmlEscape = lazy(() => import("@/components/tools/encoding/HtmlEscape"));
const ProtobufDecoder = lazy(() => import("@/components/tools/encoding/ProtobufDecoder"));

const CaseConverter = lazy(() => import("@/components/tools/text/CaseConverter"));
const WordCounter = lazy(() => import("@/components/tools/text/WordCounter"));
const StripWhitespace = lazy(() => import("@/components/tools/text/StripWhitespace"));
const DiffTool = lazy(() => import("@/components/tools/text/DiffTool"));
const GitDiffViewer = lazy(() => import("@/components/tools/text/GitDiffViewer"));
const RegexTester = lazy(() => import("@/components/tools/text/RegexTester"));
const LoremIpsumGenerator = lazy(() => import("@/components/tools/text/LoremIpsumGenerator"));

const SqlFormatter = lazy(() => import("@/components/tools/web/SqlFormatter"));
const YamlFormatter = lazy(() => import("@/components/tools/web/YamlFormatter"));
const ApiRequestBuilder = lazy(() => import("@/components/tools/web/ApiRequestBuilder"));

const PasswordGenerator = lazy(() => import("@/components/tools/security/PasswordGenerator"));
const TotpGenerator = lazy(() => import("@/components/tools/security/TotpGenerator"));
const CertificateDecoder = lazy(() => import("@/components/tools/security/CertificateDecoder"));

const QrCodeGenerator = lazy(() => import("@/components/tools/utilities/QrCodeGenerator"));
const FakeDataGenerator = lazy(() => import("@/components/tools/utilities/FakeDataGenerator"));
const CrontabGenerator = lazy(() => import("@/components/tools/utilities/CrontabGenerator"));
const DockerCommandBuilder = lazy(() => import("@/components/tools/utilities/DockerCommandBuilder"));

const XmlFormatter = lazy(() => import("@/components/tools/web/XmlFormatter"));
const CssFormatter = lazy(() => import("@/components/tools/web/CssFormatter"));
const JsJsonMinifier = lazy(() => import("@/components/tools/web/JsJsonMinifier"));
const MarkdownPreviewer = lazy(() => import("@/components/tools/web/MarkdownPreviewer"));
const GraphqlFormatter = lazy(() => import("@/components/tools/web/GraphqlFormatter"));
const WebSocketTester = lazy(() => import("@/components/tools/web/WebSocketTester"));
const NginxConfigValidator = lazy(() => import("@/components/tools/web/NginxConfigValidator"));

const HashGenerator = lazy(() => import("@/components/tools/security/HashGenerator"));
const JwtDecoder = lazy(() => import("@/components/tools/security/JwtDecoder"));

const TimestampConverter = lazy(() => import("@/components/tools/converters/TimestampConverter"));
const ColorConverter = lazy(() => import("@/components/tools/converters/ColorConverter"));
const UnitConverter = lazy(() => import("@/components/tools/converters/UnitConverter"));
const ImageConverter = lazy(() => import("@/components/tools/converters/ImageConverter"));
const PdfTools = lazy(() => import("@/components/tools/converters/PdfTools"));

const DateCalculator = lazy(() => import("@/components/tools/utilities/DateCalculator"));
const CronParser = lazy(() => import("@/components/tools/utilities/CronParser"));
const UuidGenerator = lazy(() => import("@/components/tools/utilities/UuidGenerator"));
const HttpStatusCodeReference = lazy(() => import("@/components/tools/utilities/HttpStatusCodeReference"));

// Tool metadata configuration
export const TOOLS: ToolMetadata[] = [
    // JSON Tools
    {
        id: 'json-formatter',
        name: 'JSON Formatter',
        description: 'Format, minify, and validate JSON data',
        category: 'json',
        path: '/app/json-formatter',
        component: JsonFormatter,
        keywords: ['json', 'format', 'minify', 'validate', 'pretty print']
    },
    {
        id: 'json-validator',
        name: 'JSON Validator',
        description: 'Validate JSON against schemas',
        category: 'json',
        path: '/app/json-validator',
        component: JsonValidator,
        keywords: ['json', 'validate', 'schema', 'ajv']
    },
    {
        id: 'csv-to-json',
        name: 'CSV to JSON',
        description: 'Convert CSV files to JSON format',
        category: 'json',
        path: '/app/csv-to-json',
        component: CsvToJsonConverter,
        keywords: ['csv', 'json', 'convert', 'transform']
    },
    // Encoding Tools
    {
        id: 'base64-encoder',
        name: 'Base64 Encoder',
        description: 'Encode text to Base64 or decode Base64 to text',
        category: 'encoding',
        path: '/app/base64-encoder',
        component: Base64Encoder,
        keywords: ['base64', 'encode', 'decode']
    },
    {
        id: 'url-encoder',
        name: 'URL Encoder',
        description: 'Encode text for URLs or decode URL-encoded text',
        category: 'encoding',
        path: '/app/url-encoder',
        component: UrlEncoder,
        keywords: ['url', 'encode', 'decode', 'uri', 'percent encoding']
    },
    {
        id: 'html-escape',
        name: 'HTML Escape',
        description: 'Escape and unescape HTML entities',
        category: 'encoding',
        path: '/app/html-escape',
        component: HtmlEscape,
        keywords: ['html', 'escape', 'unescape', 'entities']
    },
    {
        id: 'protobuf-decoder',
        name: 'Protobuf Decoder',
        description: 'Decode raw Protocol Buffer binary data into readable fields',
        category: 'encoding',
        path: '/app/protobuf-decoder',
        component: ProtobufDecoder,
        keywords: ['protobuf', 'protocol buffer', 'decode', 'binary', 'grpc', 'wire format']
    },
    // Text Tools
    {
        id: 'case-converter',
        name: 'Case Converter',
        description: 'Convert text between camelCase, snake_case, PascalCase, and more',
        category: 'text',
        path: '/app/case-converter',
        component: CaseConverter,
        keywords: ['case', 'convert', 'camel', 'snake', 'pascal', 'kebab']
    },
    {
        id: 'word-counter',
        name: 'Word Counter',
        description: 'Count words, characters, and sentences',
        category: 'text',
        path: '/app/word-counter',
        component: WordCounter,
        keywords: ['word', 'count', 'character', 'sentence', 'statistics']
    },
    {
        id: 'strip-whitespace',
        name: 'Strip Whitespace',
        description: 'Remove unnecessary whitespace from text',
        category: 'text',
        path: '/app/strip-whitespace',
        component: StripWhitespace,
        keywords: ['whitespace', 'trim', 'strip', 'clean']
    },
    {
        id: 'diff-tool',
        name: 'Diff Tool',
        description: 'Compare text and see differences side-by-side',
        category: 'text',
        path: '/app/diff-tool',
        component: DiffTool,
        keywords: ['diff', 'compare', 'difference', 'merge']
    },
    {
        id: 'git-diff-viewer',
        name: 'Git Diff Viewer',
        description: 'Paste git diff output to view syntax-highlighted changes',
        category: 'text',
        path: '/app/git-diff-viewer',
        component: GitDiffViewer,
        keywords: ['git', 'diff', 'patch', 'viewer', 'changes', 'commit']
    },
    {
        id: 'regex-tester',
        name: 'Regex Tester',
        description: 'Test regex patterns with real-time matching and replace',
        category: 'text',
        path: '/app/regex-tester',
        component: RegexTester,
        keywords: ['regex', 'regular expression', 'pattern', 'test', 'match', 'replace']
    },
    {
        id: 'lorem-ipsum-generator',
        name: 'Lorem Ipsum Generator',
        description: 'Generate placeholder text for designs and mockups',
        category: 'text',
        path: '/app/lorem-ipsum-generator',
        component: LoremIpsumGenerator,
        keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'generate', 'dummy']
    },
    // Web Development
    {
        id: 'css-formatter',
        name: 'CSS Formatter',
        description: 'Format and minify CSS code',
        category: 'web',
        path: '/app/css-formatter',
        component: CssFormatter,
        keywords: ['css', 'format', 'minify', 'beautify']
    },
    {
        id: 'js-json-minifier',
        name: 'JS/JSON Minifier',
        description: 'Minify JavaScript code',
        category: 'web',
        path: '/app/js-json-minifier',
        component: JsJsonMinifier,
        keywords: ['javascript', 'minify', 'compress', 'uglify']
    },
    {
        id: 'markdown-previewer',
        name: 'Markdown Previewer',
        description: 'Live preview Markdown with syntax support',
        category: 'web',
        path: '/app/markdown-previewer',
        component: MarkdownPreviewer,
        keywords: ['markdown', 'preview', 'md', 'render']
    },
    {
        id: 'yaml-formatter',
        name: 'YAML Formatter',
        description: 'Format YAML and convert between YAML and JSON',
        category: 'web',
        path: '/app/yaml-formatter',
        component: YamlFormatter,
        keywords: ['yaml', 'json', 'format', 'convert', 'yml']
    },
    {
        id: 'api-request-builder',
        name: 'API Request Builder',
        description: 'Send HTTP requests and inspect responses (Postman-lite)',
        category: 'web',
        path: '/app/api-request-builder',
        component: ApiRequestBuilder,
        keywords: ['api', 'http', 'request', 'postman', 'rest', 'fetch', 'get', 'post', 'put', 'delete']
    },
    {
        id: 'xml-formatter',
        name: 'XML Formatter',
        description: 'Format, minify, convert XML to JSON, and query with XPath',
        category: 'web',
        path: '/app/xml-formatter',
        component: XmlFormatter,
        keywords: ['xml', 'format', 'minify', 'json', 'xpath', 'convert', 'prettify']
    },
    {
        id: 'sql-formatter',
        name: 'SQL Formatter',
        description: 'Format, minify, and uppercase SQL queries',
        category: 'web',
        path: '/app/sql-formatter',
        component: SqlFormatter,
        keywords: ['sql', 'format', 'query', 'database', 'minify', 'mysql', 'postgresql']
    },
    {
        id: 'graphql-formatter',
        name: 'GraphQL Formatter',
        description: 'Format, validate, and minify GraphQL queries and schemas',
        category: 'web',
        path: '/app/graphql-formatter',
        component: GraphqlFormatter,
        keywords: ['graphql', 'gql', 'format', 'validate', 'query', 'mutation', 'schema']
    },
    {
        id: 'websocket-tester',
        name: 'WebSocket Tester',
        description: 'Connect to WebSocket servers, send and receive messages in real-time',
        category: 'web',
        path: '/app/websocket-tester',
        component: WebSocketTester,
        keywords: ['websocket', 'ws', 'wss', 'real-time', 'socket', 'test', 'connect']
    },
    {
        id: 'nginx-config-validator',
        name: 'Nginx Config Validator',
        description: 'Validate, format, and analyze Nginx configuration files',
        category: 'web',
        path: '/app/nginx-config-validator',
        component: NginxConfigValidator,
        keywords: ['nginx', 'config', 'validate', 'server', 'proxy', 'reverse proxy']
    },
    // Security
    {
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes',
        category: 'security',
        path: '/app/hash-generator',
        component: HashGenerator,
        keywords: ['hash', 'md5', 'sha', 'checksum', 'digest']
    },
    {
        id: 'jwt-decoder',
        name: 'JWT Decoder',
        description: 'Decode and inspect JWT tokens',
        category: 'security',
        path: '/app/jwt-decoder',
        component: JwtDecoder,
        keywords: ['jwt', 'token', 'decode', 'inspect', 'authentication']
    },
    {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Generate secure random passwords with strength meter',
        category: 'security',
        path: '/app/password-generator',
        component: PasswordGenerator,
        keywords: ['password', 'generate', 'random', 'secure', 'strength']
    },
    {
        id: 'totp-generator',
        name: 'TOTP/2FA Generator',
        description: 'Generate time-based one-time passwords (TOTP) offline',
        category: 'security',
        path: '/app/totp-generator',
        component: TotpGenerator,
        keywords: ['totp', '2fa', 'two-factor', 'authenticator', 'otp', 'mfa']
    },
    {
        id: 'certificate-decoder',
        name: 'Certificate Decoder',
        description: 'Decode and inspect SSL/TLS certificates (PEM format)',
        category: 'security',
        path: '/app/certificate-decoder',
        component: CertificateDecoder,
        keywords: ['certificate', 'ssl', 'tls', 'x509', 'pem', 'decode', 'inspect']
    },
    // Converters
    {
        id: 'timestamp-converter',
        name: 'Timestamp Converter',
        description: 'Convert between timestamps and human-readable dates',
        category: 'converters',
        path: '/app/timestamp-converter',
        component: TimestampConverter,
        keywords: ['timestamp', 'unix', 'epoch', 'date', 'time']
    },
    {
        id: 'color-converter',
        name: 'Color Converter',
        description: 'Convert between HEX, RGB, and HSL color formats',
        category: 'converters',
        path: '/app/color-converter',
        component: ColorConverter,
        keywords: ['color', 'hex', 'rgb', 'hsl', 'convert']
    },
    {
        id: 'unit-converter',
        name: 'Unit Converter',
        description: 'Convert between different units of measurement',
        category: 'converters',
        path: '/app/unit-converter',
        component: UnitConverter,
        keywords: ['unit', 'convert', 'measurement', 'length', 'weight']
    },
    {
        id: 'image-converter',
        name: 'Image Converter',
        description: 'Convert, resize, and optimize images between PNG, JPEG, and WebP',
        category: 'converters',
        path: '/app/image-converter',
        component: ImageConverter,
        keywords: ['image', 'convert', 'resize', 'compress', 'png', 'jpg', 'webp', 'optimize']
    },
    {
        id: 'pdf-tools',
        name: 'PDF Tools',
        description: 'Merge, split, and rotate PDFs — all processing in your browser',
        category: 'converters',
        path: '/app/pdf-tools',
        component: PdfTools,
        keywords: ['pdf', 'merge', 'split', 'rotate', 'extract', 'combine', 'pages']
    },
    // Utilities
    {
        id: 'date-calculator',
        name: 'Date Calculator',
        description: 'Calculate date differences and add/subtract time',
        category: 'utilities',
        path: '/app/date-calculator',
        component: DateCalculator,
        keywords: ['date', 'calculate', 'difference', 'add', 'subtract']
    },
    {
        id: 'cron-parser',
        name: 'Cron Expression Parser',
        description: 'Parse and understand cron expressions',
        category: 'utilities',
        path: '/app/cron-parser',
        component: CronParser,
        keywords: ['cron', 'parse', 'schedule', 'expression']
    },
    {
        id: 'uuid-generator',
        name: 'UUID Generator',
        description: 'Generate UUIDs (v4)',
        category: 'utilities',
        path: '/app/uuid-generator',
        component: UuidGenerator,
        keywords: ['uuid', 'guid', 'generate', 'unique', 'identifier']
    },
    {
        id: 'http-status-codes',
        name: 'HTTP Status Codes',
        description: 'Quick reference for HTTP status codes',
        category: 'utilities',
        path: '/app/http-status-codes',
        component: HttpStatusCodeReference,
        keywords: ['http', 'status', 'code', 'reference', 'error']
    },
    {
        id: 'fake-data-generator',
        name: 'Fake Data Generator',
        description: 'Generate realistic test data with names, emails, and addresses',
        category: 'utilities',
        path: '/app/fake-data-generator',
        component: FakeDataGenerator,
        keywords: ['fake', 'data', 'generate', 'mock', 'test', 'name', 'email', 'address', 'csv', 'sql']
    },
    {
        id: 'qr-code-generator',
        name: 'QR Code Generator',
        description: 'Generate QR codes for text, URLs, WiFi, and contacts',
        category: 'utilities',
        path: '/app/qr-code-generator',
        component: QrCodeGenerator,
        keywords: ['qr', 'code', 'generate', 'barcode', 'wifi', 'vcard', 'url']
    },
    {
        id: 'crontab-generator',
        name: 'Crontab Generator',
        description: 'Build cron expressions visually with real-time preview',
        category: 'utilities',
        path: '/app/crontab-generator',
        component: CrontabGenerator,
        keywords: ['cron', 'crontab', 'schedule', 'build', 'visual', 'generator']
    },
    {
        id: 'docker-command-builder',
        name: 'Docker Command Builder',
        description: 'Build docker run commands and docker-compose files visually',
        category: 'utilities',
        path: '/app/docker-command-builder',
        component: DockerCommandBuilder,
        keywords: ['docker', 'container', 'compose', 'run', 'build', 'command']
    }
];

// Helper functions
export const getToolsByCategory = (category: string) =>
    TOOLS.filter(tool => tool.category === category);

export const getToolById = (id: string) =>
    TOOLS.find(tool => tool.id === id);

export const getToolByPath = (path: string) =>
    TOOLS.find(tool => tool.path === path);

export const searchTools = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return TOOLS.filter(tool =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery) ||
        tool.keywords?.some(keyword => keyword.includes(lowerQuery))
    );
};
