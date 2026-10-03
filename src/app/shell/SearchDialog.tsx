import { useEffect, useRef, useState } from 'react';
import { IconArrowRight, IconBookmark, IconSearch, IconX } from '@tabler/icons-react';
import { TOOLS } from '@/content/tools.config';
import { openDialog, closeDialog } from '@/shared/dialog';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { isWorkbenchToolId } from '@/features/tools/specs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const saved = useWorkbenchMemory((s) => s.saved);
  const { openTool, restore, navigate } = useWorkbenchActions();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    openDialog(dialogRef.current);
  }, []);

  const q = query.toLowerCase();
  const tools = TOOLS.filter((t) =>
    `${t.name} ${t.description} ${t.keywords?.join(' ') ?? ''}`.toLowerCase().includes(q),
  );
  const savedResults = saved.filter((s) => s.name.toLowerCase().includes(q));

  const openFirstTool = () => {
    const first = tools[0];
    if (!first) return;
    onClose();
    if (isWorkbenchToolId(first.id)) openTool(first.id);
    else navigate(first.path);
  };

  return (
    <dialog
      ref={dialogRef}
      className="wb-search-dialog"
      aria-labelledby="wb-search-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeDialog(dialogRef.current);
      }}
    >
      <h2 id="wb-search-title" className="wb-sr-only">
        Search tools and saved work
      </h2>
      <div className="wb-dialog-search">
        <IconSearch size={25} />
        <Input
          autoFocus
          aria-label="Search tools and saved work"
          placeholder="Search tools or saved work..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tools.length) {
              e.preventDefault();
              openFirstTool();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="wb-icon-button"
          aria-label="Close search"
          onClick={() => closeDialog(dialogRef.current)}
        >
          <IconX size={22} />
        </Button>
      </div>
      <div className="wb-search-results">
        <p>Tools</p>
        {tools.map((tool) => (
          <Button
            key={tool.id}
            type="button"
            variant="ghost"
            className="w-full justify-between text-left h-auto"
            onClick={() => {
              onClose();
              if (isWorkbenchToolId(tool.id)) openTool(tool.id);
              else navigate(tool.path);
            }}
          >
            <span>
              <strong>{tool.name}</strong>
              <small>{tool.description}</small>
            </span>
            <IconArrowRight size={18} />
          </Button>
        ))}
        {!!savedResults.length && <p>Saved work</p>}
        {savedResults.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            className="w-full justify-between text-left h-auto"
            onClick={() => {
              onClose();
              restore(item);
            }}
          >
            <IconBookmark size={23} />
            <span>
              <strong>{item.name}</strong>
              <small>{item.kind}</small>
            </span>
            <IconArrowRight size={18} />
          </Button>
        ))}
        {!tools.length && !savedResults.length && (
          <div className="wb-empty">No matching tools or saved work.</div>
        )}
      </div>
      <footer>Enter opens the first tool · Esc closes search</footer>
    </dialog>
  );
}
