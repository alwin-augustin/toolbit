import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Copy, Check, Workflow, ArrowRight, Save, X } from "lucide-react";
import { IconButton, Tooltip, Badge } from "@/ds/components";
import { useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";
import { useToolPipe } from "@/hooks/use-tool-pipe";
import { getChainTargets } from "@/config/tool-chains.config";

const semibold = "var(--weight-semibold)" as CSSProperties["fontWeight"];
const medium = "var(--weight-medium)" as CSSProperties["fontWeight"];

export function PanelHeader({ title, badge, action }: { title: string; badge?: ReactNode; action?: ReactNode }) {
    return (
        <header
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 36,
                padding: "0 10px",
                flexShrink: 0,
                borderBottom: "1px solid hsl(var(--border-faint))",
                background: "hsl(var(--surface-1))",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: semibold, color: "hsl(var(--text-strong))" }}>
                    {title}
                </span>
                {badge}
            </div>
            {action}
        </header>
    );
}

export function Panel({ children }: { children: ReactNode }) {
    return (
        <section
            style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius-lg)",
                background: "hsl(var(--surface-0))",
                overflow: "hidden",
            }}
        >
            {children}
        </section>
    );
}

/** Copy-to-clipboard action for panel headers. */
export function CopyAction({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <Tooltip label={copied ? "Copied" : "Copy output"} side="left">
            <IconButton
                size="sm"
                title="Copy"
                onClick={() => {
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                }}
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
            </IconButton>
        </Tooltip>
    );
}

/** Standard valid/invalid badge for output panels. */
export function ValidityBadge({ valid, validLabel = "valid", invalidLabel = "invalid" }: { valid: boolean | null; validLabel?: string; invalidLabel?: string }) {
    if (valid === null) return null;
    return <Badge tone={valid ? "success" : "danger"}>{valid ? `✓ ${validLabel}` : `✕ ${invalidLabel}`}</Badge>;
}

/**
 * Two-column input/output split with the Phase-2 pipeline strip below.
 * Tools that don't fit the split (generators, builders) can pass a single
 * child which then spans the full width.
 */
export function EditorSplit({ children, toolId, output = "" }: { children: ReactNode; toolId?: string; output?: string }) {
    const count = Array.isArray(children) ? children.filter(Boolean).length : 1;
    return (
        <div className="tb-editor-split" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
                style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: count > 1 ? "1fr 1fr" : "1fr",
                    gap: 12,
                    padding: 12,
                    minHeight: 0,
                }}
            >
                {children}
            </div>
            <PipelineStrip toolId={toolId} output={output} />
        </div>
    );
}

/** Visible but disabled — piping ships in Phase 2. */
export function PipelineStrip({ toolId, output }: { toolId?: string; output?: string }) {
    const [, setLocation] = useLocation();
    const { pipeline, setPipeData, addPipelineStep, clearPipeline, } = useToolPipe();
    const tool = toolId ? TOOLS.find((candidate) => candidate.id === toolId) : undefined;
    const [targetId, setTargetId] = useState("");
    const chainTargets = tool ? getChainTargets(tool.id) : [];

    const pipeTo = (nextId: string) => {
        if (!tool || !output || !nextId) return;
        const target = TOOLS.find((candidate) => candidate.id === nextId);
        if (!target) return;
        addPipelineStep({ toolId: tool.id, toolName: tool.name, path: tool.path });
        addPipelineStep({ toolId: target.id, toolName: target.name, path: target.path });
        setPipeData(output, tool.id);
        setTargetId("");
        setLocation(target.path);
    };

    const saveWorkflow = () => {
        if (pipeline.length < 2) return;
        window.dispatchEvent(new CustomEvent("open-workspaces", { detail: { pipeline } }));
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px 12px",
                flexShrink: 0,
                flexWrap: "wrap",
            }}
        >
            {pipeline.length > 0 && pipeline.map((step, index) => (
                <span key={`${step.toolId}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {index > 0 && <ArrowRight size={12} style={{ color: "hsl(var(--text-faint))" }} />}
                    <span style={{
                        display: "inline-flex", alignItems: "center", height: 26, padding: "0 9px",
                        borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", fontWeight: medium,
                        background: index === pipeline.length - 1 ? "hsl(var(--primary-soft))" : "hsl(var(--surface-2))",
                        color: index === pipeline.length - 1 ? "hsl(var(--primary))" : "hsl(var(--text-body))",
                        border: "1px solid " + (index === pipeline.length - 1 ? "hsl(var(--primary) / .35)" : "hsl(var(--border))"),
                    }}>{step.toolName}</span>
                </span>
            ))}
            {tool && output && (
                <select
                    aria-label="Pipe output to"
                    value={targetId}
                    onChange={(event) => pipeTo(event.target.value)}
                    style={{ height: 26, maxWidth: 190, padding: "0 8px", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius-md)", background: "hsl(var(--surface-2))", color: "hsl(var(--text-body))", font: "var(--text-xs) var(--font-sans)" }}
                >
                    <option value="">Pipe output to…</option>
                    {chainTargets.map((targetId) => {
                        const candidate = TOOLS.find((toolMetadata) => toolMetadata.id === targetId);
                        return candidate ? <option key={candidate.id} value={candidate.id}>{candidate.name}</option> : null;
                    })}
                </select>
            )}
            {pipeline.length >= 2 && <IconButton size="sm" title="Save pipeline as workspace" onClick={saveWorkflow}><Save size={13} /></IconButton>}
            {pipeline.length > 0 && <IconButton size="sm" title="Clear pipeline" onClick={clearPipeline}><X size={13} /></IconButton>}
            {pipeline.length === 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))", fontWeight: medium }}>
                <Workflow size={14} /> {tool ? "Pipeline" : "Open a tool to start a pipeline"}
            </span>}
        </div>
    );
}
