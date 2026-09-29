import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { X, Shield, Star } from "lucide-react";
import { Button, IconButton } from "@/ds/components";
import { TOOLS } from "@/config/tools.config";
import { categoryMeta } from "./categories";
import { readFavoriteIds, writeFavoriteIds } from "./favorites";

/**
 * Per-tool inspector config panels. The six priority tools register here;
 * every other tool gets the privacy card only.
 */
export const INSPECTOR_PANELS: Record<string, ComponentType> = {};
const inspectorListeners = new Set<() => void>();

export function registerInspectorPanel(toolId: string, panel: ComponentType) {
    INSPECTOR_PANELS[toolId] = panel;
    inspectorListeners.forEach((listener) => listener());
}

function useRegisteredInspectorPanel(toolId: string | null) {
    const [, refresh] = useState(0);

    useEffect(() => {
        const listener = () => refresh((value) => value + 1);
        inspectorListeners.add(listener);
        return () => {
            inspectorListeners.delete(listener);
        };
    }, []);

    return toolId ? INSPECTOR_PANELS[toolId] : undefined;
}

const semibold = "var(--weight-semibold)" as CSSProperties["fontWeight"];

interface InspectorProps {
    toolId: string | null;
    onClose: () => void;
}

export function Inspector({ toolId, onClose }: InspectorProps) {
    const tool = toolId ? TOOLS.find((t) => t.id === toolId) : undefined;
    const Panel = useRegisteredInspectorPanel(toolId);

    return (
        <aside
            className="tb-inspector"
            aria-label="Tool inspector"
            style={{
                width: "var(--inspector-width)",
                flexShrink: 0,
                height: "100%",
                overflowY: "auto",
                background: "hsl(var(--surface-1))",
                borderLeft: "1px solid hsl(var(--border))",
                padding: "0 16px 16px",
            }}
        >
            <header
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "var(--header-height)",
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-2xs)",
                            letterSpacing: "var(--tracking-wider)",
                            textTransform: "uppercase",
                            color: "hsl(var(--text-faint))",
                        }}
                    >
                        Inspector
                    </div>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: semibold, color: "hsl(var(--text-strong))" }}>
                        {tool ? `${tool.name} options` : "Options"}
                    </div>
                </div>
                <IconButton size="sm" title="Close inspector" onClick={onClose}>
                    <X size={14} />
                </IconButton>
            </header>

            {Panel ? (
                <div style={{ display: "grid", gap: 14, marginTop: 6 }}>
                    <Panel />
                </div>
            ) : (
                <GenericToolPanel toolId={toolId} />
            )}

            <div
                style={{
                    marginTop: 22,
                    padding: 12,
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--surface-0))",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <span style={{ color: "hsl(var(--success))", display: "inline-flex" }}>
                        <Shield size={14} />
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: semibold, color: "hsl(var(--text-strong))" }}>
                        Local only
                    </span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))", lineHeight: "var(--leading-snug)" }}>
                    Tool content stays on this device. Anonymous product analytics never include inputs, outputs, or
                    piped workflow content.
                </p>
            </div>
        </aside>
    );
}

function GenericToolPanel({ toolId }: { toolId: string | null }) {
    const tool = toolId ? TOOLS.find((candidate) => candidate.id === toolId) : undefined;
    const [favorite, setFavorite] = useState(() => (toolId ? readFavoriteIds().includes(toolId) : false));
    useEffect(() => {
        setFavorite(toolId ? readFavoriteIds().includes(toolId) : false);
    }, [toolId]);
    if (!tool) return null;
    const category = categoryMeta(tool.category);
    const toggleFavorite = () => {
        const current = readFavoriteIds();
        const next = favorite ? current.filter((id) => id !== tool.id) : [...current, tool.id];
        writeFavoriteIds(next);
        setFavorite(!favorite);
    };
    return (
        <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
            <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "hsl(var(--text-faint))", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>Tool profile</span>
                <strong style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-strong))" }}>{category?.label ?? "Tool"}</strong>
                <span style={{ fontSize: "var(--text-xs)", lineHeight: 1.5, color: "hsl(var(--text-muted))" }}>{tool.description}</span>
            </div>
            <Button variant={favorite ? "secondary" : "outline"} size="sm" iconLeft={<Star size={13} />} onClick={toggleFavorite}>
                {favorite ? "Pinned in favorites" : "Pin to favorites"}
            </Button>
        </div>
    );
}
