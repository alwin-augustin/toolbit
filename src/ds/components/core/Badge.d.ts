import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  variant?: "soft" | "outline" | "solid";
}

/** Compact status/count label. Soft tinted fill by default. */
export declare function Badge(props: BadgeProps): React.JSX.Element;
