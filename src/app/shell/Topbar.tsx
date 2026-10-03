import { useMemo } from 'react';
import { IconMenu2, IconMoon, IconPlus, IconSearch, IconSun, IconX } from '@tabler/icons-react';
import { Link, useLocation } from 'wouter';
import { TOOLS } from '@/content/tools.config';
import { useWorkspace } from '@/shared/workspace-store';
import { specIcon, specTitle } from '@/features/tools/specs';
import { setTheme, useResolvedTheme } from '@/shared/theme';

export function Topbar({ onSearch, onMenu }: { onSearch: () => void; onMenu: () => void }) {
  const [path, navigate] = useLocation();
  const tabs = useWorkspace((s) => s.tabs);
  const activeTabId = useWorkspace((s) => s.activeTabId);
  const setActiveTab = useWorkspace((s) => s.setActiveTab);
  const closeTab = useWorkspace((s) => s.closeTab);
  const resolved = useResolvedTheme();
  const onToolRoute =
    path !== '/' && !['/library', '/saved', '/history', '/settings'].includes(path);

  const toolMeta = useMemo(() => new Map(TOOLS.map((t) => [t.id, t])), []);
  const tabTitle = (toolId: string) =>
    specTitle(toolId, toolMeta.get(toolId)?.name ?? toolId);

  const closeDoc = (id: string) => {
    const remaining = useWorkspace.getState().tabs.filter((t) => t.id !== id);
    const nextTool = closeTab(id);
    if (!remaining.length) {
      navigate('/');
      return;
    }
    if (nextTool) {
      const target = toolMeta.get(nextTool)?.path;
      if (target) navigate(target);
    }
  };

  return (
    <header className="wb-topbar">
      <div className="wb-search-row">
        <button
          type="button"
          className="wb-button wb-icon-button wb-mobile-menu"
          aria-label="Open navigation"
          onClick={onMenu}
        >
          <IconMenu2 size={22} />
        </button>
        <button type="button" className="wb-search-trigger" onClick={onSearch}>
          <IconSearch size={25} stroke={1.7} aria-hidden="true" />
          <span>Search tools or actions...</span>
          <kbd>{typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <button
          type="button"
          className="wb-button wb-icon-button wb-theme-toggle"
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
        >
          {resolved === 'dark' ? <IconSun size={22} /> : <IconMoon size={22} />}
        </button>
      </div>
      <div className="wb-doc-tabs-row">
        <div className="wb-document-tabs" role="group" aria-label="Open documents">
          {tabs.map((doc) => {
            const ToolIcon = specIcon(doc.toolId) ?? IconSearch;
            const label = (
              (doc.payload as { label?: string } | undefined)?.label || tabTitle(doc.toolId)
            ).toString();
            const toolPath = toolMeta.get(doc.toolId)?.path ?? '/';
            return (
              <div
                key={doc.id}
                className={`wb-doc-tab${onToolRoute && doc.id === activeTabId ? ' active' : ''}`}
              >
                <Link
                  href={toolPath}
                  aria-current={onToolRoute && doc.id === activeTabId ? 'page' : undefined}
                  onClick={() => setActiveTab(doc.id)}
                  className="wb-doc-tab-link"
                >
                  <ToolIcon size={24} stroke={1.8} aria-hidden="true" />
                  {label}
                </Link>
                <button
                  type="button"
                  aria-label={`Close ${label} document`}
                  onClick={() => closeDoc(doc.id)}
                >
                  <IconX size={18} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="wb-new-tab"
          aria-label="Open another tool"
          onClick={onSearch}
        >
          <IconPlus size={24} />
        </button>
      </div>
    </header>
  );
}
