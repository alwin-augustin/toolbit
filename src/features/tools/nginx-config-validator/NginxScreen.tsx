import { useMemo } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export interface NginxIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface NginxServerBlock {
  listen: string[];
  serverName: string[];
  locations: string[];
}

export const VALID_NGINX_DIRECTIVES: ReadonlySet<string> = new Set([
  'server',
  'location',
  'upstream',
  'events',
  'http',
  'stream',
  'mail',
  'listen',
  'server_name',
  'root',
  'index',
  'try_files',
  'return',
  'proxy_pass',
  'proxy_set_header',
  'proxy_redirect',
  'proxy_buffering',
  'proxy_cache',
  'proxy_cache_valid',
  'proxy_connect_timeout',
  'fastcgi_pass',
  'fastcgi_param',
  'fastcgi_index',
  'access_log',
  'error_log',
  'log_format',
  'ssl_certificate',
  'ssl_certificate_key',
  'ssl_protocols',
  'ssl_ciphers',
  'ssl_prefer_server_ciphers',
  'ssl_session_cache',
  'ssl_session_timeout',
  'worker_processes',
  'worker_connections',
  'use',
  'include',
  'error_page',
  'client_max_body_size',
  'sendfile',
  'keepalive_timeout',
  'gzip',
  'gzip_types',
  'gzip_min_length',
  'add_header',
  'expires',
  'charset',
  'types',
  'default_type',
  'resolver',
  'set',
  'if',
  'rewrite',
  'map',
  'geo',
  'limit_req_zone',
  'limit_req',
  'limit_conn_zone',
  'limit_conn',
  'deny',
  'allow',
  'auth_basic',
  'auth_basic_user_file',
  'autoindex',
  'stub_status',
  'tcp_nopush',
  'tcp_nodelay',
  'multi_accept',
  'accept_mutex',
  'daemon',
  'pid',
  'user',
]);

/**
 * Limited static checks: brace balance, missing semicolons, and a directive
 * allowlist. Passing these checks does not prove the config runs.
 */
export function validateNginxConfig(input: string): {
  issues: NginxIssue[];
  servers: NginxServerBlock[];
} {
  const lines = input.split('\n');
  const issues: NginxIssue[] = [];
  const servers: NginxServerBlock[] = [];
  let braceDepth = 0;
  let inServer = false;
  let currentServer: NginxServerBlock = { listen: [], serverName: [], locations: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (!line || line.startsWith('#')) continue;

    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    if (line.includes('server') && line.includes('{') && !line.includes('server_name')) {
      inServer = true;
      currentServer = { listen: [], serverName: [], locations: [] };
    }

    if (inServer) {
      if (line.startsWith('listen')) {
        const val = line
          .replace(/^listen\s+/, '')
          .replace(/;$/, '')
          .trim();
        currentServer.listen.push(val);
      }
      if (line.startsWith('server_name')) {
        const val = line
          .replace(/^server_name\s+/, '')
          .replace(/;$/, '')
          .trim();
        currentServer.serverName.push(val);
      }
      if (line.startsWith('location')) {
        const val = line
          .replace(/^location\s+/, '')
          .replace(/\s*{.*$/, '')
          .trim();
        currentServer.locations.push(val);
      }
    }

    braceDepth += openBraces - closeBraces;

    if (inServer && braceDepth === 0) {
      inServer = false;
      servers.push(currentServer);
    }

    if (
      !line.endsWith(';') &&
      !line.endsWith('{') &&
      !line.endsWith('}') &&
      !line.startsWith('#') &&
      !line.startsWith('if') &&
      !line.startsWith('location') &&
      !line.startsWith('server') &&
      !line.startsWith('upstream') &&
      !line.startsWith('events') &&
      !line.startsWith('http') &&
      !line.startsWith('stream') &&
      !line.startsWith('map') &&
      line !== '}'
    ) {
      let isBlockStart = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;
        if (nextLine.startsWith('{')) isBlockStart = true;
        break;
      }
      if (!isBlockStart) {
        issues.push({
          line: lineNum,
          message: 'Missing semicolon at end of directive',
          severity: 'error',
        });
      }
    }

    if (line && !line.startsWith('#') && line !== '}' && !line.startsWith('{')) {
      const directive = line.split(/[\s{;]/)[0];
      if (directive && !VALID_NGINX_DIRECTIVES.has(directive) && !directive.startsWith('#')) {
        issues.push({
          line: lineNum,
          message: `Unknown directive: "${directive}"`,
          severity: 'warning',
        });
      }
    }
  }

  if (braceDepth > 0) {
    issues.push({
      line: lines.length,
      message: `${braceDepth} unclosed brace(s)`,
      severity: 'error',
    });
  } else if (braceDepth < 0) {
    issues.push({
      line: lines.length,
      message: `${Math.abs(braceDepth)} extra closing brace(s)`,
      severity: 'error',
    });
  }

  return { issues, servers };
}

export function formatNginxConfig(input: string): string {
  const lines = input.split('\n');
  const result: string[] = [];
  let indent = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      result.push('');
      continue;
    }

    if (line === '}' || line.startsWith('}')) {
      indent = Math.max(0, indent - 1);
    }

    result.push('    '.repeat(indent) + line);

    if (line.endsWith('{')) {
      indent++;
    }
  }

  return result.join('\n');
}

