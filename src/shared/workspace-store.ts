import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/core/preferences';
import { parseWorkspace, type ToolDocumentV1 } from '@/core/workspace-schema';
import type { JsonValue } from '@/core/tool-contract';
import type { Workspace } from '@/core/workspace-db';
import { TOOLS } from '@/content/tools.config';
import type { ToolCategory } from '@/content/tools.config';

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
  /**
   * Open a workbench document, always creating a new tab. Returns the new
   * tab id. The seed payload carries the document input and options; the
   * persist layer already strips payloads, so content stays session-only.
   */
  openDocument: (id: string, seed?: Record<string, JsonValue>) => string | null;
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

export const MAX_OPEN_TABS = 20;

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
      openDocument: (id, seed) => {
        if (!TOOLS.some((t) => t.id === id)) return null;
        const document = {
          id: crypto.randomUUID(),
          toolId: id,
          toolVersion: 1,
          options: {},
          payload: seed,
          updatedAt: Date.now(),
        };
        set((s) => {
          if (s.tabs.length >= MAX_OPEN_TABS) {
            // Drop the oldest Tab to keep the strip and persisted shells bounded.
            const [, ...rest] = s.tabs;
            return { tabs: [...rest, document], activeTabId: document.id };
          }
          return { tabs: [...s.tabs, document], activeTabId: document.id };
        });
        return document.id;
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
