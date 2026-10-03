import * as React from 'react';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  /** `segment` = filled pill group (Text/Tree toggle); `underline` = text tabs. */
  variant?: 'segment' | 'underline';
}

/** Tab control — segmented pill group or underline tabs. Controlled. */

function onTabKeyDown(e: React.KeyboardEvent, index: number, count: number, select: (i: number) => void) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? (index + 1) % count : (index - 1 + count) % count;
    select(next);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  }
}

/**
 * Segmented / underline tabs. Controlled via value + onChange.
 * `variant="segment"` (default) = filled pill group; "underline" = text + bar.
 */
export function Tabs({
  items = [],
  value,
  onChange,
  variant = 'segment',
  style,
  ...rest
}: TabsProps) {
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        aria-label="Tabs"
        style={{
          display: 'flex',
          gap: '1.25rem',
          borderBottom: '1px solid hsl(var(--border))',
          ...style,
        }}
        {...rest}
      >
        {items.map((it, index) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange?.(it.value)}
              onKeyDown={(e) =>
                onTabKeyDown(e, index, items.length, (i) => onChange?.(items[i].value))
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.125rem',
                marginBottom: '-1px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? 'hsl(var(--primary))' : 'transparent'}`,
                color: active ? 'hsl(var(--text-strong))' : 'hsl(var(--text-muted))',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
                transition: 'color var(--duration-fast) var(--ease-standard)',
              }}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      style={{
        display: 'inline-flex',
        gap: '2px',
        padding: '3px',
        background: 'hsl(var(--surface-3))',
        borderRadius: 'var(--radius-md)',
        ...style,
      }}
      {...rest}
    >
      {items.map((it, index) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(it.value)}
            onKeyDown={(e) =>
              onTabKeyDown(e, index, items.length, (i) => onChange?.(items[i].value))
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              height: '28px',
              padding: '0 0.625rem',
              background: active ? 'hsl(var(--surface-0))' : 'transparent',
              color: active ? 'hsl(var(--text-strong))' : 'hsl(var(--text-muted))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
              transition:
                'background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)',
            }}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
