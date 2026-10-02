import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  /** Stretch to container width. */
  fullWidth?: boolean;
}

/** Native `<select>` styled to match inputs, with a chevron. Pass `<option>` children. */

/** Native select styled to match the system, with a chevron. */
export function Select({
  children,
  invalid = false,
  fullWidth = false,
  style,
  ...rest
}: SelectProps) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', width: fullWidth ? '100%' : 'auto' }}
    >
      <select
        onFocus={(e) => {
          setFocus(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          rest.onBlur?.(e);
        }}
        style={{
          appearance: 'none',
          height: '32px',
          width: '100%',
          padding: '0 2rem 0 0.75rem',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-base)',
          color: 'hsl(var(--text-strong))',
          background: 'hsl(var(--surface-0))',
          border: `1px solid ${invalid ? 'hsl(var(--danger))' : focus ? 'hsl(var(--ring))' : 'hsl(var(--border-strong))'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: focus ? '0 0 0 3px hsl(var(--ring) / 0.18)' : 'none',
          transition:
            'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          right: '0.625rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'hsl(var(--text-faint))',
          pointerEvents: 'none',
        }}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
