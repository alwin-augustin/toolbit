import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Plug, Unplug, Send, Trash2, ArrowDown, ArrowUp } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

interface Message {
    id: number
    direction: "sent" | "received" | "system" | "error"
    content: string
    timestamp: Date
}

const STATUS_COLORS: Record<string, string> = {
    disconnected: "bg-gray-400",
    connecting: "bg-yellow-500 animate-pulse",
    connected: "bg-green-500",
    error: "bg-red-500",
}

const STATUS_LABELS: Record<string, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
    error: "Error",
}

export default function WebSocketTester() {
    const [url, setUrl] = useState("wss://echo.websocket.events")
    const [status, setStatus] = useState("disconnected")
    const [messageInput, setMessageInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [autoReconnect, setAutoReconnect] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const msgIdRef = useRef(0)
    const logRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()
    const shareState = useMemo(() => ({ url, autoReconnect }), [url, autoReconnect])
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setUrl(typeof state.url === "string" ? state.url : "wss://echo.websocket.events")
        setAutoReconnect(state.autoReconnect === true)
    })
    const { addEntry } = useToolHistory("websocket-tester", "WebSocket Tester")

    const addMessage = useCallback((direction: Message["direction"], content: string) => {
        const msg: Message = { id: msgIdRef.current++, direction, content, timestamp: new Date() }
        setMessages(prev => [...prev, msg])
    }, [])

    const connect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close()
        }
        try {
            setStatus("connecting")
            const ws = new WebSocket(url)

            ws.onopen = () => {
                setStatus("connected")
                addMessage("system", `Connected to ${url}`)
            }

            ws.onmessage = (event) => {
                const data = typeof event.data === "string" ? event.data : "[Binary data]"
                addMessage("received", data)
            }

            ws.onerror = () => {
                setStatus("error")
                addMessage("error", "Connection error occurred")
            }

            ws.onclose = (event) => {
                setStatus("disconnected")
                addMessage("system", `Disconnected (code: ${event.code}, reason: ${event.reason || "none"})`)
                wsRef.current = null
                if (autoReconnect && event.code !== 1000) {
                    setTimeout(() => connect(), 3000)
                }
            }

            wsRef.current = ws
        } catch (err) {
            setStatus("error")
            addMessage("error", `Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
    }, [url, autoReconnect, addMessage])

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, "User disconnected")
        }
    }, [])

    const sendMessage = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !messageInput.trim()) return
        wsRef.current.send(messageInput)
        addMessage("sent", messageInput)
        setMessageInput("")
    }, [messageInput, addMessage])

    const formatContent = (content: string): string => {
        try {
            return JSON.stringify(JSON.parse(content), null, 2)
        } catch {
            return content
        }
    }

    const copyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content)
        toast({ title: "Copied to clipboard" })
        addEntry({ input: url, output: content, metadata: { action: "copy" } })
    }, [toast, addEntry, url])

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close()
        }
    }, [])

    const directionColors: Record<string, string> = {
        sent: "border-l-blue-500 bg-blue-500/5",
        received: "border-l-green-500 bg-green-500/5",
        system: "border-l-gray-400 bg-gray-500/5",
        error: "border-l-red-500 bg-red-500/5",
    }

    const directionIcons: Record<string, React.ReactNode> = {
        sent: <ArrowUp className="h-3 w-3 text-blue-500" />,
        received: <ArrowDown className="h-3 w-3 text-green-500" />,
    }

    return (
        <ToolCard
            title="WebSocket Tester"
            description="Connect to WebSocket servers, send and receive messages in real-time"
            icon={<Plug className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "websocket-tester",
                toolName: "WebSocket Tester",
                onRestore: (entry) => {
                    setUrl(entry.input || "wss://echo.websocket.events")
                },
            }}
        >
            <div className="space-y-4">
                {/* Connection */}
                <div className="flex gap-2 items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_COLORS[status]}`} title={STATUS_LABELS[status]} />
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="wss://echo.websocket.events"
                        className="flex-1"
                        disabled={status === "connected" || status === "connecting"}
                    />
                    {status === "connected" || status === "connecting" ? (
                        <Button variant="destructive" onClick={disconnect} size="sm">
                            <Unplug className="h-4 w-4 mr-1" /> Disconnect
                        </Button>
                    ) : (
                        <Button onClick={connect} size="sm">
                            <Plug className="h-4 w-4 mr-1" /> Connect
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={autoReconnect}
                            onChange={(e) => setAutoReconnect(e.target.checked)}
                            className="rounded"
                        />
                        Auto-reconnect
                    </label>
                    <span className="text-muted-foreground">{STATUS_LABELS[status]}</span>
                </div>

                {/* Message Log */}
                <div
                    ref={logRef}
                    className="h-80 overflow-y-auto border rounded-md p-2 space-y-1 bg-muted/30"
                >
                    {messages.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">
                            Connect to a WebSocket server to start
                        </p>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`border-l-2 pl-3 py-1.5 pr-2 rounded-r text-sm group ${directionColors[msg.direction]}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {directionIcons[msg.direction]}
                                    <span className="capitalize font-medium">{msg.direction}</span>
                                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                                </div>
                                <button
                                    onClick={() => copyMessage(msg.content)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy"
                                >
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </div>
                            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs">
                                {formatContent(msg.content)}
                            </pre>
                        </div>
                    ))}
                </div>

                {/* Send Message */}
                <div className="flex gap-2">
                    <Textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder='Type a message... (e.g., {"type": "hello"})'
                        className="flex-1 min-h-[60px]"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                            }
                        }}
                        disabled={status !== "connected"}
                    />
                    <div className="flex flex-col gap-1">
                        <Button onClick={sendMessage} disabled={status !== "connected" || !messageInput.trim()} size="sm">
                            <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setMessages([])} size="sm" title="Clear log">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Sent: {messages.filter(m => m.direction === "sent").length}</span>
                    <span>Received: {messages.filter(m => m.direction === "received").length}</span>
                    <span>Total: {messages.length}</span>
                </div>
            </div>
        </ToolCard>
    )
}