export const NGINX_SAMPLE = `server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}`;

export function NginxScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const { issues, servers } = useMemo(() => {
    if (!input.trim()) return { issues: [], servers: [] };
    return validateNginxConfig(input);
  }, [input]);

  const formatConfig = () => {
    if (!input.trim()) return;
    setInput(formatNginxConfig(input));
    notify('Config formatted');
  };

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(input);
      notify('Config copied');
    } catch {
      notify('Clipboard unavailable. Select the config and copy it.');
    }
  };

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Nginx</h1>
          <p>Configuration helper with limited static checks</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <button type="button" className="wb-button primary" onClick={() => setInput(NGINX_SAMPLE)}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button type="button" className="wb-button" onClick={formatConfig} disabled={!input.trim()}>
          Format
        </button>
        <button type="button" className="wb-button" onClick={() => void copyConfig()}>
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy
        </button>
        <button type="button" className="wb-button" onClick={() => setInput('')} disabled={!input}>
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </button>
      </div>
      <p>
        Limited static checks only: brace balance, missing semicolons, and known directives. Passing
        checks does not prove the config runs. Always verify with nginx -t on the target machine.
      </p>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Config panel">
          <div className="wb-pane-header">
            <h2>Nginx config</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Nginx config"
            placeholder="Paste your nginx configuration here..."
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>
              {input ? `${input.split('\n').length} lines` : 'Waiting for input'} · {servers.length}{' '}
              server blocks
            </span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Checks panel">
          <div className="wb-pane-header">
            <h2>Static checks</h2>
            <span className="wb-result-state">
              {!input.trim()
                ? 'No input yet'
                : errors.length > 0
                  ? `${errors.length} errors, ${warnings.length} warnings`
                  : warnings.length > 0
                    ? `${warnings.length} warnings`
                    : 'Checks passed (not proof it runs)'}
            </span>
          </div>
          <div>
            {!input.trim() ? (
              <div className="wb-empty">
                <h2>No checks yet</h2>
                <p>Paste a config to run limited static checks. Passing is not proof it runs.</p>
              </div>
            ) : null}
            {input.trim() && errors.length === 0 && warnings.length === 0 ? (
              <div className="wb-setting-row">
                <span>
                  <strong>Limited checks passed</strong>
                  <small>
                    Braces, semicolons, and directives look fine. Still verify with nginx -t.
                  </small>
                </span>
                <IconCheck size={20} aria-hidden="true" />
              </div>
            ) : null}
            {issues.map((issue, index) => (
              <div className="wb-list-row" key={`${issue.line}-${index}`}>
                <IconAlertTriangle size={20} aria-hidden="true" />
                <span>
                  <strong>
                    L{issue.line} · {issue.severity}
                  </strong>
                  <small>{issue.message}</small>
                </span>
              </div>
            ))}
            {servers.map((server, index) => (
              <div className="wb-list-row" key={`server-${index}`}>
                <span>
                  <strong>Server {index + 1}</strong>
                  <small>
                    listen: {server.listen.join(', ') || '—'} · names:{' '}
                    {server.serverName.join(', ') || '—'}
                    {server.locations.length > 0
                      ? ` · locations: ${server.locations.join(', ')}`
                      : ''}
                  </small>
                </span>
              </div>
            ))}
          </div>
          <div className="wb-pane-footer">
            <span>
              {issues.length === 0 ? 'No findings' : `${issues.length} findings`} · limited checks
              only
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
