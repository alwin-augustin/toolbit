import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, RefreshCw, Database } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Emma", "Oliver", "Sophia", "Liam",
    "Ava", "Noah", "Isabella", "Lucas", "Mia", "Ethan", "Charlotte", "Mason",
]

const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
]

const DOMAINS = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "proton.me",
    "icloud.com", "mail.com", "fastmail.com", "zoho.com", "aol.com",
]

const STREETS = [
    "Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm St",
    "Washington Blvd", "Park Ave", "Lake Dr", "Hill Rd", "Forest Way",
    "River Rd", "Sunset Blvd", "Broadway", "Market St", "Church St",
]

const CITIES = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Denver", "Seattle", "Boston", "Portland", "Miami", "Atlanta",
]

const STATES = [
    "NY", "CA", "IL", "TX", "AZ", "PA", "FL", "OH", "GA", "NC",
    "MI", "NJ", "VA", "WA", "MA", "CO", "OR", "IN", "TN", "MO",
]

const COMPANIES = [
    "Acme Corp", "Globex Inc", "Initech", "Umbrella Corp", "Stark Industries",
    "Wayne Enterprises", "Cyberdyne Systems", "Soylent Corp", "Tyrell Corp",
    "Massive Dynamic", "Aperture Science", "Black Mesa", "Oscorp", "LexCorp",
]

function rand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randPhone(): string {
    return `(${randInt(200, 999)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`
}

function randZip(): string {
    return String(randInt(10000, 99999))
}

interface FakeRecord {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    company: string
}

function generateRecord(): FakeRecord {
    const firstName = rand(FIRST_NAMES)
    const lastName = rand(LAST_NAMES)
    return {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 99)}@${rand(DOMAINS)}`,
        phone: randPhone(),
        address: `${randInt(100, 9999)} ${rand(STREETS)}`,
        city: rand(CITIES),
        state: rand(STATES),
        zip: randZip(),
        company: rand(COMPANIES),
    }
}

type OutputFormat = "json" | "csv" | "sql"

type FieldKey = keyof FakeRecord

const ALL_FIELDS: { key: FieldKey; label: string }[] = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip", label: "Zip" },
    { key: "company", label: "Company" },
]

function formatRecords(records: FakeRecord[], format: OutputFormat, fields: FieldKey[]): string {
    const filtered = records.map(r => {
        const obj: Record<string, string> = {}
        fields.forEach(f => { obj[f] = r[f] })
        return obj
    })

    switch (format) {
        case "json":
            return JSON.stringify(filtered, null, 2)
        case "csv": {
            const header = fields.join(",")
            const rows = filtered.map(r => fields.map(f => `"${r[f]}"`).join(","))
            return [header, ...rows].join("\n")
        }
        case "sql": {
            const tableName = "users"
            const cols = fields.join(", ")
            const rows = filtered.map(r => {
                const vals = fields.map(f => `'${r[f].replace(/'/g, "''")}'`).join(", ")
                return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`
            })
            return rows.join("\n")
        }
    }
}

export default function FakeDataGenerator() {
    const [count, setCount] = useState(10)
    const [format, setFormat] = useState<OutputFormat>("json")
    const [fields, setFields] = useState<FieldKey[]>(["firstName", "lastName", "email", "phone"])
    const [output, setOutput] = useState("")
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({ count, format, fields }),
        [count, format, fields],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setCount(typeof state.count === "number" ? state.count : 10)
        setFormat(state.format === "csv" || state.format === "sql" ? state.format : "json")
        if (Array.isArray(state.fields) && state.fields.length > 0) {
            setFields(state.fields as FieldKey[])
        }
    })
    const { addEntry } = useToolHistory("fake-data-generator", "Fake Data Generator")

    const toggleField = useCallback((field: FieldKey) => {
        setFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        )
    }, [])

    const generate = useCallback(() => {
        if (fields.length === 0) {
            toast({ description: "Select at least one field", variant: "destructive" })
            return
        }
        const records = Array.from({ length: count }, generateRecord)
        const output = formatRecords(records, format, fields)
        setOutput(output)
        addEntry({
            input: JSON.stringify({ count, format, fields }),
            output,
            metadata: { action: "generate" },
        })
    }, [count, format, fields, toast, addEntry])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="Fake Data Generator"
            description="Generate realistic test data with names, emails, addresses, and more"
            icon={<Database className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "fake-data-generator",
                toolName: "Fake Data Generator",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { count?: number; format?: OutputFormat; fields?: FieldKey[] }
                        setCount(typeof parsed.count === "number" ? parsed.count : 10)
                        setFormat(parsed.format === "csv" || parsed.format === "sql" ? parsed.format : "json")
                        if (Array.isArray(parsed.fields) && parsed.fields.length > 0) {
                            setFields(parsed.fields)
                        }
                        if (entry.output) setOutput(entry.output)
                    } catch {
                        // ignore
                    }
                },
            }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="fake-count" className="text-sm font-medium">Number of Records</label>
                    <Input
                        id="fake-count"
                        type="number"
                        min={1}
                        max={1000}
                        value={count}
                        onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format</label>
                    <div className="flex gap-2">
                        {(["json", "csv", "sql"] as OutputFormat[]).map(f => (
                            <Button
                                key={f}
                                variant={format === f ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFormat(f)}
                                className="uppercase text-xs"
                            >
                                {f}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Fields</label>
                <div className="flex flex-wrap gap-2">
                    {ALL_FIELDS.map(({ key, label }) => (
                        <Button
                            key={key}
                            variant={fields.includes(key) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleField(key)}
                            className="text-xs"
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={generate}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate
                </Button>
                {output && (
                    <Button variant="outline" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                )}
            </div>

            {output && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Output ({count} records)</label>
                    <Textarea
                        value={output}
                        readOnly
                        className="min-h-[300px] font-mono text-sm"
                    />
                </div>
            )}
        </ToolCard>
    )
}
