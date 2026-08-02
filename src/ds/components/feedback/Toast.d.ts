import * as React from "react";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "neutral" | "success" | "danger" | "primary";
  title?: React.ReactNode;
  icon?: React.ReactNode;
  /** Show a dismiss (×) button. */
  onClose?: () => void;
}

/** Transient confirmation toast (e.g. "Copied to clipboard"). Position via a fixed wrapper. */
export declare function Toast(props: ToastProps): React.JSX.Element;
