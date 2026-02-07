import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import {
    Copy,
    Regex,
    Trash2,
    ChevronDown,
    Replace,
    Sparkles,
} from "lucide-react"

interface MatchResult {
    fullMatch: string
    index: number
    groups: string[]
    namedGroups: Record<string, string>
}

const COMMON_PATTERNS: { label: string; pattern: string; flags: string }[] = [
    { label: "Email Address", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
    { label: "URL", pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", flags: "g" },
    { label: "IPv4 Address", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
    { label: "Phone Number (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", flags: "g" },
    { label: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi" },
    { label: "HTML Tag", pattern: "<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)</\\1>", flags: "gs" },
    { label: "ISO Date", pattern: "\\d{4}-\\d{2}-\\d{2}(?:T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})?)?", flags: "g" },
    { label: "UUID", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", flags: "gi" },
    { label: "IP v6", pattern: "(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}", flags: "g" },
    { label: "CSS Property", pattern: "([a-z-]+)\\s*:\\s*([^;]+);", flags: "g" },
]

const FLAG_OPTIONS = [
    { flag: "g", label: "Global", description: "Find all matches" },
    { flag: "i", label: "Case Insensitive", description: "Ignore case" },
    { flag: "m", label: "Multiline", description: "^ and $ match line boundaries" },
    { flag: "s", label: "Dotall", description: ". matches newlines" },
    { flag: "u", label: "Unicode", description: "Unicode support" },
]

export default function RegexTester() {
    const [pattern, setPattern] = useState("")
    const [flags, setFlags] = useState("g")
    const [testString, setTestString] = useState("")
    const [replacement, setReplacement] = useState("")
    const [showReplace, setShowReplace] = useState(false)
    const [showPatterns, setShowPatterns] = useState(false)
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({ pattern, flags, testString, replacement, showReplace }),
        [pattern, flags, testString, replacement, showReplace],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setPattern(typeof state.pattern === "string" ? state.pattern : "")
        setFlags(typeof state.flags === "string" ? state.flags : "g")
        setTestString(typeof state.testString === "string" ? state.testString : "")
        setReplacement(typeof state.replacement === "string" ? state.replacement : "")
        setShowReplace(state.showReplace === true)
    })
    const { addEntry } = useToolHistory("regex-tester", "Regex Tester")

    const toggleFlag = useCallback((flag: string) => {
        setFlags(prev =>
            prev.includes(flag)
                ? prev.replace(flag, "")
                : prev + flag
        )
    }, [])

    const { matches, error, regex } = useMemo(() => {
        if (!pattern || !testString) {
            return { matches: [] as MatchResult[], error: null, regex: null }
        }

        try {
            const re = new RegExp(pattern, flags)
            const results: MatchResult[] = []

            if (flags.includes("g")) {
                let match: RegExpExecArray | null
                let safety = 0
                while ((match = re.exec(testString)) !== null && safety < 10000) {
                    safety++
                    results.push({
                        fullMatch: match[0],
                        index: match.index,
                        groups: match.slice(1),
                        namedGroups: match.groups ? { ...match.groups } : {},
                    })
                    if (match[0].length === 0) {
                        re.lastIndex++
                    }
                }
            } else {
                const match = re.exec(testString)
                if (match) {
                    results.push({
                        fullMatch: match[0],
                        index: match.index,
                        groups: match.slice(1),
                        namedGroups: match.groups ? { ...match.groups } : {},
                    })
                }
            }

            return { matches: results, error: null, regex: re }
        } catch (e) {
            return {
                matches: [] as MatchResult[],
                error: (e as Error).message,
                regex: null,
            }
        }
    }, [pattern, flags, testString])

    const replaceResult = useMemo(() => {
        if (!regex || !showReplace) return ""
        try {
            return testString.replace(regex, replacement)
        } catch {
            return ""
        }
    }, [regex, testString, replacement, showReplace])

    const highlightedText = useMemo(() => {
        if (!matches.length || !testString) return null

        const parts: { text: string; isMatch: boolean; matchIndex: number }[] = []
        let lastEnd = 0

        for (let i = 0; i < matches.length; i++) {
            const m = matches[i]
            if (m.index > lastEnd) {
                parts.push({ text: testString.slice(lastEnd, m.index), isMatch: false, matchIndex: -1 })
            }
            parts.push({ text: m.fullMatch, isMatch: true, matchIndex: i })
            lastEnd = m.index + m.fullMatch.length
        }
        if (lastEnd < testString.length) {
            parts.push({ text: testString.slice(lastEnd), isMatch: false, matchIndex: -1 })
        }

        return parts
    }, [matches, testString])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({ description: "Copied to clipboard!" })
        addEntry({
            input: JSON.stringify({ pattern, flags, testString, replacement, showReplace }),
            output: text,
            metadata: { action: "copy" },
        })
    }

    const applyCommonPattern = (p: typeof COMMON_PATTERNS[0]) => {
        setPattern(p.pattern)
        setFlags(p.flags)
        setShowPatterns(false)
    }

    const loadSample = () => {
        setPattern("(\\w+)@([\\w.]+)")
        setFlags("g")
        setTestString("Contact us at support@toolbit.dev or sales@example.com for help.\nAlso try admin@test.org")
    }

    const clear = () => {
        setPattern("")
        setTestString("")
        setReplacement("")
    }

    return (
        <ToolCard
            title="Regex Tester"
            description="Test regular expressions with real-time matching, capture groups, and replace"
            icon={<Regex className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "regex-tester",
                toolName: "Regex Tester",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { pattern?: string; flags?: string; testString?: string; replacement?: string; showReplace?: boolean }
                        setPattern(parsed.pattern || "")
                        setFlags(parsed.flags || "g")
                        setTestString(parsed.testString || "")
                        setReplacement(parsed.replacement || "")
                        setShowReplace(parsed.showReplace === true)
                    } catch {
                        setPattern(entry.input || "")
                    }
                },
            }}
        >
            {/* Pattern Input */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="regex-pattern" className="text-sm font-medium">
                        Pattern
                    </label>
                    <div className="flex gap-1">
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPatterns(!showPatterns)}
                                className="text-xs"
                            >
                                Common Patterns
                                <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                            {showPatterns && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border bg-popover p-1 shadow-md">
                                    {COMMON_PATTERNS.map((p) => (
                                        <button
                                            key={p.label}
                                            className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => applyCommonPattern(p)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-0 rounded-md border border-input bg-background">
                        <span className="px-2 text-muted-foreground font-mono text-sm">/</span>
                        <Input
                            id="regex-pattern"
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            placeholder="Enter regex pattern..."
                            className="border-0 focus-visible:ring-0 font-mono"
                            data-testid="regex-pattern"
                        />
                        <span className="px-2 text-muted-foreground font-mono text-sm">/{flags}</span>
                    </div>
                </div>
                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
            </div>

            {/* Flags */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Flags</label>
                <div className="flex flex-wrap gap-2">
                    {FLAG_OPTIONS.map((opt) => (
                        <Button
                            key={opt.flag}
                            variant={flags.includes(opt.flag) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFlag(opt.flag)}
                            title={opt.description}
                            className="text-xs"
                        >
                            {opt.flag} - {opt.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Test String */}
            <div className="space-y-2">
                <label htmlFor="test-string" className="text-sm font-medium">
                    Test String
                </label>
                <Textarea
                    id="test-string"
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder="Enter test string..."
                    className="min-h-[120px] font-mono text-sm"
                    data-testid="test-string"
                />
            </div>

            {/* Highlighted Matches */}
            {highlightedText && highlightedText.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Match Highlighting ({matches.length} match{matches.length !== 1 ? "es" : ""})
                    </label>
                    <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                        {highlightedText.map((part, i) =>
                            part.isMatch ? (
                                <mark
                                    key={i}
                                    className="bg-yellow-300 dark:bg-yellow-600 text-foreground rounded-sm px-0.5"
                                    title={`Match ${part.matchIndex + 1}`}
                                >
                                    {part.text}
                                </mark>
                            ) : (
                                <span key={i}>{part.text}</span>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Match Details */}
            {matches.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                            Match Details
                        </label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(matches.map(m => m.fullMatch).join("\n"))}
                        >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Matches
                        </Button>
                    </div>
                    <div className="rounded-md border max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">#</th>
                                    <th className="text-left px-3 py-2 font-medium">Match</th>
                                    <th className="text-left px-3 py-2 font-medium">Index</th>
                                    <th className="text-left px-3 py-2 font-medium">Groups</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((m, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                        <td className="px-3 py-2 font-mono break-all">{m.fullMatch}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{m.index}</td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                            {m.groups.length > 0
                                                ? m.groups.map((g, gi) => (
                                                    <span key={gi} className="inline-block bg-muted rounded px-1 mr-1 mb-1">
                                                        ${gi + 1}: {g}
                                                    </span>
                                                ))
                                                : <span className="text-muted-foreground">—</span>
                                            }
                                            {Object.keys(m.namedGroups).length > 0 && (
                                                <>
                                                    {Object.entries(m.namedGroups).map(([name, val]) => (
                                                        <span key={name} className="inline-block bg-primary/10 text-primary rounded px-1 mr-1 mb-1">
                                                            {name}: {val}
                                                        </span>
                                                    ))}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Replace Section */}
            <div className="space-y-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReplace(!showReplace)}
                >
                    <Replace className="h-3 w-3 mr-1" />
                    {showReplace ? "Hide" : "Show"} Replace
                </Button>
                {showReplace && (
                    <div className="space-y-2">
                        <Input
                            value={replacement}
                            onChange={(e) => setReplacement(e.target.value)}
                            placeholder="Replacement string (supports $1, $2, etc.)"
                            className="font-mono text-sm"
                            data-testid="replacement-input"
                        />
                        {replaceResult && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Result</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(replaceResult)}
                                    >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                                    {replaceResult}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={loadSample}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sample
                </Button>
                <Button variant="outline" onClick={clear}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            </div>
        </ToolCard>
    )
}
