import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Monospace (JetBrains Mono). Defaults to true for code/data entry. */
  mono?: boolean;
  invalid?: boolean;
}

/** Multi-line code/data input — the product's primary editor surface. */
export declare function Textarea(props: TextareaProps): React.JSX.Element;
