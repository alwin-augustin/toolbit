import { useSessionDocumentState } from "@/v2/document-state";
import { useDocumentField } from "@/v2/document-state";
import { useEffect } from "react"
import { Trash2, Sparkles } from "lucide-react"
import { Button } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels"
import { useEditorStatus } from "@/v2/workspace-store"
import { useUrlState } from "@/hooks/use-url-state"
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
    const [input, setInput] = useDocumentField<string>("input", "")
    const [output, setOutput] = useSessionDocumentState("output", "")
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("sql-formatter", "SQL Formatter")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)
    const setStatus = useEditorStatus((s) => s.setStatus)

    useEffect(() => {
        if (input) return
        // Check for smart-paste data from AppHome
        const smartPaste = sessionStorage.getItem("toolbit:smart-paste");
        if (smartPaste) {
            sessionStorage.removeItem("toolbit:smart-paste");
            setInput(smartPaste.trim());
            return;
        }
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

    // SQL formatting has no validation step; keep the status bar neutral.
    useEffect(() => {
        setStatus({ valid: null, validityLabel: "" })
    }, [setStatus])

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

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Input SQL"
                    action={
                        <Button variant="ghost" size="sm" iconLeft={<Sparkles size={14} />} onClick={loadSample}>
                            Load sample
                        </Button>
                    }
                />
                <div
                    style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "8px 10px",
                        flexShrink: 0,
                        borderBottom: "1px solid hsl(var(--border-faint))",
                    }}
                >
                    <Button size="sm" onClick={handleFormat}>
                        Format
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleMinify}>
                        Minify
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleUppercase}>
                        Uppercase keywords
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Trash2 size={14} />}
                        onClick={() => { setInput(""); setOutput("") }}
                    >
                        Clear
                    </Button>
                </div>
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    language="text"
                    reportStatus
                    placeholder="SELECT * FROM users WHERE id = 1;"
                />
            </Panel>
            <Panel>
                <PanelHeader title="Output" action={<CopyAction text={output} />} />
                <CodeEditor
                    value={output}
                    language="text"
                    readOnly
                    placeholder="Formatted SQL will appear here..."
                />
            </Panel>
        </EditorSplit>
    )
}
