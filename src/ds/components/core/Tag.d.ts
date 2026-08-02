import * as React from "react";

export interface TagProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Selected/active state (blue tint). */
  active?: boolean;
  onClick?: () => void;
}

/** Rounded interactive chip — tool shortcuts, filters, detected-type suggestions. */
export declare function Tag(props: TagProps): React.JSX.Element;
