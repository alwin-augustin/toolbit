export interface SmartSuggestion {
  toolId: string;
  toolName: string;
  path: string;
  reason: string;
}

interface Detector {
  id: string;
  priority: number;
  test: (trimmed: string) => string | null;
  suggestion: (reason: string) => SmartSuggestion;
}

function make(toolId: string, toolName: string, path: string) {
  return (reason: string): SmartSuggestion => ({ toolId, toolName, path, reason });
}

function isValidCron(trimmed: string): boolean {
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) return false;
  // Reject trivial all-numeric sequences like "1 2 3 4 5" without wildcards/ranges.
  if (!/[*/,-]/.test(trimmed)) return false;
  return /^([*]|[0-9,/-]+)(\s+([*]|[0-9,/-]+)){4,5}$/.test(trimmed);
}

function looksLikeCsv(trimmed: string): boolean {
  if (!trimmed.includes('\n')) return false;
  const lines = trimmed.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return false;
  // Respect quoted commas: split respecting double quotes.
  const splitRow = (row: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (quoted && row[i + 1] === '"') {
          current += '"';
          i++;
        } else quoted = !quoted;
      } else if ((c === ',' || c === '\t') && !quoted) {
        cells.push(current);
        current = '';
      } else current += c;
    }
    cells.push(current);
    return cells;
  };
  // Detect delimiter: comma or tab.
  const delim = lines[0].includes('\t') ? '\t' : ',';
  if (!lines[0].includes(delim)) return false;
  const first = splitRow(lines[0]).length;
  if (first < 2) return false;
  return lines.every((l) => Math.abs(splitRow(l).length - first) <= 1);
}

