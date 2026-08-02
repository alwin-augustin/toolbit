import React from "react";

/** Single-line text input. Monospace optional (for code/data values). */
export function Input({ mono = false, invalid = false, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
      style={{
        height: "32px",
        width: "100%",
        padding: "0 0.75rem",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: "var(--text-base)",
        color: "hsl(var(--text-strong))",
        background: "hsl(var(--surface-0))",
        border: `1px solid ${invalid ? "hsl(var(--danger))" : focus ? "hsl(var(--ring))" : "hsl(var(--border-strong))"}`,
        borderRadius: "var(--radius-md)",
        outline: "none",
        boxShadow: focus ? "0 0 0 3px hsl(var(--ring) / 0.18)" : "none",
        transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    />
  );
}
