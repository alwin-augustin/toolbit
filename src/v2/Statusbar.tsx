import type { ReactNode } from "react";
import { Shield, Workflow } from "lucide-react";
import { useEditorStatus } from "./workspace-store";
import { useToolPipe } from "@/hooks/use-tool-pipe";

function Item({ children, accent }: { children: ReactNode; accent?: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0 8px",
                height: "100%",
                fontSize: "var(--text-2xs)",
                fontFamily: "var(--font-sans)",
                color: accent ? `hsl(${accent})` : "hsl(var(--text-muted))",
            }}
        >
            {children}
        </span>
    );
}

function Divider() {
    return <span style={{ width: 1, height: 14, background: "hsl(var(--border))" }} />;
}

function formatBytes(b: number): string {
    if (!b) return "0 B";
    if (b < 1024) return `${b} B`;
    return `${(b / 1024).toFixed(1)} KB`;
}

export function Statusbar() {
    const { valid, bytes, ln, col, validityLabel } = useEditorStatus();
    const pipelineSteps = useToolPipe((state) => state.pipeline.length);
    return (
        <footer
            style={{
                display: "flex",
                alignItems: "center",
                height: "var(--statusbar-height)",
                flexShrink: 0,
                borderTop: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface-1))",
                padding: "0 6px",
            }}
        >
            <Item accent="var(--success)">
                <Shield size={12} /> Local · no network
            </Item>
            <Divider />
            {valid !== null && (
                <Item accent={valid ? "var(--success)" : "var(--danger)"}>
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "var(--radius-full)",
                            background: "currentColor",
                            display: "inline-block",
                        }}
                    />
                    {validityLabel || (valid ? "Valid" : "Invalid")}
                </Item>
            )}
            <Item>{formatBytes(bytes)}</Item>
            <Item>UTF-8</Item>
            <span style={{ flex: 1 }} />
            <Item>
                <Workflow size={12} /> {pipelineSteps}-step pipeline
            </Item>
            <Divider />
            <Item>
                Ln {ln}, Col {col}
            </Item>
        </footer>
    );
}
