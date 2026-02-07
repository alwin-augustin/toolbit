import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { GitCompare, Copy, Download, Columns, AlignJustify } from "lucide-react"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import * as Diff from "diff"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"
import { useWorkspace } from "@/hooks/use-workspace"

type ViewMode = "unified" | "side-by-side"

interface DiffLine {
    type: "added" | "removed" | "unchanged"
    value: string
    lineNumOld?: number
    lineNumNew?: number
}

function computeDiff(text1: string, text2: string, ignoreWhitespace: boolean): DiffLine[] {
    const changes = Diff.diffLines(
        ignoreWhitespace ? text1.replace(/[ \t]+/g, " ").replace(/ +\n/g, "\n") : text1,
        ignoreWhitespace ? text2.replace(/[ \t]+/g, " ").replace(/ +\n/g, "\n") : text2
    )

    const lines: DiffLine[] = []
    let oldLine = 1
    let newLine = 1

    for (const change of changes) {
        const changeLines = change.value.replace(/\n$/, "").split("\n")
        for (const line of changeLines) {
            if (change.added) {
                lines.push({ type: "added", value: line, lineNumNew: newLine++ })
            } else if (change.removed) {
                lines.push({ type: "removed", value: line, lineNumOld: oldLine++ })
            } else {
                lines.push({ type: "unchanged", value: line, lineNumOld: oldLine++, lineNumNew: newLine++ })
            }
        }
    }

    return lines
}

function generatePatch(text1: string, text2: string, ignoreWhitespace: boolean): string {
    const patch = Diff.createTwoFilesPatch(
        "original",
        "modified",
        ignoreWhitespace ? text1.replace(/[ \t]+/g, " ").replace(/ +\n/g, "\n") : text1,
        ignoreWhitespace ? text2.replace(/[ \t]+/g, " ").replace(/ +\n/g, "\n") : text2
    )
    return patch
}

const WORKER_THRESHOLD_BYTES = 50_000
const WORKER_TIMEOUT_MS = 20_000

const SAMPLE_ORIGINAL = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function formatCurrency(amount) {
  return "$" + amount.toFixed(2);
}`

const SAMPLE_MODIFIED = `function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return Math.round(total * 100) / 100;
}

