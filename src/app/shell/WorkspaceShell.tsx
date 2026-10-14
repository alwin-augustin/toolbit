import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { IconCircleCheck } from '@tabler/icons-react';
import { useLocation } from 'wouter';
import { NavRail } from '@/app/shell/NavRail';
import { Sidebar } from '@/app/shell/Sidebar';
import { Topbar } from '@/app/shell/Topbar';
import { SearchDialog } from '@/app/shell/SearchDialog';
import { TabBar } from '@/app/shell/TabBar';
import { sectionForPath } from '@/app/shell/navigation';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { useWorkspace } from '@/shared/workspace-store';
import { toolPath } from '@/shared/workbench-actions';
import { applyTheme } from '@/shared/theme';

const PANEL_KEY = 'toolbit:panel';

function readPanelOpen(): boolean {
  try {
    return window.localStorage.getItem(PANEL_KEY) !== 'collapsed';
  } catch {
    return true;
  }
}

/**
 * The application frame.
 *
 * Three columns: the rail (always), the navigator panel (desktop, collapsible)
 * and the workspace. Below 1024px the panel becomes a drawer over the
 * workspace and the rail stays put, so navigation never disappears.
 *
 * The panel is also the ONLY piece of layout state that persists — it is a
 * workspace preference, not document content.
 */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [path, navigate] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(readPanelOpen);
  const [searchOpen, setSearchOpen] = useState(false);

  const toast = useWorkbenchMemory((s) => s.toast);
  const clearToast = useWorkbenchMemory((s) => s.clearToast);

  const section = sectionForPath(path);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const setPanel = useCallback((next: boolean) => {
    setPanelOpen(next);
    try {
      window.localStorage.setItem(PANEL_KEY, next ? 'open' : 'collapsed');
    } catch {
      /* preference is best-effort */
    }
  }, []);

  // The panel is the first thing to go when the viewport gets tight: on
  // desktop collapse it, below 1024px close the drawer.
  const togglePanel = useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) setPanel(!panelOpen);
    else setDrawerOpen((open) => !open);
  }, [panelOpen, setPanel]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  // The palette is opened from controls that sit outside this component — the
  // sidebar, the tab strip, the start screen and, installed, the native menu —
  // so they signal it on the window rather than threading a callback through
  // the tree.
  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener('wb:open-search', open);
    return () => window.removeEventListener('wb:open-search', open);
  }, []);

  // Leave the drawer behind whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  useLayoutEffect(() => {
    applyTheme();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.key === 'Escape') {
        setDrawerOpen(false);
        setSearchOpen(false);
        return;
      }

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (meta && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        togglePanel();
        return;
      }

      // ⌘1-9 jumps to the nth open document, matching the tab strip order.
      if (meta && /^[1-9]$/.test(event.key)) {
        const tabs = useWorkspace.getState().tabs;
        const tab = tabs[Number(event.key) - 1];
        if (!tab) return;
        event.preventDefault();
        useWorkspace.getState().setActiveTab(tab.id);
        navigate(toolPath(tab.toolId));
        return;
      }

      // ⌥W closes the active document.
      if (event.altKey && event.key.toLowerCase() === 'w') {
        const activeId = useWorkspace.getState().activeTabId;
        if (!activeId) return;
        event.preventDefault();
        const { closeTab, tabs } = useWorkspace.getState();
        closeTab(activeId);
        if (tabs.length <= 1) navigate('/');
        return;
      }

      if (typing) return;

      // Single-key shortcuts, only when nothing is focused.
      if (event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, togglePanel]);

  return (
    <div
      className="wb-shell"
      data-panel={panelOpen ? 'open' : 'collapsed'}
      data-drawer={drawerOpen ? 'open' : 'closed'}
    >
      <a className="wb-skip-link" href="#wb-main">
        Skip to workspace
      </a>

      {drawerOpen && (
        <button
          type="button"
          className="wb-backdrop"
          aria-label="Close navigator"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <NavRail
        section={section}
        onNavigate={() => setDrawerOpen(false)}
        onRevealPanel={() => (panelOpen ? undefined : setPanel(true))}
      />

      <Sidebar
        open={drawerOpen}
        onNavigate={() => setDrawerOpen(false)}
        onCollapse={() => setPanel(false)}
      />

      <div className="wb-main-shell" inert={drawerOpen || undefined}>
        <Topbar
          section={section}
          path={path}
          panelOpen={panelOpen}
          onSearch={openSearch}
          onTogglePanel={togglePanel}
          onOpenNavigation={() => setDrawerOpen(true)}
        />
        <TabBar />
        {children}
      </div>

      {searchOpen && <SearchDialog onClose={closeSearch} />}

      <div className={`wb-toast${toast ? ' visible' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <IconCircleCheck size={16} className="wb-toast-icon" aria-hidden="true" />
            {toast}
          </>
        )}
      </div>
    </div>
  );
}
