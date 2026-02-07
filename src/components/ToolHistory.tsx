import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Clock, RotateCcw } from "lucide-react"
import { useEffect } from "react"
import { useToolHistory } from "@/hooks/use-tool-history"
import { type ToolHistoryEntry } from "@/lib/history-db"

interface ToolHistoryProps {
    toolId: string
    toolName: string
    onRestore: (entry: ToolHistoryEntry) => void
}

function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString()
}

function previewText(text?: string, max = 140): string {
    if (!text) return ""
    const cleaned = text.replace(/\s+/g, " ").trim()
    return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned
}

export function ToolHistory({ toolId, toolName, onRestore }: ToolHistoryProps) {
    const [open, setOpen] = useState(false)
    const { entries, loading, refresh } = useToolHistory(toolId, toolName)

    useEffect(() => {
        if (open) {
            refresh()
        }
    }, [open, refresh])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title="History"
                aria-label="Open history"
            >
                <Clock className="h-4 w-4" />
            </Button>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>{toolName} History</SheetTitle>
                    <SheetDescription>
                        Restore recent inputs and outputs for this tool.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {loading && (
                        <div className="text-sm text-muted-foreground">Loading history…</div>
                    )}
                    {!loading && entries.length === 0 && (
                        <div className="text-sm text-muted-foreground">No history yet.</div>
                    )}
                    {entries.map((entry) => (
                        <div key={entry.id} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatTimestamp(entry.timestamp)}</span>
                                {entry.metadata?.action ? (
                                    <span className="uppercase tracking-wide">{String(entry.metadata.action)}</span>
                                ) : null}
                            </div>
                            <div className="text-sm">
                                <div className="font-medium">Input</div>
                                <div className="font-mono text-xs text-muted-foreground break-words">
                                    {previewText(entry.input)}
                                </div>
                            </div>
                            {entry.output && (
                                <div className="text-sm">
                                    <div className="font-medium">Output</div>
                                    <div className="font-mono text-xs text-muted-foreground break-words">
                                        {previewText(entry.output)}
                                    </div>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    onRestore(entry)
                                    setOpen(false)
                                }}
                            >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Restore
                            </Button>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}