function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}`

export default function DiffTool() {
    const [text1, setText1] = useState("")
    const [text2, setText2] = useState("")
    const [diffLines, setDiffLines] = useState<DiffLine[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>("unified")
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
    const [hasCompared, setHasCompared] = useState(false)
    const [isComputing, setIsComputing] = useState(false)
    const { toast } = useToast()
    const diffRef = useRef<HTMLDivElement>(null)
    const shareState = useMemo(
        () => ({ text1, text2, viewMode, ignoreWhitespace }),
        [text1, text2, viewMode, ignoreWhitespace],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setText1(typeof state.text1 === "string" ? state.text1 : "")
        setText2(typeof state.text2 === "string" ? state.text2 : "")
        setViewMode(state.viewMode === "side-by-side" ? "side-by-side" : "unified")
        setIgnoreWhitespace(state.ignoreWhitespace === true)
    })
    const { addEntry } = useToolHistory("diff-tool", "Diff Tool")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)

    useEffect(() => {
        if (text1 || text2) return
        const workspaceState = consumeWorkspaceState("diff-tool")
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string }
                if (parsed.input) {
                    const inputData = JSON.parse(parsed.input) as { text1?: string; text2?: string }
                    setText1(inputData.text1 || "")
                    setText2(inputData.text2 || "")
                    return
                }
            } catch {
                setText1(workspaceState)
            }
            return
        }
        const payload = consumePipeData()
        if (payload?.data) {
            setText1(payload.data)
        }
    }, [consumePipeData, text1, text2, consumeWorkspaceState])

    const runWorkerDiff = useCallback((inputA: string, inputB: string, whitespace: boolean) => {
        const worker = new Worker(new URL("../../../workers/diff-worker.ts", import.meta.url), { type: "module" })
        return new Promise<{ diffLines: DiffLine[]; patch: string }>((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                worker.terminate()
                reject(new Error("Worker timed out"))
            }, WORKER_TIMEOUT_MS)

            worker.onmessage = (event: MessageEvent<{ ok: boolean; diffLines?: DiffLine[]; patch?: string; error?: string }>) => {
                window.clearTimeout(timeout)
                worker.terminate()
                if (event.data?.ok && event.data.diffLines && typeof event.data.patch === "string") {
                    resolve({ diffLines: event.data.diffLines, patch: event.data.patch })
                } else {
                    reject(new Error(event.data?.error || "Worker failed"))
                }
            }

            worker.onerror = (event) => {
                window.clearTimeout(timeout)
                worker.terminate()
                reject(new Error(event.message || "Worker error"))
            }

            worker.postMessage({ text1: inputA, text2: inputB, ignoreWhitespace: whitespace })
        })
    }, [])

    const compare = useCallback(async () => {
        setIsComputing(true)
        const payloadSize = new Blob([text1, text2]).size
        try {
            if (payloadSize > WORKER_THRESHOLD_BYTES && "Worker" in window) {
                const result = await runWorkerDiff(text1, text2, ignoreWhitespace)
                setDiffLines(result.diffLines)
                setHasCompared(true)
                addEntry({
                    input: JSON.stringify({ text1, text2 }),
                    output: result.patch,
                    metadata: { action: "compare", viewMode, ignoreWhitespace, usedWorker: true },
                })
                setIsComputing(false)
                return
            }
        } catch (_error) {
            toast({ description: "Worker failed, running on main thread." })
        }

        const lines = computeDiff(text1, text2, ignoreWhitespace)
        setDiffLines(lines)
        setHasCompared(true)
        addEntry({
            input: JSON.stringify({ text1, text2 }),
            output: generatePatch(text1, text2, ignoreWhitespace),
            metadata: { action: "compare", viewMode, ignoreWhitespace, usedWorker: false },
        })
        setIsComputing(false)
    }, [text1, text2, ignoreWhitespace, addEntry, viewMode, toast, runWorkerDiff])

    const loadSample = () => {
        setText1(SAMPLE_ORIGINAL)
        setText2(SAMPLE_MODIFIED)
        setDiffLines([])
        setHasCompared(false)
    }

    const copyDiff = () => {
        const text = diffLines.map(l => {
            if (l.type === "added") return `+ ${l.value}`
            if (l.type === "removed") return `- ${l.value}`
            return `  ${l.value}`
        }).join("\n")
        navigator.clipboard.writeText(text)
        toast({ description: "Diff copied!" })
    }

    const exportPatch = () => {
        const patch = generatePatch(text1, text2, ignoreWhitespace)
        const blob = new Blob([patch], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "changes.patch"
        a.click()
        URL.revokeObjectURL(url)
        toast({ description: "Patch file downloaded!" })
    }

    const stats = {
        added: diffLines.filter(l => l.type === "added").length,
        removed: diffLines.filter(l => l.type === "removed").length,
        unchanged: diffLines.filter(l => l.type === "unchanged").length,
    }

    const lineClass = (type: "added" | "removed" | "unchanged") => {
        if (type === "added") return "bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200"
        if (type === "removed") return "bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200"
        return ""
    }

    const linePrefix = (type: "added" | "removed" | "unchanged") => {
        if (type === "added") return "+"
        if (type === "removed") return "-"
        return " "
    }

    return (
        <ToolCard
            title="Diff Tool"
            description="Compare two texts and highlight differences"
            icon={<GitCompare className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "diff-tool",
                toolName: "Diff Tool",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { text1?: string; text2?: string }
                        setText1(parsed.text1 || "")
                        setText2(parsed.text2 || "")
                    } catch {
                        setText1(entry.input || "")
                    }
                },
            }}
            pipeSource={{
                toolId: "diff-tool",
                output: generatePatch(text1, text2, ignoreWhitespace),
            }}
        >
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <Button onClick={compare} data-testid="button-compare" disabled={isComputing}>
                    Compare
                </Button>
                <Button onClick={loadSample} variant="outline" data-testid="button-sample">
                    Sample
                </Button>
                <div className="flex items-center gap-1.5 ml-auto">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={ignoreWhitespace}
                            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                            className="rounded"
                        />
                        Ignore whitespace
                    </label>
                </div>
            </div>

            {/* Input areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Original</label>
                    <Textarea
                        value={text1}
                        onChange={(e) => setText1(e.target.value)}
                        placeholder="Paste original text..."
                        className="h-48 font-mono text-sm"
                        data-testid="input-text1"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Modified</label>
                    <Textarea
                        value={text2}
                        onChange={(e) => setText2(e.target.value)}
                        placeholder="Paste modified text..."
                        className="h-48 font-mono text-sm"
                        data-testid="input-text2"
                    />
                </div>
            </div>

            {/* Results */}
            {hasCompared && (
                <div className="space-y-3">
                    {/* Results toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600 font-medium">+{stats.added}</span>
                            <span className="text-red-600 font-medium">-{stats.removed}</span>
                            <span className="text-muted-foreground">{stats.unchanged} unchanged</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            <Button
                                variant={viewMode === "unified" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("unified")}
                                title="Unified view"
                            >
                                <AlignJustify className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant={viewMode === "side-by-side" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setViewMode("side-by-side")}
                                title="Side-by-side view"
                            >
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={copyDiff}>
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportPatch}>
                                <Download className="h-3.5 w-3.5 mr-1" />
                                .patch
                            </Button>
                        </div>
                    </div>

                    {/* Diff output */}
                    <div ref={diffRef} className="border rounded-md overflow-hidden max-h-[500px] overflow-y-auto">
                        {viewMode === "unified" ? (
                            <div className="font-mono text-sm">
                                {diffLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${lineClass(line.type)}`}
                                    >
                                        <span className="w-10 text-right px-2 text-muted-foreground/60 text-xs leading-6 select-none shrink-0 border-r">
                                            {line.lineNumOld ?? ""}
                                        </span>
                                        <span className="w-10 text-right px-2 text-muted-foreground/60 text-xs leading-6 select-none shrink-0 border-r">
                                            {line.lineNumNew ?? ""}
                                        </span>
                                        <span className="w-5 text-center text-muted-foreground/80 select-none shrink-0 leading-6">
                                            {linePrefix(line.type)}
                                        </span>
                                        <span className="flex-1 px-2 leading-6 whitespace-pre">
                                            {line.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <SideBySideView lines={diffLines} />
                        )}
                    </div>
                </div>
            )}
        </ToolCard>
    )
}

