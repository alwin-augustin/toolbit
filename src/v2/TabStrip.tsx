import type { CSSProperties } from "react";
import { X } from "lucide-react";
import { TOOLS } from "@/config/tools.config";
import type { WorkspaceTab } from "./workspace-store";

function tabLabel(id: string): string {
    const tool = TOOLS.find((t) => t.id === id);
    return tool ? tool.name.split(" ")[0] : id;
}

interface TabStripProps {
    tabs: WorkspaceTab[];
    activeTabId: string | null;
    onTab: (id: string) => void;
    onClose: (id: string) => void;
    onAdd: () => void;
}

export function TabStrip({ tabs, activeTabId, onTab, onClose, onAdd }: TabStripProps) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                padding: "6px 12px 0",
                borderBottom: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface-0))",
                flexShrink: 0,
                overflowX: "auto",
            }}
        >
            {tabs.map((t) => {
                const active = t.id === activeTabId;
                return (
                    <button
                        key={t.id}
                        onClick={() => onTab(t.id)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            height: 32,
                            padding: "0 10px",
                            background: active ? "hsl(var(--surface-2))" : "transparent",
                            color: active ? "hsl(var(--text-strong))" : "hsl(var(--text-muted))",
                            border: "1px solid " + (active ? "hsl(var(--border))" : "transparent"),
                            borderBottom: "none",
                            borderTopLeftRadius: "var(--radius-md)",
                            borderTopRightRadius: "var(--radius-md)",
                            fontFamily: "var(--font-sans)",
                            fontSize: "var(--text-sm)",
                            fontWeight: "var(--weight-medium)" as CSSProperties["fontWeight"],
                            cursor: "pointer",
                            position: "relative",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {active && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: -1,
                                    left: 6,
                                    right: 6,
                                    height: 2,
                                    borderRadius: 2,
                                    background: "hsl(var(--primary))",
                                }}
                            />
                        )}
                        {tabLabel(t.id)}
                        <span
                            role="button"
                            aria-label={`Close ${tabLabel(t.id)}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(t.id);
                            }}
                            style={{ color: "hsl(var(--text-faint))", display: "inline-flex", lineHeight: 0 }}
                        >
                            <X size={11} />
                        </span>
                    </button>
                );
            })}
            <button
                onClick={onAdd}
                title="Open another tool"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    marginBottom: 2,
                    background: "transparent",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    color: "hsl(var(--text-muted))",
                    cursor: "pointer",
                    fontSize: 15,
                    fontFamily: "var(--font-sans)",
                }}
            >
                +
            </button>
        </div>
    );
}
