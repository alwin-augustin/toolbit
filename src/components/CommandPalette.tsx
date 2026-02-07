import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import { TOOLS, TOOL_CATEGORIES } from "@/config/tools.config";
import {
    FileJson,
    Code,
    Shield,
    Type,
    Clock,
    Hash,
    Search,
    Keyboard,
    Moon,
    Sun,
    Star,
    FolderOpen,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { getRecentHistory, type ToolHistoryEntry } from "@/lib/history-db";
import { listWorkspaces, type Workspace } from "@/lib/workspace-db";
import { useWorkspace } from "@/hooks/use-workspace";

const categoryIcons: Record<string, typeof FileJson> = {
    json: FileJson,
    encoding: Code,
    text: Type,
    web: Code,
    security: Shield,
    converters: Clock,
    utilities: Hash,
};

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [, setLocation] = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [recentTools, setRecentTools] = useState<string[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [recentHistory, setRecentHistory] = useState<ToolHistoryEntry[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const { setWorkspace } = useWorkspace();

    // Load recent tools and favorites from localStorage when palette opens
    useEffect(() => {
        if (open) {
            const recent = JSON.parse(localStorage.getItem("toolbit:recent") || "[]");
            const favs = JSON.parse(localStorage.getItem("toolbit:favorites") || "[]");
            setRecentTools(recent);
            setFavorites(favs);
            getRecentHistory(10).then(setRecentHistory).catch(() => setRecentHistory([]));
            listWorkspaces().then(setWorkspaces).catch(() => setWorkspaces([]));
        }
    }, [open]);

    // Toggle the command palette with keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Open with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            // Also support Cmd+P for VS Code users
            if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleSelect = useCallback((path: string, toolId: string) => {
        // Add to recent tools
        const recent = JSON.parse(localStorage.getItem("toolbit:recent") || "[]");
        const newRecent = [toolId, ...recent.filter((id: string) => id !== toolId)].slice(0, 10);
        localStorage.setItem("toolbit:recent", JSON.stringify(newRecent));

        setOpen(false);
        setSearch("");
        setLocation(path);
    }, [setLocation]);

    const toggleFavorite = useCallback((toolId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const favs = JSON.parse(localStorage.getItem("toolbit:favorites") || "[]");
        const newFavs = favs.includes(toolId)
            ? favs.filter((id: string) => id !== toolId)
            : [...favs, toolId];
        localStorage.setItem("toolbit:favorites", JSON.stringify(newFavs));
        setFavorites(newFavs);
    }, []);

    const handleToggleTheme = useCallback(() => {
        toggleTheme();
        setOpen(false);
        setSearch("");
    }, [toggleTheme]);

    // Get recent tools
    const recentToolsData = TOOLS.filter((tool) => recentTools.includes(tool.id)).slice(0, 5);

    // Get favorite tools
    const favoriteToolsData = TOOLS.filter((tool) => favorites.includes(tool.id));

    // Group tools by category
    const toolsByCategory = Object.entries(TOOL_CATEGORIES).map(([key, category]) => ({
        key,
        ...category,
        tools: TOOLS.filter(tool => tool.category === key)
    }));

    const recentHistoryData = recentHistory
        .map((entry) => ({
            entry,
            tool: TOOLS.find((t) => t.id === entry.toolId),
        }))
        .filter((item) => item.tool);

    const previewText = (text: string, max = 80) => {
        const cleaned = text.replace(/\s+/g, " ").trim();
        return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Command Palette"
            className="fixed inset-0 z-50"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 border-b border-border">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search tools... (type to filter)"
                        className="flex-1 h-14 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
                        autoFocus
                    />
                    <kbd className="hidden sm:inline-flex h-6 px-2 items-center gap-1 rounded bg-muted text-xs text-muted-foreground">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                    <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                        No tools found. Try a different search term.
                    </Command.Empty>

                    {/* Quick Actions */}
                    {!search && (
                        <Command.Group heading="Quick Actions" className="px-2 py-1.5">
                            <Command.Item
                                onSelect={handleToggleTheme}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Moon className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
                                <span className="ml-auto text-xs text-muted-foreground">Theme</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => {
                                    setOpen(false);
                                    // Dispatch custom event for keyboard shortcuts help
                                    window.dispatchEvent(new CustomEvent("show-keyboard-shortcuts"));
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                            >
                                <Keyboard className="h-4 w-4 text-muted-foreground" />
                                <span>Keyboard Shortcuts</span>
                                <kbd className="ml-auto px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">?</kbd>
                            </Command.Item>
                        </Command.Group>
                    )}

                    {/* Favorites */}
                    {!search && favoriteToolsData.length > 0 && (
                        <Command.Group heading="Favorites" className="px-2 py-1.5">
                            {favoriteToolsData.map((tool) => {
                                const CategoryIcon = categoryIcons[tool.category] || Hash;
                                return (
                                    <Command.Item
                                        key={tool.id}
                                        value={tool.id}
                                        onSelect={() => handleSelect(tool.path, tool.id)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                                            <CategoryIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{tool.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {tool.description}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => toggleFavorite(tool.id, e)}
                                            className="shrink-0 text-yellow-500 hover:text-yellow-600"
                                        >
                                            <Star className="h-4 w-4 fill-current" />
                                        </button>
                                    </Command.Item>
                                );
                            })}
                        </Command.Group>
                    )}

                    {/* Recent Activity */}
                    {!search && recentHistoryData.length > 0 && (
                        <Command.Group heading="Recent Activity" className="px-2 py-1.5">
                            {recentHistoryData.map(({ entry, tool }) => {
                                const CategoryIcon = categoryIcons[tool!.category] || Hash;
                                return (
                                    <Command.Item
                                        key={entry.id}
                                        value={`${tool!.name} ${entry.input}`}
                                        onSelect={() => {
                                            setOpen(false);
                                            setSearch("");
                                            setLocation(tool!.path);
                                        }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                                            <CategoryIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{tool!.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {previewText(entry.input)}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                        </span>
                                    </Command.Item>
                                );
                            })}
                        </Command.Group>
                    )}

                    {/* Workspaces */}
                    {!search && workspaces.length > 0 && (
                        <Command.Group heading="Workspaces" className="px-2 py-1.5">
                            {workspaces.slice(0, 8).map((workspace) => (
                                <Command.Item
                                    key={workspace.id}
                                    value={workspace.name}
                                    onSelect={() => {
                                        setOpen(false);
                                        setSearch("");
                                        setWorkspace(workspace);
                                        const firstToolId = workspace.tools[0]?.toolId;
                                        const tool = TOOLS.find((t) => t.id === firstToolId);
                                        if (tool) {
                                            setLocation(tool.path);
                                        }
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                                        <FolderOpen className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{workspace.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {workspace.tools.length} tools
                                        </div>
                                    </div>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    {/* Recent Tools */}
                    {!search && recentToolsData.length > 0 && (
                        <Command.Group heading="Recent" className="px-2 py-1.5">
                            {recentToolsData.map((tool) => {
                                const CategoryIcon = categoryIcons[tool.category] || Hash;
                                const isFavorite = favorites.includes(tool.id);
                                return (
                                    <Command.Item
                                        key={tool.id}
                                        value={tool.id}
                                        onSelect={() => handleSelect(tool.path, tool.id)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                                    >
                                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                                            <CategoryIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{tool.name}</div>
                                        </div>
                                        <button
                                            onClick={(e) => toggleFavorite(tool.id, e)}
                                            className={cn(
                                                "shrink-0 hover:text-yellow-600 transition-colors",
                                                isFavorite ? "text-yellow-500" : "text-muted-foreground"
                                            )}
                                        >
                                            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                                        </button>
                                    </Command.Item>
                                );
                            })}
                        </Command.Group>
                    )}

                    {/* Tools by Category */}
                    {toolsByCategory.map(({ key, name, tools }) => {
                        if (tools.length === 0) return null;
                        const CategoryIcon = categoryIcons[key] || Hash;

                        return (
                            <Command.Group key={key} heading={name} className="px-2 py-1.5">
                                {tools.map((tool) => {
                                    const isFavorite = favorites.includes(tool.id);
                                    return (
                                        <Command.Item
                                            key={tool.id}
                                            value={`${tool.name} ${tool.description} ${tool.keywords?.join(" ")}`}
                                            onSelect={() => handleSelect(tool.path, tool.id)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary shrink-0">
                                                <CategoryIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{tool.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {tool.description}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => toggleFavorite(tool.id, e)}
                                                className={cn(
                                                    "shrink-0 hover:text-yellow-600 transition-colors",
                                                    isFavorite ? "text-yellow-500" : "text-muted-foreground/50"
                                                )}
                                            >
                                                <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                                            </button>
                                        </Command.Item>
                                    );
                                })}
                            </Command.Group>
                        );
                    })}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted">↵</kbd>
                            Select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted">ESC</kbd>
                            Close
                        </span>
                    </div>
                    <span className="hidden sm:inline">
                        <kbd className="px-1.5 py-0.5 rounded bg-muted">⌘K</kbd> to open anytime
                    </span>
                </div>
            </div>
        </Command.Dialog>
    );
}
