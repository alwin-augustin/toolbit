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

  /**
   * Open a tool as a NEW document. Opening a tool that is already open adds a
   * second, independent document and numbers its label — the same mental model
   * as opening a second file. Use `activateExistingOrOpen` when the user is
   * navigating rather than deliberately starting fresh work.
   */
  const openTool = useCallback(
    (toolId: string, input?: string) => {
      if (!isWorkbenchToolId(toolId)) {
        navigate(toolPath(toolId));
        return;
      }
      const meta = getSpec(toolId);
      const title = meta?.title ?? toolId;
      const alreadyOpen = useWorkspace.getState().tabs.filter((d) => d.toolId === toolId).length;
      const seed = {
        ...defaultDocState(toolId, input),
        label: alreadyOpen === 0 ? title : `${title} ${alreadyOpen + 1}`,
      };
      useWorkspace.getState().openDocument(toolId, seed);
      navigate(toolPath(toolId));
    },
    [navigate],
  );

  /**
   * Navigate to a tool: focus its document when one is open, otherwise create
   * one. Seeds are always applied, so pasting new content into an open tool
   * opens a fresh document rather than silently overwriting the current one.
   */
  const activateExistingOrOpen = useCallback(
    (toolId: string, input?: string) => {
      const existing =
        input === undefined
          ? useWorkspace.getState().tabs.find((d) => d.toolId === toolId)
          : undefined;
      if (existing) {
        useWorkspace.getState().setActiveTab(existing.id);
        navigate(toolPath(toolId));
        return;
      }
      openTool(toolId, input);
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
