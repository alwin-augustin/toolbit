import { useSessionDocumentState } from '@/v2/document-state';
import { copyText } from '@/lib/clipboard';
import { useDocumentField } from '@/v2/document-state';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Copy, Check, Plug, Unplug, Send, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { Button, IconButton, Input, Textarea, Checkbox, StatusPill } from '@/ds/components';
import { Panel, PanelHeader, EditorSplit } from '@/v2/EditorPanels';
import { Row, Stat } from '@/v2/restyle-kit';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

interface Message {
  id: number;
  direction: 'sent' | 'received' | 'system' | 'error';
  content: string;
  timestamp: Date;
}

type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const STATUS_TONES: Record<string, PillTone> = {
  disconnected: 'neutral',
  connecting: 'warning',
  connected: 'success',
  error: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Error',
};

const DIRECTION_COLORS: Record<Message['direction'], string> = {
  sent: 'hsl(var(--primary))',
  received: 'hsl(var(--success))',
  system: 'hsl(var(--text-faint))',
  error: 'hsl(var(--danger))',
};

function MessageCopyButton({ onCopy }: { onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      size="sm"
      title="Copy message"
      onClick={() => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </IconButton>
  );
}

export default function WebSocketTester() {
  const [url, setUrl] = useDocumentField<string>('url', 'wss://echo.websocket.events');
  const [status, setStatus] = useState('disconnected');
  const [messageInput, setMessageInput] = useSessionDocumentState('messageInput', '');
  const [messages, setMessages] = useSessionDocumentState<Message[]>('messages', []);
  const [autoReconnect, setAutoReconnect] = useSessionDocumentState('autoReconnect', false);
  const wsRef = useRef<WebSocket | null>(null);
  const msgIdRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const shareState = useMemo(() => ({ url, autoReconnect }), [url, autoReconnect]);
  useUrlState(shareState, (state) => {
    setUrl(typeof state.url === 'string' ? state.url : 'wss://echo.websocket.events');
    setAutoReconnect(state.autoReconnect === true);
  });
  const { addEntry } = useToolHistory('websocket-tester', 'WebSocket Tester');

  const addMessage = useCallback(
    (direction: Message['direction'], content: string) => {
      const msg: Message = { id: msgIdRef.current++, direction, content, timestamp: new Date() };
      setMessages((prev) => [...prev, msg]);
    },
    [setMessages],
  );

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    try {
      setStatus('connecting');
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus('connected');
        addMessage('system', `Connected to ${url}`);
      };

      ws.onmessage = (event) => {
        const data = typeof event.data === 'string' ? event.data : '[Binary data]';
        addMessage('received', data);
      };

      ws.onerror = () => {
        setStatus('error');
        addMessage('error', 'Connection error occurred');
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        addMessage(
          'system',
          `Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`,
        );
        wsRef.current = null;
        if (autoReconnect && event.code !== 1000) {
          setTimeout(() => connect(), 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      addMessage(
        'error',
        `Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }, [url, autoReconnect, addMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !messageInput.trim())
      return;
    wsRef.current.send(messageInput);
    addMessage('sent', messageInput);
    setMessageInput('');
  }, [messageInput, addMessage, setMessageInput]);

  const formatContent = (content: string): string => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  };

  const copyMessage = useCallback(
    async (content: string) => {
      if (!(await copyText(content))) return;
      addEntry({ input: url, output: content, metadata: { action: 'copy' } });
    },
    [addEntry, url],
  );

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const directionIcons: Record<string, ReactNode> = {
    sent: <ArrowUp size={12} style={{ color: DIRECTION_COLORS.sent }} />,
    received: <ArrowDown size={12} style={{ color: DIRECTION_COLORS.received }} />,
  };

  const isActive = status === 'connected' || status === 'connecting';

  return (
    <EditorSplit>
      <Panel>
        <PanelHeader
          title="Connection"
          badge={<StatusPill tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</StatusPill>}
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: 12,
            display: 'grid',
            gap: 12,
            alignContent: 'start',
          }}
        >
          <Row wrap={false}>
            <Input
              mono
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="wss://echo.websocket.events"
              style={{ flex: 1 }}
              disabled={isActive}
            />
            {isActive ? (
              <Button
                variant="destructive"
                size="sm"
                iconLeft={<Unplug size={14} />}
                onClick={disconnect}
              >
                Disconnect
              </Button>
            ) : (
              <Button size="sm" iconLeft={<Plug size={14} />} onClick={connect}>
                Connect
              </Button>
            )}
          </Row>

          <Checkbox
            checked={autoReconnect}
            onChange={(v) => setAutoReconnect(v)}
            label="Auto-reconnect"
          />

          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'hsl(var(--text-body))',
              }}
            >
              Message
            </label>
            <Textarea
              mono
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder='Type a message... (e.g., {"type": "hello"})'
              style={{ minHeight: 80 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={status !== 'connected'}
            />
            <Row>
              <Button
                size="sm"
                iconLeft={<Send size={14} />}
                onClick={sendMessage}
                disabled={status !== 'connected' || !messageInput.trim()}
              >
                Send
              </Button>
              <span style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--text-faint))' }}>
                Enter to send, Shift+Enter for a new line
              </span>
            </Row>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border-faint))', paddingTop: 8 }}>
            <Stat label="Sent" value={messages.filter((m) => m.direction === 'sent').length} />
            <Stat
              label="Received"
              value={messages.filter((m) => m.direction === 'received').length}
            />
            <Stat label="Total" value={messages.length} />
          </div>
        </div>
      </Panel>
      <Panel>
        <PanelHeader
          title="Message log"
          action={
            <IconButton size="sm" title="Clear log" onClick={() => setMessages([])}>
              <Trash2 size={14} />
            </IconButton>
          }
        />
        <div
          ref={logRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: 8,
            display: 'grid',
            gap: 4,
            alignContent: 'start',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                fontSize: 'var(--text-sm)',
                color: 'hsl(var(--text-faint))',
              }}
            >
              Connect to a WebSocket server to start
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                borderLeft: `2px solid ${DIRECTION_COLORS[msg.direction]}`,
                background: 'hsl(var(--surface-1))',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                padding: '6px 8px 6px 12px',
                fontSize: 'var(--text-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--text-xs)',
                    color: 'hsl(var(--text-muted))',
                  }}
                >
                  {directionIcons[msg.direction]}
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                    {msg.direction}
                  </span>
                  <span>{msg.timestamp.toLocaleTimeString()}</span>
                </div>
                <MessageCopyButton onCopy={() => copyMessage(msg.content)} />
              </div>
              <pre
                style={{
                  margin: '4px 0 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'hsl(var(--text-body))',
                }}
              >
                {formatContent(msg.content)}
              </pre>
            </div>
          ))}
        </div>
      </Panel>
    </EditorSplit>
  );
}
