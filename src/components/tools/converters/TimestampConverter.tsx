import { useState, useMemo } from "react"
import { Clock } from "lucide-react"
import { Button, Card, Input } from "@/ds/components"
import { CopyAction } from "@/v2/EditorPanels"
import { ToolPage, Field, Row, Grid2, SectionTitle } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const RESULT_LABELS: Record<string, string> = {
    unix: "Unix Timestamp",
    iso: "ISO 8601",
    local: "Local Time",
    utc: "UTC",
    relative: "Relative",
}

export default function TimestampConverter() {
    const [timestamp, setTimestamp] = useState("")
    const [dateTime, setDateTime] = useState("")
    const [error, setError] = useState("")
    const [results, setResults] = useState({
        unix: "",
        iso: "",
        local: "",
        utc: "",
        relative: ""
    })
    const shareState = useMemo(() => ({ timestamp, dateTime }), [timestamp, dateTime])
    useUrlState(shareState, (state) => {
        setTimestamp(typeof state.timestamp === "string" ? state.timestamp : "")
        setDateTime(typeof state.dateTime === "string" ? state.dateTime : "")
    })
    const { addEntry } = useToolHistory("timestamp-converter", "Timestamp Converter")

    const convertFromTimestamp = () => {
        try {
            const ts = parseInt(timestamp)
            const date = new Date(ts * 1000)

            setResults({
                unix: ts.toString(),
                iso: date.toISOString(),
                local: date.toLocaleString(),
                utc: date.toUTCString(),
                relative: getRelativeTime(date)
            })
            setError("")
            addEntry({ input: JSON.stringify({ timestamp, dateTime }), output: JSON.stringify({ unix: ts.toString() }), metadata: { action: "from-timestamp" } })
        } catch (_error) {
            setError("Invalid timestamp")
        }
    }

    const convertFromDateTime = () => {
        try {
            const date = new Date(dateTime)
            const ts = Math.floor(date.getTime() / 1000)

            setResults({
                unix: ts.toString(),
                iso: date.toISOString(),
                local: date.toLocaleString(),
                utc: date.toUTCString(),
                relative: getRelativeTime(date)
            })
            setError("")
            addEntry({ input: JSON.stringify({ timestamp, dateTime }), output: JSON.stringify({ unix: ts.toString() }), metadata: { action: "from-datetime" } })
        } catch (_error) {
            setError("Invalid date/time")
        }
    }

    const getCurrentTimestamp = () => {
        const now = new Date()
        const ts = Math.floor(now.getTime() / 1000)

        setTimestamp(ts.toString())
        setResults({
            unix: ts.toString(),
            iso: now.toISOString(),
            local: now.toLocaleString(),
            utc: now.toUTCString(),
            relative: "Now"
        })
        setError("")
        addEntry({ input: JSON.stringify({ timestamp: ts.toString(), dateTime: "" }), output: JSON.stringify({ unix: ts.toString() }), metadata: { action: "current" } })
    }

    const getRelativeTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const seconds = Math.floor(diff / 1000)

        if (seconds < 60) return `${seconds} seconds ago`
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
        return `${Math.floor(seconds / 86400)} days ago`
    }

    return (
        <ToolPage>
            <Card>
                <div style={{ display: "grid", gap: 12 }}>
                    <SectionTitle>Input</SectionTitle>
                    <Grid2>
                        <Field label="Unix timestamp" hint="Unix timestamps are usually 10 digits (seconds).">
                            <Row wrap={false}>
                                <Input
                                    id="timestamp-input"
                                    mono
                                    placeholder="1640995200"
                                    value={timestamp}
                                    onChange={(e) => setTimestamp(e.target.value)}
                                    style={{ flex: 1 }}
                                    data-testid="input-timestamp"
                                />
                                <Button onClick={convertFromTimestamp} data-testid="button-convert-timestamp">
                                    Convert
                                </Button>
                            </Row>
                        </Field>
                        <Field label="Date/time">
                            <Row wrap={false}>
                                <Input
                                    id="datetime-input"
                                    type="datetime-local"
                                    value={dateTime}
                                    onChange={(e) => setDateTime(e.target.value)}
                                    style={{ flex: 1 }}
                                    data-testid="input-datetime"
                                />
                                <Button variant="outline" onClick={convertFromDateTime} data-testid="button-convert-datetime">
                                    Convert
                                </Button>
                            </Row>
                        </Field>
                    </Grid2>
                    <Button
                        variant="secondary"
                        iconLeft={<Clock size={14} />}
                        onClick={getCurrentTimestamp}
                        data-testid="button-current"
                    >
                        Get current timestamp
                    </Button>
                    {error && (
                        <span style={{ fontSize: "var(--text-sm)", color: "hsl(var(--danger))" }}>{error}</span>
                    )}
                </div>
            </Card>

            {results.unix && (
                <Card>
                    <div style={{ display: "grid", gap: 12 }}>
                        <SectionTitle>Results</SectionTitle>
                        {Object.entries(RESULT_LABELS).map(([key, label]) => (
                            <Row key={key} wrap={false}>
                                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "hsl(var(--text-body))", width: 120, flexShrink: 0 }}>
                                    {label}
                                </label>
                                <Input
                                    mono
                                    value={results[key as keyof typeof results]}
                                    readOnly
                                    style={{ flex: 1 }}
                                    data-testid={`output-${key}`}
                                />
                                <CopyAction text={results[key as keyof typeof results]} />
                            </Row>
                        ))}
                    </div>
                </Card>
            )}
        </ToolPage>
    )
}
