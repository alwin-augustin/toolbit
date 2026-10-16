import { useMemo, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconSparkles,
} from '@tabler/icons-react';
import { useDocumentField } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';

export const URL_PARSER_SAMPLE =
  'https://user:pass@api.example.com:8443/v2/orders/1042?status=paid&tags=a,b&tags=c#receipt';

export interface ParsedQueryParam {
  /** Decoded name. */
  name: string;
  /** Decoded value. */
  value: string;
  /** Encoded `name=value` pair exactly as it appears in the URL. */
  raw: string;
  /** Encoded name on its own. */
  rawName: string;
}

export interface ParsedUrl {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  /** Default port of the protocol; '' for schemes with no public default. */
  portDefault: string;
  path: string;
  pathSegments: string[];
  fragment: string;
  origin: string;
  query: ParsedQueryParam[];
}

export type UrlParseResult = { ok: true; value: ParsedUrl } | { ok: false; error: string };

function defaultPort(protocol: string): string {
  if (protocol === 'http:') return '80';
  if (protocol === 'https:') return '443';
  // ws/wss are normally 80/443 too, but a WebSocket URL can be served by
  // anything, so claiming a default here would just guess.
  return '';
}

// The query is split by hand instead of read from url.searchParams so every
// occurrence keeps the encoded form as written; searchParams exposes only
// decoded names and values, which would fold `+` and `%20` together.
function parseQuery(search: string): ParsedQueryParam[] {
  if (!search || search === '?') return [];
  return search
    .slice(1)
    .split('&')
    .filter((pair) => pair !== '')
    .map((pair) => {
      const separator = pair.indexOf('=');
      const rawName = separator === -1 ? pair : pair.slice(0, separator);
      // URLSearchParams decodes percent-escapes and turns `+` into a space,
      // which is how a browser reads a form-encoded query string.
      const [decoded = ['', '']] = new URLSearchParams(pair).entries();
      return { name: decoded[0], value: decoded[1], raw: pair, rawName };
    });
}

