import { useSessionDocumentState } from "@/v2/document-state";
import { copyText } from "@/lib/clipboard";
import { useDocumentField } from "@/v2/document-state";
import { useState, useMemo, useCallback } from "react"
import type { CSSProperties } from "react"
import { parsePatch, type StructuredPatch, type StructuredPatchHunk } from "diff"
import { Button, Textarea } from "@/ds/components"
import { FileDropZone } from "@/components/FileDropZone"
import { Copy, Check, ChevronDown, ChevronRight, FileText, Sparkles } from "lucide-react"
import { ToolPage, Row } from "@/v2/restyle-kit"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

const SAMPLE_DIFF = `diff --git a/src/utils/auth.ts b/src/utils/auth.ts
index abc1234..def5678 100644
--- a/src/utils/auth.ts
+++ b/src/utils/auth.ts
@@ -1,8 +1,12 @@
-import { hash } from 'crypto';
+import { hash, compare } from 'crypto';
+import { Logger } from './logger';

 export function authenticate(username: string, password: string) {
-  const hashedPassword = hash(password);
-  return db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPassword]);
+  const logger = new Logger('auth');
+  logger.info(\`Login attempt for user: \${username}\`);
+
+  const hashedPassword = hash(password, 'sha256');
+  const user = db.query('SELECT * FROM users WHERE username = ?', [username]);
+
+  if (!user || !compare(hashedPassword, user.password)) {
+    logger.warn(\`Failed login for user: \${username}\`);
+    return null;
+  }
+
+  return user;
 }
diff --git a/src/config.ts b/src/config.ts
index 111aaaa..222bbbb 100644
--- a/src/config.ts
+++ b/src/config.ts
@@ -5,3 +5,5 @@ export const config = {
   port: 3000,
   host: 'localhost',
+  logLevel: 'info',
+  maxRetries: 3,
 };`

const ADDED_BG = "hsl(var(--success) / 0.15)"
const REMOVED_BG = "hsl(var(--danger) / 0.15)"

function lineToneStyle(isAdd: boolean, isDel: boolean): CSSProperties {
    if (isAdd) return { background: ADDED_BG }
    if (isDel) return { background: REMOVED_BG }
    return {}
}

function prefixColor(isAdd: boolean, isDel: boolean): string {
    if (isAdd) return "hsl(var(--success))"
    if (isDel) return "hsl(var(--danger))"
    return "hsl(var(--text-faint))"
}

function DiffLineRow({ line }: { line: string }) {
    const isAdd = line.startsWith("+")
    const isDel = line.startsWith("-")
    const prefix = line[0] || " "
    const content = line.substring(1)
    return (
        <div style={{ display: "flex", ...lineToneStyle(isAdd, isDel) }}>
            <span
                style={{
                    userSelect: "none",
                    padding: "0 8px",
                    fontSize: "var(--text-xs)",
                    lineHeight: "24px",
                    width: 24,
                    textAlign: "center",
                    flexShrink: 0,
                    color: prefixColor(isAdd, isDel),
                }}
            >
                {prefix}
            </span>
            <span style={{ padding: "0 8px", lineHeight: "24px", whiteSpace: "pre" }}>{content}</span>
        </div>
    )
}

