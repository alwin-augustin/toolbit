import * as React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  /** Stretch to container width. */
  fullWidth?: boolean;
}

/** Native `<select>` styled to match inputs, with a chevron. Pass `<option>` children. */
export declare function Select(props: SelectProps): React.JSX.Element;
