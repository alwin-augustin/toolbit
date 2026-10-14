import { IconArrowRight, IconClock } from '@tabler/icons-react';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * History.
 *
 * Recording is opt-in and session-only — the screen says so, twice: once as
 * the switch that controls it and once as the caption on the list it produces.
 * Secret tools are excluded from history regardless of this switch.
 */
export function HistoryScreen() {
  const runs = useWorkbenchMemory((s) => s.runs);
  const remember = useWorkbenchMemory((s) => s.remember);
  const setRemember = useWorkbenchMemory((s) => s.setRemember);
  const { restore } = useWorkbenchActions();

  return (
    <div className="flex flex-col gap-5 pb-10">
      <header className="wb-page-heading">
        <h1>History</h1>
        <p>Return to a previous run with its original input.</p>
      </header>

      <div className="wb-card">
        <Label className="wb-setting-row cursor-pointer">
          <span>
            <strong>Remember runs in this session</strong>
            <small>
              Off by default. Secret tools never record. Nothing is written after you refresh.
            </small>
          </span>
          <Checkbox
            checked={remember}
            onCheckedChange={(checked) => setRemember(Boolean(checked))}
          />
        </Label>

        {runs.length === 0 ? (
          <div className="wb-empty">
            <IconClock size={22} aria-hidden="true" />
            <h2>No recorded runs</h2>
            <p>Turn recording on, then run a tool to see it here.</p>
          </div>
        ) : (
          runs.map((run) => (
            <button
              key={run.id}
              type="button"
              className="wb-list-row"
              onClick={() =>
                restore({
                  kind: 'Sessions',
                  toolId: run.toolId,
                  doc: run.doc,
                  input: run.doc.input,
                  name: run.name,
                })
              }
            >
              <IconClock size={18} aria-hidden="true" className="shrink-0 text-ink-faint" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-sm text-ink">{run.name}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-faint">
                  This session · original input and result
                </span>
              </span>
              <span className="wb-row-action">
                Reopen
                <IconArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
