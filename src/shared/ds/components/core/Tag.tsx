import * as React from 'react';

export interface TagProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Selected/active state (blue tint). */
  active?: boolean;
  onClick?: () => void;
}

/** Rounded interactive chip — tool shortcuts, filters, detected-type suggestions. */

/**
 * Tag/chip — interactive pill for tools, filters, detected-type suggestions.
 * Renders as button when onClick set, otherwise as a static span.
 */
export function Tag({ children, icon, active = false, onClick, style, ...rest }: TagProps) {
  const [hover, setHover] = React.useState(false);
  const interactive = !!onClick;

  const bg = active
    ? 'hsl(var(--primary-soft))'
    : hover && interactive
      ? 'hsl(var(--elevate-1))'
      : 'hsl(var(--surface-2))';

  const shared = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    height: '26px',
    padding: '0 0.625rem',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)',
    lineHeight: 1,
    color: active ? 'hsl(var(--primary))' : 'hsl(var(--text-body))',
    background: bg,
    border: `1px solid ${active ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border))'}`,
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
    ...style,
  } as const;

  if (!interactive) {
    return (
      <span style={{ ...shared, cursor: 'default' }} {...rest}>
        {icon}
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...shared,
        cursor: 'pointer',
        transition:
          'background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)',
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
