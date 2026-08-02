import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import cronParser from "cron-parser";
import cronstrue from "cronstrue";
import { Button, Badge, Checkbox, Input, Tag } from "@/ds/components";
import { CodeEditor } from "../CodeEditor";
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "../EditorPanels";
import { registerInspectorPanel } from "../Inspector";
import { useEditorStatus } from "../workspace-store";
import { useSmartPasteInput } from "../smart-paste";
import { useToolHistory } from "@/hooks/use-tool-history";

interface CronOptions {
    showExplanation: boolean;
    showNextRuns: boolean;
    visualBuilder: boolean;
    set: (patch: Partial<Omit<CronOptions, "set">>) => void;
}

const useCronOptions = create<CronOptions>()(
    persist(
        (set) => ({
            showExplanation: true,
            showNextRuns: true,
            visualBuilder: false,
            set: (patch) => set(patch),
        }),
        { name: "toolbit-v2-cron-options" }
    )
);

const PRESETS = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 min", value: "*/5 * * * *" },
    { label: "Hourly", value: "0 * * * *" },
    { label: "Daily midnight", value: "0 0 * * *" },
    { label: "Weekdays 9am", value: "0 9 * * 1-5" },
    { label: "Monthly 1st", value: "0 0 1 * *" },
];

const FIELD_DEFS = [
    { label: "Minute", range: "0–59" },
    { label: "Hour", range: "0–23" },
    { label: "Day", range: "1–31" },
    { label: "Month", range: "1–12" },
    { label: "Weekday", range: "0–6" },
];

function parseCron(expression: string) {
    const description = cronstrue.toString(expression);
    const interval = cronParser.parseExpression(expression);
    const nextRuns: string[] = [];
    for (let i = 0; i < 5; i++) nextRuns.push(interval.next().toDate().toLocaleString());
    return { description, nextRuns };
}

function CronInspectorPanel() {
    const { showExplanation, showNextRuns, visualBuilder, set } = useCronOptions();
    return (
        <div style={{ display: "grid", gap: 10 }}>
            <Checkbox checked={showExplanation} onChange={(v) => set({ showExplanation: v })} label="Human-readable explanation" />
            <Checkbox checked={showNextRuns} onChange={(v) => set({ showNextRuns: v })} label="Next 5 run times" />
            <Checkbox checked={visualBuilder} onChange={(v) => set({ visualBuilder: v })} label="Visual builder" />
        </div>
    );
}

registerInspectorPanel("cron-parser", CronInspectorPanel);
registerInspectorPanel("crontab-generator", CronInspectorPanel);

const semibold = "var(--weight-semibold)" as CSSProperties["fontWeight"];

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: "10px 12px" }}>
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    letterSpacing: "var(--tracking-wider)",
                    textTransform: "uppercase",
                    color: "hsl(var(--text-faint))",
                    marginBottom: 6,
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

