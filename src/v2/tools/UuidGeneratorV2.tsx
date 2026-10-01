import { useDocumentField, useDocumentOptions } from "../document-state";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button, Badge, Select, Checkbox, Input } from "@/ds/components";
import { CodeEditor } from "../CodeEditor";
import { Panel, PanelHeader, CopyAction, EditorSplit } from "../EditorPanels";
import { registerInspectorPanel } from "../Inspector";
import { useEditorStatus } from "../workspace-store";
import { useToolHistory } from "@/hooks/use-tool-history";

type UuidVersion = "v4" | "v7";

function useUuidOptions() { return useDocumentOptions({version:"v4" as UuidVersion,count:1,uppercase:false as boolean}); }


function uuidV7(): string {
    // RFC 9562 UUIDv7: 48-bit unix-ms timestamp + version/variant bits + randomness.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let ts = Date.now();
    for (let i = 5; i >= 0; i--) {
        bytes[i] = ts % 256;
        ts = Math.floor(ts / 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generate(version: UuidVersion, count: number, uppercase: boolean): string[] {
    const list = Array.from({ length: count }, () => (version === "v4" ? crypto.randomUUID() : uuidV7()));
    return uppercase ? list.map((u) => u.toUpperCase()) : list;
}

function UuidInspectorPanel() {
    const { version, count, uppercase, set } = useUuidOptions();
    return (
        <>
            <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "hsl(var(--text-body))" }}>Version</label>
                <Select fullWidth value={version} onChange={(e) => set({ version: e.target.value as UuidVersion })}>
                    <option value="v4">v4 — random</option>
                    <option value="v7">v7 — time-ordered</option>
                </Select>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "hsl(var(--text-body))" }}>Batch count</label>
                <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={count}
                    onChange={(e) => set({ count: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })}
                />
            </div>
            <Checkbox checked={uppercase} onChange={(v) => set({ uppercase: v })} label="Uppercase" />
        </>
    );
}

registerInspectorPanel("uuid-generator", UuidInspectorPanel);

export default function UuidGeneratorV2() {
    const { version, count, uppercase } = useUuidOptions();
    const [uuids, setUuids] = useDocumentField<string[]>("uuids", []);
    const setStatus = useEditorStatus((s) => s.setStatus);
    const { addEntry } = useToolHistory("uuid-generator", "UUID Generator");

    const regenerate = () => {
        const next = generate(version, count, uppercase);
        setUuids(next);
        addEntry({ input: `${version} × ${count}`, output: next.join("\n") });
    };

    // Generate an initial batch and re-case existing output when options change.
    useEffect(() => {
        setUuids((prev) =>
            prev.length ? prev.map((u) => (uppercase ? u.toUpperCase() : u.toLowerCase())) : generate(version, count, uppercase)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uppercase]);

    const output = uuids.join("\n");

    useEffect(() => {
        setStatus({ valid: null, bytes: new Blob([output]).size });
    }, [output, setStatus]);

    return (
        <EditorSplit toolId="uuid-generator" output={output}>
            <Panel>
                <PanelHeader
                    title="Generated UUIDs"
                    badge={<Badge tone="primary">{`${version} · ${uuids.length}`}</Badge>}
                    action={
                        <div style={{ display: "flex", gap: 6 }}>
                            <Button size="sm" iconLeft={<RefreshCw size={13} />} onClick={regenerate}>
                                Generate
                            </Button>
                            <CopyAction text={output} />
                        </div>
                    }
                />
                <CodeEditor value={output} readOnly placeholder="Press Generate to create UUIDs." />
            </Panel>
        </EditorSplit>
    );
}
