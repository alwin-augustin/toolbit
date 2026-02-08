import { RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AutoSaveRestoreProps {
    visible: boolean
    onRestore: () => void
    onDismiss: () => void
}

export function AutoSaveRestore({ visible, onRestore, onDismiss }: AutoSaveRestoreProps) {
    if (!visible) return null

    return (
        <div
            className="flex items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-4 py-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
            role="alert"
            aria-live="polite"
        >
            <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                Previous session found. Restore your work?
            </p>
            <Button size="sm" variant="outline" onClick={onRestore} className="shrink-0">
                Restore
            </Button>
            <button
                onClick={onDismiss}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 shrink-0"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
