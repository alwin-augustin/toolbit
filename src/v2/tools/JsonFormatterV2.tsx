import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Button, Badge, Select, Checkbox } from "@/ds/components";
import { CodeEditor } from "../CodeEditor";
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "../EditorPanels";
import { registerInspectorPanel } from "../Inspector";
import { useEditorStatus } from "../workspace-store";
import { useSmartPasteInput } from "../smart-paste";
import { useToolHistory } from "@/hooks/use-tool-history";

const SAMPLE = `{"workspace":"API Debug","tools":["JSON","JWT","Base64"],"density":"comfortable","localFirst":true,"tabs":3}`;

interface JsonOptions {
    indent: number;
    sortKeys: boolean;
    validateWhileTyping: boolean;
    collapseArrays: boolean;
    set: (patch: Partial<Omit<JsonOptions, "set">>) => void;
}

const useJsonOptions = create<JsonOptions>()(
    persist(
        (set) => ({
            indent: 2,
            sortKeys: false,
            validateWhileTyping: true,
            collapseArrays: false,
            set: (patch) => set(patch),
        }),
        { name: "toolbit-v2-json-options" }
    )
);

function sortDeep(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object") {
        return Object.keys(v as Record<string, unknown>)
            .sort()
            .reduce((acc: Record<string, unknown>, k) => {
                acc[k] = sortDeep((v as Record<string, unknown>)[k]);
                return acc;
            }, {});
    }
    return v;
}

const COLLAPSE_THRESHOLD = 20;

function collapseLarge(v: unknown): unknown {
    if (Array.isArray(v)) {
        if (v.length > COLLAPSE_THRESHOLD) {
            return [...v.slice(0, 5).map(collapseLarge), `… ${v.length - 5} more items (collapsed)`];
        }
        return v.map(collapseLarge);
    }
    if (v && typeof v === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = collapseLarge(val);
        return out;
    }
    return v;
}

function JsonInspectorPanel() {
    const { indent, sortKeys, validateWhileTyping, collapseArrays, set } = useJsonOptions();
    return (
        <>
            <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "hsl(var(--text-body))" }}>
                    Indent
                </label>
                <Select fullWidth value={String(indent)} onChange={(e) => set({ indent: Number(e.target.value) })}>
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                    <option value="8">8 spaces</option>
                </Select>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
                <Checkbox checked={sortKeys} onChange={(v) => set({ sortKeys: v })} label="Sort keys" />
                <Checkbox
                    checked={validateWhileTyping}
                    onChange={(v) => set({ validateWhileTyping: v })}
                    label="Validate while typing"
                />
                <Checkbox
                    checked={collapseArrays}
                    onChange={(v) => set({ collapseArrays: v })}
                    label="Collapse large arrays"
                />
            </div>
        </>
    );
}

registerInspectorPanel("json-formatter", JsonInspectorPanel);

export default function JsonFormatterV2() {
    const [input, setInput] = useState("");
    useSmartPasteInput(setInput);
    const [committedInput, setCommittedInput] = useState("");
    const { indent, sortKeys, validateWhileTyping, collapseArrays } = useJsonOptions();
    const setStatus = useEditorStatus((s) => s.setStatus);
    const { addEntry } = useToolHistory("json-formatter", "JSON Formatter");

    const source = validateWhileTyping ? input : committedInput;

    const result = useMemo(() => {
        if (!source.trim()) return { output: "", valid: null as boolean | null };
        try {
            let obj: unknown = JSON.parse(source);
            if (sortKeys) obj = sortDeep(obj);
            if (collapseArrays) obj = collapseLarge(obj);
            return { output: JSON.stringify(obj, null, indent), valid: true as boolean | null };
        } catch (e) {
            return { output: e instanceof Error ? e.message : String(e), valid: false as boolean | null };
        }
    }, [source, indent, sortKeys, collapseArrays]);

    useEffect(() => {
        setStatus({
            valid: result.valid,
            validityLabel: result.valid === null ? "" : result.valid ? "Valid JSON" : "Invalid JSON",
        });
    }, [result.valid, setStatus]);

    // Record successful formats in local history (debounced).
    useEffect(() => {
        if (result.valid !== true || !source.trim()) return;
        const t = setTimeout(() => addEntry({ input: source, output: result.output }), 1500);
        return () => clearTimeout(t);
    }, [source, result.output, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <EditorSplit toolId="json-formatter" output={result.valid ? result.output : ""}>
            <Panel>
                <PanelHeader
                    title="Input"
                    badge={input.trim() ? <Badge tone="primary">detected JSON</Badge> : undefined}
                    action={
                        <div style={{ display: "flex", gap: 6 }}>
                            {!validateWhileTyping && (
                                <Button variant="secondary" size="sm" onClick={() => setCommittedInput(input)}>
                                    Format
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const pretty = JSON.stringify(JSON.parse(SAMPLE), null, 2);
                                    setInput(pretty);
                                    setCommittedInput(pretty);
                                }}
                            >
                                Load sample
                            </Button>
                        </div>
                    }
                />
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    language="json"
                    reportStatus
                    placeholder="Paste JSON here — or ⌘V anywhere and Toolbit detects the tool."
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title="Output"
                    badge={<ValidityBadge valid={result.valid} validLabel="valid object" invalidLabel="parse error" />}
                    action={<CopyAction text={result.valid ? result.output : ""} />}
                />
                {result.valid === false ? (
                    <div
                        style={{
                            padding: "10px 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-sm)",
                            color: "hsl(var(--danger))",
                        }}
                    >
                        {result.output}
                    </div>
                ) : (
                    <CodeEditor value={result.output} language="json" readOnly />
                )}
            </Panel>
        </EditorSplit>
    );
}
