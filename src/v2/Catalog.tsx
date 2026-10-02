import type { CSSProperties } from 'react';
import { Card } from '@/ds/components';
import { TOOLS } from '@/config/tools.config';
import type { ToolCategory } from '@/config/tools.config';
import { CATEGORIES, categoryMeta } from './categories';

interface CatalogProps {
  category: ToolCategory | null;
  onTool: (id: string) => void;
}

const semibold = 'var(--weight-semibold)' as CSSProperties['fontWeight'];
const medium = 'var(--weight-medium)' as CSSProperties['fontWeight'];

export function Catalog({ category, onTool }: CatalogProps) {
  const cats = category ? CATEGORIES.filter((c) => c.id === category) : CATEGORIES;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 28 }}>
        {cats.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat.id);
          return (
            <section key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: 'hsl(var(--primary-soft))',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  {cat.icon(17)}
                </span>
                <h1
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: semibold,
                    color: 'hsl(var(--text-strong))',
                  }}
                >
                  {cat.label}
                </h1>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'hsl(var(--text-faint))',
                  }}
                >
                  {tools.length} tools
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: 20,
                }}
              >
                Open a tool as a new tab.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {tools.map((t) => (
                  <Card key={t.id} interactive padding="12px" onClick={() => onTool(t.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30,
                          height: 30,
                          borderRadius: 'var(--radius-md)',
                          background: 'hsl(var(--primary-soft))',
                          color: 'hsl(var(--primary))',
                          flexShrink: 0,
                        }}
                      >
                        {categoryMeta(t.category)?.icon(16)}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 'var(--text-sm)',
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
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.description}
                        </span>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
