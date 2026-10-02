import { copyText } from '@/lib/clipboard';
import { parseWorkspace, workspaceSnapshot } from '@/lib/workspace-schema';
import { useWorkspace } from './workspace-store';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Badge, Button, IconButton } from '@/ds/components';
import { TOOLS } from '@/config/tools.config';
import { deleteSnippet, listSnippets, saveSnippet, type Snippet } from '@/lib/snippet-db';
import { deleteWorkspace, listWorkspaces, saveWorkspace, type Workspace } from '@/lib/workspace-db';
import { getFavoriteTools, writeFavoriteIds } from './favorites';
import type { PipelineStep } from '@/hooks/use-tool-pipe';
import type { WorkspaceTab } from './workspace-store';
import { useFocusTrap } from './use-focus-trap';
import { isPostHogEnabled, posthog } from '@/lib/posthog';

type PanelKind = 'workspaces' | 'snippets' | 'favorites';

const fieldStyle = {
  width: '100%',
  minHeight: 32,
  padding: '0 9px',
  border: '1px solid hsl(var(--border-strong))',
  borderRadius: 'var(--radius-md)',
  background: 'hsl(var(--surface-0))',
  color: 'hsl(var(--text-strong))',
  font: 'var(--text-sm) var(--font-sans)',
};

function preview(text: string, max = 110) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

interface PhaseTwoPanelsProps {
  panel: PanelKind | null;
  onClose: () => void;
  onLoadWorkspace: (workspace: Workspace) => void;
  tabs: WorkspaceTab[];
  pipeline: PipelineStep[];
  favoriteIds: string[];
  onFavoritesChange: (ids: string[]) => void;
}

export function PhaseTwoPanels({
  panel,
  onClose,
  onLoadWorkspace,
  tabs,
  pipeline,
  favoriteIds,
  onFavoritesChange,
}: PhaseTwoPanelsProps) {
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(Boolean(panel), panelRef, onClose);
  if (!panel) return null;
  const title =
    panel === 'workspaces' ? 'Workspaces' : panel === 'snippets' ? 'Snippets' : 'Favorites';
  return (
    <div className="tb-phase-scrim" onClick={onClose}>
      <aside
        ref={panelRef}
        className="tb-phase-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="phase-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="tb-phase-panel-header">
          <div>
            <span className="tb-eyebrow">Your library</span>
            <h2 id="phase-panel-title">{title}</h2>
          </div>
          <IconButton title="Close" onClick={onClose}>
            <X size={15} />
          </IconButton>
        </header>
        {panel === 'workspaces' && (
          <WorkspacePanel tabs={tabs} pipeline={pipeline} onLoad={onLoadWorkspace} />
        )}
        {panel === 'snippets' && <SnippetPanel />}
        {panel === 'favorites' && (
          <FavoritesPanel favoriteIds={favoriteIds} onChange={onFavoritesChange} />
        )}
      </aside>
    </div>
  );
}

