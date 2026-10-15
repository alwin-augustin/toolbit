import { useMemo } from 'react';
import { IconArrowRight } from '@tabler/icons-react';
import { capabilityReason, nextActionsFor } from '@/core/capability-graph';
import { track } from '@/core/telemetry';
import { TOOL_INDEX } from '@/app/shell/navigation';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { Button } from '@/components/ui/button';

/**
 * Next Useful Action.
 *
 * After a successful run the result chrome offers at most two follow-ups from
 * the tool's curated `related` edges — never a wall of recommendations. Each
 * action says why it is shown in the tool's own intent phrasing ("validate
 * json against a schema"), carries the current result forward as the next
 * tool's input, and reports the handoff. When no payload or no edge exists,
 * nothing renders: a fabricated next step is worse than none.
 *
 * One component serves both architectures: the generic workbench renders it
 * under the result panes (the document output is the payload), and the router
 * renders it under a custom screen (the published result is the payload).
 */
export function NextActions({
  toolId,
  payload,
  className,
}: {
  toolId: string;
  payload: string;
  className?: string;
}) {
  const { openWithPayload } = useWorkbenchActions();
  const actions = useMemo(
    () =>
      nextActionsFor(toolId)
        .map((id) => ({ id, name: TOOL_INDEX.get(id)?.name ?? id, reason: capabilityReason(id) }))
        .filter(
          (action): action is { id: string; name: string; reason: string } => !!action.reason,
        ),
    [toolId],
  );

  if (!payload.trim() || actions.length === 0) return null;

  const label = (reason: string) => reason.charAt(0).toUpperCase() + reason.slice(1);

  return (
    <section
      aria-label="Next useful actions"
      className={`flex flex-wrap items-center gap-1.5${className ? ` ${className}` : ''}`}
    >
      <span className="wb-caps mr-0.5">Next</span>
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          title={`Open ${action.name}`}
          onClick={() => {
            track('discovery_handoff', { from_tool_id: toolId, to_tool_id: action.id });
            openWithPayload(action.id, payload);
          }}
        >
          {label(action.reason)}
          <IconArrowRight size={13} aria-hidden="true" />
        </Button>
      ))}
    </section>
  );
}
