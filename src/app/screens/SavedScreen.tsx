import { useState } from 'react';
import { IconArrowRight, IconBookmark, IconPlayerPlay } from '@tabler/icons-react';
import { useWorkbenchMemory, type SavedKind } from '@/shared/workbench-memory';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const KINDS: SavedKind[] = ['Sessions', 'Examples', 'Snippets'];

const DESCRIPTIONS: Record<SavedKind, string> = {
  Sessions: 'Reopen a tool with its input, result, and options.',
  Examples: 'Run a runnable example.',
  Snippets: 'Reuse a piece of data in a new task.',
};

export function SavedScreen() {
  const [tab, setTab] = useState<SavedKind>('Sessions');
  const saved = useWorkbenchMemory((s) => s.saved);
  const { restore } = useWorkbenchActions();
  const items = saved.filter((s) => s.kind === tab);

  return (
    <>
      <div className="wb-page-heading">
        <h1>Saved</h1>
        <p>Keep useful work easy to find.</p>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as SavedKind)}>
        <TabsList>
          {KINDS.map((kind) => (
            <TabsTrigger key={kind} value={kind}>
              {kind}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="wb-section-description">{DESCRIPTIONS[tab]}</p>
      {items.length === 0 ? (
        <div className="wb-empty">
          <h2>No {tab.toLowerCase()} yet</h2>
          <p>Save work from a Tool to find it here.</p>
        </div>
      ) : null}
      {items.map((item) => (
        <button key={item.id} type="button" className="wb-list-row" onClick={() => restore(item)}>
          {tab === 'Examples' ? (
            <IconPlayerPlay size={26} aria-hidden="true" />
          ) : (
            <IconBookmark size={26} aria-hidden="true" />
          )}
          <span>
            <strong>{item.name}</strong>
            <small>
              {tab === 'Examples' ? item.name : item.example ? 'Example' : 'Saved in this session'}
            </small>
          </span>
          <span className="wb-row-action">
            {tab === 'Examples' ? 'Run example' : 'Open'}
            <IconArrowRight size={20} aria-hidden="true" />
          </span>
        </button>
      ))}
      <p className="wb-preview-note">
        Saved items stay in memory for this session. Refreshing resets them.
      </p>
    </>
  );
}
