import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { TOOLS } from "@/config/tools.config";
import { useTheme } from "@/hooks/use-theme";
import { useWorkspace, useEditorStatus } from "./workspace-store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TabStrip } from "./TabStrip";
import { Statusbar } from "./Statusbar";
import { Inspector } from "./Inspector";
import { Catalog } from "./Catalog";
import { CommandPalette } from "./CommandPalette";
import { HistoryPanel } from "./HistoryPanel";
import { categoryMeta } from "./categories";
import { detectSmartPaste, isEditableTarget, stashSmartPaste } from "./smart-paste";
import { HomeDashboard } from "./HomeDashboard";
import { PhaseTwoPanels } from "./PhaseTwoPanels";
import { FAVORITES_CHANGED_EVENT, getFavoriteTools, readFavoriteIds } from "./favorites";
import { useToolPipe } from "@/hooks/use-tool-pipe";
import { useRouteSeo } from "@/seo/use-seo";
import { useWorkspace as useLegacyWorkspace } from "@/hooks/use-workspace";
import { PRESET_WORKFLOWS } from "@/config/workflows.config";

function toolFromPath(path: string) {
    const m = path.match(/^\/app\/([^/]+)\/?$/);
    if (!m) return undefined;
    return TOOLS.find((t) => t.id === m[1]);
}