const DETECTORS: Detector[] = [
  {
    id: 'jwt',
    priority: 10,
    test: (t) =>
      /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(t) ? 'Detected JWT token' : null,
    suggestion: make('jwt-decoder', 'JWT Decoder', '/jwt-decoder'),
  },
  {
    id: 'pem',
    priority: 11,
    test: (t) => (/-----BEGIN CERTIFICATE-----/.test(t) ? 'Detected PEM certificate' : null),
    suggestion: make('certificate-decoder', 'Certificate Decoder', '/certificate-decoder'),
  },
  {
    id: 'git-diff',
    priority: 12,
    test: (t) => (/^diff --git|^@@\s/m.test(t) ? 'Detected git diff' : null),
    suggestion: make('git-diff-viewer', 'Git Diff Viewer', '/git-diff-viewer'),
  },
  {
    id: 'json',
    priority: 20,
    test: (t) => {
      if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))))
        return null;
      try {
        JSON.parse(t);
        return 'Detected valid JSON';
      } catch {
        return 'Looks like JSON (may have errors)';
      }
    },
    suggestion: make('json-formatter', 'JSON Formatter', '/json-formatter'),
  },
  {
    id: 'uuid',
    priority: 21,
    test: (t) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)
        ? 'Detected UUID'
        : null,
    suggestion: make('uuid-generator', 'UUID Generator', '/uuid-generator'),
  },
  {
    id: 'hex-color',
    priority: 22,
    test: (t) =>
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(t) ? 'Detected hex color' : null,
    suggestion: make('color-converter', 'Color Converter', '/color-converter'),
  },
  {
    id: 'timestamp',
    priority: 23,
    test: (t) => (/^\d{10,13}$/.test(t) ? 'Detected Unix timestamp' : null),
    suggestion: make('timestamp-converter', 'Timestamp Converter', '/timestamp-converter'),
  },
  {
    id: 'cron',
    priority: 24,
    test: (t) => (isValidCron(t) ? 'Detected cron expression' : null),
    suggestion: make('cron-parser', 'Cron Parser', '/cron-parser'),
  },
  {
    id: 'url-plain',
    priority: 25,
    test: (t) => {
      if (!/^https?:\/\/\S+$/i.test(t)) return null;
      try {
        new URL(t);
        return 'Detected URL';
      } catch {
        return null;
      }
    },
    suggestion: make('url-encoder', 'URL Encoder', '/url-encoder'),
  },
  {
    id: 'regex',
    priority: 40,
    test: (t) => {
      // Require delimiters with content and valid flags; reject paths and empty patterns.
      const m = /^\/(.+)\/([gimsuy]*)$/.exec(t);
      if (!m || m[1].length === 0 || t === '//') return null;
      if (t.startsWith('/path/') || /^\/[a-z]+\//.test(t) && !/[.*+?^${}()|[\]\\]/.test(m[1]))
        return null;
      try {
        new RegExp(m[1], m[2]);
        return 'Detected regex pattern';
      } catch {
        return null;
      }
    },
    suggestion: make('regex-tester', 'Regex Tester', '/regex-tester'),
  },
  {
    id: 'base64',
    priority: 50,
    test: (t) =>
      /^[A-Za-z0-9+/=]{20,}$/.test(t) && t.length % 4 === 0 ? 'Detected Base64 encoded data' : null,
    suggestion: make('base64-encoder', 'Base64 Decoder', '/base64-encoder'),
  },
  {
    id: 'url-encoded',
    priority: 51,
    test: (t) => (/%[0-9A-Fa-f]{2}/.test(t) ? 'Detected URL-encoded text' : null),
    suggestion: make('url-encoder', 'URL Decoder', '/url-encoder'),
  },
  {
    id: 'xml',
    priority: 52,
    test: (t) => (/^<\?xml|^<[a-zA-Z][\w]*[\s>]/m.test(t) ? 'Detected XML' : null),
    suggestion: make('xml-formatter', 'XML Formatter', '/xml-formatter'),
  },
  {
    id: 'html',
    priority: 53,
    test: (t) => (/<[a-z][\s\S]*>/i.test(t) ? 'Detected HTML content' : null),
    suggestion: make('html-escape', 'HTML Escape', '/html-escape'),
  },
  {
    id: 'css',
    priority: 54,
    test: (t) => (/[.#@][a-zA-Z][\w-]*\s*\{/.test(t) ? 'Detected CSS' : null),
    suggestion: make('css-formatter', 'CSS Formatter', '/css-formatter'),
  },
  {
    id: 'sql',
    priority: 55,
    test: (t) =>
      /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN|VALUES)\s/im.test(t)
        ? 'Detected SQL query'
        : null,
    suggestion: make('sql-formatter', 'SQL Formatter', '/sql-formatter'),
  },
  {
    id: 'yaml',
    priority: 56,
    test: (t) => {
      if (t.startsWith('{')) return null;
      if (t.includes('://')) return null;
      // Require at least two key lines or a list item to avoid prose false positives,
      // but accept a single clean mapping like "a: 1".
      const keys = t.match(/^[a-zA-Z_][\w.-]*:\s*.+/m);
      if (!keys) return null;
      const lines = t.split('\n').filter((l) => l.trim());
      if (lines.length >= 2 && lines.filter((l) => /^[a-zA-Z_][\w.-]*:\s*.+/.test(l)).length >= 2)
        return 'Detected YAML';
      if (/^-\s+.+/m.test(t) && keys) return 'Detected YAML';
      if (lines.length === 1 && /^[a-zA-Z_][\w.-]*:\s*\S+/.test(lines[0])) return 'Detected YAML';
      return null;
    },
    suggestion: make('yaml-formatter', 'YAML Formatter', '/yaml-formatter'),
  },
  {
    id: 'csv',
    priority: 57,
    test: (t) => (looksLikeCsv(t) ? 'Detected CSV data' : null),
    suggestion: make('csv-to-json', 'CSV to JSON', '/csv-to-json'),
  },
  {
    id: 'markdown',
    priority: 58,
    test: (t) =>
      /^#{1,6}\s|^\*{1,2}[^*]+\*{1,2}|\[.*\]\(.*\)/m.test(t) ? 'Detected Markdown' : null,
    suggestion: make('markdown-previewer', 'Markdown Previewer', '/markdown-previewer'),
  },
];

export { DETECTORS };

export function detectContentType(text: string): SmartSuggestion[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const MAX_DETECT_LENGTH = 200_000;

  if (trimmed.length > MAX_DETECT_LENGTH) {
    // Sample head and tail so large certificates still suggest their Tool.
    const sample = `${trimmed.slice(0, 50_000)}\n${trimmed.slice(-50_000)}`;
    if (/-----BEGIN CERTIFICATE-----/.test(sample))
      return [
        {
          toolId: 'certificate-decoder',
          toolName: 'Certificate Decoder',
          path: '/certificate-decoder',
          reason: 'Large input — detected certificate',
        },
      ];
    return [
      {
        toolId: 'json-formatter',
        toolName: 'JSON Formatter',
        path: '/json-formatter',
        reason: 'Large input — open formatter',
      },
      {
        toolId: 'base64-encoder',
        toolName: 'Base64 Decoder',
        path: '/base64-encoder',
        reason: 'Large input — try decode',
      },
      {
        toolId: 'hash-generator',
        toolName: 'Hash Generator',
        path: '/hash-generator',
        reason: 'Large input — generate hash',
      },
    ];
  }

  const matched: Array<SmartSuggestion & { priority: number }> = [];
  for (const detector of DETECTORS) {
    const reason = detector.test(trimmed);
    if (reason) matched.push({ ...detector.suggestion(reason), priority: detector.priority });
  }

  // High-precision detectors (JWT/PEM/git-diff/JSON/UUID/color/timestamp/cron/URL)
  // coexist; generic text detectors only fire when nothing precise matched.
  const precise = matched.filter((m) => m.priority < 40);
  const generic = matched.filter((m) => m.priority >= 40);
  const combined = precise.length > 0 ? [...precise, ...generic.slice(0, 1)] : generic;

  // Enrich JWT with Base64 companion without duplicating JSON noise.
  if (combined.some((s) => s.toolId === 'jwt-decoder') && !combined.some((s) => s.toolId === 'base64-encoder')) {
    combined.push({
      toolId: 'base64-encoder',
      toolName: 'Base64 Decoder',
      path: '/base64-encoder',
      reason: 'Decode Base64 segments',
      priority: 50,
    });
  }
  if (combined.some((s) => s.toolId === 'json-formatter') && !combined.some((s) => s.toolId === 'json-validator')) {
    combined.push({
      toolId: 'json-validator',
      toolName: 'JSON Schema Validator',
      path: '/json-validator',
      reason: 'Validate against schema',
      priority: 20,
    });
  }

  combined.sort((a, b) => a.priority - b.priority);

  if (combined.length === 0 && trimmed.length > 0) {
    return [
      {
        toolId: 'hash-generator',
        toolName: 'Hash Generator',
        path: '/hash-generator',
        reason: 'Generate hash',
      },
      {
        toolId: 'base64-encoder',
        toolName: 'Base64 Encoder',
        path: '/base64-encoder',
        reason: 'Encode to Base64',
      },
      {
        toolId: 'case-converter',
        toolName: 'Case Converter',
        path: '/case-converter',
        reason: 'Convert text case',
      },
    ];
  }

  return combined.slice(0, 4).map(({ priority: _p, ...rest }) => rest);
}
