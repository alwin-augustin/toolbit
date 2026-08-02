import * as React from "react";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Toggle switch for boolean settings (Network Off, theme, options). */
export declare function Switch(props: SwitchProps): React.JSX.Element;
