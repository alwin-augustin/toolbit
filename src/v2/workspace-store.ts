import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/preferences';
import { parseWorkspace, type ToolDocumentV1 } from '@/lib/workspace-schema';
import type { Workspace } from '@/lib/workspace-db';
import { TOOLS } from '@/config/tools.config';
import type { ToolCategory } from '@/config/tools.config';

export type WorkspaceTab = ToolDocumentV1;

export type Density = 'compact' | 'comfortable';

export type WorkspaceView = { kind: 'tool' } | { kind: 'catalog'; category: ToolCategory | null };

interface WorkspaceState {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  density: Density;
  inspectorOpen: boolean;
  view: WorkspaceView;

  openTool: (id: string, newDocument?: boolean) => void;
  patchDocument: (id: string, patch: Partial<ToolDocumentV1>) => void;
  restore: (workspace: Workspace) => void;
  reopen: () => string | null;
  closed: WorkspaceTab[];
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
      density: 'comfortable',
      inspectorOpen: true,
      view: { kind: 'tool' },

      closed: [],
      patchDocument: (id, patch) =>
        set((s) => ({
          tabs: s.tabs.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)),
        })),
      restore: (workspace) => {
        const parsed = parseWorkspace(JSON.stringify(workspace));
        const ids = new Map(parsed.documents.map((d) => [d.id, crypto.randomUUID()]));
        const tabs = parsed.documents.map((d) => ({ ...d, id: ids.get(d.id)! }));
        set({
          tabs,
          activeTabId: ids.get(parsed.activeDocumentId || parsed.documents[0]?.id) || null,
          ...parsed.layout,
          view: { kind: 'tool' },
        });
      },
      reopen: () => {
        const [doc, ...closed] = get().closed;
        if (!doc) return null;
        set((s) => ({ tabs: [...s.tabs, doc], closed, activeTabId: doc.id }));
        return doc.toolId;
      },
      openTool: (id, newDocument = false) => {
        if (!TOOLS.some((t) => t.id === id)) return;
        const existing =
          (!newDocument && get().tabs.find((t) => t.id === get().activeTabId && t.toolId === id)) ||
          (!newDocument && get().tabs.find((t) => t.toolId === id));
        const document = existing || {
          id: crypto.randomUUID(),
          toolId: id,
          toolVersion: 1,
          options: {},
          updatedAt: Date.now(),
        };
        set((s) => ({
          tabs: existing ? s.tabs : [...s.tabs, document],
          activeTabId: document.id,
          view: { kind: 'tool' },
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
        set({
          tabs: next,
          activeTabId: nextActive,
          closed: [tabs[idx], ...get().closed].slice(0, 10),
        });
        return next.find((t) => t.id === nextActive)?.toolId || null;
      },

      setActiveTab: (id) => {
        if (get().tabs.some((t) => t.id === id)) set({ activeTabId: id, view: { kind: 'tool' } });
      },
      setDensity: (density) => set({ density }),
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      showCatalog: (category) => set({ view: { kind: 'catalog', category } }),
      showTool: () => set({ view: { kind: 'tool' } }),
    }),
    {
      name: 'toolbit-workspace',
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      migrate: (old: unknown) => {
        const state = old as { tabs?: Array<{ id: string }>; density?: Density };
        return {
          tabs: (state.tabs || [])
            .filter((t) => TOOLS.some((tool) => tool.id === t.id))
            .map((t) => ({
              id: crypto.randomUUID(),
              toolId: t.id,
              toolVersion: 1,
              options: {},
              updatedAt: Date.now(),
            })),
          activeTabId: null,
          density: state.density || 'comfortable',
        };
      },
      partialize: (s) => ({
        tabs: s.tabs.map(({ payload: _payload, ...document }) => document),
        activeTabId: s.activeTabId,
        density: s.density,
        inspectorOpen: s.inspectorOpen,
      }),
    },
  ),
);

/** Ephemeral per-tool status reported into the status bar. Not persisted. */
interface EditorStatus {
  valid: boolean | null;
  bytes: number;
  ln: number;
  col: number;
  validityLabel: string;
  setStatus: (patch: Partial<Omit<EditorStatus, 'setStatus' | 'reset'>>) => void;
  reset: () => void;
}

const STATUS_DEFAULTS = { valid: null, bytes: 0, ln: 1, col: 1, validityLabel: '' } as const;

export const useEditorStatus = create<EditorStatus>()((set) => ({
  ...STATUS_DEFAULTS,
  setStatus: (patch) => set(patch),
  reset: () => set(STATUS_DEFAULTS),
}));