/** Parse one URL. Empty or relative input is a failure, not a partial result. */
export function parseUrl(input: string): UrlParseResult {
  try {
    const url = new URL(input.trim());
    return {
      ok: true,
      value: {
        protocol: url.protocol,
        username: url.username,
        password: url.password,
        hostname: url.hostname,
        port: url.port,
        portDefault: defaultPort(url.protocol),
        path: url.pathname,
        pathSegments: url.pathname.split('/').filter(Boolean),
        fragment: url.hash,
        origin: url.origin,
        query: parseQuery(url.search),
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid URL' };
  }
}

/** Group a query by name: one occurrence stays a string, repeats become an array. */
export function queryToObject(
  query: Array<{ name: string; value: string }>,
): Record<string, string | string[]> {
  // Null prototype: `__proto__` is a legal query name, and a plain object
  // literal would absorb it instead of storing it.
  const object: Record<string, string | string[]> = Object.create(null);
  for (const { name, value } of query) {
    const current = object[name];
    if (current === undefined) object[name] = value;
    else if (Array.isArray(current)) current.push(value);
    else object[name] = [current, value];
  }
  return object;
}

/** One row of the Components table. The password row is masked until revealed. */
interface ComponentRow {
  key: string;
  label: string;
  value: string;
}

function componentRows(value: ParsedUrl): ComponentRow[] {
  const rows: ComponentRow[] = [
    { key: 'protocol', label: 'Protocol', value: value.protocol },
    { key: 'username', label: 'Username', value: value.username || '—' },
    { key: 'password', label: 'Password', value: value.password },
    { key: 'hostname', label: 'Hostname', value: value.hostname },
    { key: 'port', label: 'Port', value: value.port || '—' },
  ];
  // A default port only says something when the URL left the port out.
  if (value.port === '' && value.portDefault) {
    rows.push({
      key: 'defaultPort',
      label: 'Default port',
      value: `${value.portDefault} (${value.protocol.replace(':', '')})`,
    });
  }
  rows.push(
    { key: 'path', label: 'Path', value: value.path },
    { key: 'fragment', label: 'Fragment', value: value.fragment || '—' },
    { key: 'origin', label: 'Origin', value: value.origin },
    { key: 'pathSegments', label: 'Path segments', value: JSON.stringify(value.pathSegments) },
  );
  return rows;
}

/** The Components table as a plain object, in row order. */
function componentsToObject(value: ParsedUrl): Record<string, string | string[]> {
  const components: Record<string, string | string[]> = {
    protocol: value.protocol,
    username: value.username,
    password: value.password,
    hostname: value.hostname,
    port: value.port,
  };
  if (value.port === '' && value.portDefault) components.defaultPort = value.portDefault;
  components.path = value.path;
  components.fragment = value.fragment;
  components.origin = value.origin;
  components.pathSegments = value.pathSegments;
  return components;
}

/** Combined object behind "Copy as JSON"; repeated query names become arrays. */
function urlToJson(value: ParsedUrl): string {
  return JSON.stringify(
    { components: componentsToObject(value), query: queryToObject(value.query) },
    null,
    2,
  );
}

export function UrlParserScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [revealed, setRevealed] = useState(false);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo(() => parseUrl(input), [input]);
  const value = outcome.ok ? outcome.value : null;

  const componentsJson = value ? JSON.stringify(componentsToObject(value), null, 2) : '';
  const queryJson = value ? JSON.stringify(queryToObject(value.query), null, 2) : '';
  const combinedJson = value ? urlToJson(value) : '';

  // The combined JSON is what "Save Result…" writes: the same object both copy
  // actions would paste together.
  usePublishedResult(combinedJson, 'URL JSON', 'json');

  const loadSample = () => {
    setInput(URL_PARSER_SAMPLE);
    setRevealed(false);
  };

  const clearInput = () => {
    setInput('');
    setRevealed(false);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the text and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>URL Parser</h1>
          <p>Break a URL into protocol, host, path, and query parameters</p>
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
        <Button type="button" variant="outline" className="wb-button" onClick={loadSample}>
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={clearInput}
          disabled={!input}
        >
          <IconEraser size={16} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
      </div>

      <div className="wb-setting-row">
        <span>
          <strong>URL</strong>
          <small>Parsed live as you type.</small>
        </span>
        <Input
          aria-label="URL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://api.example.com/v2/orders?status=paid"
          inputMode="url"
          spellCheck={false}
        />
      </div>

      <div className="wb-toolbar">
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!value}
          onClick={() => void copyText(componentsJson, 'Components')}
        >
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy components
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          disabled={!value}
          onClick={() => void copyText(queryJson, 'Query parameters')}
        >
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy query as JSON
        </Button>
        <Button
          type="button"
          className="wb-button primary"
          disabled={!value}
          onClick={() => void copyText(combinedJson, 'URL JSON')}
        >
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy as JSON
        </Button>
      </div>

      {!input.trim() ? (
        <div className="wb-empty">
          <h2>No URL yet</h2>
          <p>Paste a URL above, or load the sample, to see its parts.</p>
        </div>
      ) : !outcome.ok ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t parse this URL.</strong>
          <span>{outcome.error}</span>
        </div>
      ) : (
        <>
          <div className="wb-card">
            <div className="wb-card-head">
              <h2>Components</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-40 px-3 py-2 text-left font-medium text-ink-faint">
                    Component
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-ink-faint">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {componentRows(outcome.value).map((row) => (
                  <tr key={row.key} className="border-b border-line last:border-b-0">
                    <th
                      scope="row"
                      className="px-3 py-2 text-left align-top font-medium text-ink-muted"
                    >
                      {row.label}
                    </th>
                    <td className="px-3 py-2 align-top">
                      {row.key === 'password' ? (
                        <span className="flex items-center gap-2">
                          <span className="font-mono break-all text-ink">
                            {row.value ? (revealed ? row.value : '••••••') : '—'}
                          </span>
                          {row.value ? (
                            <Toggle
                              pressed={revealed}
                              onPressedChange={(pressed) => setRevealed(pressed)}
                              variant="outline"
                              className="wb-button ml-auto"
                              aria-label={revealed ? 'Hide password' : 'Reveal password'}
                            >
                              {revealed ? (
                                <IconEyeOff size={16} stroke={1.7} aria-hidden="true" />
                              ) : (
                                <IconEye size={16} stroke={1.7} aria-hidden="true" />
                              )}
                              {revealed ? 'Hide' : 'Reveal'}
                            </Toggle>
                          ) : null}
                        </span>
                      ) : (
                        <span className="font-mono break-all text-ink">{row.value}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wb-card">
            <div className="wb-card-head">
              <h2>
                Query parameters
                {outcome.value.query.length > 0 ? ` (${outcome.value.query.length})` : ''}
              </h2>
            </div>
            {outcome.value.query.length === 0 ? (
              <div className="wb-empty">
                <h2>No query parameters</h2>
                <p>This URL has no query string.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-3 py-2 text-left font-medium text-ink-faint">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-ink-faint">
                      Value
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-ink-faint">
                      Raw
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {outcome.value.query.map((param, index) => (
                    <tr
                      key={`${index}-${param.rawName}`}
                      className="border-b border-line last:border-b-0"
                    >
                      <td className="px-3 py-2 align-top font-mono break-all text-ink">
                        {param.name || '—'}
                      </td>
                      <td className="px-3 py-2 align-top font-mono break-all text-ink">
                        {param.value || '—'}
                      </td>
                      <td className="px-3 py-2 align-top font-mono break-all text-ink-muted">
                        {param.raw || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="wb-note border-t border-line">
              Values are decoded with URLSearchParams: + becomes a space and percent-escapes are
              decoded. Raw keeps each pair exactly as it appears in the URL.
            </p>
          </div>
        </>
      )}
    </>
  );
}
