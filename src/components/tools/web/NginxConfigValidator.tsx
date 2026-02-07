import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { FileDropZone } from "@/components/FileDropZone"
import { Copy, Server, CheckCircle, AlertCircle, Maximize2 } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

interface ValidationIssue {
    line: number
    message: string
    severity: "error" | "warning"
}

interface ServerBlock {
    listen: string[]
    serverName: string[]
    locations: string[]
}

const VALID_DIRECTIVES = new Set([
    "server", "location", "upstream", "events", "http", "stream", "mail",
    "listen", "server_name", "root", "index", "try_files", "return",
    "proxy_pass", "proxy_set_header", "proxy_redirect", "proxy_buffering",
    "proxy_cache", "proxy_cache_valid", "proxy_connect_timeout",
    "fastcgi_pass", "fastcgi_param", "fastcgi_index",
    "access_log", "error_log", "log_format",
    "ssl_certificate", "ssl_certificate_key", "ssl_protocols", "ssl_ciphers",
    "ssl_prefer_server_ciphers", "ssl_session_cache", "ssl_session_timeout",
    "worker_processes", "worker_connections", "use",
    "include", "error_page", "client_max_body_size", "sendfile",
    "keepalive_timeout", "gzip", "gzip_types", "gzip_min_length",
    "add_header", "expires", "charset", "types", "default_type",
    "resolver", "set", "if", "rewrite", "map", "geo",
    "limit_req_zone", "limit_req", "limit_conn_zone", "limit_conn",
    "deny", "allow", "auth_basic", "auth_basic_user_file",
    "autoindex", "stub_status", "tcp_nopush", "tcp_nodelay",
    "multi_accept", "accept_mutex", "daemon", "pid", "user",
])

function validateNginxConfig(input: string): { issues: ValidationIssue[]; servers: ServerBlock[] } {
    const lines = input.split("\n")
    const issues: ValidationIssue[] = []
    const servers: ServerBlock[] = []
    let braceDepth = 0
    let inServer = false
    let currentServer: ServerBlock = { listen: [], serverName: [], locations: [] }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const lineNum = i + 1

        // Skip empty lines and comments
        if (!line || line.startsWith("#")) continue

        // Count braces
        const openBraces = (line.match(/{/g) || []).length
        const closeBraces = (line.match(/}/g) || []).length

        if (line.includes("server") && line.includes("{") && !line.includes("server_name")) {
            inServer = true
            currentServer = { listen: [], serverName: [], locations: [] }
        }

        if (inServer) {
            if (line.startsWith("listen")) {
                const val = line.replace(/^listen\s+/, "").replace(/;$/, "").trim()
                currentServer.listen.push(val)
            }
            if (line.startsWith("server_name")) {
                const val = line.replace(/^server_name\s+/, "").replace(/;$/, "").trim()
                currentServer.serverName.push(val)
            }
            if (line.startsWith("location")) {
                const val = line.replace(/^location\s+/, "").replace(/\s*{.*$/, "").trim()
                currentServer.locations.push(val)
            }
        }

        braceDepth += openBraces - closeBraces

        if (inServer && braceDepth === 0) {
            inServer = false
            servers.push(currentServer)
        }

        // Check for missing semicolons (lines that aren't block openers/closers/comments)
        if (!line.endsWith(";") && !line.endsWith("{") && !line.endsWith("}") && !line.startsWith("#") && !line.startsWith("if") && !line.startsWith("location") && !line.startsWith("server") && !line.startsWith("upstream") && !line.startsWith("events") && !line.startsWith("http") && !line.startsWith("stream") && !line.startsWith("map") && line !== "}") {
            // Check if next non-empty line starts with { (multi-line block)
            let isBlockStart = false
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim()
                if (!nextLine) continue
                if (nextLine.startsWith("{")) isBlockStart = true
                break
            }
            if (!isBlockStart) {
                issues.push({ line: lineNum, message: "Missing semicolon at end of directive", severity: "error" })
            }
        }

        // Check for unknown directives
        if (line && !line.startsWith("#") && line !== "}" && !line.startsWith("{")) {
            const directive = line.split(/[\s{;]/)[0]
            if (directive && !VALID_DIRECTIVES.has(directive) && !directive.startsWith("#")) {
                issues.push({ line: lineNum, message: `Unknown directive: "${directive}"`, severity: "warning" })
            }
        }
    }

    // Check unmatched braces
    if (braceDepth > 0) {
        issues.push({ line: lines.length, message: `${braceDepth} unclosed brace(s)`, severity: "error" })
    } else if (braceDepth < 0) {
        issues.push({ line: lines.length, message: `${Math.abs(braceDepth)} extra closing brace(s)`, severity: "error" })
    }

    return { issues, servers }
}

