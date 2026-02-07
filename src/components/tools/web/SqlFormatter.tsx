import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { useUrlState } from "@/hooks/use-url-state"
import { Copy, Database, Trash2, Sparkles } from "lucide-react"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"
import { useWorkspace } from "@/hooks/use-workspace"

const SQL_KEYWORDS = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "ON", "AS",
    "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS",
    "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
    "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW",
    "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
    "UNION", "ALL", "DISTINCT", "BETWEEN", "LIKE", "IS", "NULL",
    "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END",
    "ASC", "DESC", "COUNT", "SUM", "AVG", "MIN", "MAX",
    "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CONSTRAINT",
    "IF", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
    "WITH", "RECURSIVE", "EXCEPT", "INTERSECT",
]

// Major clauses that get their own line
const MAJOR_CLAUSES = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT JOIN",
    "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "FULL JOIN", "CROSS JOIN",
    "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
    "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
    "CREATE TABLE", "ALTER TABLE", "DROP TABLE",
    "UNION", "UNION ALL", "EXCEPT", "INTERSECT",
    "WITH", "CASE", "WHEN", "THEN", "ELSE", "END",
]

function formatSql(sql: string): string {
    if (!sql.trim()) return ""

    let formatted = sql.trim()

    // Normalize whitespace
    formatted = formatted.replace(/\s+/g, " ")

    // Add newlines before major clauses
    for (const clause of MAJOR_CLAUSES.sort((a, b) => b.length - a.length)) {
        const regex = new RegExp(`\\b(${clause})\\b`, "gi")
        formatted = formatted.replace(regex, `\n${clause.toUpperCase()}`)
    }

    // Indent sub-clauses
    const lines = formatted.split("\n").filter(l => l.trim())
    const result: string[] = []
    let indent = 0

    for (const line of lines) {
        const trimmed = line.trim()
        const upper = trimmed.toUpperCase()

        // Decrease indent for END
        if (upper.startsWith("END")) {
            indent = Math.max(0, indent - 1)
        }

        // Sub-clauses get indented
        const isSubClause = upper.startsWith("AND ") || upper.startsWith("OR ") ||
            upper.startsWith("ON ") || upper.startsWith("WHEN ") ||
            upper.startsWith("THEN ") || upper.startsWith("ELSE ")

        const currentIndent = isSubClause ? indent + 1 : indent
        result.push("  ".repeat(currentIndent) + trimmed)

        // Increase indent after CASE
        if (upper.startsWith("CASE")) {
            indent++
        }
    }

    return result.join("\n")
}

function minifySql(sql: string): string {
    if (!sql.trim()) return ""
    return sql
        .replace(/--[^\n]*/g, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/\s+/g, " ")
        .trim()
}

function uppercaseKeywords(sql: string): string {
    let result = sql
    for (const keyword of SQL_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi")
        result = result.replace(regex, keyword.toUpperCase())
    }
    return result
}

export default function SqlFormatter() {
    const [input, setInput] = useState("")
    const [output, setOutput] = useState("")
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("sql-formatter", "SQL Formatter")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)

    useEffect(() => {
        if (input) return
        const workspaceState = consumeWorkspaceState("sql-formatter")
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string; output?: string }
                setInput(parsed.input || "")
                setOutput(parsed.output || "")
            } catch {
                setInput(workspaceState)
            }
            return
        }
        const payload = consumePipeData()
        if (payload?.data) {
            setInput(payload.data)
        }
    }, [consumePipeData, input, setInput, setOutput, consumeWorkspaceState])

    const loadSample = () => {
        setInput("SELECT u.id, u.name, u.email, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.active = 1 AND o.total > 100 ORDER BY o.total DESC LIMIT 10;")
        setOutput("")
    }

    const handleFormat = () => {
        const result = formatSql(uppercaseKeywords(input))
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "format" } })
    }

    const handleMinify = () => {
        const result = minifySql(input)
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "minify" } })
    }

    const handleUppercase = () => {
        const result = uppercaseKeywords(input)
        setOutput(result)
        addEntry({ input, output: result, metadata: { action: "uppercase" } })
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output)
        toast({ description: "Copied to clipboard!" })
    }

    return (
        <ToolCard
            title="SQL Formatter"
            description="Format, minify, and uppercase SQL queries"
            icon={<Database className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "sql-formatter",
                toolName: "SQL Formatter",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                    setOutput(entry.output || "")
                },
            }}
            pipeSource={{
                toolId: "sql-formatter",
                output: output || "",
            }}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="sql-input" className="text-sm font-medium">
                        Input SQL
                    </label>
                    <Textarea
                        id="sql-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="SELECT * FROM users WHERE id = 1;"
                        className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleFormat}>Format</Button>
                        <Button variant="outline" onClick={loadSample}>
                            <Sparkles className="h-4 w-4 mr-1" />
                            Sample
                        </Button>
                        <Button onClick={handleMinify} variant="outline">Minify</Button>
                        <Button onClick={handleUppercase} variant="outline">Uppercase Keywords</Button>
                        <Button variant="outline" onClick={() => { setInput(""); setOutput("") }}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Output</label>
                    <Textarea
                        value={output}
                        readOnly
                        placeholder="Formatted SQL will appear here..."
                        className="min-h-[300px] font-mono text-sm"
                    />
                    <Button variant="outline" onClick={copyToClipboard} disabled={!output}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                </div>
            </div>
        </ToolCard>
    )
}
