import { describe, expect, it } from 'vitest';
import {
  API_SAMPLE,
  apiErrorTitle,
  buildCurlCommand,
  isValidHttpUrl,
  prettyPrintBody,
  quoteCurlArg,
} from '@/features/tools/api-request-builder/ApiScreen';
import {
  formatWsContent,
  isValidWsUrl,
  wsStatusLabel,
} from '@/features/tools/websocket-tester/WsScreen';
import {
  filterHttpStatuses,
  HTTP_STATUS_CODES,
  statusCodeLabel,
} from '@/features/tools/http-status-codes/HttpStatusScreen';
import {
  formatNginxConfig,
  validateNginxConfig,
} from '@/features/tools/nginx-config-validator/NginxScreen';
import {
  buildDockerRunCommand,
  shellQuote,
} from '@/features/tools/docker-command-builder/DockerScreen';

describe('curl export builder', () => {
  it('exports a simple GET request with quoted URL', () => {
    expect(buildCurlCommand('GET', 'https://httpbin.org/json', [], '')).toBe(
      `curl 'https://httpbin.org/json'`,
    );
  });

  it('adds method, enabled headers, and body for POST', () => {
    const command = buildCurlCommand(
      'POST',
      'https://api.example.com/users',
      [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'X-Skip', value: 'yes', enabled: false },
      ],
      '{"name":"ada"}',
    );
    expect(command).toContain('-X POST');
    expect(command).toContain(`-H 'Content-Type: application/json'`);
    expect(command).not.toContain('X-Skip');
    expect(command).toContain(`--data-raw '{"name":"ada"}'`);
    expect(command.endsWith(`'https://api.example.com/users'`)).toBe(true);
  });

  it('omits the body for GET requests', () => {
    const command = buildCurlCommand('GET', 'https://example.com', [], '{"a":1}');
    expect(command).not.toContain('--data-raw');
  });

  it('escapes single quotes in shell arguments', () => {
    expect(quoteCurlArg(`a'b`)).toBe(`'a'"'"'b'`);
    const command = buildCurlCommand('POST', 'https://example.com', [], `it's`);
    expect(command).toContain(`'it'"'"'s'`);
  });

  it('validates http and https URLs only', () => {
    expect(isValidHttpUrl('https://api.example.com/users')).toBe(true);
    expect(isValidHttpUrl('http://localhost:3000')).toBe(true);
    expect(isValidHttpUrl('wss://echo.websocket.events')).toBe(false);
    expect(isValidHttpUrl('not a url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });

  it('pretty-prints JSON bodies and leaves text alone', () => {
    expect(prettyPrintBody('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyPrintBody('plain text')).toBe('plain text');
    expect(prettyPrintBody('{broken}')).toBe('{broken}');
  });

  it('labels HTTP errors separately from network failures', () => {
    expect(apiErrorTitle('http')).toContain('HTTP');
    expect(apiErrorTitle('network')).toContain('Network');
    expect(apiErrorTitle('timeout')).toContain('timed out');
    expect(apiErrorTitle('cancelled')).toContain('cancelled');
  });

  it('ships a sample that points at https httpbin', () => {
    expect(API_SAMPLE.method).toBe('GET');
    expect(isValidHttpUrl(API_SAMPLE.url)).toBe(true);
  });
});

describe('websocket URL validation', () => {
  it('accepts ws and wss URLs', () => {
    expect(isValidWsUrl('wss://echo.websocket.events')).toBe(true);
    expect(isValidWsUrl('ws://localhost:8080/chat')).toBe(true);
  });

  it('rejects http, empty, and garbage input', () => {
    expect(isValidWsUrl('https://example.com')).toBe(false);
    expect(isValidWsUrl('http://example.com')).toBe(false);
    expect(isValidWsUrl('')).toBe(false);
    expect(isValidWsUrl('   ')).toBe(false);
    expect(isValidWsUrl('not a url')).toBe(false);
  });

  it('pretty-prints JSON payloads for the log', () => {
    expect(formatWsContent('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(formatWsContent('hello')).toBe('hello');
  });

  it('labels every connection status', () => {
    expect(wsStatusLabel('connected')).toBe('Connected');
    expect(wsStatusLabel('connecting')).toContain('Connecting');
    expect(wsStatusLabel('disconnected')).toBe('Disconnected');
    expect(wsStatusLabel('error')).toBe('Error');
  });
});

describe('http status search filter', () => {
  it('ports the legacy list faithfully with 17 entries', () => {
    expect(HTTP_STATUS_CODES).toHaveLength(17);
    expect(HTTP_STATUS_CODES[0]).toEqual({ code: 100, phrase: 'Continue' });
    expect(HTTP_STATUS_CODES.find((entry) => entry.code === 404)).toEqual({
      code: 404,
      phrase: 'Not Found',
    });
    expect(HTTP_STATUS_CODES.find((entry) => entry.code === 503)).toEqual({
      code: 503,
      phrase: 'Service Unavailable',
    });
  });

  it('returns everything for an empty query', () => {
    expect(filterHttpStatuses('')).toHaveLength(17);
    expect(filterHttpStatuses('   ')).toHaveLength(17);
  });

  it('matches by exact code', () => {
    expect(filterHttpStatuses('404')).toEqual([{ code: 404, phrase: 'Not Found' }]);
    expect(filterHttpStatuses('50')).toHaveLength(4);
  });

  it('matches phrases case-insensitively', () => {
    expect(filterHttpStatuses('not found')).toEqual([{ code: 404, phrase: 'Not Found' }]);
    expect(filterHttpStatuses('BAD GATEWAY')).toEqual([{ code: 502, phrase: 'Bad Gateway' }]);
    expect(filterHttpStatuses('zzz-no-match')).toHaveLength(0);
  });

  it('formats copy text as code plus phrase', () => {
    expect(statusCodeLabel({ code: 200, phrase: 'OK' })).toBe('200 OK');
  });
});

describe('nginx static checks', () => {
  it('flags a missing semicolon as an error', () => {
    const result = validateNginxConfig('server {\n    listen 80\n}\n');
    expect(result.issues.some((issue) => issue.message.includes('semicolon'))).toBe(true);
    expect(result.issues.some((issue) => issue.severity === 'error')).toBe(true);
  });

  it('flags unknown directives as warnings', () => {
    const result = validateNginxConfig('server {\n    frobnicate on;\n}\n');
    expect(
      result.issues.some(
        (issue) => issue.severity === 'warning' && issue.message.includes('frobnicate'),
      ),
    ).toBe(true);
  });

  it('flags unclosed and extra braces', () => {
    const unclosed = validateNginxConfig('server {\n    listen 80;\n');
    expect(unclosed.issues.some((issue) => issue.message.includes('unclosed'))).toBe(true);
    const extra = validateNginxConfig('listen 80;\n}\n');
    expect(extra.issues.some((issue) => issue.message.includes('extra closing'))).toBe(true);
  });

  it('passes a minimal valid server block without issues', () => {
    const result = validateNginxConfig('server {\n    listen 80;\n}\n');
    expect(result.issues).toHaveLength(0);
    expect(result.servers).toHaveLength(1);
    expect(result.servers[0]).toMatchObject({ listen: ['80'] });
  });

  it('summarizes listen, server names, and locations', () => {
    const result = validateNginxConfig(
      'server {\n    listen 443 ssl;\n    server_name example.com;\n    location /api {\n        proxy_pass http://localhost:3000;\n    }\n}\n',
    );
    expect(result.servers[0]).toMatchObject({
      listen: ['443 ssl'],
      serverName: ['example.com'],
      locations: ['/api'],
    });
  });

  it('indents nested blocks when formatting', () => {
    expect(formatNginxConfig('server {\nlisten 80;\n}\n')).toBe('server {\n    listen 80;\n}\n');
  });
});

describe('docker command builder', () => {
  it('builds the sample nginx command', () => {
    const command = buildDockerRunCommand({
      image: 'nginx:latest',
      name: 'my-nginx',
      ports: [{ host: '8080', container: '80', protocol: 'tcp' }],
      volumes: [],
      env: [],
      network: '',
      restart: '',
      flags: { detach: true, rm: false, interactive: false, privileged: false },
    });
    expect(command).toBe(
      'docker run \\\n  -d \\\n  --name my-nginx \\\n  -p 8080:80 \\\n  nginx:latest',
    );
  });

  it('maps ports, volumes, env, network, and restart flags', () => {
    const command = buildDockerRunCommand({
      image: 'postgres:16',
      name: 'db',
      ports: [{ host: '5432', container: '5432', protocol: 'tcp' }],
      volumes: [{ host: 'pgdata', container: '/var/lib/postgresql/data', mode: 'rw' }],
      env: [{ key: 'POSTGRES_PASSWORD', value: 'secret' }],
      network: 'app-net',
      restart: 'always',
      flags: { detach: true, rm: true, interactive: false, privileged: false },
    });
    expect(command).toContain('--rm');
    expect(command).toContain('--network app-net');
    expect(command).toContain('--restart always');
    expect(command).toContain('-v pgdata:/var/lib/postgresql/data');
    expect(command).toContain('-e POSTGRES_PASSWORD=secret');
  });

  it('keeps udp suffixes and read-only volume flags', () => {
    const command = buildDockerRunCommand({
      image: 'img',
      name: '',
      ports: [{ host: '53', container: '53', protocol: 'udp' }],
      volumes: [{ host: './html', container: '/usr/share/nginx/html', mode: 'ro' }],
      env: [],
      network: '',
      restart: '',
      flags: { detach: false, rm: false, interactive: false, privileged: false },
    });
    expect(command).toContain('-p 53:53/udp');
    expect(command).toContain('-v ./html:/usr/share/nginx/html:ro');
  });

  it('quotes values with spaces and escapes single quotes', () => {
    expect(shellQuote('nginx:latest')).toBe('nginx:latest');
    expect(shellQuote('my volume')).toBe(`'my volume'`);
    expect(shellQuote(`a'b`)).toBe(`'a'"'"'b'`);
    const command = buildDockerRunCommand({
      image: 'nginx:latest',
      name: 'my container',
      ports: [],
      volumes: [{ host: 'my data', container: '/data', mode: 'rw' }],
      env: [{ key: 'GREETING', value: 'hello world' }],
      network: '',
      restart: '',
      flags: { detach: false, rm: false, interactive: true, privileged: false },
    });
    expect(command).toContain(`--name 'my container'`);
    expect(command).toContain(`-v 'my data:/data'`);
    expect(command).toContain(`-e 'GREETING=hello world'`);
    expect(command).toContain('-it');
  });

  it('falls back to nginx:latest for a blank image', () => {
    const command = buildDockerRunCommand({
      image: '   ',
      name: '',
      ports: [],
      volumes: [],
      env: [],
      network: '',
      restart: '',
      flags: { detach: false, rm: false, interactive: false, privileged: false },
    });
    expect(command).toBe('docker run \\\n  nginx:latest');
  });
});
