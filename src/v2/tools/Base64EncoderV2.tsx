import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Button, Badge, Checkbox, Tabs } from "@/ds/components";
import { CodeEditor } from "../CodeEditor";
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "../EditorPanels";
import { registerInspectorPanel } from "../Inspector";
import { useEditorStatus } from "../workspace-store";
import { useSmartPasteInput } from "../smart-paste";
import { useToolHistory } from "@/hooks/use-tool-history";

type Mode = "encode" | "decode";

interface Base64Options {
    mode: Mode;
    urlSafe: boolean;
    set: (patch: Partial<Omit<Base64Options, "set">>) => void;
}

const useBase64Options = create<Base64Options>()(
    persist(
        (set) => ({
            mode: "encode" as Mode,
            urlSafe: false,
            set: (patch) => set(patch),
        }),
        { name: "toolbit-v2-base64-options" }
    )
);

/** UTF-8 safe encode/decode (matches the legacy tool's behaviour). */
function encodeBase64(text: string, urlSafe: boolean): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    let out = btoa(binary);
    if (urlSafe) out = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return out;
}

function decodeBase64(text: string, urlSafe: boolean): string {
    let normalized = text.trim();
    if (urlSafe || /[-_]/.test(normalized)) {
        normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
    }
    normalized += "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function Base64InspectorPanel() {
    const { mode, urlSafe, set } = useBase64Options();
    return (
        <>
            <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "hsl(var(--text-body))" }}>Mode</label>
                <Tabs
                    variant="segment"
                    value={mode}
                    onChange={(v) => set({ mode: v as Mode })}
                    items={[
                        { value: "encode", label: "Encode" },
                        { value: "decode", label: "Decode" },
                    ]}
                />
            </div>
            <Checkbox checked={urlSafe} onChange={(v) => set({ urlSafe: v })} label="URL-safe variant (-_ instead of +/)" />
        </>
    );
}

registerInspectorPanel("base64-encoder", Base64InspectorPanel);

export default function Base64EncoderV2() {
    const [input, setInput] = useState("");
    useSmartPasteInput(setInput);
    const { mode, urlSafe } = useBase64Options();
    const setStatus = useEditorStatus((s) => s.setStatus);
    const { addEntry } = useToolHistory("base64-encoder", "Base64 Encoder");

    const result = useMemo(() => {
        if (!input.trim()) return { output: "", valid: null as boolean | null };
        try {
            const output = mode === "encode" ? encodeBase64(input, urlSafe) : decodeBase64(input, urlSafe);
            return { output, valid: true as boolean | null };
        } catch {
            return { output: "Invalid Base64 input", valid: false as boolean | null };
        }
    }, [input, mode, urlSafe]);

    useEffect(() => {
        setStatus({
            valid: result.valid,
            validityLabel:
                result.valid === null ? "" : result.valid ? (mode === "encode" ? "Encoded" : "Decoded") : "Invalid Base64",
        });
    }, [result.valid, mode, setStatus]);

    useEffect(() => {
        if (result.valid !== true || !input.trim()) return;
        const t = setTimeout(() => addEntry({ input, output: result.output, metadata: { mode, urlSafe } }), 1500);
        return () => clearTimeout(t);
    }, [input, result.output, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <EditorSplit toolId="base64-encoder" output={result.valid ? result.output : ""}>
            <Panel>
                <PanelHeader
                    title={mode === "encode" ? "Plain text" : "Base64"}
                    badge={input.trim() && mode === "decode" ? <Badge tone="primary">detected Base64</Badge> : undefined}
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInput(mode === "encode" ? "Local-first developer tools — privacy by default." : "TG9jYWwtZmlyc3QgZGV2ZWxvcGVyIHRvb2xzIOKAlCBwcml2YWN5IGJ5IGRlZmF1bHQu")}
                        >
                            Load sample
                        </Button>
                    }
                />
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    reportStatus
                    placeholder={mode === "encode" ? "Type or paste text to encode…" : "Paste Base64 to decode…"}
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title={mode === "encode" ? "Base64" : "Plain text"}
                    badge={<ValidityBadge valid={result.valid} validLabel={mode === "encode" ? "encoded" : "decoded"} invalidLabel="invalid input" />}
                    action={<CopyAction text={result.valid ? result.output : ""} />}
                />
                {result.valid === false ? (
                    <div style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "hsl(var(--danger))" }}>
                        {result.output}
                    </div>
                ) : (
                    <CodeEditor value={result.output} readOnly />
                )}
            </Panel>
        </EditorSplit>
    );
}
