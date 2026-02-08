import { useState, useCallback, useRef } from "react"
import { ChevronRight, ChevronDown, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const MAX_VISIBLE_NODES = 500
const BATCH_SIZE = 500

interface JsonTreeViewProps {
    data: unknown
}

function getType(value: unknown): string {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
}

function getPreview(value: unknown): string {
    const type = getType(value)
    if (type === "array") return `Array(${(value as unknown[]).length})`
    if (type === "object") return `Object{${Object.keys(value as object).length}}`
    if (type === "string") return `"${(value as string).length > 50 ? (value as string).slice(0, 50) + "..." : value}"`
    return String(value)
}

function getValueClass(value: unknown): string {
    const type = getType(value)
    switch (type) {
        case "string": return "text-green-600 dark:text-green-400"
        case "number": return "text-blue-600 dark:text-blue-400"
        case "boolean": return "text-purple-600 dark:text-purple-400"
        case "null": return "text-muted-foreground italic"
        default: return "text-foreground"
    }
}

interface TreeNodeProps {
    keyName: string | number
    value: unknown
    path: string
    depth: number
    nodeCounter: React.MutableRefObject<number>
    nodeLimit: number
}

function TreeNode({ keyName, value, path, depth, nodeCounter, nodeLimit }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(depth < 2)
    const { toast } = useToast()
    const type = getType(value)
    const isExpandable = type === "object" || type === "array"

    // Count this node against the limit
    nodeCounter.current++
    if (nodeCounter.current > nodeLimit) return null

    const copyPath = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(path)
        toast({ description: `Copied: ${path}` })
    }, [path, toast])

    const entries = isExpandable
        ? type === "array"
            ? (value as unknown[]).map((v, i) => [i, v] as const)
            : Object.entries(value as object)
        : []

    return (
        <div className="font-mono text-sm">
            <div
                className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-muted/50 cursor-pointer group"
                onClick={() => isExpandable && setIsOpen(!isOpen)}
                style={{ paddingLeft: `${depth * 16}px` }}
            >
                {isExpandable ? (
                    isOpen ? (
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )
                ) : (
                    <span className="w-3 shrink-0" />
                )}

                <span className="text-foreground/80">{keyName}</span>
                <span className="text-muted-foreground mx-0.5">:</span>

                {isExpandable && !isOpen ? (
                    <span className="text-muted-foreground">{getPreview(value)}</span>
                ) : !isExpandable ? (
                    <span className={getValueClass(value)}>{getPreview(value)}</span>
                ) : null}

                <button
                    onClick={copyPath}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted"
                    title={`Copy path: ${path}`}
                >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
            </div>

            {isExpandable && isOpen && (
                <div>
                    {entries.map(([key, val]) => (
                        <TreeNode
                            key={String(key)}
                            keyName={key}
                            value={val}
                            path={type === "array" ? `${path}[${key}]` : `${path}.${key}`}
                            depth={depth + 1}
                            nodeCounter={nodeCounter}
                            nodeLimit={nodeLimit}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
    const [nodeLimit, setNodeLimit] = useState(MAX_VISIBLE_NODES)
    const nodeCounter = useRef(0)
    const type = getType(data)

    if (type !== "object" && type !== "array") {
        return (
            <div className="p-3 font-mono text-sm">
                <span className={getValueClass(data)}>{getPreview(data)}</span>
            </div>
        )
    }

    const entries = type === "array"
        ? (data as unknown[]).map((v, i) => [i, v] as const)
        : Object.entries(data as object)

    // Reset counter before each render
    nodeCounter.current = 0

    return (
        <div className="max-h-[400px] overflow-y-auto rounded-md border bg-background p-2">
            {entries.map(([key, val]) => (
                <TreeNode
                    key={String(key)}
                    keyName={key}
                    value={val}
                    path={type === "array" ? `$[${key}]` : `$.${key}`}
                    depth={0}
                    nodeCounter={nodeCounter}
                    nodeLimit={nodeLimit}
                />
            ))}
            {nodeCounter.current > nodeLimit && (
                <button
                    onClick={() => setNodeLimit(prev => prev + BATCH_SIZE)}
                    className="mt-2 w-full py-1.5 text-sm text-primary hover:underline"
                >
                    Showing {nodeLimit} nodes — click to show more
                </button>
            )}
        </div>
    )
}
