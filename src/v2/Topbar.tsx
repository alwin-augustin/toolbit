import type { CSSProperties } from "react";
import { PanelRight, Sun, Moon, Save } from "lucide-react";
import { Button, IconButton, Tabs, Tooltip } from "@/ds/components";
import type { Density } from "./workspace-store";

interface TopbarProps {
    crumb: [string, string];
    density: Density;
    onDensity: (d: Density) => void;
    onToggleInspector: () => void;
    theme: "dark" | "light";
    onToggleTheme: () => void;
    pipelineStepCount: number;
    onSavePipeline: () => void;
}

export function Topbar({ crumb, density, onDensity, onToggleInspector, theme, onToggleTheme, pipelineStepCount, onSavePipeline }: TopbarProps) {
    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: "var(--header-height)",
                padding: "0 12px",
                flexShrink: 0,
                borderBottom: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface-0))",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: "var(--text-sm)",
                    color: "hsl(var(--text-muted))",
                    minWidth: 0,
                }}
            >
                <span>{crumb[0]}</span>
                <span style={{ color: "hsl(var(--text-faint))" }}>/</span>
                <span
                    style={{
                        color: "hsl(var(--text-strong))",
                        fontWeight: "var(--weight-semibold)" as CSSProperties["fontWeight"],
                    }}
                >
                    {crumb[1]}
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tabs
                    variant="segment"
                    value={density}
                    onChange={(v) => onDensity(v as Density)}
                    items={[
                        { value: "compact", label: "Compact" },
                        { value: "comfortable", label: "Comfort" },
                    ]}
                />
                <Tooltip label="Toggle inspector" side="bottom">
                    <IconButton title="Toggle inspector" onClick={onToggleInspector}>
                        <PanelRight size={16} />
                    </IconButton>
                </Tooltip>
                <Tooltip label="Toggle theme" side="bottom">
                    <IconButton title="Toggle theme" onClick={onToggleTheme}>
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    </IconButton>
                </Tooltip>
                <Button size="sm" disabled={pipelineStepCount < 2} iconLeft={<Save size={13} />} onClick={onSavePipeline}>
                    {pipelineStepCount >= 2 ? "Save pipeline" : "Pipeline"}
                </Button>
            </div>
        </header>
    );
}
