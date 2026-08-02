import * as React from "react";

export interface SidebarItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Leading icon (Lucide SVG). */
  icon?: React.ReactNode;
  /** Active/selected state — blue tint + left accent bar. */
  active?: boolean;
  /** Optional trailing node (count, star). */
  badge?: React.ReactNode;
  onClick?: () => void;
}

/** Sidebar / tool-list navigation row with active + hover states. */
export declare function SidebarItem(props: SidebarItemProps): React.JSX.Element;
