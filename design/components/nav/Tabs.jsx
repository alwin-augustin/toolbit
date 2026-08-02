import React from "react";

/**
 * Segmented / underline tabs. Controlled via value + onChange.
 * `variant="segment"` (default) = filled pill group; "underline" = text + bar.
 */
export function Tabs({ items = [], value, onChange, variant = "segment", style, ...rest }) {
  if (variant === "underline") {
    return (
      <div style={{ display: "flex", gap: "1.25rem", borderBottom: "1px solid hsl(var(--border))", ...style }} {...rest}>
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              type="button"
              onClick={() => onChange?.(it.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.125rem",
                marginBottom: "-1px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? "hsl(var(--primary))" : "transparent"}`,
                color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                cursor: "pointer",
                transition: "color var(--duration-fast) var(--ease-standard)",
              }}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        gap: "2px",
        padding: "3px",
        background: "hsl(var(--surface-3))",
        borderRadius: "var(--radius-md)",
        ...style,
      }}
      {...rest}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange?.(it.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              height: "28px",
              padding: "0 0.625rem",
              background: active ? "hsl(var(--surface-0))" : "transparent",
              color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
              border: "none",
              borderRadius: "var(--radius-sm)",
              boxShadow: active ? "var(--shadow-xs)" : "none",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              cursor: "pointer",
              transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
            }}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
