import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { ToolErrorBoundary } from '@/app/components/ToolErrorBoundary';
import { LoadingFallback } from '@/app/components/LoadingFallback';
import { TOOLS } from '@/content/tools.config';
import { DocumentContext, DocumentSeedContext } from '@/shared/document-state';
import { useWorkspace } from '@/shared/workspace-store';
import { StartScreen } from '@/app/screens/StartScreen';
import { ToolsScreen } from '@/app/screens/ToolsScreen';
import { SavedScreen } from '@/app/screens/SavedScreen';
import { HistoryScreen } from '@/app/screens/HistoryScreen';
import { SettingsScreen } from '@/app/screens/SettingsScreen';
import { WorkspaceScreen } from '@/app/screens/WorkspaceScreen';
import {
  clearSmartPaste,
  defaultDocState,
  getSpec,
  isWorkbenchToolId,
  peekSmartPaste,
  smartPastePayload,
} from '@/features/tools/specs';
import { CUSTOM_SCREENS } from '@/features/tools/custom-screens';

function ScreenPage({ children }: { children: ReactNode }) {
  return (
    <main id="wb-main" tabIndex={-1} className="wb-scroll flex-1 overflow-y-auto min-h-0">
      <div className="mx-auto w-full max-w-5xl px-6 py-6">{children}</div>
    </main>
  );
}

function ToolRoute({ toolId }: { toolId: string }) {
  const tabs = useWorkspace((s) => s.tabs);
  const activeTabId = useWorkspace((s) => s.activeTabId);
  const [, navigate] = useLocation();

  // A pending Smart paste is read once per mount and cleared once applied, so
  // pasted content can never leak into a later document. Read-only peek keeps
  // this safe under React's double-invoked renders.
  const pendingPaste = useRef<string | null | undefined>(undefined);
  if (pendingPaste.current === undefined) pendingPaste.current = peekSmartPaste();
  const pasted = pendingPaste.current;

  const isWorkbench = isWorkbenchToolId(toolId);
  const title = getSpec(toolId)?.title ?? toolId;
  const Custom = CUSTOM_SCREENS[toolId];
  const meta = TOOLS.find((tool) => tool.id === toolId);
  const Component = meta?.component;
  const routable = isWorkbench || !!Custom || !!Component;

  // Find existing tab for this tool (without creating one)
  const active =
    tabs.find((t) => t.id === activeTabId && t.toolId === toolId) ??
    [...tabs].reverse().find((t) => t.toolId === toolId);
  const activeId = active?.id ?? null;

  // ALL HOOKS MUST BE AT THE TOP LEVEL — never inside conditionals or after early returns.

  // If a tab exists but isn't active, activate it (no tab creation).
  useEffect(() => {
    if (active && active.id !== activeTabId) {
      useWorkspace.getState().setActiveTab(active.id);
    }
  }, [activeId, activeTabId, active]);

  // Workbench tools open as documents on direct URL navigation. Custom
  // screens render without a document — their state is session-only by design
  // — and an unknown slug falls back home rather than showing an empty shell.
  useEffect(() => {
    if (active || !routable) return;
    if (!isWorkbench) return;
    const state = useWorkspace.getState();
    const existing = state.tabs.find((t) => t.toolId === toolId);
    if (existing) {
      if (existing.id !== state.activeTabId) state.setActiveTab(existing.id);
      return;
    }
    state.openDocument(toolId, {
      ...defaultDocState(toolId, pasted ?? undefined),
      label: title,
    });
    clearSmartPaste();
  }, [toolId, title, isWorkbench, routable, active, pasted]);

  // Custom screens hold no document, so a pending paste is applied through the
  // seed context and then dropped.
  useEffect(() => {
    if (!isWorkbench) clearSmartPaste();
  }, [isWorkbench]);

  // Unknown routes never render an empty workspace.
  useEffect(() => {
    if (!routable) navigate('/');
  }, [routable, navigate]);

  // Values the tool should start with when it has no document of its own.
  const seed = useMemo(
    () => (pasted && !isWorkbench ? smartPastePayload(toolId, pasted) : null),
    [pasted, isWorkbench, toolId],
  );

  if (isWorkbench) {
    if (active) {
      return (
        <main id="wb-main" tabIndex={-1} className="flex flex-col flex-1 min-h-0">
          <ToolErrorBoundary key={active.id} toolName={title}>
            <WorkspaceScreen key={active.id} tab={active} />
          </ToolErrorBoundary>
        </main>
      );
    }
    // No tab yet — show loading while the effect above creates one
    return <LoadingFallback />;
  }

  // Custom tool screens (Hash, JWT, etc.)
  if (Custom) {
    return (
      <main id="wb-main" tabIndex={-1} className="wb-scroll flex-1 overflow-y-auto min-h-0">
        <ToolErrorBoundary key={activeId ?? toolId} toolName={meta?.name ?? toolId}>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentContext.Provider value={activeId}>
              <DocumentSeedContext.Provider value={seed}>
                {/* Every tool document lays out inside one container, with the
                    same inset and gap the generic workbench screen uses. The
                    screens themselves only emit `.wb-*` primitives, which
                    carry no outer spacing, so without this the header and the
                    panes sit flush against the rail and each other. `grid`
                    rather than `flex`: the primitives below set `flex: 1` for
                    the definite-height workbench layout, and a flex parent
                    here would resolve that to zero and clip a content-sized
                    result pane. */}
                <div className="grid gap-3 p-4">
                  <Custom key={activeId ?? toolId} />
                </div>
              </DocumentSeedContext.Provider>
            </DocumentContext.Provider>
          </Suspense>
        </ToolErrorBoundary>
      </main>
    );
  }

  // Regular tool components
  if (!Component) return <LoadingFallback />;
  return (
    <main id="wb-main" tabIndex={-1} className="wb-scroll flex-1 overflow-y-auto min-h-0">
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
