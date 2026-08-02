import React from "react";

/** Checkbox with label. Controlled via checked/onChange. */
export function Checkbox({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-base)",
        color: "hsl(var(--text-body))",
        userSelect: "none",
        ...style,
      }}
      {...rest}
    >
      <span
        onClick={() => !disabled && onChange?.(!checked)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "18px",
          height: "18px",
          flexShrink: 0,
          borderRadius: "var(--radius-xs)",
          background: checked ? "hsl(var(--primary))" : "hsl(var(--surface-0))",
          border: `1px solid ${checked ? "hsl(var(--primary))" : "hsl(var(--border-strong))"}`,
          transition: "background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
