import React from "react";

/**
 * Status pill with a leading dot — the product's "No network calls made",
 * online/offline, valid/invalid indicators.
 */
export function StatusPill({ children, tone = "success", icon, style, ...rest }) {
  const color = {
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    neutral: "var(--text-muted)",
    primary: "var(--primary)",
  }[tone] || "var(--success)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4375rem",
        height: "26px",
        padding: "0 0.625rem",
        background: "hsl(var(--surface-2) / 0.6)",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-full)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-xs)",
        color: "hsl(var(--text-body))",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon ? (
        <span style={{ color: `hsl(${color})`, display: "inline-flex" }}>{icon}</span>
      ) : (
        <span style={{ width: 7, height: 7, borderRadius: "var(--radius-full)", background: `hsl(${color})`, boxShadow: `0 0 0 3px hsl(${color} / 0.18)` }} />
      )}
      {children}
    </span>
  );
}
