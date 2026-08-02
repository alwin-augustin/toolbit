import * as React from "react";

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  /** Label node rendered after the box. */
  label?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Checkbox with inline label. Blue fill + check when on. */
export declare function Checkbox(props: CheckboxProps): React.JSX.Element;
