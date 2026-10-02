import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { X, Clock } from 'lucide-react';
import { IconButton } from '@/ds/components';
import { getRecentHistory, type ToolHistoryEntry } from '@/lib/history-db';
import { useFocusTrap } from './use-focus-trap';

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function preview(text?: string, max = 90): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

const semibold = 'var(--weight-semibold)' as CSSProperties['fontWeight'];
const medium = 'var(--weight-medium)' as CSSProperties['fontWeight'];

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenTool: (toolId: string) => void;
}

export function HistoryPanel({ open, onClose, onOpenTool }: HistoryPanelProps) {
  const [entries, setEntries] = useState<ToolHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useFocusTrap(open, panelRef, onClose);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getRecentHistory(30)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="tb-enter-fade"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'hsl(var(--overlay) / 0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-panel-title"
        onClick={(e) => e.stopPropagation()}
        className="tb-enter-slide-up"
        style={{
          width: 360,
          height: '100%',
          overflowY: 'auto',
          background: 'hsl(var(--surface-1))',
          borderLeft: '1px solid hsl(var(--border))',
          padding: '0 16px 16px',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 'var(--header-height)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} />
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: semibold,
                color: 'hsl(var(--text-strong))',
              }}
            >
              <span id="history-panel-title">History</span>
            </span>
          </div>
          <IconButton size="sm" title="Close history" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </header>

        {loading && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--text-faint))' }}>Loading…</p>
        )}
        {!loading && entries.length === 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--text-faint))' }}>
            Nothing here yet. Tool runs are saved locally as you work.
          </p>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {entries.map((e) => (
            <button
              key={`${e.toolId}-${e.timestamp}`}
              onClick={() => {
                onOpenTool(e.toolId);
                onClose();
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 10px',
                background: 'hsl(var(--surface-0))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: medium,
                    color: 'hsl(var(--text-strong))',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {e.toolName}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-2xs)',
                    color: 'hsl(var(--text-faint))',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatTimestamp(e.timestamp)}
                </span>
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  color: 'hsl(var(--text-muted))',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {preview(e.input)}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