function SideBySideView({ lines }: { lines: DiffLine[] }) {
    // Build paired lines for side-by-side
    const pairs: { left?: DiffLine; right?: DiffLine }[] = []
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        if (line.type === "unchanged") {
            pairs.push({ left: line, right: line })
            i++
        } else if (line.type === "removed") {
            // Check if next is added (paired change)
            if (i + 1 < lines.length && lines[i + 1].type === "added") {
                pairs.push({ left: line, right: lines[i + 1] })
                i += 2
            } else {
                pairs.push({ left: line })
                i++
            }
        } else {
            pairs.push({ right: line })
            i++
        }
    }

    const cellClass = (type?: "added" | "removed" | "unchanged") => {
        if (type === "added") return "bg-green-50 dark:bg-green-950/40"
        if (type === "removed") return "bg-red-50 dark:bg-red-950/40"
        return ""
    }

    return (
        <div className="font-mono text-sm">
            {pairs.map((pair, i) => (
                <div key={i} className="flex">
                    {/* Left side */}
                    <div className={`flex-1 flex border-r ${cellClass(pair.left?.type)}`}>
                        <span className="w-8 text-right px-1 text-muted-foreground/60 text-xs leading-6 select-none shrink-0 border-r">
                            {pair.left?.lineNumOld ?? ""}
                        </span>
                        <span className="flex-1 px-2 leading-6 whitespace-pre truncate">
                            {pair.left?.value ?? ""}
                        </span>
                    </div>
                    {/* Right side */}
                    <div className={`flex-1 flex ${cellClass(pair.right?.type)}`}>
                        <span className="w-8 text-right px-1 text-muted-foreground/60 text-xs leading-6 select-none shrink-0 border-r">
                            {pair.right?.lineNumNew ?? ""}
                        </span>
                        <span className="flex-1 px-2 leading-6 whitespace-pre truncate">
                            {pair.right?.value ?? ""}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}
