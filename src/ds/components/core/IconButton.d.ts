import * as React from "react";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon node (Lucide SVG). */
  children: React.ReactNode;
  variant?: "ghost" | "outline" | "solid";
  size?: "sm" | "default" | "lg";
  /** Accessible label / tooltip. */
  title?: string;
}

/** Square icon-only button for toolbars (copy, clear, theme toggle, more). */
export declare function IconButton(props: IconButtonProps): React.JSX.Element;
