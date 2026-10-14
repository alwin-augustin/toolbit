import { useEffect, useRef } from 'react';
import { IconPlus, IconX } from '@tabler/icons-react';
import { useLocation } from 'wouter';
import { TOOLS } from '@/content/tools.config';
import { useWorkspace, type WorkspaceTab } from '@/shared/workspace-store';
import { toolPath } from '@/shared/workbench-actions';
import { specIcon, specTitle, isWorkbenchToolId, readDoc } from '@/features/tools/specs';

function resolveTabTitle(tab: WorkspaceTab): string {
  if (isWorkbenchToolId(tab.toolId)) return specTitle(tab.toolId, tab.toolId);
  return TOOLS.find((tool) => tool.id === tab.toolId)?.name ?? tab.toolId;
}

function isDirty(tab: WorkspaceTab): boolean {
  if (!isWorkbenchToolId(tab.toolId)) return false;
  return readDoc(tab).dirty;
}

/**
 * Document strip.
 *
 * One row, scrollable, no chrome that competes with the work. Tabs are the
 * only place a document's identity lives, so this is also the fastest way to
 * move between open work: ⌘1-9 jumps, ⌥W closes, arrows step through.
 */
export function TabBar() {
  const tabs = useWorkspace((s) => s.tabs);
  const activeTabId = useWorkspace((s) => s.activeTabId);
  const setActiveTab = useWorkspace((s) => s.setActiveTab);
  const closeTab = useWorkspace((s) => s.closeTab);
  const [, navigate] = useLocation();
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the active tab visible when it changes from a shortcut or the palette.
  useEffect(() => {
    if (!activeTabId) return;
    const node = stripRef.current?.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`);
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTabId, tabs.length]);

  // Nothing open: the home screen supplies its own entry points, so an empty
  // strip would only add a dead row of chrome.
  if (tabs.length === 0) return null;

  // Tabs are links: they address a document, so middle-click, copy-link and
  // "open in new tab" all behave the way a browser user expects.
  const activate = (tab: WorkspaceTab) => {
    setActiveTab(tab.id);
    navigate(toolPath(tab.toolId));
  };

  const close = (id: string) => {
    closeTab(id);
    if (useWorkspace.getState().tabs.length === 0) navigate('/');
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = tabs[index + (event.key === 'ArrowRight' ? 1 : -1)];
    if (!next) return;
    activate(next);
    requestAnimationFrame(() => {
      stripRef.current?.querySelector<HTMLElement>(`[data-tab-id="${next.id}"]`)?.focus();
    });
  };

  return (
    <div
      className="wb-tabs wb-doc-tabs-row tb-scroll-none"
      ref={stripRef}
      aria-label="Open documents"
    >
      {tabs.map((tab, index) => {
        const active = tab.id === activeTabId;
        const title = resolveTabTitle(tab);
        const Icon = isWorkbenchToolId(tab.toolId) ? specIcon(tab.toolId) : undefined;
        const dirty = isDirty(tab);

        return (
          <a
            key={tab.id}
            data-tab-id={tab.id}
            href={toolPath(tab.toolId)}
            aria-current={active ? 'page' : undefined}
            className="wb-tab"
            title={title}
            onClick={(event) => {
              event.preventDefault();
              activate(tab);
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
            onAuxClick={(event) => {
              if (event.button === 1) {
                event.preventDefault();
                close(tab.id);
              }
            }}
          >
            {Icon ? <Icon size={13} aria-hidden="true" className="shrink-0 opacity-70" /> : null}
            <span className="min-w-0 flex-1 truncate">{title}</span>
            {dirty && !active ? (
              <span
                aria-label="Unsaved changes"
                className="size-1.5 shrink-0 rounded-full bg-brand"
              />
            ) : null}
            <button
              type="button"
              className="wb-tab-close"
              aria-label={`Close ${title}`}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                close(tab.id);
              }}
            >
              <IconX size={12} />
            </button>
          </a>
        );
      })}

      <button
        type="button"
        className="grid w-8 shrink-0 place-items-center text-ink-faint transition-colors hover:bg-state-hover hover:text-ink"
        aria-label="Open a tool"
        title="Open a tool (⌘K)"
        onClick={() => window.dispatchEvent(new CustomEvent('wb:open-search'))}
      >
        <IconPlus size={14} />
      </button>
    </div>
  );
}
