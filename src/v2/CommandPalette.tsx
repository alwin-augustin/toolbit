import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Search, Shield } from 'lucide-react';
import { Kbd } from '@/ds/components';
import { TOOLS } from '@/config/tools.config';
import type { ToolMetadata } from '@/config/tools.config';
import { categoryMeta } from './categories';
import { useFocusTrap } from './use-focus-trap';

/** Lightweight fuzzy match: every query char must appear in order. */
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx !== -1) return 1000 - idx; // substring beats scattered match
  let qi = 0;
  let score = 0;
  let last = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += last === ti - 1 ? 5 : 1; // consecutive runs score higher
      last = ti;
      qi++;
    }
  }
  return qi === q.length ? score : -1;
}

function searchTools(query: string): ToolMetadata[] {
  if (!query.trim()) return TOOLS.slice(0, 7);
  return TOOLS.map((t) => {
    const nameScore = fuzzyScore(query, t.name);
    const descScore = fuzzyScore(query, t.description);
    const keywordScore = Math.max(...(t.keywords ?? []).map((k) => fuzzyScore(query, k)), -1);
    return { tool: t, score: Math.max(nameScore * 2, descScore, keywordScore) };
  })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9)
    .map((r) => r.tool);
}

const medium = 'var(--weight-medium)' as CSSProperties['fontWeight'];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
}

export function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchTools(q), [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setSelected(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => setSelected(0), [q]);

  useFocusTrap(open, dialogRef, onClose, inputRef);

  if (!open) return null;

  const pick = (id: string) => {
    onSelect(id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selected]) pick(results[selected].id);
    }
  };

  return (
    <div
      onClick={onClose}
      className="tb-enter-fade"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'hsl(var(--overlay) / 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onKeyDown={onKeyDown}
        className="tb-enter-scale"
        style={{
          width: 560,
          maxWidth: '92vw',
          background: 'hsl(var(--surface-2))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <span id="command-palette-title" className="sr-only">
            Open a tool
          </span>
          <span style={{ color: 'hsl(var(--text-faint))', display: 'inline-flex' }}>
            <Search size={18} />
          </span>
          <input
            ref={inputRef}
            aria-label="Search tools"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'hsl(var(--text-strong))',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-md)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'hsl(var(--text-faint))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-xs)',
              padding: '2px 6px',
            }}
          >
            ESC
          </span>
        </div>
        <div
          role="listbox"
          aria-label="Tool results"
          style={{ maxHeight: 340, overflowY: 'auto', padding: 8 }}
        >
          {results.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: 'hsl(var(--text-faint))',
                fontSize: 'var(--text-sm)',
              }}
            >
              No matches for “{q}”
            </div>
          )}
          {results.map((t, i) => {
            const c = categoryMeta(t.category);
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={i === selected}
                onClick={() => pick(t.id)}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '9px 10px',
                  textAlign: 'left',
                  background: i === selected ? 'hsl(var(--primary-soft))' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 'var(--radius-md)',
                    background: 'hsl(var(--surface-3))',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  {c?.icon(16)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-base)',
                      fontWeight: medium,
                      color: 'hsl(var(--text-strong))',
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-xs)',
                      color: 'hsl(var(--text-muted))',
                    }}
                  >
                    {t.description}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'hsl(var(--text-faint))',
                    textTransform: 'uppercase',
                  }}
                >
                  {c?.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '9px 16px',
            borderTop: '1px solid hsl(var(--border))',
            color: 'hsl(var(--text-faint))',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Kbd>↵</Kbd> open
          </span>
          <span
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Shield size={12} /> local only
          </span>
        </div>
      </div>
    </div>
  );
}
