import { useState, useCallback, useMemo, useEffect } from "react"
import { parse, print } from "graphql"
import { Minimize2, Maximize2, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/ds/components"
import { CodeEditor } from "@/v2/CodeEditor"
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "@/v2/EditorPanels"
import { useEditorStatus } from "@/v2/workspace-store"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useWorkspace } from "@/hooks/use-workspace"

const SAMPLE_QUERY = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts(first: 10, orderBy: CREATED_AT_DESC) {
      edges {
        node {
          id
          title
          body
          createdAt
          comments {
            totalCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    followers {
      totalCount
    }
  }
}

mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
      body
      author {
        id
        name
      }
    }
    errors {
      field
      message
    }
  }
}`

export default function GraphqlFormatter() {
    const [input, setInput] = useState("")
    useUrlState(input, setInput)
    const { addEntry } = useToolHistory("graphql-formatter", "GraphQL Formatter")
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
        const workspaceState = consumeWorkspaceState("graphql-formatter")
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string }
                setInput(parsed.input || "")
            } catch {
                setInput(workspaceState)
            }
        }
    }, [input, consumeWorkspaceState])

    const result = useMemo(() => {
        if (!input.trim()) return { output: "", error: "" }
        try {
            const ast = parse(input)
            return { output: print(ast), error: "" }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Invalid GraphQL"
            return { output: "", error: msg }
        }
    }, [input])

    const valid = input.trim() ? !result.error : null

    useEffect(() => {
        setStatus({
            valid,
            validityLabel: valid === null ? "" : valid ? "Valid GraphQL" : "Invalid GraphQL",
        })
    }, [valid, setStatus])

    const minify = useCallback(() => {
        if (!input.trim()) return
        try {
            const ast = parse(input)
            const printed = print(ast)
            // Remove extra whitespace, keep single spaces
            const minified = printed
                .replace(/\s+/g, " ")
                .replace(/\s*([{}():])\s*/g, "$1")
                .replace(/,\s*/g, ",")
                .trim()
            setInput(minified)
            addEntry({ input, output: minified, metadata: { action: "minify" } })
        } catch {
            // Invalid GraphQL — the error already shows in the output panel.
        }
    }, [input, addEntry])

    const format = useCallback(() => {
        if (!input.trim()) return
        try {
            const ast = parse(input)
            const formatted = print(ast)
            setInput(formatted)
            addEntry({ input, output: formatted, metadata: { action: "format" } })
        } catch {
            // Invalid GraphQL — the error already shows in the output panel.
        }
    }, [input, addEntry])

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title="Input"
                    action={
                        <div style={{ display: "flex", gap: 6 }}>
                            <Button size="sm" iconLeft={<Maximize2 size={14} />} onClick={format}>
                                Format
                            </Button>
                            <Button variant="secondary" size="sm" iconLeft={<Minimize2 size={14} />} onClick={minify}>
                                Minify
                            </Button>
                            <Button variant="ghost" size="sm" iconLeft={<Sparkles size={14} />} onClick={() => setInput(SAMPLE_QUERY)}>
                                Load sample
                            </Button>
                            {input && (
                                <Button variant="ghost" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => setInput("")}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    }
                />
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    language="text"
                    reportStatus
                    placeholder="Paste your GraphQL query, mutation, or schema here..."
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title={result.error ? "Validation error" : "Formatted output"}
                    badge={<ValidityBadge valid={valid} validLabel="valid GraphQL" invalidLabel="parse error" />}
                    action={<CopyAction text={result.output || input} />}
                />
                {result.error ? (
                    <div
                        style={{
                            padding: "10px 12px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-sm)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: "hsl(var(--danger))",
                        }}
                    >
                        {result.error}
                    </div>
                ) : (
                    <CodeEditor
                        value={result.output}
                        language="text"
                        readOnly
                        placeholder="Formatted output will appear here..."
                    />
                )}
            </Panel>
        </EditorSplit>
    )
}
