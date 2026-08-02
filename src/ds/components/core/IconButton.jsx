import React from "react";

/**
 * Square icon-only button — toolbar actions (copy, clear, theme, more).
 * Pass a Lucide SVG (or any node) as children.
 */
export function IconButton({
  children,
  variant = "ghost",
  size = "default",
  disabled = false,
  title,
  type = "button",
  style,
  ...rest
}) {
  const dims = { sm: 24, default: 28, lg: 36 }[size];
  const [hover, setHover] = React.useState(false);

  const variants = {
    ghost: {
      background: hover && !disabled ? "hsl(var(--elevate-1))" : "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "transparent",
    },
    outline: {
      background: hover && !disabled ? "hsl(var(--elevate-1))" : "transparent",
      color: "hsl(var(--text-body))",
      borderColor: "hsl(var(--border-strong))",
    },
    solid: {
      background: hover && !disabled ? "hsl(var(--primary-hover))" : "hsl(var(--primary))",
      color: "hsl(var(--text-onbrand))",
      borderColor: "hsl(var(--primary) / 0.6)",
    },
  };

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dims,
        height: dims,
        borderRadius: "var(--radius-md)",
        border: "1px solid transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
