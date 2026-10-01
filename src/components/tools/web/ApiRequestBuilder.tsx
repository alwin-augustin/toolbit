import { useSessionDocumentState } from "@/v2/document-state";
import { useDocumentField } from "@/v2/document-state";
import { useState, useCallback, useMemo } from "react"
import { FolderOpen, Plus, Save, Send, Trash2 } from "lucide-react"
import { Button, Badge, IconButton, Input, Select, Textarea, Checkbox, Tabs } from "@/ds/components"
import { Panel, PanelHeader, CopyAction, EditorSplit } from "@/v2/EditorPanels"
import { CodeEditor } from "@/v2/CodeEditor"
import { Row } from "@/v2/restyle-kit"
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

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger"

const METHOD_TONES: Record<HttpMethod, BadgeTone> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    PATCH: "warning",
    DELETE: "danger",
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
    void requests // session-only; requests can contain credentials
}

export default function ApiRequestBuilder() {
    const [method, setMethod] = useSessionDocumentState<HttpMethod>("method", "GET")
    const [url, setUrl] = useDocumentField<string>("url", "")
    const [headers, setHeaders] = useSessionDocumentState<Header[]>("headers", [
        { key: "Content-Type", value: "application/json", enabled: true },
    ])
    const [body, setBody] = useDocumentField<string>("body", "")
    const [bodyType, setBodyType] = useSessionDocumentState<"json" | "text" | "form">("bodyType", "json")
    const [response, setResponse] = useSessionDocumentState("response", "")
    const [responseStatus, setResponseStatus] = useState<number | null>(null)
    const [responseTime, setResponseTime] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useSessionDocumentState<"headers" | "body" | "saved">("activeTab", "headers")
    const [savedRequests, setSavedRequests] = useSessionDocumentState<SavedRequest[]>("savedRequests", [])
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
    useUrlState(shareState, (state) => {
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
    }, [url, method, headers, body, bodyType, addEntry, setResponse])

    const saveCurrentRequest = () => {
        const name = prompt("Save request as:")
        if (!name) return
        const req: SavedRequest = { name, method, url, headers, body, bodyType }
        const updated = [...savedRequests, req]
        setSavedRequests(updated)
        saveRequests(updated)
    }

    const loadRequest = (req: SavedRequest) => {
        setMethod(req.method)
        setUrl(req.url)
        setHeaders(req.headers)
        setBody(req.body)
        setBodyType(req.bodyType as "json" | "text" | "form")
        setActiveTab("headers")
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

    const statusTone: BadgeTone = responseStatus
        ? responseStatus < 300 ? "success"
        : responseStatus < 400 ? "warning"
        : "danger"
        : "danger"

    const responseLooksJson = response.trimStart().startsWith("{") || response.trimStart().startsWith("[")

    const mutedText = { fontSize: "var(--text-sm)", color: "hsl(var(--text-muted))" } as const

    return (
        <EditorSplit>
            <Panel>
                <div><p>Saved requests remain in this session only.</p><Button variant="secondary" onClick={()=>setSavedRequests(loadSavedRequests())}>Recover legacy saved requests</Button></div>
                <PanelHeader
                    title="Request"
                    badge={<Badge tone={METHOD_TONES[method]}>{method}</Badge>}
                    action={
                        <Button variant="ghost" size="sm" onClick={loadSample}>
                            Load sample
                        </Button>
                    }
                />
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12, display: "grid", gap: 12, alignContent: "start" }}>
                    <Row wrap={false}>
                        <Select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as HttpMethod)}
                            style={{ fontFamily: "var(--font-mono)" }}
                        >
                            {(["GET", "POST", "PUT", "PATCH", "DELETE"] as HttpMethod[]).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </Select>
                        <Input
                            mono
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://api.example.com/users"
                            style={{ flex: 1 }}
                            onKeyDown={(e) => e.key === "Enter" && sendRequest()}
                        />
                        <Button onClick={sendRequest} disabled={loading || !url.trim()} iconLeft={<Send size={14} />}>
                            {loading ? "Sending..." : "Send"}
                        </Button>
                    </Row>

                    <Row>
                        <Tabs
                            variant="underline"
                            value={activeTab}
                            onChange={(v) => setActiveTab(v as "headers" | "body" | "saved")}
                            items={[
                                { value: "headers", label: "Headers" },
                                { value: "body", label: "Body" },
                                { value: "saved", label: `Session (${savedRequests.length})`, icon: <FolderOpen size={13} /> },
                            ]}
                            style={{ flex: 1 }}
                        />
                        <Button variant="ghost" size="sm" iconLeft={<Save size={13} />} onClick={saveCurrentRequest}>
                            Save
                        </Button>
                    </Row>

                    {activeTab === "headers" && (
                        <div style={{ display: "grid", gap: 8 }}>
                            {headers.map((h, i) => (
                                <Row key={i} wrap={false}>
                                    <Checkbox
                                        checked={h.enabled}
                                        onChange={(v) => updateHeader(i, "enabled", v)}
                                    />
                                    <Input
                                        mono
                                        value={h.key}
                                        onChange={(e) => updateHeader(i, "key", e.target.value)}
                                        placeholder="Header name"
                                        style={{ flex: 1 }}
                                    />
                                    <Input
                                        mono
                                        value={h.value}
                                        onChange={(e) => updateHeader(i, "value", e.target.value)}
                                        placeholder="Value"
                                        style={{ flex: 1 }}
                                    />
                                    <IconButton size="sm" title="Remove header" onClick={() => removeHeader(i)}>
                                        <Trash2 size={13} />
                                    </IconButton>
                                </Row>
                            ))}
                            <div>
                                <Button variant="outline" size="sm" iconLeft={<Plus size={13} />} onClick={addHeader}>
                                    Add header
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === "body" && (
                        <div style={{ display: "grid", gap: 8 }}>
                            <Tabs
                                variant="segment"
                                value={bodyType}
                                onChange={(v) => setBodyType(v as "json" | "text" | "form")}
                                items={[
                                    { value: "json", label: "JSON" },
                                    { value: "text", label: "Text" },
                                    { value: "form", label: "Form" },
                                ]}
                            />
                            <Textarea
                                mono
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={bodyType === "json" ? '{"key": "value"}' : "Request body..."}
                                style={{ minHeight: 150 }}
                            />
                        </div>
                    )}

                    {activeTab === "saved" && (
                        <div style={{ display: "grid", gap: 8 }}>
                            {savedRequests.length === 0 ? (
                                <div style={{ ...mutedText, textAlign: "center", padding: "16px 0" }}>
                                    No saved requests yet. Click "Save" to save the current request.
                                </div>
                            ) : (
                                savedRequests.map((req, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: 8,
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "var(--radius-md)",
                                            background: "hsl(var(--surface-1))",
                                        }}
                                    >
                                        <Badge tone={METHOD_TONES[req.method]}>{req.method}</Badge>
                                        <span
                                            style={{
                                                flex: 1,
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "var(--text-sm)",
                                                color: "hsl(var(--text-body))",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {req.url}
                                        </span>
                                        <span style={mutedText}>{req.name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => loadRequest(req)}>Load</Button>
                                        <IconButton size="sm" title="Delete request" onClick={() => deleteRequest(i)}>
                                            <Trash2 size={13} />
                                        </IconButton>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Panel>
            <Panel>
                <PanelHeader
                    title="Response"
                    badge={
                        responseStatus !== null ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Badge tone={statusTone}>
                                    {responseStatus === 0 ? "Error" : responseStatus}
                                </Badge>
                                {responseTime !== null && (
                                    <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-muted))" }}>
                                        {responseTime}ms
                                    </span>
                                )}
                            </span>
                        ) : undefined
                    }
                    action={<CopyAction text={response} />}
                />
                {response || responseStatus !== null ? (
                    <CodeEditor value={response} language={responseLooksJson ? "json" : "text"} readOnly />
                ) : (
                    <div style={{ padding: "16px 12px", fontSize: "var(--text-sm)", color: "hsl(var(--text-faint))" }}>
                        Send a request to see the response here.
                    </div>
                )}
            </Panel>
        </EditorSplit>
    )
}