function WorkspacePanel({
  tabs,
  pipeline,
  onLoad,
}: {
  tabs: WorkspaceTab[];
  pipeline: PipelineStep[];
  onLoad: (workspace: Workspace) => void;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [includeData, setIncludeData] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () =>
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]));
  useEffect(() => {
    refresh();
  }, []);

  const createWorkspace = async () => {
    const state = useWorkspace.getState();
    if (!state.tabs.length) return;
    try {
      await saveWorkspace(
        workspaceSnapshot(
          name,
          state.tabs,
          state.activeTabId,
          { density: state.density, inspectorOpen: state.inspectorOpen },
          includeData,
        ),
      );
      setMessage('Workspace saved locally.');
    } catch {
      setMessage('Workspace could not be saved. Storage may be unavailable.');
      return;
    }
    setName('');
    refresh();
  };

  const rename = async (workspace: Workspace) => {
    const next = editingName.trim();
    if (!next) return;
    try {
      await saveWorkspace({ ...workspace, name: next });
    } catch {
      setMessage('Workspace could not be renamed. Storage may be unavailable.');
      return;
    }
    setEditingId(null);
    refresh();
  };

  const exportWorkspace = (workspace: Workspace) => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${workspace.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importWorkspace = async (file: File) => {
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Workspace is too large (maximum 2 MB).');
      const parsed = parseWorkspace(await file.text());
      await saveWorkspace({
        ...parsed,
        id: crypto.randomUUID(),
        name: parsed.name || 'Imported workspace',
        createdAt: Date.now(),
      });
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace import failed.');
    }
  };

  return (
    <div className="tb-phase-panel-body">
      <p className="tb-phase-help">
        Save documents and settings locally. Data is excluded unless you explicitly include it;
        secret tool payloads are always excluded.
      </p>
      <div className="tb-phase-form">
        <input
          aria-label="Workspace name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Workspace name"
          style={fieldStyle}
        />
        <Button
          size="sm"
          iconLeft={<Plus size={13} />}
          onClick={createWorkspace}
          disabled={!tabs.length && !pipeline.length}
        >
          Save current
        </Button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={includeData}
          onChange={(e) => setIncludeData(e.target.checked)}
        />{' '}
        Include data in this workspace
      </label>
      <p role="status">{message}</p>
      <div className="tb-phase-toolbar">
        <span className="tb-muted-label">Saved workspaces</span>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importWorkspace(file);
              event.target.value = '';
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<Upload size={13} />}
            onClick={() => fileRef.current?.click()}
          >
            Import
          </Button>
        </div>
      </div>
      <div className="tb-phase-list">
        {workspaces.length === 0 && <div className="tb-empty-state">No saved workspaces yet.</div>}
        {workspaces.map((workspace) => (
          <div className="tb-phase-list-row" key={workspace.id}>
            <FolderOpen size={15} className="tb-phase-list-icon" />
            <div className="tb-phase-list-copy">
              {editingId === workspace.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') rename(workspace);
                  }}
                  style={{ ...fieldStyle, minHeight: 26 }}
                />
              ) : (
                <strong>{workspace.name}</strong>
              )}
              <small>{workspace.tools.length} tools</small>
            </div>
            <div className="tb-phase-row-actions">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  try {
                    onLoad(workspace);
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : 'Workspace could not be opened.',
                    );
                  }
                }}
              >
                Open
              </Button>
              <IconButton
                size="sm"
                title="Rename workspace"
                onClick={() => {
                  setEditingId(workspace.id);
                  setEditingName(workspace.name);
                }}
              >
                <FileText size={13} />
              </IconButton>
              <IconButton
                size="sm"
                title="Export workspace"
                onClick={() => exportWorkspace(workspace)}
              >
                <Download size={13} />
              </IconButton>
              <IconButton
                size="sm"
                title="Delete workspace"
                onClick={async () => {
                  try {
                    await deleteWorkspace(workspace.id);
                    refresh();
                  } catch {
                    setMessage('Workspace could not be deleted. Storage may be unavailable.');
                  }
                }}
              >
                <Trash2 size={13} />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnippetPanel() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const refresh = () =>
    listSnippets()
      .then(setSnippets)
      .catch(() => setSnippets([]));
  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    if (!content.trim()) return;
    await saveSnippet({
      id: crypto.randomUUID(),
      name: name.trim() || 'Snippet',
      content,
      createdAt: Date.now(),
    });
    if (isPostHogEnabled) {
      posthog.capture('snippet_saved');
    }
    setName('');
    setContent('');
    refresh();
  };

  return (
    <div className="tb-phase-panel-body">
      <p className="tb-phase-help">Keep reusable inputs and outputs beside your daily tools.</p>
      <div className="tb-phase-form vertical">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Snippet name"
          style={fieldStyle}
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Paste snippet content"
          style={{
            ...fieldStyle,
            height: 110,
            padding: 9,
            resize: 'vertical',
            fontFamily: 'var(--font-mono)',
          }}
        />
        <Button size="sm" iconLeft={<Save size={13} />} onClick={create} disabled={!content.trim()}>
          Save snippet
        </Button>
      </div>
      <div className="tb-phase-toolbar">
        <span className="tb-muted-label">Saved snippets</span>
        <Badge>{snippets.length}</Badge>
      </div>
      <div className="tb-phase-list">
        {snippets.length === 0 && <div className="tb-empty-state">No snippets yet.</div>}
        {snippets.map((snippet) => (
          <div className="tb-phase-card" key={snippet.id}>
            <div className="tb-phase-card-title">
              <strong>{snippet.name}</strong>
              <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
            </div>
            <p>{preview(snippet.content)}</p>
            <div className="tb-phase-row-actions">
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<Copy size={13} />}
                onClick={() => copyText(snippet.content)}
              >
                Copy
              </Button>
              <IconButton
                size="sm"
                title="Delete snippet"
                onClick={async () => {
                  await deleteSnippet(snippet.id);
                  refresh();
                }}
              >
                <Trash2 size={13} />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FavoritesPanel({
  favoriteIds,
  onChange,
}: {
  favoriteIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const favorites = getFavoriteTools(favoriteIds);
  const available = useMemo(
    () =>
      TOOLS.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query.toLowerCase()) && !favoriteIds.includes(tool.id),
      ).slice(0, 10),
    [favoriteIds, query],
  );

  const update = (ids: string[]) => {
    writeFavoriteIds(ids);
    onChange(ids);
  };

  const move = (index: number, delta: number) => {
    const next = [...favoriteIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  return (
    <div className="tb-phase-panel-body">
      <p className="tb-phase-help">
        Choose the tools shown in Favorites. The first three receive keyboard shortcuts ⌘1–⌘3.
      </p>
      <div className="tb-phase-form">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Add a tool"
          style={fieldStyle}
        />
      </div>
      {query && (
        <div className="tb-phase-list compact">
          {available.map((tool) => (
            <button
              className="tb-phase-add-row"
              type="button"
              key={tool.id}
              onClick={() => update([...favoriteIds, tool.id])}
            >
              <Plus size={14} />
              {tool.name}
              <span>{tool.description}</span>
            </button>
          ))}
        </div>
      )}
      <div className="tb-phase-toolbar">
        <span className="tb-muted-label">Pinned tools</span>
        <Badge>{favorites.length}</Badge>
      </div>
      <div className="tb-phase-list">
        {favorites.length === 0 && <div className="tb-empty-state">No favorites pinned.</div>}
        {favorites.map((favorite, index) => (
          <div className="tb-phase-list-row" key={favorite.id}>
            <span className="tb-phase-order">{index + 1}</span>
            <div className="tb-phase-list-copy">
              <strong>{favorite.label}</strong>
              <small>{favorite.shortcut}</small>
            </div>
            <div className="tb-phase-row-actions">
              <IconButton
                size="sm"
                title="Move up"
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                <ArrowUp size={13} />
              </IconButton>
              <IconButton
                size="sm"
                title="Move down"
                onClick={() => move(index, 1)}
                disabled={index === favorites.length - 1}
              >
                <ArrowDown size={13} />
              </IconButton>
              <IconButton
                size="sm"
                title="Unpin favorite"
                onClick={() => update(favoriteIds.filter((id) => id !== favorite.id))}
              >
                <X size={13} />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
