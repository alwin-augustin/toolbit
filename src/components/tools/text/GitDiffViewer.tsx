import { useState, useMemo, useCallback } from "react"
import { parsePatch, type StructuredPatch, type StructuredPatchHunk } from "diff"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { FileDropZone } from "@/components/FileDropZone"
import { Copy, GitBranch, ChevronDown, ChevronRight, FileText } from "lucide-react"
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

export default function GitDiffViewer() {
    const [input, setInput] = useState("")
    const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set())
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("diff-tool", "Git Diff Viewer")

    const normalizedInput = useMemo(() => {
        const stripAnsi = (value: string) => {
            let result = ""
            let i = 0
            while (i < value.length) {
                const char = value[i]
                if (char === "\u001b" && value[i + 1] === "[") {
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
    }, [])

    const handleFileDrop = useCallback((content: string) => {
        setInput(content)
    }, [])

    const loadSample = useCallback(() => {
        setInput(SAMPLE_DIFF)
    }, [])

    const copyDiff = useCallback(() => {
        navigator.clipboard.writeText(normalizedInput)
        toast({ title: "Copied to clipboard" })
        addEntry({ input: normalizedInput, output: normalizedInput, metadata: { action: "copy" } })
    }, [normalizedInput, toast, addEntry])

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
        <ToolCard
            title="Git Diff Viewer"
            description="Paste git diff output to view syntax-highlighted changes"
            icon={<GitBranch className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "diff-tool",
                toolName: "Git Diff Viewer",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                },
            }}
        >
            <div className="space-y-4">
                {/* Input */}
                <FileDropZone
                    onFileContent={handleFileDrop}
                    accept={[".diff", ".patch"]}
                >
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste git diff output here..."
                        className="font-mono text-sm min-h-[150px]"
                    />
                </FileDropZone>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadSample}>
                        Load Sample
                    </Button>
                    {input && (
                        <Button variant="outline" size="sm" onClick={copyDiff}>
                            <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                    )}
                    {input && (
                        <Button variant="outline" size="sm" onClick={() => setInput("")}>
                            Clear
                        </Button>
                    )}
                </div>

                {/* Stats */}
                {parsed.files.length > 0 && (
                    <div className="flex gap-4 text-sm">
                        <span className="font-medium">{parsed.stats.files} file{parsed.stats.files !== 1 ? "s" : ""} changed</span>
                        <span className="text-green-600 dark:text-green-400">+{parsed.stats.additions} additions</span>
                        <span className="text-red-600 dark:text-red-400">-{parsed.stats.deletions} deletions</span>
                    </div>
                )}

                {/* File List */}
                {parsed.files.map((file, fileIdx) => {
                    const name = getFileName(file)
                    const stats = fileStats(file)
                    const isCollapsed = collapsedFiles.has(fileIdx)

                    return (
                        <div key={fileIdx} className="border rounded-md overflow-hidden">
                            {/* File Header */}
                            <button
                                onClick={() => toggleFile(fileIdx)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-sm text-left"
                            >
                                {isCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="font-mono font-medium flex-1 truncate">{name}</span>
                                <span className="text-green-600 dark:text-green-400 text-xs font-mono">+{stats.add}</span>
                                <span className="text-red-600 dark:text-red-400 text-xs font-mono">-{stats.del}</span>
                            </button>

                            {/* Hunks */}
                            {!isCollapsed && (
                                <div className="overflow-x-auto">
                                    {file.hunks.map((hunk: StructuredPatchHunk, hunkIdx: number) => (
                                        <div key={hunkIdx}>
                                            <div className="bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3 py-0.5 text-xs font-mono border-y border-border/50">
                                                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                                            </div>
                                            <div className="text-sm font-mono">
                                                {hunk.lines.map((line: string, lineIdx: number) => {
                                                    const isAdd = line.startsWith("+")
                                                    const isDel = line.startsWith("-")
                                                    const bgClass = isAdd
                                                        ? "bg-green-500/10 text-green-800 dark:text-green-200"
                                                        : isDel
                                                        ? "bg-red-500/10 text-red-800 dark:text-red-200"
                                                        : ""
                                                    const prefix = line[0] || " "
                                                    const content = line.substring(1)

                                                    return (
                                                        <div key={lineIdx} className={`flex ${bgClass}`}>
                                                            <span className={`select-none px-2 text-xs leading-6 w-6 text-center shrink-0 ${
                                                                isAdd ? "text-green-600" : isDel ? "text-red-600" : "text-muted-foreground"
                                                            }`}>
                                                                {prefix}
                                                            </span>
                                                            <span className="px-2 leading-6 whitespace-pre">{content}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
                {normalizedInput.trim() && parsed.files.length === 0 && (
                    <div className="border rounded-md p-3 text-sm">
                        <div className="font-medium mb-2">Could not parse diff.</div>
                        <div className="text-muted-foreground mb-3">
                            If you copied from a terminal, try `git diff --no-color`.
                        </div>
                        <div className="font-mono text-xs border rounded-md overflow-hidden">
                            {normalizedInput.split("\n").map((line, idx) => {
                                const isAdd = line.startsWith("+")
                                const isDel = line.startsWith("-")
                                const bgClass = isAdd
                                    ? "bg-green-500/10 text-green-800 dark:text-green-200"
                                    : isDel
                                    ? "bg-red-500/10 text-red-800 dark:text-red-200"
                                    : ""
                                return (
                                    <div key={idx} className={`flex ${bgClass}`}>
                                        <span className={`select-none px-2 text-xs leading-6 w-6 text-center shrink-0 ${
                                            isAdd ? "text-green-600" : isDel ? "text-red-600" : "text-muted-foreground"
                                        }`}>
                                            {line[0] || " "}
                                        </span>
                                        <span className="px-2 leading-6 whitespace-pre">{line.substring(1)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </ToolCard>
    )
}
