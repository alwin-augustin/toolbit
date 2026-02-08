import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";
import { getRecentHistory, type ToolHistoryEntry } from "@/lib/history-db";
import {
    Sparkles,
    Clock,
    Star,
    ArrowRight,
    Clipboard,
    FileJson,
    Code,
    Shield,
    Type,
    Hash,
    Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmartSuggestion {
    toolId: string;
    toolName: string;
    path: string;
    reason: string;
}

function detectContentType(text: string): SmartSuggestion[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const suggestions: SmartSuggestion[] = [];

    // JWT detection (starts with eyJ)
    if (/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(trimmed)) {
        suggestions.push({ toolId: "jwt-decoder", toolName: "JWT Decoder", path: "/app/jwt-decoder", reason: "Detected JWT token" });
        suggestions.push({ toolId: "base64-encoder", toolName: "Base64 Decoder", path: "/app/base64-encoder", reason: "Decode Base64 segments" });
    }

    // JSON detection
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
            JSON.parse(trimmed);
            suggestions.push({ toolId: "json-formatter", toolName: "JSON Formatter", path: "/app/json-formatter", reason: "Detected valid JSON" });
            suggestions.push({ toolId: "json-validator", toolName: "JSON Schema Validator", path: "/app/json-validator", reason: "Validate against schema" });
        } catch {
            suggestions.push({ toolId: "json-formatter", toolName: "JSON Formatter", path: "/app/json-formatter", reason: "Looks like JSON (may have errors)" });
        }
    }

    // Base64 detection
    if (/^[A-Za-z0-9+/=]{20,}$/.test(trimmed) && trimmed.length % 4 === 0 && suggestions.length === 0) {
        suggestions.push({ toolId: "base64-encoder", toolName: "Base64 Decoder", path: "/app/base64-encoder", reason: "Detected Base64 encoded data" });
    }

    // URL-encoded detection
    if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
        suggestions.push({ toolId: "url-encoder", toolName: "URL Decoder", path: "/app/url-encoder", reason: "Detected URL-encoded text" });
    }

    // Cron expression detection
    if (/^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)(\s+(\*|[0-9,\-\/]+))?$/.test(trimmed)) {
        suggestions.push({ toolId: "cron-parser", toolName: "Cron Parser", path: "/app/cron-parser", reason: "Detected cron expression" });
    }

    // Unix timestamp detection
    if (/^\d{10,13}$/.test(trimmed)) {
        suggestions.push({ toolId: "timestamp-converter", toolName: "Timestamp Converter", path: "/app/timestamp-converter", reason: "Detected Unix timestamp" });
    }

    // HTML detection
    if (/<[a-z][\s\S]*>/i.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "html-escape", toolName: "HTML Escape", path: "/app/html-escape", reason: "Detected HTML content" });
    }

    // CSS detection
    if (/[.#@][a-zA-Z][\w-]*\s*\{/.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "css-formatter", toolName: "CSS Formatter", path: "/app/css-formatter", reason: "Detected CSS" });
    }

    // YAML detection
    if (/^[a-zA-Z_][\w]*:\s*.+/m.test(trimmed) && !trimmed.startsWith("{") && suggestions.length === 0) {
        suggestions.push({ toolId: "yaml-formatter", toolName: "YAML Formatter", path: "/app/yaml-formatter", reason: "Detected YAML" });
    }

    // SQL detection
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/im.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "sql-formatter", toolName: "SQL Formatter", path: "/app/sql-formatter", reason: "Detected SQL query" });
    }

    // XML detection
    if (/^<\?xml|^<[a-zA-Z][\w]*[\s>]/m.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "xml-formatter", toolName: "XML Formatter", path: "/app/xml-formatter", reason: "Detected XML" });
    }

    // Hex color detection
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) {
        suggestions.push({ toolId: "color-converter", toolName: "Color Converter", path: "/app/color-converter", reason: "Detected hex color" });
    }

    // Regex detection
    if (/^\/.*\/[gimsuvy]*$/.test(trimmed)) {
        suggestions.push({ toolId: "regex-tester", toolName: "Regex Tester", path: "/app/regex-tester", reason: "Detected regex pattern" });
    }

    // UUID detection
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
        suggestions.push({ toolId: "uuid-generator", toolName: "UUID Generator", path: "/app/uuid-generator", reason: "Detected UUID" });
    }

    // CSV detection
    if (trimmed.includes(",") && trimmed.includes("\n") && suggestions.length === 0) {
        const lines = trimmed.split("\n").filter(Boolean);
        if (lines.length >= 2) {
            const commaCount = lines[0].split(",").length;
            if (commaCount >= 2 && lines.every(l => Math.abs(l.split(",").length - commaCount) <= 1)) {
                suggestions.push({ toolId: "csv-to-json", toolName: "CSV to JSON", path: "/app/csv-to-json", reason: "Detected CSV data" });
            }
        }
    }

    // Markdown detection
    if (/^#{1,6}\s|^\*{1,2}[^*]+\*{1,2}|\[.*\]\(.*\)/m.test(trimmed) && suggestions.length === 0) {
        suggestions.push({ toolId: "markdown-previewer", toolName: "Markdown Previewer", path: "/app/markdown-previewer", reason: "Detected Markdown" });
    }

    // Git diff detection
    if (/^diff --git|^@@\s/.test(trimmed)) {
        suggestions.push({ toolId: "git-diff-viewer", toolName: "Git Diff Viewer", path: "/app/git-diff-viewer", reason: "Detected git diff" });
    }

    // PEM certificate detection
    if (/-----BEGIN CERTIFICATE-----/.test(trimmed)) {
        suggestions.push({ toolId: "certificate-decoder", toolName: "Certificate Decoder", path: "/app/certificate-decoder", reason: "Detected PEM certificate" });
    }

    // Fallback: general text tools
    if (suggestions.length === 0 && trimmed.length > 0) {
        suggestions.push({ toolId: "hash-generator", toolName: "Hash Generator", path: "/app/hash-generator", reason: "Generate hash" });
        suggestions.push({ toolId: "base64-encoder", toolName: "Base64 Encoder", path: "/app/base64-encoder", reason: "Encode to Base64" });
        suggestions.push({ toolId: "case-converter", toolName: "Case Converter", path: "/app/case-converter", reason: "Convert text case" });
    }

    return suggestions.slice(0, 4);
}

