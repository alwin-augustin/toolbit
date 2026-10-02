import { X } from 'lucide-react';
import { TOOLS } from '@/config/tools.config';
import type { WorkspaceTab } from './workspace-store';
export function TabStrip({
  tabs,
  activeTabId,
  onTab,
  onClose,
  onAdd,
}: {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  onTab: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="tb-tab-strip">
      <div
        role="tablist"
        aria-label="Open documents"
        style={{ display: 'flex' }}
        onKeyDown={(event) => {
          const index = tabs.findIndex((t) => t.id === activeTabId);
          const next =
            event.key === 'ArrowRight'
              ? (index + 1) % tabs.length
              : event.key === 'ArrowLeft'
                ? (index + tabs.length - 1) % tabs.length
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? tabs.length - 1
                    : null;
          if (next !== null && tabs[next]) {
            event.preventDefault();
            onTab(tabs[next].id);
            document.getElementById(`toolbit-tab-${tabs[next].id}`)?.focus();
          }
          if (event.key === 'Delete' && activeTabId) {
            event.preventDefault();
            onClose(activeTabId);
          }
        }}
      >
        {tabs.map((tab, index) => {
          const name = TOOLS.find((t) => t.id === tab.toolId)?.name || tab.toolId;
          return (
            <button
              key={tab.id}
              id={`toolbit-tab-${tab.id}`}
              role="tab"
              tabIndex={tab.id === activeTabId ? 0 : -1}
              aria-selected={tab.id === activeTabId}
              aria-controls="tool-document-panel"
              onClick={() => onTab(tab.id)}
            >
              {name} {index + 1}
              {tab.payload ? ' •' : ''}
              <span
                aria-hidden="true"
                style={{ paddingLeft: 8 }}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(tab.id);
                }}
              >
                ×
              </span>
            </button>
          );
        })}
      </div>
      <button
        title="Close current document (Delete)"
        aria-label="Close current document"
        disabled={!activeTabId}
        onClick={() => activeTabId && onClose(activeTabId)}
      >
        <X size={12} />
      </button>
      <button title="Open another tool" aria-label="New document" onClick={onAdd}>
        +
      </button>
    </div>
  );
}
