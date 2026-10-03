import { useRef, useState } from 'react';
import {
  IconCopy,
  IconDeviceDesktop,
  IconPlus,
  IconSend,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export const API_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const API_SAMPLE: {
  method: HttpMethod;
  url: string;
  headers: ApiHeader[];
  body: string;
} = {
  method: 'GET',
  url: 'https://httpbin.org/json',
  headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
  body: '',
};

export const API_TIMEOUT_DEFAULT = 15;
export const MAX_API_RESPONSE_BYTES = 1_000_000;

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'cancelled' | 'validation' | '';

/** Single-quote a shell argument, escaping embedded quotes. Copy only, never executed. */
export function quoteCurlArg(value: string): string {
  const singleLine = value.replace(/[\r\n]+/g, ' ');
  return `'${singleLine.replace(/'/g, `'"'"'`)}'`;
}

/** Build a copy-only cURL command for the current request. Never executed here. */
export function buildCurlCommand(
  method: HttpMethod,
  url: string,
  headers: ApiHeader[],
  body: string,
): string {
  const parts = ['curl'];
  if (method !== 'GET') parts.push('-X', method);
  for (const header of headers) {
    if (header.enabled && header.key.trim()) {
      parts.push('-H', quoteCurlArg(`${header.key.trim()}: ${header.value}`));
    }
  }
  if (method !== 'GET' && body.trim()) parts.push('--data-raw', quoteCurlArg(body));
  parts.push(quoteCurlArg(url));
  return parts.join(' ');
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Pretty-print JSON bodies; return other bodies untouched. */
export function prettyPrintBody(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

export function apiErrorTitle(kind: ApiErrorKind): string {
  if (kind === 'http') return 'Endpoint returned an HTTP error.';
  if (kind === 'network') return 'Network failure. The endpoint sent no response.';
  if (kind === 'timeout') return 'Request timed out.';
  if (kind === 'cancelled') return 'Request cancelled.';
  return 'Check the request.';
}

export function ApiScreen() {
  const [method, setMethod] = useSessionDocumentState<HttpMethod>('method', 'GET');
  const [url, setUrl] = useDocumentField<string>('url', '');
  const [headers, setHeaders] = useSessionDocumentState<ApiHeader[]>('headers', [
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useDocumentField<string>('body', '');
  const [timeoutSecs, setTimeoutSecs] = useSessionDocumentState<number>(
    'timeoutSecs',
    API_TIMEOUT_DEFAULT,
  );
  const [response, setResponse] = useState('');
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<ApiErrorKind>('');
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  const sendRequest = async () => {
    if (!url.trim()) {
      setError('Enter a URL first.');
      setErrorKind('validation');
      return;
    }
    if (!isValidHttpUrl(url)) {
      setError('URL must start with http:// or https://.');
      setErrorKind('validation');
      return;
    }
    abortRef.current?.abort();
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const controller = new AbortController();
    abortRef.current = controller;
    cancelledRef.current = false;
    setLoading(true);
    setError('');
    setErrorKind('');
    setResponse('');
    setResponseHeaders({});
    setStatus(null);
    setElapsed(null);
    const started = performance.now();
    const timeoutMs = Math.max(1, Math.min(120, timeoutSecs || API_TIMEOUT_DEFAULT)) * 1000;
    let timedOut = false;
    timerRef.current = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const requestHeaders: Record<string, string> = {};
      for (const header of headers) {
        if (header.enabled && header.key.trim()) requestHeaders[header.key.trim()] = header.value;
      }
      const init: RequestInit = { method, headers: requestHeaders, signal: controller.signal };
      if (method !== 'GET' && body.trim()) init.body = body;
      const res = await fetch(url.trim(), init);
      setElapsed(Math.round(performance.now() - started));
      setStatus(res.status);
      const headerRecord: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headerRecord[key] = value;
      });
      setResponseHeaders(headerRecord);
      const text = await res.text();
      if (text.length > MAX_API_RESPONSE_BYTES) {
        setResponse(
          `${prettyPrintBody(text.slice(0, MAX_API_RESPONSE_BYTES))}\n\n… truncated to first 1 MB of ${text.length} characters.`,
        );
      } else {
        setResponse(prettyPrintBody(text));
      }
      if (!res.ok) {
        setErrorKind('http');
        setError(
          `Endpoint returned HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}. This is an endpoint response, not a tool failure.`,
        );
      }
    } catch (err) {
      setElapsed(Math.round(performance.now() - started));
      setStatus(0);
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (cancelledRef.current) {
          setErrorKind('cancelled');
          setError('Request cancelled before a response arrived.');
        } else if (timedOut) {
          setErrorKind('timeout');
          setError(
            `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for the endpoint above.`,
          );
        } else {
          setErrorKind('cancelled');
          setError('Request aborted.');
        }
      } else {
        setErrorKind('network');
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(
          `Network failure: ${message}. The request left this device for the endpoint above. Check the URL and your connection.`,
        );
      }
    } finally {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      abortRef.current = null;
      setLoading(false);
    }
  };

  const cancelRequest = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
  };

  const loadSample = () => {
    setMethod(API_SAMPLE.method);
    setUrl(API_SAMPLE.url);
    setHeaders(API_SAMPLE.headers);
    setBody(API_SAMPLE.body);
  };

  const clear = () => {
    setUrl('');
    setBody('');
    setResponse('');
    setResponseHeaders({});
    setStatus(null);
    setElapsed(null);
    setError('');
    setErrorKind('');
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map((header, i) => (i === index ? { ...header, [field]: value } : header)));
  };

  const toggleHeader = (index: number, enabled: boolean) => {
    setHeaders(headers.map((header, i) => (i === index ? { ...header, enabled } : header)));
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const headerEntries = Object.entries(responseHeaders);
  const responseLooksJson =
    response.trimStart().startsWith('{') || response.trimStart().startsWith('[');
  const curlCommand = buildCurlCommand(method, url, headers, body);

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>API Request</h1>
          <p>Send HTTP requests and inspect responses</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconSend size={16} />
            Sends to the endpoint you choose
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      <div className="wb-toolbar">
        <button type="button" className="wb-button primary" onClick={loadSample}>
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
        <button
          type="button"
          className="wb-button"
          onClick={clear}
          disabled={!url && !body && !response}
        >
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </button>
        {loading ? (
          <button type="button" className="wb-button" onClick={cancelRequest}>
            <IconX size={22} stroke={1.7} aria-hidden="true" />
            Cancel
          </button>
        ) : (
          <button
            type="button"
            className="wb-button primary"
            onClick={() => void sendRequest()}
            disabled={!url.trim()}
          >
            <IconSend size={22} stroke={1.7} aria-hidden="true" />
            Send
          </button>
        )}
        <button
          type="button"
          className="wb-button"
          onClick={() => void copyText(curlCommand, 'cURL command')}
          disabled={!url.trim()}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy as cURL
        </button>
        <small>Sends to: {url.trim() || 'No URL yet'}</small>
        {loading ? <span>Sending…</span> : null}
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>{apiErrorTitle(errorKind)}</strong>
          <span>{error}</span>
          {errorKind === 'network' || errorKind === 'timeout' ? (
            <small>HTTP errors (4xx, 5xx) appear with a status code instead.</small>
          ) : null}
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Method</strong>
          <small>HTTP verb sent to the endpoint</small>
        </span>
        <select
          aria-label="HTTP method"
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
        >
          {API_METHODS.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>URL</strong>
          <small>Endpoint that receives this request</small>
        </span>
        <input
          aria-label="Request URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/users"
          inputMode="url"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void sendRequest();
          }}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Timeout: {timeoutSecs}s</strong>
          <small>1 to 120 seconds. Cancel anytime.</small>
        </span>
        <input
          type="number"
          aria-label="Timeout seconds"
          min={1}
          max={120}
          value={timeoutSecs}
          onChange={(e) =>
            setTimeoutSecs(
              Math.max(1, Math.min(120, Number(e.target.value) || API_TIMEOUT_DEFAULT)),
            )
          }
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Copy as cURL only</strong>
          <small>Exported commands are for copying. They are never executed here.</small>
        </span>
        <button
          type="button"
          className="wb-button"
          onClick={() => void copyText(curlCommand, 'cURL command')}
          disabled={!url.trim()}
        >
          <IconCopy size={20} aria-hidden="true" />
          Copy
        </button>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Headers</strong>
          <small>{headers.length} configured</small>
        </span>
        <button type="button" className="wb-button" onClick={addHeader}>
          <IconPlus size={20} aria-hidden="true" />
          Add header
        </button>
      </div>
      {headers.map((header, index) => (
        <div className="wb-list-row" key={`header-${index}`}>
          <input
            type="checkbox"
            aria-label={`Enable header ${index + 1}`}
            checked={header.enabled}
            onChange={(e) => toggleHeader(index, e.target.checked)}
          />
          <span>
            <strong>Header {index + 1}</strong>
            <small>{header.enabled ? 'Sent with the request' : 'Disabled'}</small>
          </span>
          <input
            aria-label={`Header ${index + 1} name`}
            value={header.key}
            onChange={(e) => updateHeader(index, 'key', e.target.value)}
            placeholder="Header name"
          />
          <input
            aria-label={`Header ${index + 1} value`}
            value={header.value}
            onChange={(e) => updateHeader(index, 'value', e.target.value)}
            placeholder="Value"
          />
          <button
            type="button"
            className="wb-icon-button"
            aria-label={`Remove header ${index + 1}`}
            onClick={() => removeHeader(index)}
          >
            <IconX size={20} />
          </button>
        </div>
      ))}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Body panel">
          <div className="wb-pane-header">
            <h2>Body</h2>
            <span className="wb-result-state">
              {method === 'GET' ? 'GET sends no body' : `${body.length} characters`}
            </span>
          </div>
          <CodeEditor
            value={body}
            onChange={setBody}
            wrap={wrap}
            label="Request body"
            placeholder='{"key": "value"}'
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{method === 'GET' ? 'Body ignored for GET' : 'Sent as the request body'}</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Response panel">
          <div className="wb-pane-header">
            <h2>Response</h2>
            <span className="wb-result-state">
              {status === null
                ? 'No response yet'
                : status === 0
                  ? 'No response (network failure)'
                  : `Status ${status} · ${elapsed ?? 0}ms`}
            </span>
            <div className="wb-copy-actions">
              <button
                type="button"
                className="wb-button primary"
                disabled={!response}
                onClick={() => void copyText(response, 'Response body')}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy body
              </button>
            </div>
          </div>
          {response || status !== null ? (
            <CodeEditor
              value={response}
              language={responseLooksJson ? 'json' : 'text'}
              readOnly
              label="Response body"
            />
          ) : (
            <div className="wb-empty">
              <h2>No response yet</h2>
              <p>
                Choose a method and URL, then press Send. The request goes to the endpoint above.
              </p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>
              {status === null
                ? 'Waiting for a request'
                : `Status ${status} · ${elapsed ?? 0}ms · ${headerEntries.length} headers`}
            </span>
          </div>
        </section>
      </div>
      {headerEntries.length > 0 ? (
        <>
          <h2 className="wb-section-title">Response headers</h2>
          {headerEntries.map(([key, value]) => (
            <div className="wb-setting-row" key={key}>
              <span>
                <strong>{key}</strong>
                <small>{value}</small>
              </span>
            </div>
          ))}
        </>
      ) : null}
    </>
  );
}
