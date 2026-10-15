import { useMemo, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { taskClusters } from '@/core/capability-graph';
import { TOOL_INDEX } from '@/app/shell/navigation';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { Button } from '@/components/ui/button';

/**
 * Task-shaped entry points.
 *
 * Four clusters grouped around what a user is trying to do — inspect API data,
 * convert formats, validate configuration, generate test data — instead of how
 * tools are implemented. Collapsed cards show a preview of their tools;
 * expanding reveals all of them, each one click from opening. The data comes
 * from the capability graph (`content/tool-capabilities.ts`).
 */
export function TaskClusters() {
  const clusters = useMemo(() => taskClusters(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { activateExistingOrOpen } = useWorkbenchActions();

  return (
    <section aria-labelledby="wb-home-tasks">
      <h2 id="wb-home-tasks" className="wb-caps mb-2">
        Common tasks
      </h2>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {clusters.map((cluster) => {
          const expanded = expandedId === cluster.id;
          const tools = cluster.toolIds
            .map((id) => TOOL_INDEX.get(id))
            .filter((tool) => tool != null);
          return (
            <div key={cluster.id} className="rounded-lg border border-line bg-surface">
              <button
                type="button"
                aria-expanded={expanded}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-state-hover"
                onClick={() => setExpandedId(expanded ? null : cluster.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{cluster.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">
                    {tools
                      .slice(0, 3)
                      .map((tool) => tool.name)
                      .join(' · ')}
                    {tools.length > 3 ? ` · +${tools.length - 3}` : ''}
                  </span>
                </span>
                <IconChevronDown
                  size={15}
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 text-ink-faint transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expanded && (
                <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2.5">
                  {tools.map((tool) => (
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
