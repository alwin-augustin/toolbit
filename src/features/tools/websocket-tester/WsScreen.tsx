import { useEffect, useRef, useState } from 'react';
import {
  IconCopy,
  IconDeviceDesktop,
  IconPlug,
  IconSend,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type WsDirection = 'sent' | 'received' | 'system' | 'error';

export interface WsMessage {
  id: number;
  direction: WsDirection;
  content: string;
  time: string;
}

export const WS_SAMPLE_URL = 'wss://echo.websocket.events';

export const WS_SAMPLE_MESSAGE = '{"type": "hello"}';

export const WS_CONNECT_TIMEOUT_MS = 10000;
export const MAX_WS_MESSAGES = 500;
export const MAX_WS_CONTENT = 100_000;

export function isValidWsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
}

/** Pretty-print JSON payloads; return other content untouched. */
export function formatWsContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return content;
    }
  }
  return content;
}

export function wsStatusLabel(status: WsStatus): string {
  if (status === 'connected') return 'Connected';
  if (status === 'connecting') return 'Connecting…';
  if (status === 'error') return 'Error';
  return 'Disconnected';
}

export function WsScreen() {
  const [url, setUrl] = useDocumentField<string>('url', WS_SAMPLE_URL);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [messageInput, setMessageInput] = useSessionDocumentState<string>('messageInput', '');
  const [messages, setMessages] = useSessionDocumentState<WsMessage[]>('messages', []);
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const addMessage = (direction: WsDirection, content: string) => {
    const truncated =
      content.length > MAX_WS_CONTENT
        ? `${content.slice(0, MAX_WS_CONTENT)}… (truncated)`
        : content;
    const message: WsMessage = {
      id: idRef.current++,
      direction,
      content: truncated,
      time: new Date().toISOString(),
    };
    setMessages((previous) => [...previous.slice(-(MAX_WS_MESSAGES - 1)), message]);
  };

  const clearTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const connect = () => {
    if (!url.trim()) {
      setError('Enter a WebSocket URL first.');
      return;
    }
    if (!isValidWsUrl(url)) {
      setError('URL must start with ws:// or wss://.');
      return;
    }
    wsRef.current?.close();
    clearTimeout();
    setError('');
    setStatus('connecting');
    let socket: WebSocket;
    try {
      socket = new WebSocket(url.trim());
    } catch (err) {
      setStatus('error');
      const detail = err instanceof Error ? err.message : 'Unknown error';
      addMessage('error', `Failed to connect: ${detail}`);
      return;
    }
    wsRef.current = socket;
    timeoutRef.current = window.setTimeout(() => {
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.close();
        setStatus('error');
        setError(`Timed out after 10s waiting for ${url.trim()}.`);
        addMessage('error', `Connection timed out after 10s: ${url.trim()}`);
      }
      timeoutRef.current = null;
    }, WS_CONNECT_TIMEOUT_MS);
    socket.onopen = () => {
      clearTimeout();
      setStatus('connected');
      setError('');
      addMessage('system', `Connected to ${url.trim()}`);
    };
    socket.onmessage = (event: MessageEvent) => {
      const data = typeof event.data === 'string' ? event.data : '[Binary data]';
      addMessage('received', data);
    };
    socket.onerror = () => {
      setStatus('error');
      addMessage('error', 'Connection error. The endpoint did not accept the connection.');
    };
    socket.onclose = (event: CloseEvent) => {
      clearTimeout();
      wsRef.current = null;
      setStatus((current) => (current === 'error' ? current : 'disconnected'));
      addMessage('system', `Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
    };
  };

  const disconnect = () => {
    clearTimeout();
    wsRef.current?.close(1000, 'User disconnected');
  };

  const sendMessage = () => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !messageInput.trim()) return;
    socket.send(messageInput);
    addMessage('sent', messageInput);
    setMessageInput('');
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  const loadSample = () => {
    setUrl(WS_SAMPLE_URL);
    setMessageInput(WS_SAMPLE_MESSAGE);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  const isActive = status === 'connected' || status === 'connecting';
  const sentCount = messages.filter((message) => message.direction === 'sent').length;
  const receivedCount = messages.filter((message) => message.direction === 'received').length;

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>WebSocket</h1>
          <p>Connect to a server and exchange messages in real time</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconPlug size={16} />
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
        {isActive ? (
          <button type="button" className="wb-button" onClick={disconnect}>
            <IconX size={22} stroke={1.7} aria-hidden="true" />
            Disconnect
          </button>
        ) : (
          <button type="button" className="wb-button primary" onClick={connect}>
            <IconPlug size={22} stroke={1.7} aria-hidden="true" />
            Connect
          </button>
        )}
        <button
          type="button"
          className="wb-button"
          onClick={() => setMessages([])}
          disabled={messages.length === 0}
        >
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear log
        </button>
        <small>Connects to: {url.trim() || 'No URL yet'}</small>
        <span className="wb-result-state">{wsStatusLabel(status)}</span>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t connect to this endpoint.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Endpoint URL</strong>
          <small>Messages go to this server. Must start with ws:// or wss://.</small>
        </span>
        <input
          aria-label="WebSocket URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="wss://echo.websocket.events"
          inputMode="url"
          disabled={isActive}
        />
      </div>
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Send panel">
          <div className="wb-pane-header">
            <h2>Message</h2>
            <div className="wb-copy-actions">
              <button
                type="button"
                className="wb-button primary"
                onClick={sendMessage}
                disabled={status !== 'connected' || !messageInput.trim()}
              >
                <IconSend size={22} stroke={1.7} aria-hidden="true" />
                Send
              </button>
            </div>
          </div>
          <CodeEditor
            value={messageInput}
            onChange={setMessageInput}
            wrap={wrap}
            label="Message to send"
            placeholder='Type a message... (e.g. {"type": "hello"})'
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>
              {status === 'connected'
                ? 'Press Send. Messages go to the endpoint above.'
                : 'Connect first, then send.'}
            </span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Message log panel">
          <div className="wb-pane-header">
            <h2>Message log</h2>
            <button
              type="button"
              className="wb-button quiet"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
            >
              Clear
            </button>
          </div>
          <div ref={logRef} role="log" aria-live="polite" aria-label="WebSocket message log">
            {messages.length === 0 ? (
              <div className="wb-empty">
                <h2>No messages yet</h2>
                <p>Connect to a WebSocket server to start.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div className="wb-list-row" key={message.id}>
                  <span>
                    <strong>
                      {message.direction} ·{' '}
                      {new Date(message.time).toLocaleTimeString() || message.time}
                    </strong>
                    <small>{formatWsContent(message.content)}</small>
                  </span>
                  <span className="wb-row-action">
                    <button
                      type="button"
                      className="wb-icon-button"
                      aria-label={`Copy ${message.direction} message`}
                      onClick={() => void copyText(message.content, 'Message')}
                    >
                      <IconCopy size={20} />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="wb-pane-footer">
            <span>
              {messages.length === 0
                ? 'Waiting for connection'
                : `${messages.length} total · ${sentCount} sent · ${receivedCount} received`}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
