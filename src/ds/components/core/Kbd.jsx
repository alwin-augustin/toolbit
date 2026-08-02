import React from "react";

/**
 * Keyboard key chip — renders shortcut keys like ⌘K, Cmd+V, Esc.
 * Monospace, subtle inset look.
 */
export function Kbd({ children, style, ...rest }) {
  return (
    <kbd
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "20px",
        height: "20px",
        padding: "0 0.375rem",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--weight-medium)",
        lineHeight: 1,
        color: "hsl(var(--text-muted))",
        background: "hsl(var(--surface-3))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-xs)",
        boxShadow: "0 1px 0 0 hsl(var(--border))",
        ...style,
      }}
      {...rest}
    >
      {children}
    </kbd>
  );
}
