import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enables hover lift (border + shadow) for clickable cards. */
  interactive?: boolean;
  /** Inner padding (CSS length). Default 1.25rem. */
  padding?: string;
}

/**
 * Base surface container — panels, tool tiles, dashboard cards.
 */
export declare function Card(props: CardProps): React.JSX.Element;
