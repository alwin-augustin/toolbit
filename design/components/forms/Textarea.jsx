import React from "react";

/**
 * Multi-line input. Defaults to monospace — the product uses textareas for
 * all code/data entry (paste anything, JSON input/output, snippets).
 */
export function Textarea({ mono = true, invalid = false, rows = 6, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <textarea
      rows={rows}
      onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
      style={{
        width: "100%",
        padding: "0.625rem 0.75rem",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: "var(--text-base)",
        lineHeight: "var(--leading-normal)",
        color: "hsl(var(--text-strong))",
        background: "hsl(var(--surface-0))",
        border: `1px solid ${invalid ? "hsl(var(--danger))" : focus ? "hsl(var(--ring))" : "hsl(var(--border-strong))"}`,
        borderRadius: "var(--radius-md)",
        outline: "none",
        resize: "vertical",
        boxShadow: focus ? "0 0 0 3px hsl(var(--ring) / 0.18)" : "none",
        transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    />
  );
}