const categoryIcons: Record<string, typeof FileJson> = {
    json: FileJson,
    encoding: Code,
    text: Type,
    web: Code,
    security: Shield,
    converters: Clock,
    utilities: Hash,
};

function AppHome() {
    const [, setLocation] = useLocation();
    const [pasteInput, setPasteInput] = useState("");
    const [recentHistory, setRecentHistory] = useState<ToolHistoryEntry[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [recentToolIds, setRecentToolIds] = useState<string[]>([]);

    useEffect(() => {
        getRecentHistory(20).then(setRecentHistory).catch(() => {});
        const favs = JSON.parse(localStorage.getItem("toolbit:favorites") || "[]");
        setFavorites(favs);
        const recent = JSON.parse(localStorage.getItem("toolbit:recent") || "[]");
        setRecentToolIds(recent);
    }, []);

    const suggestions = useMemo(() => detectContentType(pasteInput), [pasteInput]);

    const handleSuggestionClick = useCallback((path: string) => {
        // Store paste data for the target tool to consume
        if (pasteInput.trim()) {
            sessionStorage.setItem("toolbit:smart-paste", pasteInput);
        }
        setLocation(path);
    }, [pasteInput, setLocation]);

    // Deduplicate recent tools by toolId, keep latest
    const recentTools = useMemo(() => {
        const seen = new Set<string>();
        const unique: { entry: ToolHistoryEntry; tool: typeof TOOLS[0] }[] = [];
        for (const entry of recentHistory) {
            if (seen.has(entry.toolId)) continue;
            seen.add(entry.toolId);
            const tool = TOOLS.find(t => t.id === entry.toolId);
            if (tool) unique.push({ entry, tool });
            if (unique.length >= 6) break;
        }
        return unique;
    }, [recentHistory]);

    const favoriteTools = useMemo(
        () => TOOLS.filter(t => favorites.includes(t.id)),
        [favorites]
    );

    const recentlyUsedTools = useMemo(
        () => TOOLS.filter(t => recentToolIds.includes(t.id)).slice(0, 8),
        [recentToolIds]
    );

    const timeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const previewText = (text: string, max = 50) => {
        const cleaned = text.replace(/\s+/g, " ").trim();
        return cleaned.length > max ? cleaned.slice(0, max) + "..." : cleaned;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Smart Paste Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">What are you working on?</h2>
                </div>
                <div className="relative">
                    <textarea
                        value={pasteInput}
                        onChange={(e) => setPasteInput(e.target.value)}
                        placeholder="Paste anything — JSON, JWT, Base64, cron, SQL, URLs — and we'll detect the right tool..."
                        className="w-full h-32 rounded-lg border border-border bg-card p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/60"
                    />
                    {!pasteInput && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-muted-foreground/50">
                            <Clipboard className="h-3 w-3" />
                            <span>Cmd+V to paste</span>
                        </div>
                    )}
                </div>

                {/* Smart Suggestions */}
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <span className="text-xs text-muted-foreground self-center mr-1">Detected:</span>
                        {suggestions.map((s) => (
                            <button
                                key={s.toolId}
                                onClick={() => handleSuggestionClick(s.path)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                            >
                                <span>{s.toolName}</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Try it examples when input is empty */}
                {!pasteInput && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Try:</span>
                        <button
                            onClick={() => setPasteInput('{"name": "toolbit", "version": "2.0", "features": ["smart-paste", "pipelines"]}')}
                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            JSON
                        </button>
                        <button
                            onClick={() => setPasteInput("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")}
                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            JWT
                        </button>
                        <button
                            onClick={() => setPasteInput("*/5 * * * *")}
                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            Cron
                        </button>
                        <button
                            onClick={() => setPasteInput("1707307200")}
                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            Timestamp
                        </button>
                        <button
                            onClick={() => setPasteInput("SELECT u.name, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01' GROUP BY u.name HAVING COUNT(o.id) > 5 ORDER BY order_count DESC")}
                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            SQL
                        </button>
                        <button
                            onClick={() => setPasteInput("#3B82F6")}
                            className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            Color
                        </button>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {recentTools.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentTools.map(({ entry, tool }) => {
                            const CategoryIcon = categoryIcons[tool.category] || Hash;
                            return (
                                <Link
                                    key={entry.toolId + entry.timestamp}
                                    href={tool.path}
                                    className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-border/80 transition-all"
                                >
                                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <CategoryIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-sm truncate">{tool.name}</div>
                                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                                {timeAgo(entry.timestamp)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                                            {previewText(entry.input)}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Favorites */}
            {favoriteTools.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Favorites</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {favoriteTools.map((tool) => {
                            const CategoryIcon = categoryIcons[tool.category] || Hash;
                            return (
                                <Link
                                    key={tool.id}
                                    href={tool.path}
                                    className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                                >
                                    <CategoryIcon className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-sm font-medium">{tool.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* All Tools Grid */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">All Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {TOOLS.map((tool) => {
                        const CategoryIcon = categoryIcons[tool.category] || Hash;
                        const isRecent = recentToolIds.includes(tool.id);
                        return (
                            <Link
                                key={tool.id}
                                href={tool.path}
                                className={cn(
                                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                                    isRecent
                                        ? "border-border bg-card hover:bg-accent"
                                        : "border-transparent hover:border-border hover:bg-card"
                                )}
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <CategoryIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{tool.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground/60">
                <Keyboard className="h-3 w-3" />
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">Cmd+K</kbd>
                <span>to search tools anytime</span>
            </div>
        </div>
    );
}

export default AppHome;
