import { useMemo, useState } from 'react';
import { IconSearch, IconStar, IconStarFilled, IconX } from '@tabler/icons-react';
import { TOOLS, RESEARCH_CATEGORIES, type ResearchCategory } from '@/content/tools.config';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { useFavorites } from '@/core/favorites-store';
import { CATEGORY_ICONS, CATEGORY_ORDER, TOOLS_BY_CATEGORY } from '@/app/shell/navigation';
import { Button } from '@/components/ui/button';

type Filter = ResearchCategory | 'all' | 'pinned';

/**
 * All Tools.
 *
 * The reference view: every tool, grouped the way the navigation groups them,
 * with a filter that matches names, descriptions and keywords. Rows are dense
 * on purpose — this page is for scanning, not reading.
 */
export function ToolsScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { activateExistingOrOpen } = useWorkbenchActions();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const grouped = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const groups = new Map<ResearchCategory, typeof TOOLS>();

    for (const category of CATEGORY_ORDER) {
      const tools = (TOOLS_BY_CATEGORY.get(category) ?? []).filter((tool) => {
        if (filter === 'pinned' && !favorites.includes(tool.id)) return false;
        if (filter !== 'all' && filter !== 'pinned' && tool.researchCategory !== filter) {
          return false;
        }
        if (!trimmed) return true;
        return `${tool.name} ${tool.description} ${(tool.keywords ?? []).join(' ')}`
          .toLowerCase()
          .includes(trimmed);
      });
      if (tools.length > 0) groups.set(category, tools);
    }
    return groups;
  }, [query, filter, favorites]);

  const matchCount = [...grouped.values()].reduce((total, tools) => total + tools.length, 0);

  const filters: Array<{ id: Filter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: TOOLS.length },
    ...CATEGORY_ORDER.map<{ id: Filter; label: string; count: number }>((category) => ({
      id: category,
      label: RESEARCH_CATEGORIES[category].name,
      count: (TOOLS_BY_CATEGORY.get(category) ?? []).length,
    })),
  ];
  // Pinned is only worth a filter once something is pinned.
  if (favorites.length > 0) {
    filters.push({ id: 'pinned', label: 'Pinned', count: favorites.length });
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <header className="wb-page-heading">
        <h1>All Tools</h1>
        <p>{TOOLS.length} utilities grouped by what they work on. Everything runs in this tab.</p>
      </header>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <IconSearch
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            aria-label="Search tools"
            placeholder="Search by name, description or keyword…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-brand"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint"
              onClick={() => setQuery('')}
            >
              <IconX size={13} />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {filters.map((entry) => (
            <Button
              key={entry.id}
              type="button"
              variant={filter === entry.id ? 'secondary' : 'ghost'}
              size="sm"
              className={`gap-1.5 ${filter === entry.id ? 'text-ink' : 'text-ink-muted'}`}
              aria-pressed={filter === entry.id}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
              <span className="tb-tnum text-2xs text-ink-faint">{entry.count}</span>
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-faint" aria-live="polite">
        {matchCount} {matchCount === 1 ? 'tool' : 'tools'}
        {query ? ` matching “${query.trim()}”` : ''}
      </p>

      {/* Grouped results */}
      {matchCount === 0 ? (
        <div className="wb-empty">
          <IconSearch size={22} aria-hidden="true" />
          <h2>No tools match</h2>
          <p>Try a shorter keyword, or clear the filter to see all {TOOLS.length} tools.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {[...grouped.entries()].map(([category, tools]) => {
            const CategoryIcon = CATEGORY_ICONS[category];
            return (
              <section key={category} aria-labelledby={`wb-cat-${category}`}>
                <h2 id={`wb-cat-${category}`} className="wb-caps mb-1.5 flex items-center gap-2">
                  <CategoryIcon size={13} aria-hidden="true" />
                  {RESEARCH_CATEGORIES[category].name}
                  <span className="tb-tnum font-normal">{tools.length}</span>
                </h2>
                <div className="wb-card">
                  {tools.map((tool) => {
                    const pinned = isFavorite(tool.id);
                    return (
                      <div key={tool.id} className="group/row relative flex items-center">
                        <button
                          type="button"
                          className="wb-list-row min-w-0 flex-1 pr-9"
                          onClick={() => activateExistingOrOpen(tool.id)}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">{tool.name}</span>
                            <span className="mt-0.5 block truncate text-xs text-ink-muted">
                              {tool.description}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={pinned ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
                          className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover/row:opacity-100 focus-visible:opacity-100"
                          onClick={() => toggleFavorite(tool.id)}
                        >
                          {pinned ? <IconStarFilled size={13} /> : <IconStar size={13} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
