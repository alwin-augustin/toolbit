import { useCallback, useEffect, useState } from "react"
import { addHistoryEntry, getHistoryByToolId, type ToolHistoryEntry } from "@/lib/history-db"

const MAX_TEXT_LENGTH = 100_000

function truncateText(value: string | undefined): string {
    if (!value) return ""
    if (value.length <= MAX_TEXT_LENGTH) return value
    return value.slice(0, MAX_TEXT_LENGTH) + "\n... (truncated)"
}

interface AddHistoryOptions {
    input: string
    output?: string
    metadata?: Record<string, unknown>
}

export function useToolHistory(toolId: string, toolName: string) {
    const [entries, setEntries] = useState<ToolHistoryEntry[]>([])
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        setLoading(true)
        const data = await getHistoryByToolId(toolId)
        setEntries(data)
        setLoading(false)
    }, [toolId])

    useEffect(() => {
        refresh()
    }, [refresh])

    const addEntry = useCallback(async (payload: AddHistoryOptions) => {
        await addHistoryEntry({
            toolId,
            toolName,
            timestamp: Date.now(),
            input: truncateText(payload.input),
            output: payload.output ? truncateText(payload.output) : undefined,
            metadata: payload.metadata,
        })
        await refresh()
    }, [toolId, toolName, refresh])

    return {
        entries,
        loading,
        refresh,
        addEntry,
    }
}
