import { useState, useCallback, useMemo } from "react"
import { RefreshCw } from "lucide-react"
import { Button, Alert, Card, Checkbox, Input } from "@/ds/components"
import { CopyAction } from "@/v2/EditorPanels"
import { ToolPage, SectionTitle, Field, Row, Grid2 } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const CHARSETS = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
}

function getRandomValues(count: number): Uint32Array {
    return crypto.getRandomValues(new Uint32Array(count))
}

function calculateStrength(password: string): { score: number; label: string; color: string } {
    let score = 0

    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    // Check for variety
    const uniqueChars = new Set(password).size
    if (uniqueChars > password.length * 0.7) score += 1

    if (score <= 2) return { score, label: "Weak", color: "hsl(var(--danger))" }
    if (score <= 4) return { score, label: "Medium", color: "hsl(var(--warning))" }
    return { score, label: score <= 5 ? "Strong" : "Very Strong", color: "hsl(var(--success))" }
}

export default function PasswordGenerator() {
    const [length, setLength] = useState(16)
    const [includeLowercase, setIncludeLowercase] = useState(true)
    const [includeUppercase, setIncludeUppercase] = useState(true)
    const [includeNumbers, setIncludeNumbers] = useState(true)
    const [includeSymbols, setIncludeSymbols] = useState(true)
    const [count, setCount] = useState(1)
    const [passwords, setPasswords] = useState<string[]>([])
    const [error, setError] = useState("")
    const shareState = useMemo(
        () => ({
            length,
            includeLowercase,
            includeUppercase,
            includeNumbers,
            includeSymbols,
            count,
        }),
        [length, includeLowercase, includeUppercase, includeNumbers, includeSymbols, count],
    )
    useUrlState(shareState, (state) => {
        setLength(typeof state.length === "number" ? state.length : 16)
        setIncludeLowercase(state.includeLowercase !== false)
        setIncludeUppercase(state.includeUppercase !== false)
        setIncludeNumbers(state.includeNumbers !== false)
        setIncludeSymbols(state.includeSymbols !== false)
        setCount(typeof state.count === "number" ? state.count : 1)
    })
    const { addEntry } = useToolHistory("password-generator", "Password Generator")

    const generate = useCallback(() => {
        let charset = ""
        if (includeLowercase) charset += CHARSETS.lowercase
        if (includeUppercase) charset += CHARSETS.uppercase
        if (includeNumbers) charset += CHARSETS.numbers
        if (includeSymbols) charset += CHARSETS.symbols

        if (!charset) {
            setError("Select at least one character type")
            return
        }
        setError("")

        const results: string[] = []
        for (let i = 0; i < count; i++) {
            const randomValues = getRandomValues(length)
            let password = ""
            for (let j = 0; j < length; j++) {
                password += charset[randomValues[j] % charset.length]
            }
            results.push(password)
        }
        setPasswords(results)
        addEntry({
            input: JSON.stringify({ length, includeLowercase, includeUppercase, includeNumbers, includeSymbols, count }),
            output: results.join("\n"),
            metadata: { action: "generate" },
        })
    }, [length, includeLowercase, includeUppercase, includeNumbers, includeSymbols, count, addEntry])

    return (
        <ToolPage maxWidth={720}>
            <Card>
                <div style={{ display: "grid", gap: 16 }}>
                    <SectionTitle>Options</SectionTitle>
                    <Grid2>
                        <Field label={`Length: ${length}`}>
                            <input
                                id="pw-length"
                                type="range"
                                min={4}
                                max={128}
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                style={{ width: "100%", accentColor: "hsl(var(--primary))" }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "var(--text-xs)",
                                    color: "hsl(var(--text-muted))",
                                }}
                            >
                                <span>4</span>
                                <span>128</span>
                            </div>
                        </Field>
                        <Field label="Count">
                            <Input
                                id="pw-count"
                                type="number"
                                min={1}
                                max={50}
                                value={count}
                                onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                            />
                        </Field>
                    </Grid2>
                    <Field label="Character types">
                        <Row gap={16}>
                            <Checkbox checked={includeLowercase} onChange={setIncludeLowercase} label="Lowercase (a-z)" />
                            <Checkbox checked={includeUppercase} onChange={setIncludeUppercase} label="Uppercase (A-Z)" />
                            <Checkbox checked={includeNumbers} onChange={setIncludeNumbers} label="Numbers (0-9)" />
                            <Checkbox checked={includeSymbols} onChange={setIncludeSymbols} label="Symbols (!@#$...)" />
                        </Row>
                    </Field>
                    {error && <Alert tone="danger">{error}</Alert>}
                    <Row>
                        <Button iconLeft={<RefreshCw size={14} />} onClick={generate}>
                            Generate
                        </Button>
                        {passwords.length > 1 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))" }}>
                                    Copy all
                                </span>
                                <CopyAction text={passwords.join("\n")} />
                            </div>
                        )}
                    </Row>
                </div>
            </Card>

            {passwords.length > 0 && (
                <Card>
                    <div style={{ display: "grid", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                        <SectionTitle>Generated passwords</SectionTitle>
                        {passwords.map((pw, i) => {
                            const strength = calculateStrength(pw)
                            return (
                                <div key={i} style={{ display: "grid", gap: 6 }}>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <Input mono readOnly value={pw} style={{ flex: 1 }} />
                                        <CopyAction text={pw} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 6,
                                                borderRadius: 999,
                                                background: "hsl(var(--surface-2))",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    borderRadius: 999,
                                                    background: strength.color,
                                                    width: `${Math.min(100, (strength.score / 7) * 100)}%`,
                                                    transition: "width 150ms ease",
                                                }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                                            {strength.label}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            )}
        </ToolPage>
    )
}
