import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TOOLS } from "@/config/tools.config";
import type { ToolCategory } from "@/config/tools.config";

export interface WorkspaceTab {
    /** Tool id from tools.config — doubles as the URL slug. */
    id: string;
}

export type Density = "compact" | "comfortable";

export type WorkspaceView =
    | { kind: "tool" }
    | { kind: "catalog"; category: ToolCategory | null };

interface WorkspaceState {
    tabs: WorkspaceTab[];
    activeTabId: string | null;
    density: Density;
    inspectorOpen: boolean;
    view: WorkspaceView;

    openTool: (id: string) => void;
    closeTab: (id: string) => string | null;
    setActiveTab: (id: string) => void;
    setDensity: (d: Density) => void;
    toggleInspector: () => void;
    showCatalog: (category: ToolCategory | null) => void;
    showTool: () => void;
}

export const useWorkspace = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,
            density: "comfortable",
            inspectorOpen: true,
            view: { kind: "tool" },

            openTool: (id) => {
                if (!TOOLS.some((t) => t.id === id)) return;
                set((s) => ({
                    tabs: s.tabs.some((t) => t.id === id) ? s.tabs : [...s.tabs, { id }],
                    activeTabId: id,
                    view: { kind: "tool" },
                }));
            },

            /** Removes the tab; returns the id of the tab that should become
             *  active (neighbour) or null when no tabs remain. */
            closeTab: (id) => {
                const { tabs, activeTabId } = get();
                const idx = tabs.findIndex((t) => t.id === id);
                if (idx === -1) return activeTabId;
                const next = tabs.filter((t) => t.id !== id);
                let nextActive = activeTabId;
                if (activeTabId === id) {
                    nextActive = next.length ? next[Math.min(idx, next.length - 1)].id : null;
                }
                set({ tabs: next, activeTabId: nextActive });
                return nextActive;
            },

            setActiveTab: (id) => set({ activeTabId: id, view: { kind: "tool" } }),
            setDensity: (density) => set({ density }),
            toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
            showCatalog: (category) => set({ view: { kind: "catalog", category } }),
            showTool: () => set({ view: { kind: "tool" } }),
        }),
        {
            name: "toolbit-workspace",
            partialize: (s) => ({
                tabs: s.tabs,
                activeTabId: s.activeTabId,
                density: s.density,
                inspectorOpen: s.inspectorOpen,
            }),
        }
    )
);

/** Ephemeral per-tool status reported into the status bar. Not persisted. */
interface EditorStatus {
    valid: boolean | null;
    bytes: number;
    ln: number;
    col: number;
    validityLabel: string;
    setStatus: (patch: Partial<Omit<EditorStatus, "setStatus" | "reset">>) => void;
    reset: () => void;
}

const STATUS_DEFAULTS = { valid: null, bytes: 0, ln: 1, col: 1, validityLabel: "" } as const;

export const useEditorStatus = create<EditorStatus>()((set) => ({
    ...STATUS_DEFAULTS,
    setStatus: (patch) => set(patch),
    reset: () => set(STATUS_DEFAULTS),
}));
