import { useEffect, useRef, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarToggle } from "@/components/SidebarToggle";
import { Footer } from "@/components/Footer";
import { useSidebar } from "@/hooks/use-sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Search, Home, Star, FolderOpen, MoreHorizontal, Moon, Sun, FileText, Minus, Square, X, ShieldCheck, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch as Toggle } from "@/components/ui/switch";
import { WorkspaceManager } from "@/components/WorkspaceManager";
import { SnippetManager } from "@/components/SnippetManager";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useElectron } from "@/hooks/use-electron";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { isOpen, close } = useSidebar();
    const [location] = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [utilitiesOpen, setUtilitiesOpen] = useState(false);
    const utilitiesRef = useRef<HTMLDivElement | null>(null);
    const { isElectron, platform, appVersion, electronAPI } = useElectron();
    const isMac = platform?.platform === "darwin";
    const showWindowControls = isElectron && !isMac;
    const [networkOff, setNetworkOff] = useState(true);

    // Close sidebar on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                close();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, close]);

    useEffect(() => {
        if (!utilitiesOpen) return;
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (utilitiesRef.current && utilitiesRef.current.contains(target)) return;
            setUtilitiesOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [utilitiesOpen]);

    return (
        <>
            {/* Skip to main content link for screen readers */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring"
            >
                Skip to main content
            </a>
            <div className="min-h-screen bg-background font-sans antialiased">
                <div className="relative flex min-h-screen">
                    {/* Mobile backdrop overlay */}
                    {isOpen && (
                        <div
                            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                            onClick={close}
                            aria-hidden="true"
                        />
                    )}
                    <AppSidebar />
                    <div className="flex-1 flex flex-col transition-all duration-150 ease-out">
                        <header
                            className={cn(
                                "sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm",
                                isElectron && "electron-titlebar",
                                isElectron && isMac && "pl-16"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <SidebarToggle />
                                {isElectron && (
                                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-semibold text-foreground">Toolbit</span>
                                        {appVersion && (
                                            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                                v{appVersion}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* Search button */}
                                <Button
                                    variant="outline"
                                    className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        // Trigger command palette
                                        const event = new KeyboardEvent('keydown', {
                                            key: 'k',
                                            metaKey: true,
                                            bubbles: true
                                        });
                                        document.dispatchEvent(event);
                                    }}
                                >
                                    <Search className="h-4 w-4" />
                                    <span className="text-sm">Search tools...</span>
                                    <kbd className="hidden md:inline-flex ml-2 px-1.5 py-0.5 rounded bg-muted text-xs">
                                        ⌘K
                                    </kbd>
                                </Button>
                                {/* Mobile search icon */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="sm:hidden"
                                    onClick={() => {
                                        const event = new KeyboardEvent('keydown', {
                                            key: 'k',
                                            metaKey: true,
                                            bubbles: true
                                        });
                                        document.dispatchEvent(event);
                                    }}
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                                <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs text-muted-foreground" title="Toolbit makes no background network calls.">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-foreground/80">No network calls made</span>
                                </div>
                                <div
                                    className="hidden lg:flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs"
                                    title="Visual indicator only. Toolbit does not make background network calls."
                                >
                                    <WifiOff className={`h-3.5 w-3.5 ${networkOff ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                                    <label htmlFor="network-off-toggle" className="text-xs text-muted-foreground">
                                        Network Off
                                    </label>
                                    <Toggle
                                        id="network-off-toggle"
                                        checked={networkOff}
                                        onCheckedChange={setNetworkOff}
                                        aria-label="Network Off (visual indicator)"
                                    />
                                </div>
                                <WorkspaceManager showTrigger={false} />
                                <SnippetManager showTrigger={false} />
                                <div ref={utilitiesRef} className="relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Utilities"
                                        onClick={() => setUtilitiesOpen(!utilitiesOpen)}
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                    {utilitiesOpen && (
                                        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-popover shadow-lg p-1 z-50">
                                            <button
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent("open-workspaces"));
                                                    setUtilitiesOpen(false);
                                                }}
                                            >
                                                <FolderOpen className="h-4 w-4" />
                                                Workspaces
                                            </button>
                                            <button
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent("open-snippets"));
                                                    setUtilitiesOpen(false);
                                                }}
                                            >
                                                <FileText className="h-4 w-4" />
                                                Snippets
                                            </button>
                                            <button
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                                                onClick={() => {
                                                    toggleTheme();
                                                    setUtilitiesOpen(false);
                                                }}
                                            >
                                                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                                {theme === "dark" ? "Light mode" : "Dark mode"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {showWindowControls && (
                                    <div className="flex items-center gap-1 border-l border-border/70 pl-2 ml-1">
                                        <button
                                            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center"
                                            onClick={() => electronAPI?.window?.minimize()}
                                            title="Minimize"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center"
                                            onClick={() => electronAPI?.window?.maximize()}
                                            title="Maximize"
                                        >
                                            <Square className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                                            onClick={() => electronAPI?.window?.close()}
                                            title="Close"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </header>
                        <main id="main-content" className="flex-1 overflow-auto p-6 md:p-8 pb-20 lg:pb-8" tabIndex={-1}>
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </main>
                        <Footer />
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
                <div className="flex items-center justify-around py-2">
                    <Link
                        href="/app"
                        className={`flex flex-col items-center gap-1 text-xs ${location === "/app" ? "text-primary" : "text-muted-foreground"}`}
                    >
                        <Home className="h-5 w-5" />
                        Home
                    </Link>
                    <button
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("open-command-palette", { detail: { search: "" } }));
                        }}
                    >
                        <Search className="h-5 w-5" />
                        Search
                    </button>
                    <button
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("open-command-palette", { detail: { search: "" } }));
                        }}
                    >
                        <Star className="h-5 w-5" />
                        Favorites
                    </button>
                    <button
                        className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("open-workspaces"));
                        }}
                    >
                        <FolderOpen className="h-5 w-5" />
                        Workspaces
                    </button>
                </div>
            </nav>
        </>
    );
}
