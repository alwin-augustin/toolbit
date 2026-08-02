import * as React from "react";

export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tooltip text. */
  label: React.ReactNode;
  /** The trigger element. */
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

/** Hover/focus tooltip wrapping a trigger element. Dark pill, appears on hover. */
export declare function Tooltip(props: TooltipProps): React.JSX.Element;
