import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import { Link, useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";
import { getRecentHistory, type ToolHistoryEntry } from "@/lib/history-db";
import { listWorkspaces, type Workspace } from "@/lib/workspace-db";
import { listSnippets, type Snippet } from "@/lib/snippet-db";
import { useWorkspace } from "@/hooks/use-workspace";
import { PRESET_WORKFLOWS } from "@/config/workflows.config";
import { detectContentType } from "@/lib/smart-detect";
import {
    Sparkles,
    Clock,
    Star,
    ArrowRight,
    Clipboard,
    FileJson,
    Lock,
    Wand2,
    ArrowRightLeft,
    Microscope,
    Hammer,
    FileText,
    Hash,
    Keyboard,
    FileText as FileTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, typeof FileJson> = {
    format: FileJson,
    encode: Lock,
    generate: Wand2,
    transform: ArrowRightLeft,
    analyze: Microscope,
    build: Hammer,
    text: FileText,
};

function AppHome() {
    const [, setLocation] = useLocation();
    const [pasteInput, setPasteInput] = useState("");
    const [recentHistory, setRecentHistory] = useState<ToolHistoryEntry[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const { setWorkspace } = useWorkspace();

    useEffect(() => {
        let mounted = true;

        const safeGetArray = (key: string) => {
            try {
                const raw = localStorage.getItem(key);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };

        if (typeof indexedDB !== "undefined") {
            getRecentHistory(20)
                .then((items) => {
                    if (mounted) setRecentHistory(items);
                })
                .catch(() => {
                    if (mounted) setRecentHistory([]);
                });
        }

        setFavorites(safeGetArray("toolbit:favorites"));
        setRecentToolIds(safeGetArray("toolbit:recent"));

        listWorkspaces()
            .then((items) => {
                if (mounted) setWorkspaces(items);
            })
            .catch(() => {
                if (mounted) setWorkspaces([]);
            });

        if (typeof indexedDB !== "undefined") {
            listSnippets()
                .then((items) => {
                    if (mounted) setSnippets(items);
                })
                .catch(() => {
                    if (mounted) setSnippets([]);
                });
        }

        return () => {
            mounted = false;
        };
    }, []);

    const deferredInput = useDeferredValue(pasteInput);
    const suggestions = useMemo(() => detectContentType(deferredInput), [deferredInput]);

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

    const toolById = useMemo(() => new Map(TOOLS.map((tool) => [tool.id, tool])), []);

    const workflowCards = useMemo(() => {
        const cards: {
            id: string;
            name: string;
            tools: string[];
            description?: string;
            type: "saved" | "preset";
            workspace?: Workspace;
        }[] = [];

        workspaces.slice(0, 3).forEach((workspace) => {
            cards.push({
                id: workspace.id,
                name: workspace.name,
                tools: workspace.tools.map((tool) => tool.toolId),
                description: `${workspace.tools.length} tools`,
                type: "saved",
                workspace,
            });
        });

        if (cards.length < 3) {
            PRESET_WORKFLOWS.filter((preset) => !cards.some(card => card.name === preset.name))
                .slice(0, 3 - cards.length)
                .forEach((preset) => {
                    cards.push({
                        id: preset.id,
                        name: preset.name,
                        tools: preset.tools,
                        description: preset.description,
                        type: "preset",
                    });
                });
        }

        return cards;
    }, [workspaces]);

    const renderWorkflowSteps = (toolIds: string[]) => {
        const names = toolIds
            .map((id) => toolById.get(id)?.name)
            .filter(Boolean) as string[];
        return names.join(" → ");
    };

    const handleLaunchWorkflow = (card: {
        name: string;
        tools: string[];
        type: "saved" | "preset";
        workspace?: Workspace;
    }) => {
        const workspace = card.workspace ?? {
            id: crypto.randomUUID(),
            name: card.name,
            createdAt: Date.now(),
            tools: card.tools.map((toolId) => ({
                toolId,
                state: JSON.stringify({ input: "", output: "" }),
            })),
        };

        setWorkspace(workspace);
        const firstToolId = workspace.tools[0]?.toolId;
        const tool = firstToolId ? toolById.get(firstToolId) : null;
        if (tool) {
            setLocation(tool.path);
        }
    };

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

    const isFirstRun = recentTools.length === 0 && favorites.length === 0 && workspaces.length === 0 && snippets.length === 0;

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

            {/* First run onboarding */}
            {isFirstRun && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Get started in 30 seconds
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Paste anything above, or jump into a popular workflow below.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => setPasteInput('{"name": "toolbit", "version": "2.0"}')}
                        >
                            Try JSON
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setLocation("/app/jwt-decoder")}
                        >
                            Open JWT Decoder
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                        >
                            Search tools
                        </Button>
                    </div>
                </div>
            )}

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
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Favorites</h3>
                </div>
                {favoriteTools.length > 0 ? (
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
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Star tools in the sidebar or command palette to pin them here.
                    </div>
                )}
            </div>

            {/* Quick Workflows */}
            {workflowCards.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Quick Workflows</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.dispatchEvent(new CustomEvent("open-workspaces"))}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Manage
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workflowCards.map((card) => (
                            <button
                                key={card.id}
                                onClick={() => handleLaunchWorkflow(card)}
                                className="group text-left p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-border/80 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm">{card.name}</div>
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                        {card.type === "preset" ? "Preset" : "Saved"}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {card.description ?? `${card.tools.length} tools`}
                                </div>
                                <div className="mt-2 text-xs font-mono text-primary/90 truncate">
                                    {renderWorkflowSteps(card.tools)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Snippets */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileTextIcon className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Snippets</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.dispatchEvent(new CustomEvent("open-snippets"))}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Manage
                    </Button>
                </div>
                {snippets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {snippets.slice(0, 6).map((snippet) => (
                            <button
                                key={snippet.id}
                                onClick={() => {
                                    if (snippet.toolId) {
                                        const tool = toolById.get(snippet.toolId);
                                        if (tool) {
                                            sessionStorage.setItem("toolbit:smart-paste", snippet.content);
                                            setLocation(tool.path);
                                            return;
                                        }
                                    }
                                    window.dispatchEvent(new CustomEvent("open-snippets"));
                                }}
                                className="group text-left p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-border/80 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm truncate">{snippet.name}</div>
                                    {snippet.toolId && (
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Saved</span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                    {previewText(snippet.content)}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Save inputs or outputs as snippets to reuse them quickly.
                    </div>
                )}
            </div>

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