export default function GitDiffViewer() {
    const [input, setInput] = useDocumentField<string>("input", "")
    const [collapsedFiles, setCollapsedFiles] = useSessionDocumentState<Set<number>>("collapsedFiles", new Set())
    const [copied, setCopied] = useState(false)
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("diff-tool", "Git Diff Viewer")

    const normalizedInput = useMemo(() => {
        const stripAnsi = (value: string) => {
            let result = ""
            let i = 0
            while (i < value.length) {
                const char = value[i]
                if (char === "" && value[i + 1] === "[") {
                    i += 2
                    while (i < value.length && value[i] !== "m") i++
                    if (i < value.length && value[i] === "m") i++
                    continue
                }
                result += char
                i++
            }
            return result
        }

        return stripAnsi(input.replace(/\r\n/g, "\n"))
    }, [input])

    const parsed = useMemo((): { files: StructuredPatch[]; stats: { files: number; additions: number; deletions: number } } => {
        if (!normalizedInput.trim()) return { files: [], stats: { files: 0, additions: 0, deletions: 0 } }
        try {
            const files = parsePatch(normalizedInput)
            let additions = 0
            let deletions = 0
            for (const file of files) {
                for (const hunk of file.hunks) {
                    for (const line of hunk.lines) {
                        if (line.startsWith("+")) additions++
                        else if (line.startsWith("-")) deletions++
                    }
                }
            }
            return { files, stats: { files: files.length, additions, deletions } }
        } catch {
            return { files: [], stats: { files: 0, additions: 0, deletions: 0 } }
        }
    }, [normalizedInput])

    const toggleFile = useCallback((index: number) => {
        setCollapsedFiles(prev => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }, [setCollapsedFiles])

    const handleFileDrop = useCallback((content: string) => {
        setInput(content)
    }, [setInput])

    const loadSample = useCallback(() => {
        setInput(SAMPLE_DIFF)
    }, [setInput])

    const copyDiff = useCallback(async () => {
        if (!(await copyText(normalizedInput))) return;
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
        addEntry({ input: normalizedInput, output: normalizedInput, metadata: { action: "copy" } })
    }, [normalizedInput, addEntry])

    const getFileName = (file: StructuredPatch): string => {
        return file.newFileName?.replace(/^[ab]\//, "") || file.oldFileName?.replace(/^[ab]\//, "") || "unknown"
    }

    const fileStats = (file: StructuredPatch) => {
        let add = 0, del = 0
        for (const hunk of file.hunks) {
            for (const line of hunk.lines) {
                if (line.startsWith("+")) add++
                else if (line.startsWith("-")) del++
            }
        }
        return { add, del }
    }

    return (
        <ToolPage maxWidth={1000}>
            {/* Input */}
            <FileDropZone
                onFileContent={handleFileDrop}
                accept={[".diff", ".patch"]}
            >
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste git diff output here..."
                    style={{ minHeight: 150, width: "100%", resize: "vertical" }}
                />
            </FileDropZone>

            <Row>
                <Button variant="outline" size="sm" iconLeft={<Sparkles size={13} />} onClick={loadSample}>
                    Load sample
                </Button>
                {input && (
                    <Button
                        variant="outline"
                        size="sm"
                        iconLeft={copied ? <Check size={13} /> : <Copy size={13} />}
                        onClick={copyDiff}
                    >
                        {copied ? "Copied" : "Copy"}
                    </Button>
                )}
                {input && (
                    <Button variant="ghost" size="sm" onClick={() => setInput("")}>
                        Clear
                    </Button>
                )}
            </Row>

            {/* Stats */}
            {parsed.files.length > 0 && (
                <div style={{ display: "flex", gap: 16, fontSize: "var(--text-sm)" }}>
                    <span style={{ fontWeight: 500, color: "hsl(var(--text-strong))" }}>
                        {parsed.stats.files} file{parsed.stats.files !== 1 ? "s" : ""} changed
                    </span>
                    <span style={{ color: "hsl(var(--success))" }}>+{parsed.stats.additions} additions</span>
                    <span style={{ color: "hsl(var(--danger))" }}>-{parsed.stats.deletions} deletions</span>
                </div>
            )}

            {/* File List */}
            {parsed.files.map((file, fileIdx) => {
                const name = getFileName(file)
                const stats = fileStats(file)
                const isCollapsed = collapsedFiles.has(fileIdx)

                return (
                    <div
                        key={fileIdx}
                        style={{
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius-md)",
                            background: "hsl(var(--surface-0))",
                            overflow: "hidden",
                        }}
                    >
                        {/* File Header */}
                        <button
                            onClick={() => toggleFile(fileIdx)}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "hsl(var(--surface-1))",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "var(--text-sm)",
                                textAlign: "left",
                                color: "hsl(var(--text-body))",
                            }}
                        >
                            {isCollapsed ? <ChevronRight size={16} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} style={{ flexShrink: 0 }} />}
                            <FileText size={16} style={{ flexShrink: 0, color: "hsl(var(--text-muted))" }} />
                            <span
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 500,
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    color: "hsl(var(--text-strong))",
                                }}
                            >
                                {name}
                            </span>
                            <span style={{ color: "hsl(var(--success))", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>+{stats.add}</span>
                            <span style={{ color: "hsl(var(--danger))", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>-{stats.del}</span>
                        </button>

                        {/* Hunks */}
                        {!isCollapsed && (
                            <div style={{ overflowX: "auto" }}>
                                {file.hunks.map((hunk: StructuredPatchHunk, hunkIdx: number) => (
                                    <div key={hunkIdx}>
                                        <div
                                            style={{
                                                background: "hsl(var(--primary) / 0.1)",
                                                color: "hsl(var(--primary))",
                                                padding: "2px 12px",
                                                fontSize: "var(--text-xs)",
                                                fontFamily: "var(--font-mono)",
                                                borderTop: "1px solid hsl(var(--border-faint))",
                                                borderBottom: "1px solid hsl(var(--border-faint))",
                                            }}
                                        >
                                            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                                        </div>
                                        <div style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)" }}>
                                            {hunk.lines.map((line: string, lineIdx: number) => (
                                                <DiffLineRow key={lineIdx} line={line} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
            {normalizedInput.trim() && parsed.files.length === 0 && (
                <div
                    style={{
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius-md)",
                        padding: 12,
                        fontSize: "var(--text-sm)",
                        display: "grid",
                        gap: 8,
                    }}
                >
                    <div style={{ fontWeight: 500, color: "hsl(var(--text-strong))" }}>Could not parse diff.</div>
                    <div style={{ color: "hsl(var(--text-muted))" }}>
                        If you copied from a terminal, try `git diff --no-color`.
                    </div>
                    <div
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-xs)",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius-md)",
                            overflow: "hidden",
                        }}
                    >
                        {normalizedInput.split("\n").map((line, idx) => (
                            <DiffLineRow key={idx} line={line} />
                        ))}
                    </div>
                </div>
            )}
        </ToolPage>
    )
}
