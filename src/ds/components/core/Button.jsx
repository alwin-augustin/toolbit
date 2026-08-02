import React from "react";

/**
 * Toolbit primary button. Sentence-case label, optional leading/trailing
 * Lucide icon (pass as ReactNode). Variants follow the source's button.tsx.
 */
export function Button({
  children,
  variant = "default",
  size = "default",
  iconLeft,
  iconRight,
  disabled = false,
  type = "button",
  style,
  ...rest
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    whiteSpace: "nowrap",
    fontFamily: "var(--font-sans)",
    fontWeight: "var(--weight-medium)",
    lineHeight: 1,
    borderRadius: "var(--radius-md)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
    userSelect: "none",
  };

  const sizes = {
    sm: { height: "28px", padding: "0 0.625rem", fontSize: "var(--text-sm)" },
    default: { height: "32px", padding: "0 0.75rem", fontSize: "var(--text-base)" },
    lg: { height: "40px", padding: "0 1.25rem", fontSize: "var(--text-md)" },
  };

  const variants = {
    default: {
      background: "hsl(var(--primary))",
      color: "hsl(var(--text-onbrand))",
      borderColor: "hsl(var(--primary) / 0.6)",
    },
    secondary: {
      background: "hsl(var(--surface-3))",
      color: "hsl(var(--text-strong))",
      borderColor: "hsl(var(--border))",
    },
    outline: {
      background: "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "hsl(var(--border-strong))",
    },
    ghost: {
      background: "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "transparent",
    },
    destructive: {
      background: "hsl(var(--danger))",
      color: "#fff",
      borderColor: "hsl(var(--danger) / 0.6)",
    },
    link: {
      background: "transparent",
      color: "hsl(var(--primary))",
      borderColor: "transparent",
      padding: 0,
      height: "auto",
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
  };

  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? hoverFor(variant) : null;

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...hoverStyle, ...style }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

function hoverFor(variant) {
  switch (variant) {
    case "default":
      return { background: "hsl(var(--primary-hover))" };
    case "secondary":
      return { background: "hsl(var(--surface-3))", borderColor: "hsl(var(--border-strong))" };
    case "outline":
      return { background: "hsl(var(--elevate-1))", borderColor: "hsl(var(--border-strong))" };
    case "ghost":
      return { background: "hsl(var(--elevate-1))" };
    case "destructive":
      return { background: "hsl(var(--danger) / 0.88)" };
    case "link":
      return { color: "hsl(var(--primary-hover))" };
    default:
      return null;
  }
}
