import { useSessionDocumentState } from "@/v2/document-state";
import { useDocumentField } from "@/v2/document-state";
import { useMemo } from "react"
import { Button, Card, Input } from "@/ds/components"
import { ToolPage, SectionTitle, Field, Row, Grid2 } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const RESULT_LABELS = {
    years: "Years",
    months: "Months",
    weeks: "Weeks",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
} as const

export default function DateCalculator() {
    const [startDate, setStartDate] = useDocumentField<string>("startDate", "")
    const [endDate, setEndDate] = useDocumentField<string>("endDate", "")
    const [hasCalculated, setHasCalculated] = useSessionDocumentState("hasCalculated", false)
    const [result, setResult] = useSessionDocumentState("result", {
        days: 0,
        weeks: 0,
        months: 0,
        years: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    })
    const shareState = useMemo(() => ({ startDate, endDate }), [startDate, endDate])
    useUrlState(shareState, (state) => {
        setStartDate(typeof state.startDate === "string" ? state.startDate : "")
        setEndDate(typeof state.endDate === "string" ? state.endDate : "")
    })
    const { addEntry } = useToolHistory("date-calculator", "Date Calculator")

    const calculateDifference = () => {
        if (!startDate || !endDate) return

        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffMs = Math.abs(end.getTime() - start.getTime())

        const seconds = Math.floor(diffMs / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const weeks = Math.floor(days / 7)
        const months = Math.floor(days / 30.44) // Average month length
        const years = Math.floor(days / 365.25) // Account for leap years

        setResult({
            seconds,
            minutes,
            hours,
            days,
            weeks,
            months,
            years
        })
        setHasCalculated(true)
        addEntry({
            input: JSON.stringify({ startDate, endDate }),
            output: JSON.stringify({ days, weeks, months, years, hours, minutes, seconds }),
            metadata: { action: "calculate" },
        })
    }

    const setToday = (field: 'start' | 'end') => {
        const today = new Date().toISOString().split('T')[0]
        if (field === 'start') {
            setStartDate(today)
        } else {
            setEndDate(today)
        }
    }

    return (
        <ToolPage maxWidth={720}>
            <Card>
                <div style={{ display: "grid", gap: 14 }}>
                    <SectionTitle>Date range</SectionTitle>
                    <Grid2>
                        <Field label="Start date">
                            <Row wrap={false}>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <Button variant="outline" onClick={() => setToday('start')}>
                                    Today
                                </Button>
                            </Row>
                        </Field>
                        <Field label="End date">
                            <Row wrap={false}>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                                <Button variant="outline" onClick={() => setToday('end')}>
                                    Today
                                </Button>
                            </Row>
                        </Field>
                    </Grid2>
                    <Button onClick={calculateDifference} disabled={!startDate || !endDate}>
                        Calculate difference
                    </Button>
                </div>
            </Card>

            {hasCalculated && (
                <Card>
                    <div style={{ display: "grid", gap: 12 }}>
                        <SectionTitle>Difference</SectionTitle>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                            {(Object.keys(RESULT_LABELS) as Array<keyof typeof RESULT_LABELS>).map((key) => (
                                <div
                                    key={key}
                                    style={{
                                        display: "grid",
                                        gap: 2,
                                        justifyItems: "center",
                                        padding: "12px 8px",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius-md)",
                                        background: "hsl(var(--surface-1))",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "var(--text-lg)",
                                            fontWeight: "var(--weight-semibold)" as React.CSSProperties["fontWeight"],
                                            color: "hsl(var(--primary))",
                                        }}
                                    >
                                        {result[key].toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                                        {RESULT_LABELS[key]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}
        </ToolPage>
    )
}
