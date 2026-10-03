import { useMemo } from 'react';
import {
  IconCircleCheckFilled,
  IconClock,
  IconCopy,
  IconFlask,
  IconHammer,
  IconTrash,
} from '@tabler/icons-react';
import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';

export const CRON_SAMPLE = '0 9 * * 1-5';

export const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
  { label: 'Monthly 1st', value: '0 0 1 * *' },
];

export type CronMode = 'explain' | 'build';

export interface CronFields {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
}

const FIELD_OPTIONS: { key: keyof CronFields; label: string; range: string; options: string[] }[] =
  [
    {
      key: 'minute',
      label: 'Minute',
      range: '0–59',
      options: ['*', '*/5', '*/10', '*/15', '*/20', '*/30', '0', '5', '15', '30', '45'],
    },
    {
      key: 'hour',
      label: 'Hour',
      range: '0–23',
      options: ['*', '*/2', '*/4', '*/6', '0', '6', '9', '12', '18'],
    },
    {
      key: 'day',
      label: 'Day',
      range: '1–31',
      options: ['*', '1', '15', '1,15', '*/2'],
    },
    {
      key: 'month',
      label: 'Month',
      range: '1–12',
      options: ['*', '1', '6', '12', '*/3'],
    },
    {
      key: 'weekday',
      label: 'Weekday',
      range: '0–6',
      options: ['*', '0', '6', '1-5', '0,6'],
    },
  ];

/** Human-readable explanation via cronstrue. Throws on invalid expressions. */
export function explainCron(expression: string): string {
  return cronstrue.toString(expression.trim());
}

/** Next run times as ISO strings, always resolved in UTC. Throws on invalid input. */
export function nextCronRuns(expression: string, count: number = 5, from?: Date): string[] {
  const interval = CronExpressionParser.parse(
    expression.trim(),
    from ? { tz: 'UTC', currentDate: from } : { tz: 'UTC' },
  );
  const runs: string[] = [];
  for (let i = 0; i < count; i++) runs.push(interval.next().toDate().toISOString());
  return runs;
}

export interface CronSchedule {
  description: string;
  nextRuns: string[];
}

export function parseCronSchedule(expression: string, from?: Date): CronSchedule {
  return { description: explainCron(expression), nextRuns: nextCronRuns(expression, 5, from) };
}

export function buildCronExpression(fields: CronFields): string {
  return [fields.minute, fields.hour, fields.day, fields.month, fields.weekday]
    .map((f) => f.trim() || '*')
    .join(' ');
}

export function splitCronFields(expression: string): CronFields {
  const parts = expression.trim().split(/\s+/);
  const [minute = '*', hour = '*', day = '*', month = '*', weekday = '*'] = parts;
  if (parts.length !== 5 || parts.some((p) => !p))
    return { minute: '*', hour: '*', day: '*', month: '*', weekday: '*' };
  return { minute, hour, day, month, weekday };
}

interface CronOutcome {
  description: string;
  nextRuns: string[];
  error: string;
}

export function CronScreen() {
  const [expression, setExpression] = useDocumentField<string>('input', '');
  const [mode, setMode] = useSessionDocumentState<CronMode>('mode', 'explain');
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo<CronOutcome>(() => {
    if (!expression.trim()) return { description: '', nextRuns: [], error: '' };
    try {
      const schedule = parseCronSchedule(expression);
      return { ...schedule, error: '' };
    } catch (e) {
      return {
        description: '',
        nextRuns: [],
        error: e instanceof Error ? e.message : 'Invalid expression',
      };
    }
  }, [expression]);

  const fields = useMemo(() => splitCronFields(expression), [expression]);

  const updateField = (key: keyof CronFields, value: string) => {
    setExpression(buildCronExpression({ ...fields, [key]: value.trim() || '*' }));
  };

  const scheduleText = outcome.description
    ? `${outcome.description}\n\nNext 5 runs (UTC):\n${outcome.nextRuns.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : '';

  const copySchedule = async () => {
    if (!scheduleText) return;
    try {
      await navigator.clipboard.writeText(scheduleText);
      notify('Schedule copied');
    } catch {
      notify('Clipboard unavailable. Select the schedule and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Cron</h1>
          <p>Explain and build cron schedules</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconClock size={18} />
            Next runs in UTC
          </span>
        </div>
      </div>

      <div className="wb-toolbar">
        <Button
          type="button"
          variant={mode === 'explain' ? 'default' : 'outline'}
          className={`wb-button${mode === 'explain' ? ' primary' : ''}`}
          onClick={() => setMode('explain')}
        >
          Explain
        </Button>
        <Button
          type="button"
          variant={mode === 'build' ? 'default' : 'outline'}
          className={`wb-button${mode === 'build' ? ' primary' : ''}`}
          onClick={() => setMode('build')}
        >
          <IconHammer size={22} stroke={1.7} aria-hidden="true" />
          Build
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setExpression(CRON_SAMPLE)}
        >
          <IconFlask size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setExpression('')}
        >
          <IconTrash size={22} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
      </div>

      {outcome.error && (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t parse this expression.</strong>
          <span>{outcome.error}</span>
        </div>
      )}

      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Expression panel">
          <div className="wb-pane-header">
            <h2>{mode === 'build' ? 'Builder' : 'Expression'}</h2>
          </div>
          {mode === 'build' && (
            <div>
              {FIELD_OPTIONS.map((field) => (
                <div className="wb-setting-row" key={field.key}>
                  <span>
                    <strong>{field.label}</strong>
                    <small>{field.range}</small>
                  </span>
                  <NativeSelect
                    aria-label={`${field.label} field`}
                    value={fields[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  >
                    {!field.options.includes(fields[field.key]) && (
                      <NativeSelectOption value={fields[field.key]}>
                        {fields[field.key]}
                      </NativeSelectOption>
                    )}
                    {field.options.map((option) => (
                      <NativeSelectOption key={option} value={option}>
                        {option}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              ))}
            </div>
          )}
          <CodeEditor
            value={expression}
            onChange={setExpression}
            wrap={wrap}
            label="Cron expression"
            placeholder="* * * * * — minute hour day month weekday"
            showLineNumbers={false}
          />
          <div className="wb-pane-footer">
            <span>{expression.trim() ? '5-field expression' : 'Waiting for input'}</span>
          </div>
        </section>

        <section className="wb-editor-pane" aria-label="Schedule panel">
          <div className="wb-pane-header">
            <h2>Schedule</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!scheduleText}
                onClick={copySchedule}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy schedule
              </Button>
            </div>
          </div>
          <CodeEditor
            value={scheduleText}
            readOnly
            wrap={wrap}
            label="Schedule explanation"
            placeholder="Explanation and next runs appear here."
          />
          <div className="wb-pane-footer">
            <span>
              {outcome.nextRuns.length ? `${outcome.nextRuns.length} runs listed` : 'UTC'}
            </span>
          </div>
        </section>
      </div>

      <div>
        {CRON_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant="ghost"
            className="wb-list-row text-left justify-start h-auto w-full"
            onClick={() => setExpression(preset.value)}
          >
            <span>
              <strong>{preset.label}</strong>
              <small>{preset.value}</small>
            </span>
          </Button>
        ))}
      </div>
    </>
  );
}
