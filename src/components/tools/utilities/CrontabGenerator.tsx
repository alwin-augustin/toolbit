import { useState, useMemo } from "react"
import cronParser from "cron-parser"
import cronstrue from "cronstrue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Calendar, Zap } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const PRESETS: { label: string; value: string }[] = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Daily at 9 AM", value: "0 9 * * *" },
    { label: "Weekly (Sunday)", value: "0 0 * * 0" },
    { label: "Monthly (1st)", value: "0 0 1 * *" },
    { label: "Yearly (Jan 1)", value: "0 0 1 1 *" },
    { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
    { label: "Every 30 min (business hours)", value: "*/30 9-17 * * 1-5" },
]

const FIELD_DEFS: { label: string; range: string; min: number; max: number; specialLabels?: Record<number, string> }[] = [
    { label: "Minute", range: "0-59", min: 0, max: 59 },
    { label: "Hour", range: "0-23", min: 0, max: 23 },
    { label: "Day of Month", range: "1-31", min: 1, max: 31 },
    { label: "Month", range: "1-12", min: 1, max: 12, specialLabels: { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" } },
    { label: "Day of Week", range: "0-6", min: 0, max: 6, specialLabels: { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" } },
]

const QUICK_OPTIONS = [
    { label: "Every (*)", value: "*" },
    { label: "Every 2nd", value: "*/2" },
    { label: "Every 5th", value: "*/5" },
    { label: "Every 10th", value: "*/10" },
    { label: "Every 15th", value: "*/15" },
]

export default function CrontabGenerator() {
    const [fields, setFields] = useState<string[]>(["*", "*", "*", "*", "*"])
    const { toast } = useToast()
    const shareState = useMemo(() => ({ fields }), [fields])
    const { getShareUrl } = useUrlState(shareState, (state) => {
        if (Array.isArray(state.fields) && state.fields.length === 5) {
            setFields(state.fields.map(String))
        }
    })
    const { addEntry } = useToolHistory("crontab-generator", "Crontab Generator")

    const expression = fields.join(" ")

    const updateField = (index: number, value: string) => {
        setFields(prev => prev.map((f, i) => i === index ? value : f))
    }

    const applyPreset = (value: string) => {
        setFields(value.split(" "))
    }

    const { description, nextRuns, error } = useMemo(() => {
        try {
            const desc = cronstrue.toString(expression)
            const interval = cronParser.parseExpression(expression)
            const runs: string[] = []
            for (let i = 0; i < 10; i++) {
                runs.push(interval.next().toDate().toLocaleString())
            }
            return { description: desc, nextRuns: runs, error: "" }
        } catch (err) {
            return { description: "", nextRuns: [], error: err instanceof Error ? err.message : "Invalid expression" }
        }
    }, [expression])

    const copyExpression = () => {
        navigator.clipboard.writeText(expression)
        toast({ title: "Cron expression copied" })
        addEntry({ input: expression, output: expression, metadata: { action: "copy" } })
    }

    return (
        <ToolCard
            title="Crontab Generator"
            description="Build cron expressions visually with real-time preview"
            icon={<Calendar className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "crontab-generator",
                toolName: "Crontab Generator",
                onRestore: (entry) => {
                    const parts = (entry.input || "* * * * *").split(" ")
                    if (parts.length === 5) setFields(parts)
                },
            }}
        >
            <div className="space-y-4">
                {/* Presets */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> Presets
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map(p => (
                            <Button
                                key={p.value}
                                variant={expression === p.value ? "default" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => applyPreset(p.value)}
                            >
                                {p.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Field Editors */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {FIELD_DEFS.map((def, i) => (
                        <div key={def.label} className="space-y-1.5">
                            <label className="text-xs font-medium">{def.label}</label>
                            <Input
                                value={fields[i]}
                                onChange={(e) => updateField(i, e.target.value)}
                                className="font-mono text-center text-sm"
                                placeholder={def.range}
                            />
                            <div className="flex flex-wrap gap-1">
                                {QUICK_OPTIONS.filter(o => {
                                    if (o.value === "*" || o.value === "*/2") return true
                                    const step = parseInt(o.value.replace("*/", ""))
                                    return step <= (def.max - def.min + 1) / 2
                                }).map(o => (
                                    <button
                                        key={o.value}
                                        onClick={() => updateField(i, o.value)}
                                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                            fields[i] === o.value
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "border-border hover:bg-muted"
                                        }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                            {def.specialLabels && (
                                <p className="text-[10px] text-muted-foreground">
                                    {Object.entries(def.specialLabels).map(([k, v]) => `${k}=${v}`).join(", ")}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Generated Expression */}
                <div className="p-4 rounded-lg border bg-muted/30 text-center space-y-2">
                    <div className="font-mono text-2xl font-bold tracking-wider">{expression}</div>
                    {description && !error && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                    <Button variant="outline" size="sm" onClick={copyExpression}>
                        <Copy className="h-4 w-4 mr-1" /> Copy Expression
                    </Button>
                </div>

                {/* Next Runs */}
                {nextRuns.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Next 10 Runs</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm font-mono">
                            {nextRuns.map((run, i) => (
                                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30">
                                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                    <span>{run}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cheatsheet */}
                <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium mb-1">Cron Syntax Reference</summary>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 p-2 rounded border bg-muted/20">
                        <span><code>*</code> — any value</span>
                        <span><code>5</code> — specific value</span>
                        <span><code>1,3,5</code> — list</span>
                        <span><code>1-5</code> — range</span>
                        <span><code>*/5</code> — every 5th</span>
                        <span><code>1-10/2</code> — range step</span>
                    </div>
                </details>
            </div>
        </ToolCard>
    )
}
