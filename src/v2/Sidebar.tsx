import type { CSSProperties, ReactNode } from "react";
import { Search, FileCode, Clock, Shield, FolderOpen } from "lucide-react";
import { SidebarItem, Kbd } from "@/ds/components";
import { TOOLS } from "@/config/tools.config";
import type { ToolCategory } from "@/config/tools.config";
import { CATEGORIES } from "./categories";
import type { FavoriteTool } from "./favorites";
import logoMark from "@/ds/assets/logo-mark.svg";

export const FAVORITES = [
    { id: "json-formatter", label: "JSON", kbd: "⌘1" },
    { id: "jwt-decoder", label: "JWT", kbd: "⌘2" },
    { id: "base64-encoder", label: "Base64", kbd: "⌘3" },
];

const WORKSPACES = [
    { id: "api-debug", label: "API Debug", tone: "var(--primary)", workflowId: "api-debug" },
    { id: "data-cleanup", label: "Data Cleanup", tone: "var(--success)", workflowId: "data-pipeline" },
    { id: "crypto", label: "Crypto", tone: "var(--warning)", workflowId: "security-audit" },
];

const MONOGRAMS: Record<string, [string, string]> = {
    "json-formatter": ["JS", "var(--warning)"],
    "jwt-decoder": ["JT", "var(--chart-4)"],
    "base64-encoder": ["64", "var(--primary)"],
};

function Monogram({ id }: { id: string }) {
    const [txt, color] = MONOGRAMS[id] ?? ["?", "var(--text-muted)"];
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                borderRadius: "var(--radius-sm)",
                background: "hsl(var(--surface-0))",
                border: "1px solid hsl(var(--border))",
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                fontWeight: "var(--weight-semibold)" as CSSProperties["fontWeight"],
                color: `hsl(${color})`,
            }}
        >
            {txt}
        </span>
    );
}

function GroupTitle({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                padding: "0 10px 5px",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                letterSpacing: "var(--tracking-wider)",
                textTransform: "uppercase",
                color: "hsl(var(--text-faint))",
            }}
        >
            {children}
        </div>
    );
}

interface SidebarProps {
    activeToolId: string | null;
    activeCategory: ToolCategory | null;
    onTool: (id: string) => void;
    onCategory: (id: ToolCategory) => void;
    onSearch: () => void;
    onHistory: () => void;
    onWorkspaces: () => void;
    onSnippets: () => void;
    onFavorites: () => void;
    onWorkflow: (workflowId: string) => void;
    favorites?: FavoriteTool[];
}

export function Sidebar({ activeToolId, activeCategory, onTool, onCategory, onSearch, onHistory, onWorkspaces, onSnippets, onFavorites, onWorkflow, favorites = FAVORITES.map((favorite) => ({ id: favorite.id, label: favorite.label, shortcut: favorite.kbd })) }: SidebarProps) {
    return (
        <aside
            className="tb-sidebar"
            aria-label="Tool navigation"
            style={{
                width: "var(--sidebar-width)",
                flexShrink: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "hsl(var(--sidebar))",
                borderRight: "1px solid hsl(var(--border))",
            }}
        >
            {/* Brand */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    height: "var(--header-height)",
                    padding: "0 14px",
                    flexShrink: 0,
                }}
            >
                <img src={logoMark} width={22} height={22} alt="" style={{ borderRadius: 6 }} />
                <span
                    style={{
                        fontSize: "var(--text-base)",
                        fontWeight: "var(--weight-bold)" as CSSProperties["fontWeight"],
                        letterSpacing: "var(--tracking-tight)",
                        color: "hsl(var(--text-strong))",
                    }}
                >
                    tool<span style={{ color: "hsl(var(--primary))" }}>bit</span>
                </span>
            </div>

            {/* Command trigger */}
            <div style={{ padding: "0 10px 10px" }}>
                <button
                    aria-label="Search tools" title="Search tools" onClick={onSearch}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        height: "var(--control-height)",
                        padding: "0 9px",
                        background: "hsl(var(--surface-0))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius-md)",
                        color: "hsl(var(--text-faint))",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--text-sm)",
                    }}
                >
                    <Search size={14} />
                    <span style={{ flex: 1, textAlign: "left" }}>Command</span>
                    <Kbd>⌘K</Kbd>
                </button>
            </div>

            <nav
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0 10px 10px",
                    display: "grid",
                    gap: 16,
                    alignContent: "start",
                }}
            >
                <div>
                    <GroupTitle>Favorites</GroupTitle>
                    <div style={{ display: "grid", gap: 1 }}>
                        {favorites.map((f) => (
                            <SidebarItem
                                key={f.id} aria-label={f.label} title={f.label}
                                active={activeToolId === f.id}
                                onClick={() => onTool(f.id)}
                                icon={<Monogram id={f.id} />}
                                badge={<Kbd>{f.shortcut}</Kbd>}
                            >
                                {f.label}
                            </SidebarItem>
                        ))}
                    </div>
                </div>

                <div>
                    <GroupTitle>Workspaces</GroupTitle>
                    <div style={{ display: "grid", gap: 1 }}>
                        {WORKSPACES.map((w) => (
                            <SidebarItem
                                key={w.id} aria-label={w.label} title={w.label}
                                onClick={() => onWorkflow(w.workflowId)}
                                icon={
                                    <span
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "var(--radius-full)",
                                            background: `hsl(${w.tone})`,
                                            display: "inline-block",
                                        }}
                                    />
                                }
                            >
                                {w.label}
                            </SidebarItem>
                        ))}
                    </div>
                </div>

                <div>
                    <GroupTitle>Tool Library</GroupTitle>
                    <div style={{ display: "grid", gap: 1 }}>
                        {CATEGORIES.map((c) => (
                            <SidebarItem
                                key={c.id} aria-label={c.label} title={c.label}
                                active={activeCategory === c.id}
                                onClick={() => onCategory(c.id)}
                                icon={c.icon()}
                                badge={
                                    <span
                                        style={{
                                            fontFamily: "var(--font-mono)",
                                            fontSize: "var(--text-2xs)",
                                            color: "hsl(var(--text-faint))",
                                        }}
                                    >
                                        {TOOLS.filter((t) => t.category === c.id).length}
                                    </span>
                                }
                            >
                                {c.label}
                            </SidebarItem>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Bottom */}
            <div
                style={{
                    padding: "8px 10px",
                    borderTop: "1px solid hsl(var(--border-faint))",
                    display: "grid",
                    gap: 1,
                }}
            >
                <SidebarItem aria-label="Snippets" title="Snippets" icon={<FileCode size={15} />} onClick={onSnippets}>
                    Snippets
                </SidebarItem>
                <SidebarItem aria-label="Workspaces" title="Workspaces" icon={<FolderOpen size={15} />} onClick={onWorkspaces}>
                    Workspaces
                </SidebarItem>
                <SidebarItem aria-label="Customize favorites" title="Customize favorites" icon={<Shield size={15} />} onClick={onFavorites}>
                    Customize favorites
                </SidebarItem>
                <SidebarItem aria-label="History" title="History" icon={<Clock size={15} />} onClick={onHistory}>
                    History
                </SidebarItem>
            </div>
            <div
                style={{
                    padding: "8px 14px 10px",
                    borderTop: "1px solid hsl(var(--border-faint))",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: "hsl(var(--text-faint))",
                }}
            >
                <span style={{ color: "hsl(var(--success))", display: "inline-flex" }}>
                    <Shield size={13} />
                </span>
                <span style={{ fontSize: "var(--text-2xs)" }}>Local processing · optional analytics</span>
            </div>
        </aside>
    );
}
