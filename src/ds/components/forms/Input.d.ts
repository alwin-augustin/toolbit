import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Use monospace (JetBrains Mono) for code/data values. */
  mono?: boolean;
  /** Error state — red border. */
  invalid?: boolean;
}

/** Single-line text input with focus ring; monospace option for code/data. */
export declare function Input(props: InputProps): React.JSX.Element;
