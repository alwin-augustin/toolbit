import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowRight, IconClock, IconCornerDownLeft, IconSearch } from '@tabler/icons-react';
import { TOOLS, RESEARCH_CATEGORIES } from '@/content/tools.config';
import { resolveIntent } from '@/core/intent/resolver';
import { useRecentTools } from '@/core/recent-tools';
import { track } from '@/core/telemetry';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { isWorkbenchToolId, specIcon } from '@/features/tools/specs';
import { CATEGORY_ICONS, CATEGORY_ORDER, DESTINATIONS, TOOL_INDEX } from '@/app/shell/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import type { ToolMetadata } from '@/content/tools.config';

interface PaletteItem {
  key: string;
  group: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  run: () => void;
}

/**
 * Command palette.
 *
 * The fastest path in the product: one keystroke from anywhere, then type.
 * Queries match by name *and* by task — "make json readable" finds the JSON
 * formatter — with each result carrying the reason it is shown. Name matches
 * still rank first, and the whole list is drivable with ↑ ↓ ⏎ — a palette that
 * needs the mouse is a menu.
 */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const { recents } = useRecentTools();
  const { openTool, navigate } = useWorkbenchActions();
  const listRef = useRef<HTMLDivElement>(null);
  const reportedQueries = useRef(new Set<string>());

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = query.trim().toLowerCase();

  const resolution = useMemo(
    () => (trimmed ? resolveIntent(trimmed, { limit: 8 }) : null),
    [trimmed],
  );

  const openToolAction = useCallback(
    (tool: Pick<ToolMetadata, 'id' | 'path'>) => {
      onClose();
      if (resolution && trimmed.length >= 2) {
        track('discovery_suggestion_accepted', {
          tool_id: tool.id,
          discovery_source: 'palette',
          resolved_by: resolution.resolvedBy,
        });
      }
      if (isWorkbenchToolId(tool.id)) openTool(tool.id);
      else navigate(tool.path);
    },
    [onClose, openTool, navigate, resolution, trimmed],
  );

  // One `discovery_query` per distinct query the user actually types.
  useEffect(() => {
    if (trimmed.length < 2 || reportedQueries.current.has(trimmed)) return;
    const handle = setTimeout(() => {
      if (reportedQueries.current.has(trimmed)) return;
      reportedQueries.current.add(trimmed);
      const count = resolution?.suggestions.length ?? 0;
      track('discovery_query', {
        discovery_source: 'palette',
        resolved_by: resolution?.resolvedBy ?? 'none',
        result_count_bucket: count === 0 ? 'none' : count <= 3 ? 'few' : 'many',
      });
    }, 600);
    return () => clearTimeout(handle);
  }, [trimmed, resolution]);

  const browseCatalogue = useCallback(() => {
    onClose();
    navigate('/library');
  }, [onClose, navigate]);

  const items = useMemo<PaletteItem[]>(() => {
    const toolItem = (tool: ToolMetadata, group: string, hint?: string): PaletteItem => {
      const Icon = isWorkbenchToolId(tool.id)
        ? (specIcon(tool.id) ?? CATEGORY_ICONS[tool.researchCategory])
        : CATEGORY_ICONS[tool.researchCategory];
      return {
        key: `${group}:${tool.id}`,
        group,
        label: tool.name,
        hint: hint ?? RESEARCH_CATEGORIES[tool.researchCategory].name,
        icon: Icon,
        run: () => openToolAction(tool),
      };
    };

    if (!trimmed) {
      const recent = recents
        .map((id) => TOOL_INDEX.get(id))
        .filter((tool): tool is ToolMetadata => tool != null)
        .slice(0, 4)
        .map((tool) => toolItem(tool, 'Recent'));

      const go = DESTINATIONS.map<PaletteItem>((destination) => ({
        key: `go:${destination.id}`,
        group: 'Go to',
        label: destination.label,
        hint: destination.href,
        icon: destination.icon,
        run: () => {
          onClose();
          navigate(destination.href);
        },
      }));

      const suggested = TOOLS.slice(0, 5).map((tool) => toolItem(tool, 'Suggested'));

      return [...recent, ...go, ...suggested];
    }

    const tools = (resolution?.suggestions ?? [])
      .map((suggestion) => {
        const tool = TOOL_INDEX.get(suggestion.toolId);
        if (!tool) return null;
        return toolItem(tool, 'Tools', suggestion.reasons[0]);
      })
      .filter((item): item is PaletteItem => item != null);

    const categories = CATEGORY_ORDER.filter((category) =>
      RESEARCH_CATEGORIES[category].name.toLowerCase().includes(trimmed),
    ).map<PaletteItem>((category) => ({
      key: `category:${category}`,
      group: 'Categories',
      label: RESEARCH_CATEGORIES[category].name,
      hint: 'Browse',
      icon: CATEGORY_ICONS[category],
      run: browseCatalogue,
    }));

    return [...tools, ...categories];
  }, [trimmed, resolution, recents, navigate, openToolAction, browseCatalogue, onClose]);

  // A fresh result set always starts at the top.
  useEffect(() => {
    setCursor(0);
  }, [trimmed]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const move = (delta: number) => {
    setCursor((current) => {
      if (items.length === 0) return 0;
      return (current + delta + items.length) % items.length;
    });
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setCursor(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setCursor(Math.max(0, items.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[cursor]?.run();
    }
  };

  // Group headers are rendered in order without repeating.
  const groups: Array<{ name: string; items: Array<{ item: PaletteItem; index: number }> }> = [];
  items.forEach((item, index) => {
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) last.items.push({ item, index });
    else groups.push({ name: item.group, items: [{ item, index }] });
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="top-[14%] max-h-[70dvh] translate-y-0 gap-0 overflow-hidden p-0"
      >
        {/* The palette has no visible title, and an unnamed dialog is announced
            as just "dialog". This names it with the words the search field is
            already labelled with, which the primitive wires to aria-labelledby. */}
        <DialogTitle className="sr-only">Search tools</DialogTitle>
        <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
          <IconSearch size={17} aria-hidden="true" className="text-ink-faint" />
          <input
            autoFocus
            type="text"
            aria-label="Search tools"
            placeholder="Search tools, or describe a task…"
            className="flex-1 bg-transparent text-md text-ink outline-none placeholder:text-ink-faint"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <Kbd className="h-4 text-2xs">esc</Kbd>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {items.length === 0
            ? 'No results'
            : `${items.length} ${items.length === 1 ? 'result' : 'results'}`}
        </p>

        <div ref={listRef} className="tb-scroll max-h-[52dvh] overflow-y-auto py-1.5">
          {items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-ink-muted">Nothing matches “{query.trim()}”.</p>
              <p className="mt-1 text-xs text-ink-faint">
                Try the task instead of the name — “make json readable”.
              </p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.name}>
              <div className="wb-caps px-3.5 pb-1 pt-2.5">{group.name}</div>
              {group.items.map(({ item, index }) => {
                const Icon = item.icon;
                const selected = index === cursor;
                return (
                  <button
                    key={item.key}
                    data-index={index}
                    type="button"
                    aria-current={selected ? 'true' : undefined}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
                      selected ? 'bg-state-selected text-state-selected-ink' : 'text-ink'
                    }`}
                    onMouseMove={() => setCursor(index)}
                    onClick={() => item.run()}
                  >
                    <Icon size={16} className="shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {group.name === 'Recent' && (
                      <IconClock size={12} aria-hidden="true" className="text-ink-faint" />
                    )}
                    <span className="max-w-[46%] shrink-0 truncate text-2xs text-ink-faint">
                      {item.hint}
                    </span>
                    {selected && (
                      <IconArrowRight size={13} aria-hidden="true" className="shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-sunken px-3.5 py-2 text-2xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <Kbd className="h-4 text-2xs">↑</Kbd>
            <Kbd className="h-4 text-2xs">↓</Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <IconCornerDownLeft size={12} aria-hidden="true" />
            open
          </span>
          <span className="ml-auto">Everything runs locally</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
