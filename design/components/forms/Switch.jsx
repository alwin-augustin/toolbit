import React from "react";

/** Toggle switch — used for settings like "Network Off", theme. */
export function Switch({ checked = false, onChange, disabled = false, style, ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        position: "relative",
        width: "36px",
        height: "20px",
        flexShrink: 0,
        padding: 0,
        border: "none",
        borderRadius: "var(--radius-full)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        background: checked ? "hsl(var(--primary))" : "hsl(var(--surface-3))",
        boxShadow: checked ? "none" : "inset 0 0 0 1px hsl(var(--border-strong))",
        transition: "background-color var(--duration-base) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "18px" : "2px",
          width: "16px",
          height: "16px",
          borderRadius: "var(--radius-full)",
          background: "#fff",
          boxShadow: "var(--shadow-sm)",
          transition: "left var(--duration-base) var(--ease-out)",
        }}
      />
    </button>
  );
}
