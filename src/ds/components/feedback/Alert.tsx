import * as React from 'react';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  /** Optional bold title line above the body. */
  title?: React.ReactNode;
  /** Leading icon (Lucide SVG). */
  icon?: React.ReactNode;
}

/** Inline alert/callout banner with soft tinted background. */

/**
 * Inline alert banner. Soft tinted background + leading icon slot.
 * Matches the product's large-file warning / status callouts.
 */
export function Alert({ children, title, tone = 'info', icon, style, ...rest }: AlertProps) {
  const tones = {
    info: { h: 'var(--info)', soft: 'var(--info-soft)' },
    success: { h: 'var(--success)', soft: 'var(--success-soft)' },
    warning: { h: 'var(--warning)', soft: 'var(--warning-soft)' },
    danger: { h: 'var(--danger)', soft: 'var(--danger-soft)' },
  };
  const t = tones[tone] || tones.info;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        gap: '0.625rem',
        padding: '0.625rem 0.75rem',
        background: `hsl(${t.soft})`,
        border: `1px solid hsl(${t.h} / 0.35)`,
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        color: 'hsl(var(--text-body))',
        lineHeight: 'var(--leading-snug)',
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span
          style={{ color: `hsl(${t.h})`, flexShrink: 0, display: 'inline-flex', marginTop: '1px' }}
        >
          {icon}
        </span>
      )}
      <div>
        {title && (
          <div
            style={{
              fontWeight: 'var(--weight-semibold)',
              color: 'hsl(var(--text-strong))',
              marginBottom: children ? '0.125rem' : 0,
            }}
          >
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