export default function CronParserV2() {
    const [expression, setExpression] = useState("");
    useSmartPasteInput(setExpression);
    const { showExplanation, showNextRuns, visualBuilder } = useCronOptions();
    const setStatus = useEditorStatus((s) => s.setStatus);
    const { addEntry } = useToolHistory("cron-parser", "Cron Parser");

    const fields = useMemo(() => {
        const parts = expression.trim().split(/\s+/);
        return parts.length === 5 ? parts : ["*", "*", "*", "*", "*"];
    }, [expression]);

    const updateField = (index: number, value: string) => {
        const next = [...fields];
        next[index] = value.trim() || "*";
        setExpression(next.join(" "));
    };

    const result = useMemo(() => {
        if (!expression.trim()) return { description: "", nextRuns: [] as string[], error: "", valid: null as boolean | null };
        try {
            return { ...parseCron(expression), error: "", valid: true as boolean | null };
        } catch (e) {
            return {
                description: "",
                nextRuns: [],
                error: e instanceof Error ? e.message : "Invalid expression",
                valid: false as boolean | null,
            };
        }
    }, [expression]);

    useEffect(() => {
        setStatus({
            valid: result.valid,
            validityLabel: result.valid === null ? "" : result.valid ? "Valid cron" : "Invalid cron",
            bytes: new Blob([expression]).size,
        });
    }, [result.valid, expression, setStatus]);

    useEffect(() => {
        if (result.valid !== true) return;
        const t = setTimeout(() => addEntry({ input: expression, output: result.description }), 1500);
        return () => clearTimeout(t);
    }, [expression, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <EditorSplit toolId="cron-parser" output={result.valid ? expression : ""}>
            <Panel>
                <PanelHeader
                    title={visualBuilder ? "Visual builder" : "Cron expression"}
                    badge={expression.trim() ? <Badge tone="primary">detected cron</Badge> : undefined}
                    action={
                        <Button variant="ghost" size="sm" onClick={() => setExpression("0 9 * * 1-5")}>
                            Load sample
                        </Button>
                    }
                />
                {visualBuilder ? (
                    <div style={{ padding: 12, display: "grid", gap: 12, overflow: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                            {FIELD_DEFS.map((f, i) => (
                                <div key={f.label} style={{ display: "grid", gap: 4 }}>
                                    <label style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                                        {f.label}
                                        <span style={{ color: "hsl(var(--text-faint))", marginLeft: 4, fontFamily: "var(--font-mono)" }}>
                                            {f.range}
                                        </span>
                                    </label>
                                    <Input
                                        value={fields[i]}
                                        onChange={(e) => updateField(i, e.target.value)}
                                        style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                padding: "10px 12px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid hsl(var(--border))",
                                background: "hsl(var(--surface-1))",
                                fontFamily: "var(--font-mono)",
                                fontSize: "var(--text-md)",
                                color: "hsl(var(--text-strong))",
                                textAlign: "center",
                            }}
                        >
                            {expression.trim() || "* * * * *"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {PRESETS.map((p) => (
                                <Tag key={p.value} active={expression === p.value} onClick={() => setExpression(p.value)}>
                                    {p.label}
                                </Tag>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <CodeEditor
                            value={expression}
                            onChange={setExpression}
                            reportStatus
                            showLineNumbers={false}
                            placeholder="* * * * * — paste or type a cron expression"
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 12px 12px" }}>
                            {PRESETS.map((p) => (
                                <Tag key={p.value} active={expression === p.value} onClick={() => setExpression(p.value)}>
                                    {p.label}
                                </Tag>
                            ))}
                        </div>
                    </>
                )}
            </Panel>
            <Panel>
                <PanelHeader
                    title="Schedule"
                    badge={<ValidityBadge valid={result.valid} validLabel="valid cron" invalidLabel="invalid" />}
                    action={<CopyAction text={expression} />}
                />
                <div style={{ flex: 1, overflow: "auto" }}>
                    {result.valid === false && (
                        <div style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "hsl(var(--danger))" }}>
                            {result.error}
                        </div>
                    )}
                    {result.valid && showExplanation && (
                        <ResultBlock title="Explanation">
                            <div style={{ fontSize: "var(--text-base)", fontWeight: semibold, color: "hsl(var(--text-strong))" }}>
                                {result.description}
                            </div>
                        </ResultBlock>
                    )}
                    {result.valid && showNextRuns && (
                        <ResultBlock title="Next 5 runs">
                            <div style={{ display: "grid", gap: 4 }}>
                                {result.nextRuns.map((r, i) => (
                                    <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "hsl(var(--text-body))" }}>
                                        <span style={{ color: "hsl(var(--text-faint))", marginRight: 10 }}>{i + 1}.</span>
                                        {r}
                                    </div>
                                ))}
                            </div>
                        </ResultBlock>
                    )}
                    {result.valid === null && (
                        <div style={{ padding: "10px 12px", fontSize: "var(--text-sm)", color: "hsl(var(--text-faint))" }}>
                            Enter a cron expression — or flip on the visual builder in the inspector.
                        </div>
                    )}
                </div>
            </Panel>
        </EditorSplit>
    );
}
