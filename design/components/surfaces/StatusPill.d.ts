import * as React from "react";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "success" | "warning" | "danger" | "neutral" | "primary";
  /** Replace the leading dot with an icon (e.g. ShieldCheck, WifiOff). */
  icon?: React.ReactNode;
}

/** Status pill with leading dot or icon — privacy/network/validity indicators. */
export declare function StatusPill(props: StatusPillProps): React.JSX.Element;
