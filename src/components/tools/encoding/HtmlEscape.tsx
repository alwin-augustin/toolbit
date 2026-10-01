import { useSessionDocumentState } from "@/v2/document-state";
import { useDocumentField } from "@/v2/document-state";
import { useEffect, useMemo } from "react";
import { Button, Tabs } from "@/ds/components";
import { CodeEditor } from "@/v2/CodeEditor";
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "@/v2/EditorPanels";
import { useEditorStatus } from "@/v2/workspace-store";
import { useUrlState } from "@/hooks/use-url-state";
import { useToolHistory } from "@/hooks/use-tool-history";

type Mode = "escape" | "unescape";

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function unescapeHtml(input: string): string {
    return input
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&"); // This should be last
}

const SAMPLE = '<div class="example">Hello & "welcome" to <HTML> escape tool!</div>';

const ENTITIES: [string, string][] = [
    ["<", "&lt;"],
    [">", "&gt;"],
    ["&", "&amp;"],
    ['"', "&quot;"],
    ["'", "&#39;"],
];

export default function HtmlEscape() {
    const [input, setInput] = useDocumentField<string>("input", "");
    const [mode, setMode] = useSessionDocumentState<Mode>("mode", "escape");
    const setStatus = useEditorStatus((s) => s.setStatus);
    useUrlState(input, setInput);
    const { addEntry } = useToolHistory("html-escape", "HTML Escape");

    const output = useMemo(() => {
        if (!input) return "";
        return mode === "escape" ? escapeHtml(input) : unescapeHtml(input);
    }, [input, mode]);

    const hasInput = input.trim().length > 0;

    useEffect(() => {
        setStatus({
            valid: hasInput ? true : null,
            validityLabel: hasInput ? (mode === "escape" ? "Escaped" : "Unescaped") : "",
        });
    }, [hasInput, mode, setStatus]);

    useEffect(() => {
        if (!hasInput) return;
        const t = setTimeout(() => addEntry({ input, output, metadata: { action: mode } }), 1500);
        return () => clearTimeout(t);
    }, [input, output, mode]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title={mode === "escape" ? "HTML" : "Escaped HTML"}
                    action={
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Tabs
                                variant="segment"
                                value={mode}
                                onChange={(v) => setMode(v as Mode)}
                                items={[
                                    { value: "escape", label: "Escape" },
                                    { value: "unescape", label: "Unescape" },
                                ]}
                            />
                            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
                                Load sample
                            </Button>
                        </div>
                    }
                />
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    reportStatus
                    placeholder={
                        mode === "escape"
                            ? "Enter HTML to escape…"
                            : "Enter escaped HTML to unescape…"
                    }
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title={mode === "escape" ? "Escaped" : "Unescaped"}
                    badge={
                        <ValidityBadge
                            valid={hasInput ? true : null}
                            validLabel={mode === "escape" ? "escaped" : "unescaped"}
                        />
                    }
                    action={<CopyAction text={output} />}
                />
                <CodeEditor value={output} readOnly placeholder="Result will appear here…" />
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px 16px",
                        padding: "8px 12px",
                        borderTop: "1px solid hsl(var(--border-faint))",
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "hsl(var(--text-muted))",
                        flexShrink: 0,
                    }}
                >
                    {ENTITIES.map(([char, entity]) => (
                        <span key={entity}>
                            {char} → {entity}
                        </span>
                    ))}
                </div>
            </Panel>
        </EditorSplit>
    );
}
