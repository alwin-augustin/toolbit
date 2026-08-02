import * as React from "react";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";
export type ButtonSize = "sm" | "default" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `default` is the blue primary CTA. */
  variant?: ButtonVariant;
  /** Height/padding scale. */
  size?: ButtonSize;
  /** Leading icon node (e.g. a Lucide SVG). */
  iconLeft?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
}

/**
 * Primary action button for Toolbit. Sentence-case labels, optional icons.
 */
export declare function Button(props: ButtonProps): React.JSX.Element;
