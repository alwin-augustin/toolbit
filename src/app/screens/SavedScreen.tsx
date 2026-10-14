import { useState } from 'react';
import { IconArrowRight, IconBookmark, IconPlayerPlay } from '@tabler/icons-react';
import { useWorkbenchMemory, type SavedKind } from '@/shared/workbench-memory';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { Button } from '@/components/ui/button';

const KINDS: SavedKind[] = ['Sessions', 'Examples', 'Snippets'];

const DESCRIPTIONS: Record<SavedKind, string> = {
  Sessions: 'Reopen a tool with its input, result, and options.',
  Examples: 'Run a runnable example.',
  Snippets: 'Reuse a piece of data in a new task.',
};

/**
 * Saved.
 *
 * Three kinds of kept work, one list at a time. The kind switcher is a
 * segmented control rather than tabs because the list below is the same shape
 * in every case — only its contents change.
 */
export function SavedScreen() {
  const [kind, setKind] = useState<SavedKind>('Sessions');
  const saved = useWorkbenchMemory((s) => s.saved);
  const { restore } = useWorkbenchActions();
  const items = saved.filter((item) => item.kind === kind);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <header className="wb-page-heading">
        <h1>Saved</h1>
        <p>Keep useful work easy to find.</p>
      </header>

      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Saved kind">
        {KINDS.map((entry) => (
          <Button
            key={entry}
            type="button"
            variant={kind === entry ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={kind === entry}
            className={kind === entry ? 'text-ink' : 'text-ink-muted'}
            onClick={() => setKind(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>

      <p className="-mt-2 text-xs text-ink-faint">{DESCRIPTIONS[kind]}</p>

      <div className="wb-card">
        <div className="wb-card-head">
          <h2>
            {kind} · {items.length}
          </h2>
        </div>
        {items.length === 0 ? (
          <div className="wb-empty">
            <IconBookmark size={22} aria-hidden="true" />
            <h2>No {kind.toLowerCase()} yet</h2>
            <p>Save work from a tool and it will appear here for this session.</p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="wb-list-row"
              onClick={() => restore(item)}
            >
              {kind === 'Examples' ? (
                <IconPlayerPlay size={18} aria-hidden="true" className="shrink-0 text-ink-faint" />
              ) : (
                <IconBookmark size={18} aria-hidden="true" className="shrink-0 text-ink-faint" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{item.name}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-faint">
                  {kind === 'Examples' ? 'Runnable example' : 'Saved in this session'}
                </span>
              </span>
              <span className="wb-row-action">
                {kind === 'Examples' ? 'Run example' : 'Open'}
                <IconArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          ))
        )}
      </div>

      <p className="text-xs text-ink-faint">
        Saved work lives in memory for this session. Refreshing resets it.
      </p>
    </div>
  );
}
