import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  variant?: 'soft' | 'outline' | 'solid';
}

/** Compact status/count label. Soft tinted fill by default. */

/**
 * Small status/label badge. Soft tinted fill + saturated text per tone.
 * Used for counts, "Saved"/"Preset" tags, validity states, "Local-only".
 */
export function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  style,
  ...rest
}: BadgeProps) {
  const tones = {
    neutral: { h: 'var(--text-muted)', soft: 'var(--surface-3)' },
    primary: { h: 'var(--primary)', soft: 'var(--primary-soft)' },
    success: { h: 'var(--success)', soft: 'var(--success-soft)' },
    warning: { h: 'var(--warning)', soft: 'var(--warning-soft)' },
    danger: { h: 'var(--danger)', soft: 'var(--danger-soft)' },
  };
  const t = tones[tone] || tones.neutral;

  const variants = {
    soft: { background: `hsl(${t.soft})`, color: `hsl(${t.h})`, borderColor: 'transparent' },
    outline: { background: 'transparent', color: `hsl(${t.h})`, borderColor: `hsl(${t.h} / 0.4)` },
    solid: {
      background: `hsl(${t.h})`,
      color: tone === 'neutral' ? 'hsl(var(--surface-0))' : '#fff',
      borderColor: 'transparent',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        height: '20px',
        padding: '0 0.4375rem',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        lineHeight: 1,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid transparent',
        whiteSpace: 'nowrap',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
