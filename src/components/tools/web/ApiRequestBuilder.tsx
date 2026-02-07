import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Globe, Plus, Send, Trash2, Save, FolderOpen } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface Header {
    key: string
    value: string
    enabled: boolean
}

interface SavedRequest {
    name: string
    method: HttpMethod
    url: string
    headers: Header[]
    body: string
    bodyType: string
}

const METHOD_COLORS: Record<HttpMethod, string> = {
    GET: "bg-green-500",
    POST: "bg-blue-500",
    PUT: "bg-orange-500",
    PATCH: "bg-yellow-500",
    DELETE: "bg-red-500",
}

const STORAGE_KEY = "toolbit-api-requests"

function loadSavedRequests(): SavedRequest[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

function saveRequests(requests: SavedRequest[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export default function ApiRequestBuilder() {
    const [method, setMethod] = useState<HttpMethod>("GET")
    const [url, setUrl] = useState("")
    const [headers, setHeaders] = useState<Header[]>([
        { key: "Content-Type", value: "application/json", enabled: true },
    ])
    const [body, setBody] = useState("")
    const [bodyType, setBodyType] = useState<"json" | "text" | "form">("json")
    const [response, setResponse] = useState("")
    const [responseStatus, setResponseStatus] = useState<number | null>(null)
    const [responseTime, setResponseTime] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"headers" | "body" | "saved">("headers")
    const [savedRequests, setSavedRequests] = useState<SavedRequest[]>(loadSavedRequests)
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({
            method,
            url,
            headers,
            body,
            bodyType,
            activeTab,
        }),
        [method, url, headers, body, bodyType, activeTab],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setMethod(state.method === "POST" || state.method === "PUT" || state.method === "PATCH" || state.method === "DELETE" ? state.method : "GET")
        setUrl(typeof state.url === "string" ? state.url : "")
        setHeaders(Array.isArray(state.headers) ? (state.headers as Header[]) : [{ key: "Content-Type", value: "application/json", enabled: true }])
        setBody(typeof state.body === "string" ? state.body : "")
        setBodyType(state.bodyType === "text" || state.bodyType === "form" ? state.bodyType : "json")
        setActiveTab(state.activeTab === "body" || state.activeTab === "saved" ? state.activeTab : "headers")
    })
    const { addEntry } = useToolHistory("api-request-builder", "API Request Builder")

    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "", enabled: true }])
    }

    const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
        const updated = [...headers]
        updated[index] = { ...updated[index], [field]: value }
        setHeaders(updated)
    }

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index))
    }

    const sendRequest = useCallback(async () => {
        if (!url.trim()) {
            toast({ description: "Enter a URL", variant: "destructive" })
            return
        }

        setLoading(true)
        setResponse("")
        setResponseStatus(null)
        setResponseTime(null)

        const startTime = performance.now()

        try {
            const requestHeaders: Record<string, string> = {}
            headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
                requestHeaders[h.key] = h.value
            })

            const options: RequestInit = {
                method,
                headers: requestHeaders,
            }

            if (method !== "GET" && body.trim()) {
                options.body = body
            }

            const res = await fetch(url, options)
            const elapsed = Math.round(performance.now() - startTime)
            setResponseTime(elapsed)
            setResponseStatus(res.status)

            const contentType = res.headers.get("content-type") || ""
            const text = await res.text()

            // Try to pretty-print JSON
            if (contentType.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
                try {
                    const parsed = JSON.parse(text)
                    const pretty = JSON.stringify(parsed, null, 2)
                    setResponse(pretty)
                    addEntry({
                        input: JSON.stringify({ method, url, headers, body, bodyType }),
                        output: pretty,
                        metadata: { action: "send", status: res.status, durationMs: elapsed },
                    })
                } catch {
                    setResponse(text)
                    addEntry({
                        input: JSON.stringify({ method, url, headers, body, bodyType }),
                        output: text,
                        metadata: { action: "send", status: res.status, durationMs: elapsed },
                    })
                }
            } else {
                setResponse(text)
                addEntry({
                    input: JSON.stringify({ method, url, headers, body, bodyType }),
                    output: text,
                    metadata: { action: "send", status: res.status, durationMs: elapsed },
                })
            }
        } catch (err) {
            const elapsed = Math.round(performance.now() - startTime)
            setResponseTime(elapsed)
            setResponse(`Error: ${(err as Error).message}`)
            setResponseStatus(0)
            addEntry({
                input: JSON.stringify({ method, url, headers, body, bodyType }),
                output: `Error: ${(err as Error).message}`,
                metadata: { action: "send", status: 0, durationMs: elapsed },
            })
        } finally {
            setLoading(false)
        }
    }, [url, method, headers, body, bodyType, toast, addEntry])

    const saveCurrentRequest = () => {
        const name = prompt("Save request as:")
        if (!name) return
        const req: SavedRequest = { name, method, url, headers, body, bodyType }
        const updated = [...savedRequests, req]
        setSavedRequests(updated)
        saveRequests(updated)
        toast({ description: `Saved "${name}"` })
    }

    const loadRequest = (req: SavedRequest) => {
        setMethod(req.method)
        setUrl(req.url)
        setHeaders(req.headers)
        setBody(req.body)
        setBodyType(req.bodyType as "json" | "text" | "form")
        setActiveTab("headers")
        toast({ description: `Loaded "${req.name}"` })
    }

    const deleteRequest = (index: number) => {
        const updated = savedRequests.filter((_, i) => i !== index)
        setSavedRequests(updated)
        saveRequests(updated)
    }

    const loadSample = () => {
        setMethod("GET")
        setUrl("https://httpbin.org/json")
        setHeaders([{ key: "Accept", value: "application/json", enabled: true }])
        setBody("")
        setActiveTab("headers")
    }

    const copyResponse = () => {
        navigator.clipboard.writeText(response)
        toast({ description: "Response copied!" })
    }

    const statusColor = responseStatus
        ? responseStatus < 300 ? "text-green-500"
        : responseStatus < 400 ? "text-yellow-500"
        : "text-red-500"
        : ""

    return (
        <ToolCard
            title="API Request Builder"
            description="Send HTTP requests and inspect responses"
            icon={<Globe className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "api-request-builder",
                toolName: "API Request Builder",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as SavedRequest
                        setMethod(parsed.method || "GET")
                        setUrl(parsed.url || "")
                        setHeaders(parsed.headers || [{ key: "Content-Type", value: "application/json", enabled: true }])
                        setBody(parsed.body || "")
                        setBodyType(parsed.bodyType as "json" | "text" | "form")
                    } catch {
                        // ignore
                    }
                },
            }}
        >
            {/* URL Bar */}
            <div className="flex gap-2">
                <div className="relative">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono font-bold appearance-none pr-6 cursor-pointer"
                    >
                        {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${METHOD_COLORS[method]}`} />
                </div>
                <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/users"
                    className="flex-1 font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && sendRequest()}
                />
                <Button onClick={sendRequest} disabled={loading}>
                    <Send className="h-4 w-4 mr-1" />
                    {loading ? "Sending..." : "Send"}
                </Button>
                <Button variant="outline" onClick={loadSample}>
                    Sample
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {(["headers", "body", "saved"] as const).map(tab => (
                    <button
                        key={tab}
                        className={`px-3 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                            activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "saved" ? (
                            <span className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                Saved ({savedRequests.length})
                            </span>
                        ) : tab}
                    </button>
                ))}
                <button
                    className="ml-auto px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={saveCurrentRequest}
                >
                    <Save className="h-3 w-3 inline mr-1" />
                    Save
                </button>
            </div>

            {/* Headers Tab */}
            {activeTab === "headers" && (
                <div className="space-y-2">
                    {headers.map((h, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input
                                type="checkbox"
                                checked={h.enabled}
                                onChange={(e) => updateHeader(i, "enabled", e.target.checked)}
                                className="rounded"
                            />
                            <Input
                                value={h.key}
                                onChange={(e) => updateHeader(i, "key", e.target.value)}
                                placeholder="Header name"
                                className="flex-1 font-mono text-sm"
                            />
                            <Input
                                value={h.value}
                                onChange={(e) => updateHeader(i, "value", e.target.value)}
                                placeholder="Value"
                                className="flex-1 font-mono text-sm"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeHeader(i)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addHeader}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Header
                    </Button>
                </div>
            )}

            {/* Body Tab */}
            {activeTab === "body" && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        {(["json", "text", "form"] as const).map(t => (
                            <Button
                                key={t}
                                variant={bodyType === t ? "default" : "outline"}
                                size="sm"
                                onClick={() => setBodyType(t)}
                                className="uppercase text-xs"
                            >
                                {t}
                            </Button>
                        ))}
                    </div>
                    <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={bodyType === "json" ? '{"key": "value"}' : "Request body..."}
                        className="min-h-[150px] font-mono text-sm"
                    />
                </div>
            )}

            {/* Saved Tab */}
            {activeTab === "saved" && (
                <div className="space-y-2">
                    {savedRequests.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            No saved requests yet. Click "Save" to save the current request.
                        </div>
                    ) : (
                        savedRequests.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50">
                                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded text-white ${METHOD_COLORS[req.method]}`}>
                                    {req.method}
                                </span>
                                <span className="flex-1 text-sm font-mono truncate">{req.url}</span>
                                <span className="text-sm text-muted-foreground">{req.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => loadRequest(req)}>Load</Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteRequest(i)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Response */}
            {(response || responseStatus !== null) && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium">Response</label>
                            {responseStatus !== null && (
                                <span className={`text-sm font-mono font-bold ${statusColor}`}>
                                    {responseStatus === 0 ? "Error" : responseStatus}
                                </span>
                            )}
                            {responseTime !== null && (
                                <span className="text-sm text-muted-foreground">
                                    {responseTime}ms
                                </span>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={copyResponse}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                        </Button>
                    </div>
                    <Textarea
                        value={response}
                        readOnly
                        className="min-h-[250px] font-mono text-sm"
                    />
                </div>
            )}
        </ToolCard>
    )
}
