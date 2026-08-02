import * as React from "react";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  /** `segment` = filled pill group (Text/Tree toggle); `underline` = text tabs. */
  variant?: "segment" | "underline";
}

/** Tab control — segmented pill group or underline tabs. Controlled. */
export declare function Tabs(props: TabsProps): React.JSX.Element;
