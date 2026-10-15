import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowRight, IconClock, IconCornerDownLeft, IconSearch } from '@tabler/icons-react';
import { TOOLS, RESEARCH_CATEGORIES } from '@/content/tools.config';
import { useRecentTools } from '@/core/recent-tools';
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
 * Results are ranked name-first so an exact name always wins, and the whole
 * list is drivable with ↑ ↓ ⏎ — a palette that needs the mouse is a menu.
 */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const { recents } = useRecentTools();
  const { openTool, navigate } = useWorkbenchActions();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openToolAction = useCallback(
    (tool: Pick<ToolMetadata, 'id' | 'path'>) => {
      onClose();
      if (isWorkbenchToolId(tool.id)) openTool(tool.id);
      else navigate(tool.path);
    },
    [onClose, openTool, navigate],
  );

  const browseCatalogue = useCallback(() => {
    onClose();
    navigate('/library');
  }, [onClose, navigate]);

  const trimmed = query.trim().toLowerCase();

  const items = useMemo<PaletteItem[]>(() => {
    const toolItem = (tool: ToolMetadata, group: string): PaletteItem => {
      const Icon = isWorkbenchToolId(tool.id)
        ? (specIcon(tool.id) ?? CATEGORY_ICONS[tool.researchCategory])
        : CATEGORY_ICONS[tool.researchCategory];
      return {
        key: `${group}:${tool.id}`,
        group,
        label: tool.name,
        hint: RESEARCH_CATEGORIES[tool.researchCategory].name,
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

    // Rank: name prefix, then name contains, then everything else.
    const scored = TOOLS.map((tool) => {
      const name = tool.name.toLowerCase();
      const haystack = `${name} ${tool.description.toLowerCase()} ${(tool.keywords ?? []).join(' ').toLowerCase()}`;
      let score = -1;
      if (name.startsWith(trimmed)) score = 0;
      else if (name.includes(trimmed)) score = 1;
      else if (haystack.includes(trimmed)) score = 2;
      else if (trimmed.includes(name)) score = 3;
      return { tool, score };
    })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => a.score - b.score);

    const tools = scored.map((entry) => toolItem(entry.tool, 'Tools'));

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
  }, [trimmed, recents, navigate, openToolAction, browseCatalogue, onClose]);

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
            placeholder="Search tools, or type a category…"
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
            <p className="px-4 py-10 text-center text-sm text-ink-muted">
              Nothing matches “{query.trim()}”.
            </p>
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
                    <span className="shrink-0 text-2xs text-ink-faint">{item.hint}</span>
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
