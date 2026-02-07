import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, RefreshCw, Shield } from "lucide-react"
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

    if (score <= 2) return { score, label: "Weak", color: "bg-destructive" }
    if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" }
    if (score <= 5) return { score, label: "Strong", color: "bg-green-500" }
    return { score, label: "Very Strong", color: "bg-green-600" }
}

export default function PasswordGenerator() {
    const [length, setLength] = useState(16)
    const [includeLowercase, setIncludeLowercase] = useState(true)
    const [includeUppercase, setIncludeUppercase] = useState(true)
    const [includeNumbers, setIncludeNumbers] = useState(true)
    const [includeSymbols, setIncludeSymbols] = useState(true)
    const [count, setCount] = useState(1)
    const [passwords, setPasswords] = useState<string[]>([])
    const { toast } = useToast()
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
    const { getShareUrl } = useUrlState(shareState, (state) => {
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
            toast({ description: "Select at least one character type", variant: "destructive" })
            return
        }

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
    }, [length, includeLowercase, includeUppercase, includeNumbers, includeSymbols, count, toast, addEntry])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({ description: "Copied to clipboard!" })
    }

    const copyAll = () => {
        navigator.clipboard.writeText(passwords.join("\n"))
        toast({ description: `${passwords.length} password(s) copied!` })
    }

    return (
        <ToolCard
            title="Password Generator"
            description="Generate secure random passwords with customizable options"
            icon={<Shield className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "password-generator",
                toolName: "Password Generator",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { length?: number; includeLowercase?: boolean; includeUppercase?: boolean; includeNumbers?: boolean; includeSymbols?: boolean; count?: number }
                        setLength(typeof parsed.length === "number" ? parsed.length : 16)
                        setIncludeLowercase(parsed.includeLowercase !== false)
                        setIncludeUppercase(parsed.includeUppercase !== false)
                        setIncludeNumbers(parsed.includeNumbers !== false)
                        setIncludeSymbols(parsed.includeSymbols !== false)
                        setCount(typeof parsed.count === "number" ? parsed.count : 1)
                        if (entry.output) setPasswords(entry.output.split("\n").filter(Boolean))
                    } catch {
                        // ignore
                    }
                },
            }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="pw-length" className="text-sm font-medium">
                        Length: {length}
                    </label>
                    <input
                        id="pw-length"
                        type="range"
                        min={4}
                        max={128}
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>4</span>
                        <span>128</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="pw-count" className="text-sm font-medium">Count</label>
                    <Input
                        id="pw-count"
                        type="number"
                        min={1}
                        max={50}
                        value={count}
                        onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Character Types</label>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={includeLowercase} onChange={(e) => setIncludeLowercase(e.target.checked)} className="rounded" />
                        Lowercase (a-z)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={includeUppercase} onChange={(e) => setIncludeUppercase(e.target.checked)} className="rounded" />
                        Uppercase (A-Z)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} className="rounded" />
                        Numbers (0-9)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} className="rounded" />
                        Symbols (!@#$...)
                    </label>
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={generate}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate
                </Button>
                {passwords.length > 1 && (
                    <Button variant="outline" onClick={copyAll}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                    </Button>
                )}
            </div>

            {passwords.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {passwords.map((pw, i) => {
                        const strength = calculateStrength(pw)
                        return (
                            <div key={i} className="space-y-1">
                                <div className="flex gap-2 items-center">
                                    <Input value={pw} readOnly className="font-mono text-sm" />
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(pw)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${strength.color}`}
                                            style={{ width: `${Math.min(100, (strength.score / 7) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{strength.label}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </ToolCard>
    )
}
