import React from "react";

/**
 * Surface card — the base container. Optional hover-lift for clickable cards
 * (tool tiles, workflow cards, recent items).
 */
export function Card({ children, interactive = false, padding = "1.25rem", style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: "hsl(var(--surface-2))",
        border: `1px solid ${hover ? "hsl(var(--border-strong))" : "hsl(var(--border-faint))"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
        padding,
        cursor: interactive ? "pointer" : "default",
        transition: "border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard), background-color var(--duration-base) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
