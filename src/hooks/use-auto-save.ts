import { useEffect, useRef, useCallback, useState } from "react"

const STORAGE_PREFIX = "toolbit:autosave:"
const DEBOUNCE_MS = 1000

/**
 * Auto-saves tool state to localStorage and restores it on revisit.
 * Shows a restore prompt if previous state exists.
 *
 * @param toolId - Unique tool identifier
 * @param state - Current serializable state to save
 * @param onRestore - Callback to restore saved state
 */
export function useAutoSave<T>(
    toolId: string,
    state: T,
    onRestore: (saved: T) => void,
) {
    const [hasRestorable, setHasRestorable] = useState(false)
    const [restoredOnce, setRestoredOnce] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const key = `${STORAGE_PREFIX}${toolId}`

    // Check for saved state on mount
    useEffect(() => {
        if (restoredOnce) return
        try {
            const saved = localStorage.getItem(key)
            if (saved) {
                const parsed = JSON.parse(saved) as { state: T; timestamp: number }
                // Only offer restore if saved within last 24 hours
                if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                    setHasRestorable(true)
                } else {
                    localStorage.removeItem(key)
                }
            }
        } catch {
            localStorage.removeItem(key)
        }
    }, [key, restoredOnce])

    // Debounced save
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            try {
                const serialized = JSON.stringify(state)
                // Don't save empty/default states
                if (serialized === "{}" || serialized === '""' || serialized === "null") return
                localStorage.setItem(key, JSON.stringify({ state, timestamp: Date.now() }))
            } catch {
                // localStorage full or state not serializable — skip
            }
        }, DEBOUNCE_MS)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [state, key])

    const restore = useCallback(() => {
        try {
            const saved = localStorage.getItem(key)
            if (saved) {
                const parsed = JSON.parse(saved) as { state: T }
                onRestore(parsed.state)
            }
        } catch {
            // Ignore parse errors
        }
        setHasRestorable(false)
        setRestoredOnce(true)
    }, [key, onRestore])

    const dismiss = useCallback(() => {
        setHasRestorable(false)
        setRestoredOnce(true)
    }, [])

    const clear = useCallback(() => {
        localStorage.removeItem(key)
        setHasRestorable(false)
    }, [key])

    return { hasRestorable, restore, dismiss, clear }
}
