import { useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { detectContentType } from '@/core/smart-detect';
import { installExternalLinkGuard } from '@/platform/external-links';
import { useWorkspace } from '@/shared/workspace-store';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { toolPath, useWorkbenchActions } from '@/shared/workbench-actions';
import { getSpec, isWorkbenchToolId, patchWorkbenchDoc, readDoc } from '@/features/tools/specs';
import {
  DESKTOP_EVENT,
  desktopErrorMessage,
  isDesktopHost,
  onDesktopMenu,
  onFileDrop,
  onOpenPath,
  openFile,
  readFile,
  saveFile,
  takePendingOpenPath,
} from '@/platform/desktop';

/** Default filename for "Save Result…", matching the workbench's own download. */
function resultFileName(toolId: string): string {
  return `toolbit-result.${getSpec(toolId)?.fileExt ?? 'txt'}`;
}

/** ⌥⌘W / "Close Document": mirrors the shell's own keyboard handler. */
function closeActiveDocument(navigate: (to: string) => void): void {
  const { activeTabId, tabs, closeTab } = useWorkspace.getState();
  const closed = tabs.find((tab) => tab.id === activeTabId);
  if (!closed) return;
  const nextToolId = closeTab(closed.id);
  // A menu command is deliberate, so the workspace moves to the neighbouring
  // document (or home). Staying put would let the tool route open the closed
  // document again.
  navigate(nextToolId ? toolPath(nextToolId) : '/');
}

/**
 * Desktop host wiring.
 *
 * Renders nothing, and is inert in every browser. Inside the Tauri shell it
 * translates the native menu, the native file panels and OS file drops into the
 * actions the workspace already exposes, so no tool screen needs to know
 * whether it is running in an installed app.
 */
export function DesktopHost() {
  const [, navigate] = useLocation();
  const { openTool } = useWorkbenchActions();
  const notify = useWorkbenchMemory((s) => s.notify);

  /**
   * Put text into the tool the user is looking at, and otherwise let Smart
   * detection pick the tool — the same routing the start screen uses for a
   * pasted payload, so opening a file and pasting one behave alike.
   */
  const openContents = useCallback(
    (contents: string, name?: string) => {
      const state = useWorkspace.getState();
      const active = state.tabs.find((tab) => tab.id === state.activeTabId);
      if (active && isWorkbenchToolId(active.toolId)) {
        patchWorkbenchDoc(active.id, {
          input: contents,
          output: '',
          error: '',
          dirty: true,
          ...(name ? { label: name } : {}),
        });
        navigate(toolPath(active.toolId));
        return;
      }
      const [best] = detectContentType(contents);
      if (best && isWorkbenchToolId(best.toolId)) {
        openTool(best.toolId, contents);
        return;
      }
      if (best) {
        try {
          sessionStorage.setItem('toolbit:smart-paste', contents);
        } catch {
          /* Storage denied: the tool opens empty rather than not at all. */
        }
        navigate(best.path);
        return;
      }
      openTool('json-formatter', contents);
    },
    [navigate, openTool],
  );

  const openFromPath = useCallback(
    async (path: string) => {
      try {
        const file = await readFile(path);
        openContents(file.contents, file.name);
        notify(`${file.name} opened`);
      } catch (error) {
        notify(desktopErrorMessage(error));
      }
    },
    [notify, openContents],
  );

  const openViaPanel = useCallback(async () => {
    try {
      const file = await openFile();
      if (!file) return;
      openContents(file.contents, file.name);
      notify(`${file.name} opened`);
    } catch (error) {
      notify(desktopErrorMessage(error));
    }
  }, [notify, openContents]);

  const saveActiveResult = useCallback(async () => {
    const state = useWorkspace.getState();
    const active = state.tabs.find((tab) => tab.id === state.activeTabId);
    if (!active || !isWorkbenchToolId(active.toolId)) {
      notify('Open a tool before saving a result.');
      return;
    }
    const output = readDoc(active).output;
    if (!output) {
      notify('Run the tool before saving a result.');
      return;
    }
    try {
      const saved = await saveFile(resultFileName(active.toolId), output);
      if (saved) notify(`Result saved to ${saved}`);
    } catch (error) {
      notify(desktopErrorMessage(error));
    }
  }, [notify]);

  useEffect(() => {
    if (!isDesktopHost()) return;
    // The window title bar shows this, and the web build's title is written for
    // search results ("Toolbit | Local-First Developer Tools, …"). An installed
    // app carries the product name.
    document.title = 'Toolbit';
    let cancelled = false;
    const disposers: Array<() => void> = [];

    // The installed app has no address bar or back button, so a link in
    // rendered content must not be able to replace the workspace.
    disposers.push(installExternalLinkGuard(notify));

    void (async () => {
      const wired = await Promise.all([
        onDesktopMenu((name) => {
          switch (name) {
            case DESKTOP_EVENT.quickOpen:
              window.dispatchEvent(new CustomEvent('wb:open-search'));
              break;
            case DESKTOP_EVENT.settings:
              navigate('/settings');
              break;
            case DESKTOP_EVENT.openFile:
              void openViaPanel();
              break;
            case DESKTOP_EVENT.saveResult:
              void saveActiveResult();
              break;
            case DESKTOP_EVENT.closeDocument:
              closeActiveDocument(navigate);
              break;
            default:
              break;
          }
        }),
        onFileDrop((paths) => {
          const [first] = paths;
          if (first) void openFromPath(first);
        }),
        onOpenPath((path) => void openFromPath(path)),
      ]);

      // A late unmount must not leave listeners attached to the shell.
      if (cancelled) {
        wired.forEach((dispose) => dispose());
        return;
      }
      disposers.push(...wired);

      // Files that arrived before this component mounted — a second launch or a
      // file association — are queued in the shell until we drain them.
      for (let pending = await takePendingOpenPath(); pending;) {
        await openFromPath(pending);
        pending = await takePendingOpenPath();
      }
    })();

    return () => {
      cancelled = true;
      disposers.forEach((dispose) => dispose());
    };
  }, [navigate, notify, openFromPath, openViaPanel, saveActiveResult]);

  return null;
}
