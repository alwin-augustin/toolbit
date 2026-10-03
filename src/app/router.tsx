import { Suspense, useEffect, type ReactNode } from 'react';
import { Switch, Route } from 'wouter';
import { ToolErrorBoundary } from '@/app/components/ToolErrorBoundary';
import { LoadingFallback } from '@/app/components/LoadingFallback';
import { TOOLS } from '@/content/tools.config';
import { DocumentContext } from '@/shared/document-state';
import { useWorkspace } from '@/shared/workspace-store';
import { StartScreen } from '@/app/screens/StartScreen';
import { ToolsScreen } from '@/app/screens/ToolsScreen';
import { SavedScreen } from '@/app/screens/SavedScreen';
import { HistoryScreen } from '@/app/screens/HistoryScreen';
import { SettingsScreen } from '@/app/screens/SettingsScreen';
import { WorkspaceScreen } from '@/app/screens/WorkspaceScreen';
import {
  defaultDocState,
  getSpec,
  isWorkbenchToolId,
  smartPastePayload,
  takeSmartPaste,
} from '@/features/tools/specs';
import { CUSTOM_SCREENS, isCustomToolId } from '@/features/tools/custom-screens';

function ScreenPage({ children }: { children: ReactNode }) {
  return (
    <main id="wb-main" tabIndex={-1} className="wb-page">
      {children}
    </main>
  );
}

function ToolRoute({ toolId }: { toolId: string }) {
  const tabs = useWorkspace((s) => s.tabs);
  const activeTabId = useWorkspace((s) => s.activeTabId);
  const active =
    tabs.find((t) => t.id === activeTabId && t.toolId === toolId) ??
    [...tabs].reverse().find((t) => t.toolId === toolId);
  const activeId = active?.id ?? null;

  // Open-once per toolId: intentionally depends only on toolId so per-keystroke
  // store updates do not re-run creation and closing the last Tab does not
  // resurrect a stray Tab before navigation commits.
  useEffect(() => {
    const state = useWorkspace.getState();
    const existing =
      state.tabs.find((t) => t.id === state.activeTabId && t.toolId === toolId) ??
      [...state.tabs].reverse().find((t) => t.toolId === toolId);
    if (!existing) {
      // Landing-demo smart paste arrives via sessionStorage (fresh doc only).
      const pasted = takeSmartPaste();
      if (isWorkbenchToolId(toolId)) {
        const count = state.tabs.filter((d) => d.toolId === toolId).length;
        const title = getSpec(toolId)?.title ?? toolId;
        state.openDocument(toolId, {
          ...defaultDocState(toolId, pasted ?? undefined),
          label: count ? `${title} ${count + 1}` : title,
        });
      } else if (isCustomToolId(toolId)) {
        const seed = pasted ? smartPastePayload(toolId, pasted) : null;
        state.openDocument(toolId, seed ? { ...seed } : undefined);
      } else {
        state.openTool(toolId);
      }
    } else if (existing.id !== state.activeTabId) {
      state.setActiveTab(existing.id);
    }
  }, [toolId]);

  if (isWorkbenchToolId(toolId)) {
    if (!active) return <LoadingFallback />;
    const title = getSpec(toolId)?.title ?? toolId;
    return (
      <main id="wb-main" tabIndex={-1} className="wb-workspace">
        <ToolErrorBoundary key={active.id} toolName={title}>
          <WorkspaceScreen key={active.id} tab={active} />
        </ToolErrorBoundary>
      </main>
    );
  }

  const Custom = CUSTOM_SCREENS[toolId];
  if (Custom) {
    const meta = TOOLS.find((t) => t.id === toolId);
    return (
      <main id="wb-main" tabIndex={-1} className="wb-workspace">
        <ToolErrorBoundary key={activeId ?? toolId} toolName={meta?.name ?? toolId}>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentContext.Provider value={activeId}>
              <Custom key={activeId ?? toolId} />
            </DocumentContext.Provider>
          </Suspense>
        </ToolErrorBoundary>
      </main>
    );
  }

  const meta = TOOLS.find((t) => t.id === toolId)!;
  const Component = meta.component;
  if (!Component) return <LoadingFallback />;
  return (
    <main id="wb-main" tabIndex={-1} className="wb-page">
      <ToolErrorBoundary toolName={meta.name}>
        <Suspense fallback={<LoadingFallback />}>
          <DocumentContext.Provider value={activeId}>
            <Component key={activeId ?? toolId} />
          </DocumentContext.Provider>
        </Suspense>
      </ToolErrorBoundary>
    </main>
  );
}

export function AppRouter() {
  return (
    <Switch>
      <Route path="/">
        <ScreenPage>
          <StartScreen />
        </ScreenPage>
      </Route>
      <Route path="/library">
        <ScreenPage>
          <ToolsScreen />
        </ScreenPage>
      </Route>
      <Route path="/saved">
        <ScreenPage>
          <SavedScreen />
        </ScreenPage>
      </Route>
      <Route path="/history">
        <ScreenPage>
          <HistoryScreen />
        </ScreenPage>
      </Route>
      <Route path="/settings">
        <ScreenPage>
          <SettingsScreen />
        </ScreenPage>
      </Route>
      {TOOLS.map(({ id, path: toolPath }) => (
        <Route key={id} path={toolPath}>
          <ToolRoute toolId={id} />
        </Route>
      ))}
      <Route>
        <ScreenPage>
          <StartScreen />
        </ScreenPage>
      </Route>
    </Switch>
  );
}
