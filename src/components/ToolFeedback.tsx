import { useState, useEffect } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "toolbit:feedback"

interface FeedbackData {
    [toolId: string]: "up" | "down"
}

function getFeedback(): FeedbackData {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    } catch {
        return {}
    }
}

function saveFeedback(data: FeedbackData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

interface ToolFeedbackProps {
    toolId: string
}

export function ToolFeedback({ toolId }: ToolFeedbackProps) {
    const [vote, setVote] = useState<"up" | "down" | null>(null)
    const [justVoted, setJustVoted] = useState(false)

    useEffect(() => {
        const data = getFeedback()
        setVote(data[toolId] || null)
    }, [toolId])

    const handleVote = (value: "up" | "down") => {
        const data = getFeedback()
        if (vote === value) {
            // Toggle off
            delete data[toolId]
            setVote(null)
        } else {
            data[toolId] = value
            setVote(value)
            setJustVoted(true)
            setTimeout(() => setJustVoted(false), 2000)
        }
        saveFeedback(data)
    }

    return (
        <div className="flex items-center gap-2 text-muted-foreground" role="group" aria-label="Tool feedback">
            {justVoted ? (
                <span className="text-xs text-primary animate-in fade-in duration-200">Thanks!</span>
            ) : (
                <span className="text-xs">Helpful?</span>
            )}
            <button
                onClick={() => handleVote("up")}
                className={cn(
                    "p-1 rounded-md hover:bg-accent transition-colors",
                    vote === "up" && "text-green-600 dark:text-green-400"
                )}
                aria-label="Thumbs up"
                aria-pressed={vote === "up"}
            >
                <ThumbsUp className={cn("h-3.5 w-3.5", vote === "up" && "fill-current")} />
            </button>
            <button
                onClick={() => handleVote("down")}
                className={cn(
                    "p-1 rounded-md hover:bg-accent transition-colors",
                    vote === "down" && "text-red-600 dark:text-red-400"
                )}
                aria-label="Thumbs down"
                aria-pressed={vote === "down"}
            >
                <ThumbsDown className={cn("h-3.5 w-3.5", vote === "down" && "fill-current")} />
            </button>
        </div>
    )
}
