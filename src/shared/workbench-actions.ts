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
  ownsDocument,
  readDoc,
  runExamplePipeline,
  smartPastePayload,
  type WorkbenchToolId,
} from '@/features/tools/specs';
import { useActiveResult } from '@/shared/result-store';
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
      if (!ownsDocument(toolId)) {
        navigate(toolPath(toolId));
        return;
      }
      const title = getSpec(toolId)?.title ?? TOOLS.find((t) => t.id === toolId)?.name ?? toolId;
      const alreadyOpen = useWorkspace.getState().tabs.filter((d) => d.toolId === toolId).length;
      const label = alreadyOpen === 0 ? title : `${title} ${alreadyOpen + 1}`;
      // A workbench tool seeds its full document; a document-backed custom
      // screen seeds only its primary field (via the smart-paste field map).
      const seed = isWorkbenchToolId(toolId)
        ? { ...defaultDocState(toolId, input), label }
        : { ...(input ? (smartPastePayload(toolId, input) ?? {}) : {}), label };
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

  /**
   * Hand a text payload to a tool: discovery's one handoff path, used by Smart
   * paste, paste expansion, and Next Useful Action. A tool that owns a document
   * (a workbench tool, or a document-backed screen such as Notes) opens as a
   * fresh document seeded with the payload; a screen with no document cannot
   * take one, so the text is staged in the pending-paste channel the router
   * already drains into its primary field. Always a new document — a handoff
   * must never overwrite work in progress.
   */
  const openWithPayload = useCallback(
    (toolId: string, payload: string) => {
      if (ownsDocument(toolId)) {
        openTool(toolId, payload);
        return;
      }
      try {
        sessionStorage.setItem('toolbit:smart-paste', payload);
      } catch {
        /* storage denied: the tool opens empty rather than not at all */
      }
      navigate(toolPath(toolId));
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

  return { openTool, activateExistingOrOpen, openWithPayload, restore, navigate, notify, addSaved };
}

/**
 * What "Save Result…" would write for the visible document, or null when there
 * is nothing to save yet.
 *
 * A workbench tool keeps its result in the document. A bespoke screen has no
 * document of its own and publishes its result through `usePublishedResult`,
 * so both architectures reach this one answer.
 */
export function activeSaveableResult(): { text: string; ext: string | null } | null {
  const state = useWorkspace.getState();
  const active = state.tabs.find((tab) => tab.id === state.activeTabId);
  if (active && isWorkbenchToolId(active.toolId)) {
    const output = readDoc(active).output;
    return output ? { text: output, ext: getSpec(active.toolId)?.fileExt ?? 'txt' } : null;
  }
  const published = useActiveResult.getState();
  if (!published.text.trim()) return null;
  return { text: published.text, ext: published.ext };
}

/** Reactive Tab list for components that actually render Tabs. */
export function useWorkbenchTabs() {
  return useWorkspace((s) => s.tabs);
}

export type { WorkbenchToolId };
