import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export default function DateCalculator() {
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [result, setResult] = useState({
        days: 0,
        weeks: 0,
        months: 0,
        years: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    })

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
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Date Calculator
                </CardTitle>
                <CardDescription>
                    Calculate the difference between two dates
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="start-date" className="text-sm font-medium">
                            Start Date
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                data-testid="input-start-date"
                            />
                            <Button
                                onClick={() => setToday('start')}
                                variant="outline"
                                data-testid="button-start-today"
                            >
                                Today
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="end-date" className="text-sm font-medium">
                            End Date
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                data-testid="input-end-date"
                            />
                            <Button
                                onClick={() => setToday('end')}
                                variant="outline"
                                data-testid="button-end-today"
                            >
                                Today
                            </Button>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={calculateDifference}
                    className="w-full"
                    disabled={!startDate || !endDate}
                    data-testid="button-calculate"
                >
                    Calculate Difference
                </Button>

                {(startDate && endDate) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries({
                            years: "Years",
                            months: "Months",
                            weeks: "Weeks",
                            days: "Days",
                            hours: "Hours",
                            minutes: "Minutes",
                            seconds: "Seconds"
                        }).map(([key, label]) => (
                            <div key={key} className="text-center p-4 border rounded-md">
                                <div className="text-xl font-bold text-primary" data-testid={`result-${key}`}>
                                    {result[key as keyof typeof result].toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">{label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}