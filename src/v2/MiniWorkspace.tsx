import type { CSSProperties, ReactNode } from "react";
import { FileJson, Lock, ArrowLeftRight, Wand2, Microscope, Hammer, Play, Shield, Workflow } from "lucide-react";
import logoMark from "@/ds/assets/logo-mark.svg";

/** Scaled-down static rendering of the workspace, used as the hero showcase. */

const mono: CSSProperties = { fontFamily: "var(--font-mono)" };

function J({ c, children }: { c: string; children: ReactNode }) {
    return <span style={{ color: `hsl(var(--code-${c}))` }}>{children}</span>;
}

function Row({ label, icon, active }: { label: string; icon: ReactNode; active?: boolean }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 22,
                padding: "0 7px",
                borderRadius: 4,
                fontSize: 10,
                background: active ? "hsl(var(--primary-soft))" : "transparent",
                color: active ? "hsl(var(--primary))" : "hsl(var(--text-muted))",
                fontWeight: active ? 500 : 400,
            }}
        >
            {icon}
            {label}
        </div>
    );
}

function GroupLabel({ children, pad }: { children: string; pad?: boolean }) {
    return (
        <div
            style={{
                ...mono,
                fontSize: 7.5,
                letterSpacing: "0.08em",
                color: "hsl(var(--text-faint))",
                padding: pad ? "6px 7px 3px" : "0 7px 3px",
                textTransform: "uppercase",
            }}
        >
            {children}
        </div>
    );
}

export function MiniWorkspace() {
    return (
        <div
            aria-hidden="true"
            style={{
                borderRadius: "var(--radius-xl)",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface-0))",
                boxShadow: "var(--shadow-xl)",
                overflow: "hidden",
                fontFamily: "var(--font-sans)",
                userSelect: "none",
            }}
        >
            {/* topbar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 34,
                    padding: "0 10px",
                    borderBottom: "1px solid hsl(var(--border))",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "hsl(var(--text-muted))" }}>
                    <img src={logoMark} width={14} height={14} alt="" style={{ borderRadius: 4 }} />
                    <span>API Debug</span>
                    <span style={{ color: "hsl(var(--text-faint))" }}>/</span>
                    <span style={{ color: "hsl(var(--text-strong))", fontWeight: 600 }}>JSON Formatter</span>
                </div>
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        height: 20,
                        padding: "0 8px",
                        borderRadius: 5,
                        background: "hsl(var(--primary))",
                        color: "#fff",
                        fontSize: 9.5,
                        fontWeight: 500,
                    }}
                >
                    <Play size={9} /> Run pipeline
                </span>
            </div>
            <div style={{ display: "flex" }}>
                {/* sidebar */}
                <div
                    style={{
                        width: 118,
                        flexShrink: 0,
                        borderRight: "1px solid hsl(var(--border))",
                        background: "hsl(var(--sidebar))",
                        padding: "8px 6px",
                        display: "grid",
                        gap: 2,
                        alignContent: "start",
                    }}
                >
                    <GroupLabel>Favorites</GroupLabel>
                    <Row label="JSON" icon={<FileJson size={11} />} active />
                    <Row label="JWT" icon={<Lock size={11} />} />
                    <Row label="Base64" icon={<ArrowLeftRight size={11} />} />
                    <GroupLabel pad>Library</GroupLabel>
                    <Row label="Generate" icon={<Wand2 size={11} />} />
                    <Row label="Analyze" icon={<Microscope size={11} />} />
                    <Row label="Build" icon={<Hammer size={11} />} />
                </div>
                {/* main */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* tabs */}
                    <div style={{ display: "flex", gap: 2, padding: "5px 8px 0", borderBottom: "1px solid hsl(var(--border))" }}>
                        <span
                            style={{
                                position: "relative",
                                fontSize: 10,
                                fontWeight: 500,
                                padding: "4px 9px",
                                background: "hsl(var(--surface-2))",
                                border: "1px solid hsl(var(--border))",
                                borderBottom: "none",
                                borderRadius: "5px 5px 0 0",
                                color: "hsl(var(--text-strong))",
                            }}
                        >
                            <span style={{ position: "absolute", top: -1, left: 5, right: 5, height: 2, borderRadius: 2, background: "hsl(var(--primary))" }} />
                            JSON
                        </span>
                        <span style={{ fontSize: 10, padding: "4px 9px", color: "hsl(var(--text-muted))" }}>Base64</span>
                        <span style={{ fontSize: 10, padding: "4px 6px", color: "hsl(var(--text-faint))" }}>+</span>
                    </div>
                    {/* split editor */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 6 }}>
                        {["Input", "Output"].map((title, i) => (
                            <div key={title} style={{ border: "1px solid hsl(var(--border))", borderRadius: 6, overflow: "hidden" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "4px 7px",
                                        background: "hsl(var(--surface-1))",
                                        borderBottom: "1px solid hsl(var(--border-faint))",
                                    }}
                                >
                                    <span style={{ fontSize: 9, fontWeight: 600, color: "hsl(var(--text-strong))" }}>{title}</span>
                                    <span style={{ fontSize: 8, color: i ? "hsl(var(--success))" : "hsl(var(--primary))" }}>
                                        {i ? "✓ valid" : "detected JSON"}
                                    </span>
                                </div>
                                <div style={{ ...mono, fontSize: 9, lineHeight: 1.7, padding: "6px 8px", whiteSpace: "pre" }}>
                                    <J c="punc">{"{"}</J>
                                    {"\n  "}
                                    <J c="key">"tool"</J>
                                    <J c="punc">: </J>
                                    <J c="string">"json"</J>
                                    <J c="punc">,</J>
                                    {"\n  "}
                                    <J c="key">"local"</J>
                                    <J c="punc">: </J>
                                    <J c="keyword">true</J>
                                    <J c="punc">,</J>
                                    {"\n  "}
                                    <J c="key">"ms"</J>
                                    <J c="punc">: </J>
                                    <J c="number">0.4</J>
                                    {"\n"}
                                    <J c="punc">{"}"}</J>
                                    {i === 0 && (
                                        <span
                                            className="tb-cursor-blink"
                                            style={{
                                                display: "inline-block",
                                                width: 5,
                                                height: 10,
                                                marginLeft: 2,
                                                borderRadius: 1,
                                                background: "hsl(var(--primary))",
                                                verticalAlign: "-1px",
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* piping */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 8px 7px", fontSize: 8.5 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "hsl(var(--text-muted))" }}>
                            <Workflow size={9} /> Pipeline
                        </span>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: "hsl(var(--primary-soft))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / .35)" }}>
                            JSON
                        </span>
                        <span style={{ color: "hsl(var(--text-faint))" }}>→</span>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-body))" }}>
                            Base64
                        </span>
                        <span style={{ color: "hsl(var(--text-faint))" }}>→</span>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-body))" }}>
                            Snippet
                        </span>
                    </div>
                    {/* statusbar */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            height: 20,
                            padding: "0 8px",
                            borderTop: "1px solid hsl(var(--border))",
                            background: "hsl(var(--surface-1))",
                            fontSize: 8,
                        }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "hsl(var(--success))" }}>
                            <Shield size={9} /> Local · no network
                        </span>
                        <span style={{ color: "hsl(var(--text-muted))" }}>Valid JSON</span>
                        <span style={{ color: "hsl(var(--text-muted))" }}>UTF-8</span>
                        <span style={{ marginLeft: "auto", color: "hsl(var(--text-muted))" }}>Ln 4, Col 12</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
