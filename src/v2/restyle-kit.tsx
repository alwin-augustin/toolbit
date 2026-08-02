import type { CSSProperties, ReactNode } from "react";

/**
 * Layout helpers for porting legacy (Tailwind/shadcn) tool pages onto the
 * v2 design system. Tools that fit the input/output split should prefer
 * EditorSplit/Panel from EditorPanels; these helpers cover form-like and
 * reference-style tools.
 */

const semibold = "var(--weight-semibold)" as CSSProperties["fontWeight"];

/** Scrollable padded page for tools that aren't a two-panel editor. */
export function ToolPage({ children, maxWidth = 920 }: { children: ReactNode; maxWidth?: number }) {
    return (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ maxWidth, margin: "0 auto", display: "grid", gap: 16, alignContent: "start" }}>
                {children}
            </div>
        </div>
    );
}

/** Uppercase mono section eyebrow, per the design system voice. */
export function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                letterSpacing: "var(--tracking-wider)",
                textTransform: "uppercase",
                color: "hsl(var(--text-faint))",
            }}
        >
            {children}
        </div>
    );
}

/** Labelled form field. */
export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
    return (
        <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "hsl(var(--text-body))" }}>
                {label}
            </label>
            {children}
            {hint && <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))" }}>{hint}</span>}
        </div>
    );
}

/** Horizontal control row. */
export function Row({ children, gap = 8, wrap = true, align = "center" }: { children: ReactNode; gap?: number; wrap?: boolean; align?: CSSProperties["alignItems"] }) {
    return (
        <div style={{ display: "flex", gap, flexWrap: wrap ? "wrap" : "nowrap", alignItems: align }}>
            {children}
        </div>
    );
}

/** Two-column responsive grid for form layouts. */
export function Grid2({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>;
}

/** Key/value stat line for results and summaries. */
export function Stat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", fontSize: "var(--text-sm)" }}>
            <span style={{ color: "hsl(var(--text-muted))" }}>{label}</span>
            <span
                style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: semibold,
                    color: tone ? `hsl(${tone})` : "hsl(var(--text-strong))",
                    wordBreak: "break-all",
                    textAlign: "right",
                }}
            >
                {value}
            </span>
        </div>
    );
}

/** Monospace output block with border, for non-editor results. */
export function OutputBlock({ children, danger }: { children: ReactNode; danger?: boolean }) {
    return (
        <pre
            style={{
                margin: 0,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface-1))",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-relaxed)",
                color: danger ? "hsl(var(--danger))" : "hsl(var(--text-body))",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflow: "auto",
            }}
        >
            {children}
        </pre>
    );
}
