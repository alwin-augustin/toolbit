import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  /** Label node rendered after the box. */
  label?: React.ReactNode;
}

/** Checkbox with inline label. Blue fill + check when on. */
export function Checkbox({ checked = false, onChange, label, disabled = false, style, id, ...rest }: CheckboxProps) {
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        color: 'hsl(var(--text-body))',
        userSelect: 'none',
        ...style,
      }}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: 'hsl(var(--primary))' }}
        {...rest}
      />
      {label ? (
        <label htmlFor={inputId} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
          {label}
        </label>
      ) : null}
    </span>
  );
}
