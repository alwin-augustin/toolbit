import * as React from 'react';

export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tooltip text. */
  label: React.ReactNode;
  /** The trigger element. */
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/** Hover/focus tooltip wrapping a trigger element. Dark pill, appears on hover. */

/** Tooltip — hover label. CSS-only via wrapper; appears on hover/focus. */
export function Tooltip({ children, label, side = 'top', style, ...rest }: TooltipProps) {
  const [show, setShow] = React.useState(false);

  const pos = {
    top: { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
    left: { right: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
    right: { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
  }[side];

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocusCapture={() => setShow(true)}
      onBlurCapture={() => setShow(false)}
      {...rest}
    >
      {children}
      <span
        role="tooltip"
        style={{
          position: 'absolute',
          ...pos,
          zIndex: 50,
          padding: '0.25rem 0.5rem',
          background: 'hsl(var(--overlay))',
          color: 'hsl(0 0% 98%)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-medium)',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          opacity: show ? 1 : 0,
          visibility: show ? 'visible' : 'hidden',
          transform: `${pos.transform} translateY(${show ? '0' : '2px'})`,
          transition:
            'opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)',
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>
    </span>
  );
}
