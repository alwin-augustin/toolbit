import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolEmptyStateProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    hint?: ReactNode;
    compact?: boolean;
    className?: string;
}

export function ToolEmptyState({ title, description, actions, hint, compact = true, className }: ToolEmptyStateProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-dashed border-border/60 bg-muted/10",
                compact ? "p-3 text-xs" : "p-4 text-sm",
                className
            )}
        >
            <div className="font-medium text-foreground">{title}</div>
            {description && (
                <p className={cn("text-muted-foreground mt-1", compact ? "text-[11px]" : "text-xs")}>
                    {description}
                </p>
            )}
            {actions && (
                <div className={cn("flex flex-wrap gap-2", compact ? "mt-2" : "mt-3")}>
                    {actions}
                </div>
            )}
            {hint && (
                <div className={cn("text-muted-foreground", compact ? "mt-2 text-[11px]" : "mt-2 text-xs")}>
                    {hint}
                </div>
            )}
        </div>
    );
}
