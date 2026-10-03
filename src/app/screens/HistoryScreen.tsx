import { IconArrowRight, IconClock } from '@tabler/icons-react';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { useWorkbenchActions } from '@/shared/workbench-actions';
import { Checkbox } from '@/components/ui/checkbox';

export function HistoryScreen() {
  const runs = useWorkbenchMemory((s) => s.runs);
  const remember = useWorkbenchMemory((s) => s.remember);
  const setRemember = useWorkbenchMemory((s) => s.setRemember);
  const { restore } = useWorkbenchActions();

  return (
    <>
      <div className="wb-page-heading">
        <h1>History</h1>
        <p>Return to a previous run with its original input.</p>
      </div>
      <label className="wb-setting-row">
        <span>
          <strong>Remember runs in this session</strong>
          <small>Off by default. History resets when this page refreshes.</small>
        </span>
        <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
      </label>
      {runs.length ? (
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
            <IconClock size={26} />
            <span>
              <strong>{run.name}</strong>
              <small>This session · original input and result</small>
            </span>
            <IconArrowRight size={20} />
          </button>
        ))
      ) : (
        <div className="wb-empty">
          <IconClock size={36} />
          <h2>No recorded runs</h2>
          <p>Enable history, then run a tool to see it here.</p>
        </div>
      )}
    </>
  );
}
