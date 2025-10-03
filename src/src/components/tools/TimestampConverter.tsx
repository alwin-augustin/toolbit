import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"

export default function TimestampConverter() {
    const [timestamp, setTimestamp] = useState("")
    const [dateTime, setDateTime] = useState("")
    const [results, setResults] = useState({
        unix: "",
        iso: "",
        local: "",
        utc: "",
        relative: ""
    })
    const { toast } = useToast()

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
        } catch (_error) {
            toast({ description: "Invalid timestamp", variant: "destructive" })
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
        } catch (_error) {
            toast({ description: "Invalid date/time", variant: "destructive" })
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="Timestamp Converter"
            description="Convert between Unix timestamps and human-readable dates"
            icon={<Clock className="h-5 w-5" />}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="timestamp-input" className="text-sm font-medium">
                        Unix Timestamp
                    </label>
                    <div className="flex gap-2">
                        <Input
                            id="timestamp-input"
                            placeholder="1640995200"
                            value={timestamp}
                            onChange={(e) => setTimestamp(e.target.value)}
                            className="font-mono"
                            data-testid="input-timestamp"
                        />
                        <Button onClick={convertFromTimestamp} data-testid="button-convert-timestamp">
                            Convert
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="datetime-input" className="text-sm font-medium">
                        Date/Time
                    </label>
                    <div className="flex gap-2">
                        <Input
                            id="datetime-input"
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            data-testid="input-datetime"
                        />
                        <Button onClick={convertFromDateTime} variant="outline" data-testid="button-convert-datetime">
                            Convert
                        </Button>
                    </div>
                </div>
            </div>

            <Button onClick={getCurrentTimestamp} className="w-full" data-testid="button-current">
                Get Current Timestamp
            </Button>

            {results.unix && (
                <div className="space-y-3">
                    {Object.entries({
                        unix: "Unix Timestamp",
                        iso: "ISO 8601",
                        local: "Local Time",
                        utc: "UTC",
                        relative: "Relative"
                    }).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                            <label className="text-sm font-medium w-24">{label}:</label>
                            <Input
                                value={results[key as keyof typeof results]}
                                readOnly
                                className="font-mono text-sm"
                                data-testid={`output-${key}`}
                            />
                            <Button
                                onClick={() => copyToClipboard(results[key as keyof typeof results])}
                                variant="outline"
                                size="icon"
                                data-testid={`button-copy-${key}`}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </ToolCard>
    )
}