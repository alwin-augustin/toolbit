import { useState } from 'react';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import { TOOLS, TOOL_CATEGORIES } from '@/content/tools.config';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { ALL_SPECS, isWorkbenchToolId } from '@/features/tools/specs';

export function ToolsScreen() {
  const [query, setQuery] = useState('');
  const { openTool, navigate } = useWorkbenchActions();
  const workbench = Object.values(ALL_SPECS).filter((tool) =>
    tool.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="wb-page-heading">
        <h1>Tools</h1>
        <p>Focused utilities for everyday development.</p>
      </div>
      <label className="wb-catalog-search">
        <IconSearch size={22} />
        <input
          aria-label="Filter tools"
          placeholder="Find a tool..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="wb-tool-grid">
        {workbench.map((tool) => {
          const ToolIcon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              className="wb-tool-tile"
              onClick={() => openTool(tool.id)}
            >
              <ToolIcon size={30} />
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <small>Runs on this device</small>
            </button>
          );
        })}
      </div>
      {!workbench.length && (
        <p className="wb-empty">No tools match. Try JSON, Base64, Timestamp, or URL.</p>
      )}
      <div className="wb-section-title-row">
        <h2>Full catalog</h2>
      </div>
      {Object.entries(TOOL_CATEGORIES).map(([categoryId, category]) => {
        const tools = TOOLS.filter(
          (t) =>
            t.category === categoryId &&
            `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()),
        );
        if (!tools.length) return null;
        return (
          <section key={categoryId} aria-label={category.name}>
            <h2 className="wb-section-title">{category.name}</h2>
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className="wb-list-row"
                onClick={() =>
                  isWorkbenchToolId(tool.id) ? openTool(tool.id) : navigate(tool.path)
                }
              >
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.description}</small>
                </span>
                <IconArrowRight size={20} />
              </button>
            ))}
          </section>
        );
      })}
      <p className="wb-preview-note">
        Saved items stay in memory for this session. Refreshing resets them.
      </p>
    </>
  );
}
