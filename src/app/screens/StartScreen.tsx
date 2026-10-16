import { useMemo, useState } from 'react';
import {
  IconArrowRight,
  IconCommand,
  IconLayoutGrid,
  IconPin,
  IconSearch,
  IconShieldLock,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { useLocation } from 'wouter';
import { detectPasteSuggestions, type PasteSuggestion } from '@/core/intent/detect';
import { TOOLS, RESEARCH_CATEGORIES } from '@/content/tools.config';
import { useFavorites } from '@/core/favorites-store';
import { useRecentTools } from '@/core/recent-tools';
import { useWorkspace, type WorkspaceTab } from '@/shared/workspace-store';
import { toolPath, useWorkbenchActions } from '@/shared/workbench-actions';
import {
  isWorkbenchToolId,
  ownsDocument,
  readDoc,
  specIcon,
  specTitle,
} from '@/features/tools/specs';
import {
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  TOOLS_BY_CATEGORY,
  TOOL_INDEX,
} from '@/app/shell/navigation';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { TaskClusters } from '@/app/components/TaskClusters';

const PASTE_FIELD = 'Paste data to find a tool';

function tabTitle(tab: WorkspaceTab): string {
  if (isWorkbenchToolId(tab.toolId)) return readDoc(tab).label || specTitle(tab.toolId, tab.toolId);
  return TOOL_INDEX.get(tab.toolId)?.name ?? tab.toolId;
}

/**
 * Start.
 *
 * The job of this screen is to get out of the way in under three seconds. A
 * developer arriving here usually has something in their clipboard, so the
 * largest affordance is a field that recognises what you paste and offers the
 * right tool for it — with search and browsing as the fallback, not the
 * primary path.
 */
export function StartScreen() {
  const [text, setText] = useState('');
  const [, navigate] = useLocation();
  const tabs = useWorkspace((s) => s.tabs);
  const activeTabId = useWorkspace((s) => s.activeTabId);
  const setActiveTab = useWorkspace((s) => s.setActiveTab);
  const closeTab = useWorkspace((s) => s.closeTab);
  const { openWithPayload, activateExistingOrOpen } = useWorkbenchActions();
  const { favorites } = useFavorites();
  const { recents } = useRecentTools();

  const suggestions = useMemo(() => (text.trim() ? detectPasteSuggestions(text) : []), [text]);

  const pinned = favorites.map((id) => TOOL_INDEX.get(id)).filter((tool) => tool != null);

  const recent = recents
    .map((id) => TOOL_INDEX.get(id))
    .filter((tool) => tool != null)
    .slice(0, 8);

  const openSearch = () => window.dispatchEvent(new CustomEvent('wb:open-search'));

  /** Hand the pasted payload to the suggested tool, then clear the field. */
  const runSuggestion = (suggestion: PasteSuggestion) => {
    const payload = text;
    setText('');
    // The unified handoff path: it seeds a document for tools that own one
    // (including Notes) and stages the pending paste for those that do not.
    openWithPayload(suggestion.toolId, payload);
  };

  const resume = (tab: WorkspaceTab) => {
    setActiveTab(tab.id);
    navigate(toolPath(tab.toolId));
  };

  return (
    <div className="flex flex-col gap-7 pb-10">
      <header className="wb-page-heading">
        <h1>Start</h1>
        <p>
          Paste anything — JSON, a JWT, a diff, SQL, a certificate — and Toolbit opens the tool that
          handles it. {TOOLS.length} utilities, all running in this tab.
        </p>
      </header>

      {/* Paste-first entry point ------------------------------------------- */}
      <section aria-label="Start from pasted data">
        <label className="sr-only" htmlFor="wb-paste">
          {PASTE_FIELD}
        </label>
        <div className="rounded-xl border border-line bg-surface shadow-xs transition-colors focus-within:border-brand">
          <textarea
            id="wb-paste"
            aria-label={PASTE_FIELD}
            placeholder={PASTE_FIELD}
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                if (suggestions[0]) runSuggestion(suggestions[0]);
              }
            }}
            spellCheck={false}
            className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-sm text-ink outline-none placeholder:font-sans placeholder:text-ink-faint"
          />
          <div className="flex items-center gap-2 border-t border-line px-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-ink-muted"
              onClick={openSearch}
            >
              <IconSearch size={14} />
              Search tools or actions...
              <span className="ml-0.5 flex items-center gap-0.5">
                <Kbd className="h-4 min-w-4 text-2xs">⌘</Kbd>
                <Kbd className="h-4 min-w-4 text-2xs">K</Kbd>
              </span>
            </Button>
            {text && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-ink-muted"
                onClick={() => setText('')}
              >
                <IconX size={13} />
                Clear
              </Button>
            )}
            <span className="ml-auto hidden items-center gap-1.5 text-2xs text-ink-faint sm:flex">
              <IconShieldLock size={12} aria-hidden="true" />
              Nothing leaves your browser
            </span>
          </div>
        </div>

        {/* Detection results --------------------------------------------- */}
        {suggestions.length > 0 && (
          <div className="mt-2.5" aria-live="polite">
            <p className="wb-caps mb-1.5 flex items-center gap-1.5">
              <IconSparkles size={12} aria-hidden="true" />
              {suggestions[0].reason}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => {
                const name = TOOL_INDEX.get(suggestion.toolId)?.name ?? suggestion.toolId;
                return (
                  <Button
                    key={suggestion.toolId}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    title={`Open ${name}`}
                    onClick={() => runSuggestion(suggestion)}
                  >
                    {suggestion.anchor
                      ? `Open ${name}`
                      : suggestion.reason.charAt(0).toUpperCase() + suggestion.reason.slice(1)}
                    <IconArrowRight size={13} aria-hidden="true" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Resume open work -------------------------------------------------- */}
      {tabs.length > 0 && (
        <section aria-labelledby="wb-home-continue">
          <h2 id="wb-home-continue" className="wb-caps mb-2 flex items-center gap-2">
            Continue
            <span className="font-normal normal-case tracking-normal text-ink-faint">
              {tabs.length} open
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => {
              const title = tabTitle(tab);
              const Icon = isWorkbenchToolId(tab.toolId)
                ? specIcon(tab.toolId)
                : CATEGORY_ICONS[TOOL_INDEX.get(tab.toolId)?.researchCategory ?? 'utilities'];
              return (
                <div
                  key={tab.id}
                  className={`group/card flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                    tab.id === activeTabId
                      ? 'border-brand/40 bg-brand-soft'
                      : 'border-line bg-surface hover:bg-state-hover'
                  }`}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => resume(tab)}
                  >
                    {Icon ? (
                      <Icon size={16} className="shrink-0 text-ink-muted" aria-hidden="true" />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{title}</span>
                      <span className="block truncate text-xs text-ink-faint">
                        {ownsDocument(tab.toolId) ? 'Document' : 'Tool'} ·{' '}
                        {TOOL_INDEX.get(tab.toolId)?.name ?? tab.toolId}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Close ${title}`}
                    className="grid size-6 shrink-0 place-items-center rounded-sm text-ink-faint opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover/card:opacity-100"
                    onClick={() => {
                      closeTab(tab.id);
                      if (tabs.length <= 1) navigate('/');
                    }}
                  >
                    <IconX size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pinned ----------------------------------------------------------- */}
      {pinned.length > 0 && (
        <section aria-labelledby="wb-home-pinned">
          <h2 id="wb-home-pinned" className="wb-caps mb-2 flex items-center gap-1.5">
            <IconPin size={12} aria-hidden="true" />
            Pinned
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {pinned.map((tool) => (
              <Button
                key={tool.id}
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => activateExistingOrOpen(tool.id)}
              >
                {tool.name}
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Recent ----------------------------------------------------------- */}
      {recent.length > 0 && (
        <section aria-labelledby="wb-home-recent">
          <h2 id="wb-home-recent" className="wb-caps mb-2">
            Recent
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((tool) => (
              <Button
                key={tool.id}
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-ink-muted"
                onClick={() => activateExistingOrOpen(tool.id)}
              >
                {tool.name}
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Common tasks ------------------------------------------------------ */}
      <TaskClusters />

      {/* Browse ----------------------------------------------------------- */}
      <section aria-labelledby="wb-home-browse">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="wb-home-browse" className="wb-caps">
            Browse
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-ink-muted"
            onClick={() => navigate('/library')}
          >
            <IconLayoutGrid size={13} />
            All {TOOLS.length} tools
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_ORDER.map((category) => {
            const tools = TOOLS_BY_CATEGORY.get(category) ?? [];
            if (tools.length === 0) return null;
            const Icon = CATEGORY_ICONS[category];
            return (
              <button
                key={category}
                type="button"
                className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:bg-state-hover"
                onClick={() => navigate('/library')}
              >
                <Icon size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-sm font-medium text-ink">
                      {RESEARCH_CATEGORIES[category].name}
                    </span>
                    <span className="tb-tnum text-2xs text-ink-faint">{tools.length}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">
                    {tools
                      .slice(0, 3)
                      .map((tool) => tool.name)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
        <IconCommand size={13} aria-hidden="true" />
        Press <Kbd className="h-4 text-2xs">⌘K</Kbd> anywhere to search, or{' '}
        <Kbd className="h-4 text-2xs">/</Kbd> from any screen.
      </p>
    </div>
  );
}
