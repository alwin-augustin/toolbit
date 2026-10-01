import { useSessionDocumentState } from "@/v2/document-state";
import { useCallback, useMemo } from "react"
import { RefreshCw } from "lucide-react"
import { Button, Badge, Input, Checkbox, Tabs } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels"
import { Field, Row } from "@/v2/restyle-kit"
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
    const [count, setCount] = useSessionDocumentState("count", 10)
    const [format, setFormat] = useSessionDocumentState<OutputFormat>("format", "json")
    const [fields, setFields] = useSessionDocumentState<FieldKey[]>("fields", ["firstName", "lastName", "email", "phone"])
    const [output, setOutput] = useSessionDocumentState("output", "")
    const shareState = useMemo(
        () => ({ count, format, fields }),
        [count, format, fields],
    )
    useUrlState(shareState, (state) => {
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
    }, [setFields])

    const generate = useCallback(() => {
        if (fields.length === 0) return
        const records = Array.from({ length: count }, generateRecord)
        const output = formatRecords(records, format, fields)
        setOutput(output)
        addEntry({
            input: JSON.stringify({ count, format, fields }),
            output,
            metadata: { action: "generate" },
        })
    }, [count, format, fields, addEntry, setOutput])

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Fake Data"
                    badge={output ? <Badge tone="primary">{`${count} records · ${format.toUpperCase()}`}</Badge> : undefined}
                    action={
                        <div style={{ display: "flex", gap: 6 }}>
                            <Button
                                size="sm"
                                iconLeft={<RefreshCw size={13} />}
                                onClick={generate}
                                disabled={fields.length === 0}
                            >
                                Generate
                            </Button>
                            <CopyAction text={output} />
                        </div>
                    }
                />
                <div
                    style={{
                        display: "grid",
                        gap: 12,
                        padding: "10px 12px",
                        borderBottom: "1px solid hsl(var(--border-faint))",
                        background: "hsl(var(--surface-1))",
                        flexShrink: 0,
                    }}
                >
                    <Row gap={16} align="flex-end">
                        <Field label="Records">
                            <Input
                                id="fake-count"
                                type="number"
                                min={1}
                                max={1000}
                                value={count}
                                onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                                style={{ width: 90 }}
                            />
                        </Field>
                        <Field label="Format">
                            <Tabs
                                variant="segment"
                                items={[
                                    { value: "json", label: "JSON" },
                                    { value: "csv", label: "CSV" },
                                    { value: "sql", label: "SQL" },
                                ]}
                                value={format}
                                onChange={(v) => setFormat(v as OutputFormat)}
                            />
                        </Field>
                    </Row>
                    <Field label="Fields" hint={fields.length === 0 ? "Select at least one field" : undefined}>
                        <Row gap={12}>
                            {ALL_FIELDS.map(({ key, label }) => (
                                <Checkbox
                                    key={key}
                                    checked={fields.includes(key)}
                                    onChange={() => toggleField(key)}
                                    label={label}
                                />
                            ))}
                        </Row>
                    </Field>
                </div>
                <CodeEditor
                    value={output}
                    readOnly
                    language={format === "json" ? "json" : "text"}
                    placeholder="Press Generate to create test data."
                />
            </Panel>
        </EditorSplit>
    )
}
