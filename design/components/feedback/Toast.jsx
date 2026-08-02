import React from "react";

/**
 * Toast notification — transient confirmation ("Copied to clipboard").
 * Static presentational component; position with a fixed wrapper.
 */
export function Toast({ children, title, tone = "neutral", icon, onClose, style, ...rest }) {
  const accent = {
    neutral: "var(--text-muted)",
    success: "var(--success)",
    danger: "var(--danger)",
    primary: "var(--primary)",
  }[tone] || "var(--text-muted)";

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.625rem",
        minWidth: "260px",
        maxWidth: "380px",
        padding: "0.75rem 0.875rem",
        background: "hsl(var(--surface-2))",
        border: "1px solid hsl(var(--border))",
        borderLeft: `3px solid hsl(${accent})`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)",
        color: "hsl(var(--text-body))",
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ color: `hsl(${accent})`, flexShrink: 0, display: "inline-flex", marginTop: "1px" }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: "var(--weight-semibold)", color: "hsl(var(--text-strong))", marginBottom: children ? "0.125rem" : 0 }}>{title}</div>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", color: "hsl(var(--text-faint))", cursor: "pointer", padding: "2px", display: "inline-flex", lineHeight: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
