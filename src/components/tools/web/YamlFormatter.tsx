import { useState, useEffect, useCallback } from "react"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import * as yaml from "js-yaml"
import { Button } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "@/v2/EditorPanels"
import { useEditorStatus } from "@/v2/workspace-store"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"
import { useWorkspace } from "@/hooks/use-workspace"

const WORKER_THRESHOLD = 100_000 // 100KB

function runMainThread(input: string, action: "format" | "yaml-to-json" | "json-to-yaml"): string {
    if (action === "format") {
        return yaml.dump(yaml.load(input), { indent: 2 })
    } else if (action === "yaml-to-json") {
        return JSON.stringify(yaml.load(input), null, 2)
    } else {
        return yaml.dump(JSON.parse(input), { indent: 2 })
    }
}

export default function YamlFormatter() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const [isValid, setIsValid] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("yaml-formatter", "YAML Formatter")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)
    const setStatus = useEditorStatus((s) => s.setStatus)

    useEffect(() => {
        if (input) return
        // Check for smart-paste data from AppHome
        const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
        if (smartPaste) {
            sessionStorage.removeItem("toolbit:smart-paste");
            setInput(smartPaste.trim());
            return;
        }
        const workspaceState = consumeWorkspaceState("yaml-formatter")
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string }
                setInput(parsed.input || "")
                setOutput(parsed.output || "")
            } catch {
                setInput(workspaceState)
            }
            return
        }
        const payload = consumePipeData()
        if (payload?.data) {
            setInput(payload.data)
        }
    }, [consumePipeData, input, setInput, setOutput, consumeWorkspaceState])

    const runWithWorker = useCallback((text: string, action: "format" | "yaml-to-json" | "json-to-yaml"): Promise<string> => {
        const worker = new Worker(new URL("../../../workers/yaml-worker.ts", import.meta.url), { type: "module" })
        return new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => { worker.terminate(); reject(new Error("Timeout")) }, 30_000)
            worker.onmessage = (e: MessageEvent) => {
                window.clearTimeout(timeout); worker.terminate()
                if (e.data?.ok) resolve(e.data.result)
                else reject(new Error(e.data?.error || "Worker failed"))
            }
            worker.onerror = (e) => { window.clearTimeout(timeout); worker.terminate(); reject(new Error(e.message)) }
            worker.postMessage({ input: text, action })
        })
    }, [])

    const processYaml = useCallback(async (action: "format" | "yaml-to-json" | "json-to-yaml") => {
        setIsProcessing(true)
        try {
            let result: string
            if (input.length > WORKER_THRESHOLD && "Worker" in window) {
                try {
                    result = await runWithWorker(input, action)
                } catch {
                    // Fallback to main thread
                    result = runMainThread(input, action)
                }
            } else {
                result = runMainThread(input, action)
            }
            setOutput(result)
            setIsValid(true)
            addEntry({ input, output: result, metadata: { action } })
        } catch (error) {
            const label = action === "json-to-yaml" ? "Invalid JSON" : "Invalid YAML"
            setOutput(`Error: ${error instanceof Error ? error.message : label}`)
            setIsValid(false)
        }
        setIsProcessing(false)
    }, [input, addEntry, runWithWorker])

    const formatYaml = () => processYaml("format")
    const yamlToJson = () => processYaml("yaml-to-json")
    const jsonToYaml = () => processYaml("json-to-yaml")

    useEffect(() => {
        setStatus({
            valid: output ? isValid : null,
            validityLabel: output ? (isValid ? "Valid YAML" : "Invalid input") : "",
        })
    }, [output, isValid, setStatus])

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader title="Input (YAML or JSON)" />
                <div
                    style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "8px 10px",
                        flexShrink: 0,
                        borderBottom: "1px solid hsl(var(--border-faint))",
                    }}
                >
                    <Button
                        size="sm"
                        onClick={formatYaml}
                        disabled={isProcessing}
                        iconLeft={isProcessing ? <Loader2 size={14} /> : undefined}
                        data-testid="button-format-yaml"
                    >
                        Format YAML
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={yamlToJson}
                        disabled={isProcessing}
                        iconLeft={<ArrowLeftRight size={14} />}
                        data-testid="button-yaml-to-json"
                    >
                        YAML to JSON
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={jsonToYaml}
                        disabled={isProcessing}
                        iconLeft={<ArrowLeftRight size={14} />}
                        data-testid="button-json-to-yaml"
                    >
                        JSON to YAML
                    </Button>
                    {input.length > WORKER_THRESHOLD && (
                        <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                            Large input — using background thread
                        </span>
                    )}
                </div>
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    language="text"
                    reportStatus
                    placeholder="key: value"
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title="Output"
                    badge={output ? <ValidityBadge valid={isValid} validLabel="valid" invalidLabel="error" /> : undefined}
                    action={<CopyAction text={isValid ? output : ""} />}
                />
                {output && !isValid ? (
                    <div
                        style={{
                            padding: "10px 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-sm)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "hsl(var(--danger))",
                        }}
                    >
                        {output}
                    </div>
                ) : (
                    <CodeEditor
                        value={output}
                        language="text"
                        readOnly
                        placeholder="Formatted output will appear here..."
                    />
                )}
            </Panel>
        </EditorSplit>
    )
}