function formatNginxConfig(input: string): string {
    const lines = input.split("\n")
    const result: string[] = []
    let indent = 0

    for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) {
            result.push("")
            continue
        }

        if (line === "}" || line.startsWith("}")) {
            indent = Math.max(0, indent - 1)
        }

        result.push("    ".repeat(indent) + line)

        if (line.endsWith("{")) {
            indent++
        }
    }

    return result.join("\n")
}

const SAMPLE_CONFIG = `server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    access_log /var/log/nginx/example.com.access.log;
    error_log /var/log/nginx/example.com.error.log;
}`

export default function NginxConfigValidator() {
    const [input, setInput] = useState("")
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("nginx-config-validator", "Nginx Config Validator")

    const { issues, servers } = useMemo(() => {
        if (!input.trim()) return { issues: [], servers: [] }
        return validateNginxConfig(input)
    }, [input])

    const formatConfig = useCallback(() => {
        if (!input.trim()) return
        const formatted = formatNginxConfig(input)
        setInput(formatted)
        toast({ title: "Config formatted" })
        addEntry({ input, output: formatted, metadata: { action: "format" } })
    }, [input, toast, addEntry])

    const copyConfig = useCallback(() => {
        navigator.clipboard.writeText(input)
        toast({ title: "Copied to clipboard" })
        addEntry({ input, output: input, metadata: { action: "copy" } })
    }, [input, toast, addEntry])

    const handleFileDrop = useCallback((content: string) => {
        setInput(content)
    }, [])

    const errors = issues.filter(i => i.severity === "error")
    const warnings = issues.filter(i => i.severity === "warning")

    return (
        <ToolCard
            title="Nginx Config Validator"
            description="Validate, format, and analyze Nginx configuration files"
            icon={<Server className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "nginx-config-validator",
                toolName: "Nginx Config Validator",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                },
            }}
        >
            <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={formatConfig} disabled={!input.trim()}>
                        <Maximize2 className="h-4 w-4 mr-1" /> Format
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE_CONFIG)}>
                        Load Sample
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyConfig} disabled={!input.trim()}>
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
                        <label className="text-sm font-medium">Nginx Config</label>
                        <FileDropZone onFileContent={handleFileDrop} accept={[".conf", ".nginx"]}>
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste your nginx configuration here..."
                                className="font-mono text-sm min-h-[400px]"
                            />
                        </FileDropZone>
                    </div>

                    {/* Results */}
                    <div className="space-y-3">
                        {/* Status */}
                        {input.trim() && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                                errors.length > 0
                                    ? "border-destructive/50 bg-destructive/5"
                                    : warnings.length > 0
                                    ? "border-yellow-500/50 bg-yellow-500/5"
                                    : "border-green-500/50 bg-green-500/5"
                            }`}>
                                {errors.length > 0 ? (
                                    <>
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        <span className="text-sm font-medium">{errors.length} error{errors.length !== 1 ? "s" : ""}, {warnings.length} warning{warnings.length !== 1 ? "s" : ""}</span>
                                    </>
                                ) : warnings.length > 0 ? (
                                    <>
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                        <span className="text-sm font-medium">{warnings.length} warning{warnings.length !== 1 ? "s" : ""}</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-sm font-medium">Config looks valid</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Issues List */}
                        {issues.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Issues</label>
                                {issues.map((issue, i) => (
                                    <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${
                                        issue.severity === "error"
                                            ? "bg-destructive/5 text-destructive"
                                            : "bg-yellow-500/5 text-yellow-700 dark:text-yellow-300"
                                    }`}>
                                        <span className="font-mono text-xs shrink-0 mt-0.5">L{issue.line}</span>
                                        <span>{issue.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Server Blocks Summary */}
                        {servers.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Server Blocks ({servers.length})</label>
                                {servers.map((srv, i) => (
                                    <div key={i} className="p-3 rounded-lg border bg-muted/20 space-y-1 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-muted-foreground text-xs w-20 shrink-0">Listen:</span>
                                            <span className="font-mono">{srv.listen.join(", ") || "—"}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-muted-foreground text-xs w-20 shrink-0">Server Name:</span>
                                            <span className="font-mono">{srv.serverName.join(", ") || "—"}</span>
                                        </div>
                                        {srv.locations.length > 0 && (
                                            <div className="flex gap-2">
                                                <span className="text-muted-foreground text-xs w-20 shrink-0">Locations:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {srv.locations.map((loc, j) => (
                                                        <span key={j} className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{loc}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolCard>
    )
}
