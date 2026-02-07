import { useState, useCallback, useMemo, useEffect } from "react"
import { parse, print } from "graphql"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { FileDropZone } from "@/components/FileDropZone"
import { Copy, Code, Minimize2, Maximize2 } from "lucide-react"
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
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("graphql-formatter", "GraphQL Formatter")
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)

    useEffect(() => {
        if (input) return
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
            toast({ title: "Cannot minify: invalid GraphQL", variant: "destructive" })
        }
    }, [input, toast, addEntry])

    const format = useCallback(() => {
        if (!input.trim()) return
        try {
            const ast = parse(input)
            const formatted = print(ast)
            setInput(formatted)
            addEntry({ input, output: formatted, metadata: { action: "format" } })
        } catch {
            toast({ title: "Cannot format: invalid GraphQL", variant: "destructive" })
        }
    }, [input, toast, addEntry])

    const copyOutput = useCallback(() => {
        const text = result.output || input
        navigator.clipboard.writeText(text)
        toast({ title: "Copied to clipboard" })
        addEntry({ input, output: text, metadata: { action: "copy" } })
    }, [result.output, input, toast, addEntry])

    const handleFileDrop = useCallback((content: string) => {
        setInput(content)
    }, [])

    return (
        <ToolCard
            title="GraphQL Formatter"
            description="Format, validate, and minify GraphQL queries and schemas"
            icon={<Code className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "graphql-formatter",
                toolName: "GraphQL Formatter",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                },
            }}
            pipeSource={{
                toolId: "graphql-formatter",
                output: result.output || input || "",
            }}
        >
            <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={format}>
                        <Maximize2 className="h-4 w-4 mr-1" /> Format
                    </Button>
                    <Button variant="outline" size="sm" onClick={minify}>
                        <Minimize2 className="h-4 w-4 mr-1" /> Minify
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE_QUERY)}>
                        Load Sample
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyOutput} disabled={!input.trim()}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    {input && (
                        <Button variant="outline" size="sm" onClick={() => setInput("")}>
                            Clear
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Input</label>
                        <FileDropZone onFileContent={handleFileDrop} accept={[".graphql", ".gql"]}>
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste your GraphQL query, mutation, or schema here..."
                                className="font-mono text-sm min-h-[400px]"
                            />
                        </FileDropZone>
                    </div>

                    {/* Output */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {result.error ? (
                                <span className="text-destructive">Validation Error</span>
                            ) : (
                                "Formatted Output"
                            )}
                        </label>
                        {result.error ? (
                            <div className="p-4 rounded-md border border-destructive/50 bg-destructive/5 min-h-[400px]">
                                <pre className="text-sm text-destructive whitespace-pre-wrap font-mono">{result.error}</pre>
                            </div>
                        ) : (
                            <Textarea
                                value={result.output}
                                readOnly
                                className="font-mono text-sm min-h-[400px] bg-muted/30"
                                placeholder="Formatted output will appear here..."
                            />
                        )}
                    </div>
                </div>
            </div>
        </ToolCard>
    )
}
