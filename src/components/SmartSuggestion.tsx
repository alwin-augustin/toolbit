import { useState, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import { detectInput, type DetectionResult } from "@/lib/input-detector"
import { TOOLS } from "@/config/tools.config"
import { Lightbulb, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SmartSuggestion() {
    const [suggestion, setSuggestion] = useState<DetectionResult | null>(null)
    const [dismissed, setDismissed] = useState(false)
    const [location, setLocation] = useLocation()

    const handlePaste = useCallback((e: ClipboardEvent) => {
        const text = e.clipboardData?.getData("text/plain")
        if (!text || text.length > 50_000) return

        const result = detectInput(text)
        if (!result || result.confidence < 0.7) return

        // Don't suggest the tool we're already on
        const currentTool = TOOLS.find((t) => t.path === location)
        if (currentTool?.id === result.toolId) return

        setSuggestion(result)
        setDismissed(false)
    }, [location])

    useEffect(() => {
        document.addEventListener("paste", handlePaste)
        return () => document.removeEventListener("paste", handlePaste)
    }, [handlePaste])

    // Clear suggestion on navigation
    useEffect(() => {
        setSuggestion(null)
        setDismissed(false)
    }, [location])

    const handleNavigate = () => {
        const tool = TOOLS.find((t) => t.id === suggestion?.toolId)
        if (tool) {
            setLocation(tool.path)
            setSuggestion(null)
        }
    }

    if (!suggestion || dismissed) return null

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] animate-in slide-in-from-bottom-4 fade-in duration-300"
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg">
                <Lightbulb className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{suggestion.message}</p>
                    <p className="text-xs text-muted-foreground">
                        Open in {suggestion.toolName}?
                    </p>
                </div>
                <Button size="sm" onClick={handleNavigate} className="shrink-0 gap-1.5">
                    Open
                    <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="Dismiss suggestion"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
