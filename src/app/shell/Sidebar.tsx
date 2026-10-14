import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconLayoutSidebar,
  IconSearch,
  IconShieldLock,
  IconSettings,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';
import { useLocation } from 'wouter';
import { TOOLS, RESEARCH_CATEGORIES, type ResearchCategory } from '@/content/tools.config';
import { useFavorites } from '@/core/favorites-store';
import { useRecentTools } from '@/core/recent-tools';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { isWorkbenchToolId } from '@/features/tools/specs';
import { Button } from '@/components/ui/button';
import {
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  TOOLS_BY_CATEGORY,
  TOOL_BY_PATH,
  TOOL_INDEX,
} from '@/app/shell/navigation';

/**
 * The Navigator.
 *
 * One panel, one job: get to any of the 42 tools in a keystroke or two. It
 * holds pinned tools, the recent trail and the full categorised tree, plus a
 * local filter for when you know the name but not the category. Global search
 * lives in the command palette; this filter narrows the tree in place.
 */
export function Sidebar({
  open,
  onNavigate,
  onCollapse,
}: {
  /** Drawer state on screens below 1024px. The shell owns the CSS. */
  open: boolean;
  onNavigate: () => void;
  /** Collapses the panel on desktop. */
  onCollapse?: () => void;
}) {
  const [path, navigate] = useLocation();
  const { openTool, navigate: navigateAction } = useWorkbenchActions();
  const { favorites, toggleFavorite } = useFavorites();
  const { recents } = useRecentTools();
  const [query, setQuery] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);

  const activeTool = TOOL_BY_PATH.get(path);
  const activeToolId = activeTool?.id ?? null;

  // Categories are closed until you need them, except the one holding the tool
  // you are actually using.
  const [expanded, setExpanded] = useState<Set<ResearchCategory>>(() => new Set());

  useEffect(() => {
    if (!activeTool) return;
    setExpanded((previous) =>
      previous.has(activeTool.researchCategory)
        ? previous
        : new Set(previous).add(activeTool.researchCategory),
    );
  }, [activeTool]);

  const go = (target: string) => {
    navigate(target);
    onNavigate();
  };

  const activate = (toolId: string) => {
    const tool = TOOL_INDEX.get(toolId);
    if (!tool) return;
    if (isWorkbenchToolId(toolId)) openTool(toolId);
    else navigateAction(tool.path);
    onNavigate();
  };

  const toggleCategory = (category: ResearchCategory) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const pinned = useMemo(
    () => favorites.map((id) => TOOL_INDEX.get(id)).filter((tool) => tool != null),
    [favorites],
  );

  const recent = useMemo(
    () => recents.map((id) => TOOL_INDEX.get(id)).filter((tool) => tool != null),
    [recents],
  );

  const trimmed = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!trimmed) return null;
    return TOOLS.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.keywords?.join(' ') ?? ''}`
        .toLowerCase()
        .includes(trimmed),
    );
  }, [trimmed]);

  return (
    <aside
      data-sidebar="true"
      data-open={open ? 'true' : 'false'}
      className="wb-panel"
      aria-label="Tool navigator"
    >
      <div className="wb-panel-head">
        <span className="wb-panel-title">Tools</span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Search tools"
            title="Search tools (⌘K)"
            onClick={() => window.dispatchEvent(new CustomEvent('wb:open-search'))}
          >
            <IconSearch size={15} />
          </Button>
          {onCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              aria-label="Collapse navigator"
              title="Collapse navigator (⌘B)"
              onClick={onCollapse}
            >
              <IconLayoutSidebar size={15} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="px-2 pt-2">
        <div className="relative">
          <IconSearch
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            ref={filterRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setQuery('');
                filterRef.current?.blur();
              }
            }}
            placeholder="Filter tools"
            aria-label="Filter tools"
            className="h-7 w-full rounded-md border border-line bg-surface pl-7 pr-2 text-xs text-ink placeholder:text-ink-faint focus-visible:border-brand"
          />
        </div>
      </div>

      <div className="wb-panel-body">
        {matches ? (
          <FilterResults matches={matches} activeToolId={activeToolId} onOpen={activate} />
        ) : (
          <>
            {pinned.length > 0 && (
              <section aria-labelledby="wb-nav-pinned">
                <h2 id="wb-nav-pinned" className="wb-nav-heading">
                  <IconStar size={12} aria-hidden="true" />
                  Pinned
                  <span className="wb-nav-count">{pinned.length}</span>
                </h2>
                {pinned.map((tool) => (
                  <ToolRow
                    key={tool.id}
                    toolId={tool.id}
                    name={tool.name}
                    active={tool.id === activeToolId}
                    favorite
                    onOpen={activate}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </section>
            )}

            {recent.length > 0 && (
              <section aria-labelledby="wb-nav-recent">
                <h2 id="wb-nav-recent" className="wb-nav-heading">
                  Recent
                  <span className="wb-nav-count">{recent.length}</span>
                </h2>
                {recent.slice(0, 5).map((tool) => (
                  <ToolRow
                    key={tool.id}
                    toolId={tool.id}
                    name={tool.name}
                    active={tool.id === activeToolId}
                    onOpen={activate}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </section>
            )}

            <nav aria-label="Tool categories" className="mt-1">
              {CATEGORY_ORDER.map((category) => {
                const tools = TOOLS_BY_CATEGORY.get(category) ?? [];
                if (tools.length === 0) return null;
                const isOpen = expanded.has(category);
                const CategoryIcon = CATEGORY_ICONS[category];
                const holdsActive = tools.some((tool) => tool.id === activeToolId);

                return (
                  <div key={category}>
                    <button
                      type="button"
                      className="wb-nav-item"
                      aria-expanded={isOpen}
                      data-active={holdsActive && !isOpen ? 'true' : undefined}
                      onClick={() => toggleCategory(category)}
                    >
                      <CategoryIcon size={15} aria-hidden="true" className="shrink-0" />
                      <span className="wb-nav-label">{RESEARCH_CATEGORIES[category].name}</span>
                      <span className="wb-nav-count">{tools.length}</span>
                      {isOpen ? (
                        <IconChevronDown size={13} aria-hidden="true" className="shrink-0" />
                      ) : (
                        <IconChevronRight size={13} aria-hidden="true" className="shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="wb-nav-branch">
                        {tools.map((tool) => (
                          <ToolRow
                            key={tool.id}
                            toolId={tool.id}
                            name={tool.name}
                            active={tool.id === activeToolId}
                            onOpen={activate}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </>
        )}
      </div>

      <div className="wb-panel-foot">
        <button
          type="button"
          className="wb-nav-item"
          aria-current={path === '/settings' ? 'page' : undefined}
          onClick={() => go('/settings')}
        >
          <IconSettings size={15} aria-hidden="true" />
          <span className="wb-nav-label">Settings</span>
        </button>
        <p className="mt-1.5 flex items-center gap-1.5 px-2 text-2xs text-ink-faint">
          <IconShieldLock size={12} aria-hidden="true" />
          Runs locally
        </p>
      </div>
    </aside>
  );
}

function ToolRow({
  toolId,
  name,
  active,
  favorite,
  onOpen,
  onToggleFavorite,
}: {
  toolId: string;
  name: string;
  active: boolean;
  favorite?: boolean;
  onOpen: (toolId: string) => void;
  onToggleFavorite: (toolId: string) => void;
}) {
  return (
    <div className="group/row relative">
      <button
        type="button"
        className="wb-nav-item pr-7"
        aria-current={active ? 'page' : undefined}
        onClick={() => onOpen(toolId)}
      >
        <span className="wb-nav-label">{name}</span>
      </button>
      <button
        type="button"
        aria-label={favorite ? `Unpin ${name}` : `Pin ${name}`}
        title={favorite ? 'Unpin' : 'Pin to top'}
        className="absolute right-1 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-sm text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover/row:opacity-100 focus-visible:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(toolId);
        }}
      >
        {favorite ? <IconStarFilled size={12} /> : <IconStar size={12} />}
      </button>
    </div>
  );
}

function FilterResults({
  matches,
  activeToolId,
  onOpen,
}: {
  matches: typeof TOOLS;
  activeToolId: string | null;
  onOpen: (toolId: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-xs text-ink-muted">No tool matches that filter.</p>
    );
  }
  return (
    <div>
      <h2 className="wb-nav-heading">
        Matches
        <span className="wb-nav-count">{matches.length}</span>
      </h2>
      {matches.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className="wb-nav-item"
          aria-current={tool.id === activeToolId ? 'page' : undefined}
          onClick={() => onOpen(tool.id)}
        >
          <span className="wb-nav-label">{tool.name}</span>
        </button>
      ))}
    </div>
  );
}
