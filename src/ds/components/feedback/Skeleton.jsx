import React from "react";

/** Skeleton loading placeholder — shimmer block. */
export function Skeleton({ width = "100%", height = "1rem", radius = "var(--radius-sm)", style, ...rest }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, hsl(var(--surface-3)) 25%, hsl(var(--surface-2)) 37%, hsl(var(--surface-3)) 63%)",
        backgroundSize: "400% 100%",
        animation: "tb-skeleton 1.4s ease infinite",
        ...style,
      }}
      {...rest}
    >
      <style>{`@keyframes tb-skeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}</style>
    </span>
  );
}
