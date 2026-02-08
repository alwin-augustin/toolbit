import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, FileText, ArrowLeftRight, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as yaml from "js-yaml"
import { ToolCard } from "@/components/ToolCard"
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
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("yaml-formatter", "YAML Formatter")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)

    useEffect(() => {
        if (input) return
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="YAML Formatter & Converter"
            description="Format YAML and convert between YAML and JSON"
            icon={<FileText className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "yaml-formatter",
                toolName: "YAML Formatter",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                    setOutput(entry.output || "")
                },
            }}
            pipeSource={{
                toolId: "yaml-formatter",
                output: output || "",
            }}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="yaml-input" className="text-sm font-medium">
                        Input (YAML or JSON)
                    </label>
                    <Textarea
                        id="yaml-input"
                        placeholder="key: value"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-grow font-mono text-sm"
                        data-testid="input-yaml"
                    />
                    <div className="flex gap-2 flex-wrap items-center">
                        <Button onClick={formatYaml} disabled={isProcessing} data-testid="button-format-yaml">
                            {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                            Format YAML
                        </Button>
                        <Button onClick={yamlToJson} variant="outline" disabled={isProcessing} data-testid="button-yaml-to-json">
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            YAML → JSON
                        </Button>
                        <Button onClick={jsonToYaml} variant="outline" disabled={isProcessing} data-testid="button-json-to-yaml">
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            JSON → YAML
                        </Button>
                        {input.length > WORKER_THRESHOLD && <span className="text-xs text-muted-foreground">Large input — using background thread</span>}
                    </div>
                </div>

                <div className="space-y-2 flex flex-col h-full">
                    <label htmlFor="yaml-output" className="text-sm font-medium">
                        Output
                    </label>
                    <Textarea
                        id="yaml-output"
                        placeholder="Formatted output will appear here..."
                        value={output}
                        readOnly
                        className={`flex-grow font-mono text-sm ${isValid ? '' : 'text-destructive'}`}
                        data-testid="output-yaml"
                    />
                    <Button
                        onClick={copyToClipboard}
                        disabled={!output}
                        variant="outline"
                        data-testid="button-copy"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                </div>
            </div>
        </ToolCard>
    )
}
