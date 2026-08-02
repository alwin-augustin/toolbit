import React from "react";

/**
 * Sidebar navigation row — icon tile + label, with active + hover states.
 * Mirrors the app sidebar / all-tools rows.
 */
export function SidebarItem({ children, icon, active = false, onClick, badge, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const bg = active
    ? "hsl(var(--primary-soft))"
    : hover
    ? "hsl(var(--elevate-1))"
    : "transparent";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        width: "100%",
        height: "30px",
        padding: "0 0.625rem",
        background: bg,
        border: "1px solid transparent",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color var(--duration-fast) var(--ease-standard)",
        position: "relative",
        ...style,
      }}
      {...rest}
    >
      {active && (
        <span style={{ position: "absolute", left: "-8px", top: "50%", transform: "translateY(-50%)", width: "3px", height: "18px", borderRadius: "var(--radius-full)", background: "hsl(var(--primary))" }} />
      )}
      {icon && (
        <span style={{ display: "inline-flex", color: active ? "hsl(var(--primary))" : "hsl(var(--text-muted))", flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <span style={{
        flex: 1,
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-base)",
        fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
        color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-body))",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {children}
      </span>
      {badge}
    </button>
  );
}
