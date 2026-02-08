import { useState, useEffect, useCallback, createContext, useContext } from "react"

type AnnounceFunction = (message: string, priority?: "polite" | "assertive") => void

const AriaLiveContext = createContext<AnnounceFunction>(() => {})

export function useAnnounce() {
    return useContext(AriaLiveContext)
}

export function AriaLiveAnnouncer({ children }: { children: React.ReactNode }) {
    const [politeMessage, setPoliteMessage] = useState("")
    const [assertiveMessage, setAssertiveMessage] = useState("")

    const announce: AnnounceFunction = useCallback((message, priority = "polite") => {
        if (priority === "assertive") {
            setAssertiveMessage("")
            // Force re-render with empty then set message so screen reader picks it up
            requestAnimationFrame(() => setAssertiveMessage(message))
        } else {
            setPoliteMessage("")
            requestAnimationFrame(() => setPoliteMessage(message))
        }
    }, [])

    // Clear messages after screen reader has had time to read them
    useEffect(() => {
        if (!politeMessage) return
        const timer = setTimeout(() => setPoliteMessage(""), 5000)
        return () => clearTimeout(timer)
    }, [politeMessage])

    useEffect(() => {
        if (!assertiveMessage) return
        const timer = setTimeout(() => setAssertiveMessage(""), 5000)
        return () => clearTimeout(timer)
    }, [assertiveMessage])

    return (
        <AriaLiveContext.Provider value={announce}>
            {children}
            <div
                aria-live="polite"
                aria-atomic="true"
                role="status"
                className="sr-only"
            >
                {politeMessage}
            </div>
            <div
                aria-live="assertive"
                aria-atomic="true"
                role="alert"
                className="sr-only"
            >
                {assertiveMessage}
            </div>
        </AriaLiveContext.Provider>
    )
}
