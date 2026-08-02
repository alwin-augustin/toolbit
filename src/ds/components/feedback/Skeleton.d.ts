import * as React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: string | number;
  height?: string | number;
  /** Border radius (defaults to --radius-sm). */
  radius?: string;
}

/** Shimmer loading placeholder block. */
export declare function Skeleton(props: SkeletonProps): React.JSX.Element;
