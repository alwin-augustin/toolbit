import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { TOOLS } from '@/content/tools.config';
import { base64Transform } from '@/core/tool-contract';
import { useWorkspace } from '@/shared/workspace-store';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import {
  defaultDocState,
  getSpec,
  isWorkbenchToolId,
  runExamplePipeline,
  type WorkbenchToolId,
} from '@/features/tools/specs';
import type { WorkbenchDocState } from '@/shared/workbench';
import type { SavedKind } from '@/shared/workbench-memory';

export function toolPath(toolId: string): string {
  return TOOLS.find((t) => t.id === toolId)?.path ?? '/';
}

/** Shared document + navigation actions used by every workbench screen. */
export function useWorkbenchActions() {
  const [, navigate] = useLocation();
  const notify = useWorkbenchMemory((s) => s.notify);
  const addSaved = useWorkbenchMemory((s) => s.addSaved);

  /** Always creates a new document, mirroring the prototype's openTool. */
  const openTool = useCallback(
    (toolId: string, input?: string) => {
      if (!isWorkbenchToolId(toolId)) {
        navigate(toolPath(toolId));
        return;
      }
      const meta = getSpec(toolId);
      const count = useWorkspace.getState().tabs.filter((d) => d.toolId === toolId).length;
      const title = meta?.title ?? toolId;
      const seed = {
        ...defaultDocState(toolId, input),
        label: count ? `${title} ${count + 1}` : title,
      };
      useWorkspace.getState().openDocument(toolId, seed);
      navigate(toolPath(toolId));
    },
    [navigate],
  );

  const activateExistingOrOpen = useCallback(
    (toolId: string) => {
      const existing = useWorkspace.getState().tabs.find((d) => d.toolId === toolId);
      if (existing) {
        useWorkspace.getState().setActiveTab(existing.id);
        navigate(toolPath(toolId));
      } else {
        openTool(toolId);
      }
    },
    [navigate, openTool],
  );

  const restore = useCallback(
    (item: {
      kind: SavedKind;
      toolId: string;
      doc: WorkbenchDocState | null;
      input: string;
      name: string;
    }) => {
      if (item.kind === 'Examples') {
        const decoded = base64Transform(item.input, 'decode', false);
        if (!decoded.ok) {
          notify('Example input must be Base64-encoded JSON.');
          return;
        }
        const result = runExamplePipeline(item.input);
        if (result.error) {
          notify(result.error);
          return;
        }
        const seed = {
          ...defaultDocState('json-formatter', decoded.value),
          output: result.output,
          dirty: false,
        };
        useWorkspace.getState().openDocument('json-formatter', seed);
        navigate(toolPath('json-formatter'));
        notify('Example complete: decoded and formatted');
        return;
      }
      if (item.doc && item.kind !== 'Snippets') {
        useWorkspace.getState().openDocument(item.toolId, { ...item.doc, label: item.name });
        navigate(toolPath(item.toolId));
        return;
      }
      openTool('json-formatter', item.input);
    },
    [navigate, notify, openTool],
  );

  return { openTool, activateExistingOrOpen, restore, navigate, notify, addSaved };
}

/** Reactive Tab list for components that actually render Tabs. */
export function useWorkbenchTabs() {
  return useWorkspace((s) => s.tabs);
}

export type { WorkbenchToolId };
