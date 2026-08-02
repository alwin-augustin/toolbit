import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "danger";
  /** Optional bold title line above the body. */
  title?: React.ReactNode;
  /** Leading icon (Lucide SVG). */
  icon?: React.ReactNode;
}

/** Inline alert/callout banner with soft tinted background. */
export declare function Alert(props: AlertProps): React.JSX.Element;
