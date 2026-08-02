import * as React from "react";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Source text. */
  code?: string;
  /** Language label shown in the header. */
  lang?: string;
  /** Optional filename shown instead of lang. */
  filename?: string;
  /** Apply lightweight JSON-ish token tinting. */
  highlight?: boolean;
}

/** Code/data display block with header bar and monospace body. */
export declare function CodeBlock(props: CodeBlockProps): React.JSX.Element;