interface WorkspaceShellProps {
    children: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
    const [location, setLocation] = useLocation();
    const { theme, toggleTheme } = useTheme();
    const {
        tabs,
        activeTabId,
        density,
        inspectorOpen,
        view,
        openTool,
        closeTab,
        setDensity,
        toggleInspector,
        showCatalog,
        showTool,
    } = useWorkspace();
    const { pipeline } = useToolPipe();
    const { setWorkspace: restoreWorkspace } = useLegacyWorkspace();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [phasePanel, setPhasePanel] = useState<"workspaces" | "snippets" | "favorites" | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavoriteIds);
    const resetStatus = useEditorStatus((s) => s.reset);

    const urlTool = toolFromPath(location);

    // Title, description, and canonical follow the active tool so each one can
    // rank for its own search terms instead of inheriting the homepage's.
    useRouteSeo();

    // URL is the source of truth: visiting /app/:slug ensures a tab exists.
    useEffect(() => {
        if (urlTool) openTool(urlTool.id);
    }, [urlTool?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Restore the active tab's URL when landing on bare /app with persisted tabs.
    useEffect(() => {
        if (location.replace(/\/$/, "") === "/app" && activeTabId) {
            setLocation(`/app/${activeTabId}`, { replace: true });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        document.documentElement.dataset.density = density;
    }, [density]);

    useEffect(() => {
        const refreshFavorites = () => setFavoriteIds(readFavoriteIds());
        const openWorkspaces = (event: Event) => {
            setPhasePanel("workspaces");
            const detail = (event as CustomEvent<{ pipeline?: unknown }>).detail;
            if (detail?.pipeline) return;
        };
        const openSnippets = () => setPhasePanel("snippets");
        const openFavorites = () => setPhasePanel("favorites");
        window.addEventListener(FAVORITES_CHANGED_EVENT, refreshFavorites);
        window.addEventListener("open-workspaces", openWorkspaces);
        window.addEventListener("open-snippets", openSnippets);
        window.addEventListener("open-favorites", openFavorites);
        return () => {
            window.removeEventListener(FAVORITES_CHANGED_EVENT, refreshFavorites);
            window.removeEventListener("open-workspaces", openWorkspaces);
            window.removeEventListener("open-snippets", openSnippets);
            window.removeEventListener("open-favorites", openFavorites);
        };
    }, []);

    // Reset the status bar whenever the active tool changes.
    useEffect(() => {
        resetStatus();
    }, [activeTabId, resetStatus]);

    const navigateToTool = (id: string) => {
        showTool();
        setLocation(`/app/${id}`);
    };

    const loadWorkspace = (workspace: Parameters<typeof restoreWorkspace>[0]) => {
        restoreWorkspace(workspace);
        workspace.tools.forEach((tool) => openTool(tool.toolId));
        const firstTool = workspace.tools[0]?.toolId;
        if (firstTool) setLocation(`/app/${firstTool}`);
        setPhasePanel(null);
    };

    const openWorkflow = (workflowId: string) => {
        const workflow = PRESET_WORKFLOWS.find((candidate) => candidate.id === workflowId);
        if (!workflow) return;
        showTool();
        workflow.tools.forEach((toolId) => openTool(toolId));
        const firstTool = workflow.tools[0];
        if (firstTool) setLocation(`/app/${firstTool}`);
    };

    const handleClose = (id: string) => {
        const nextActive = closeTab(id);
        if (id === activeTabId) {
            setLocation(nextActive ? `/app/${nextActive}` : "/app");
        }
    };

    // Smart paste: ⌘V outside editable elements detects the content type
    // and routes to the matching tool with the content pre-filled.
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            if (isEditableTarget(e.target)) return;
            const text = e.clipboardData?.getData("text") ?? "";
            if (!text.trim()) return;
            const match = detectSmartPaste(text);
            if (!match) return;
            e.preventDefault();
            stashSmartPaste(text);
            navigateToTool(match.toolId);
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Global shortcuts: ⌘K palette, ⌘1–3 favorites.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((p) => !p);
                return;
            }
            if (mod && ["1", "2", "3"].includes(e.key)) {
                const fav = favoriteIds[Number(e.key) - 1];
                if (fav) {
                    e.preventDefault();
                    navigateToTool(fav);
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const activeTool = TOOLS.find((t) => t.id === activeTabId);
    const normalizedLocation = location.replace(/\/$/, "");
    const isHome = view.kind === "tool" && !activeTabId && (normalizedLocation === "" || normalizedLocation === "/app");
    const crumb: [string, string] =
        view.kind === "catalog"
            ? ["Tool Library", view.category ? categoryMeta(view.category)?.label ?? "All tools" : "All tools"]
            : [
                  activeTool ? categoryMeta(activeTool.category)?.label ?? "Tools" : "Toolbit",
                  activeTool?.name ?? "Workspace",
              ];

    return (
        <div
            className="tb-workspace-shell"
            style={{
                display: "flex",
                height: "100vh",
                overflow: "hidden",
                background: "hsl(var(--surface-0))",
                color: "hsl(var(--text-body))",
                fontFamily: "var(--font-sans)",
            }}
        >
            <Sidebar
                activeToolId={view.kind === "tool" ? activeTabId : null}
                activeCategory={view.kind === "catalog" ? view.category : null}
                onTool={navigateToTool}
                onCategory={(c) => showCatalog(c)}
                onSearch={() => setPaletteOpen(true)}
                onHistory={() => setHistoryOpen(true)}
                onWorkspaces={() => setPhasePanel("workspaces")}
                onSnippets={() => setPhasePanel("snippets")}
                onFavorites={() => setPhasePanel("favorites")}
                onWorkflow={openWorkflow}
                favorites={getFavoriteTools(favoriteIds)}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Topbar
                    crumb={crumb}
                    density={density}
                    onDensity={setDensity}
                onToggleInspector={toggleInspector}
                theme={theme}
                onToggleTheme={toggleTheme}
                pipelineStepCount={pipeline.length}
                onSavePipeline={() => setPhasePanel("workspaces")}
                />
                {view.kind === "tool" ? (
                    <>
                        {isHome ? (
                            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                                <HomeDashboard onSearch={() => setPaletteOpen(true)} onHistory={() => setHistoryOpen(true)} onCategory={(category) => showCatalog(category)} />
                            </div>
                        ) : (
                            <>
                                <TabStrip
                                    tabs={tabs}
                                    activeTabId={activeTabId}
                                    onTab={navigateToTool}
                                    onClose={handleClose}
                                    onAdd={() => setPaletteOpen(true)}
                                />
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
                                    {children}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <Catalog category={view.category} onTool={navigateToTool} />
                )}
                <Statusbar />
            </div>
            {inspectorOpen && view.kind === "tool" && (
                <Inspector toolId={activeTabId} onClose={toggleInspector} />
            )}
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={navigateToTool} />
            <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} onOpenTool={navigateToTool} />
            <PhaseTwoPanels
                panel={phasePanel}
                onClose={() => setPhasePanel(null)}
                onLoadWorkspace={loadWorkspace}
                tabs={tabs}
                pipeline={pipeline}
                favoriteIds={favoriteIds}
                onFavoritesChange={setFavoriteIds}
            />
        </div>
    );
}
