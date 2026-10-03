import { useState } from 'react';
import {
  IconCalendarPlus,
  IconCircleCheckFilled,
  IconDeviceDesktop,
  IconEqual,
  IconSparkles,
} from '@tabler/icons-react';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DateDifference {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const DATE_RESULT_LABELS: { key: keyof DateDifference; label: string }[] = [
  { key: 'years', label: 'Years' },
  { key: 'months', label: 'Months' },
  { key: 'weeks', label: 'Weeks' },
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
];

const EMPTY_DIFFERENCE: DateDifference = {
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

/** Port of the legacy difference math: absolute ms gap floored down each unit. */
export function calculateDateDifference(startIso: string, endIso: string): DateDifference | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = Math.abs(end.getTime() - start.getTime());
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);
  return { years, months, weeks, days, hours, minutes, seconds };
}

function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Add (or subtract) whole calendar days. Parses at local noon so DST
 * transitions never shift the calendar day, then formats back to YYYY-MM-DD.
 */
export function addDaysToDate(dateIso: string, deltaDays: number): string | null {
  if (!dateIso || !Number.isFinite(deltaDays)) return null;
  const base = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + Math.trunc(deltaDays));
  return toIsoDay(base);
}

export function todayIsoDay(): string {
  return toIsoDay(new Date());
}

export function DateCalcScreen() {
  const [baseDate, setBaseDate] = useDocumentField<string>('baseDate', '');
  const [delta, setDelta] = useSessionDocumentState<number>('delta', 7);
  const [shifted, setShifted] = useSessionDocumentState<string>('shifted', '');
  const [startDate, setStartDate] = useDocumentField<string>('startDate', '');
  const [endDate, setEndDate] = useDocumentField<string>('endDate', '');
  const [result, setResult] = useSessionDocumentState<DateDifference>('result', EMPTY_DIFFERENCE);
  const [hasCalculated, setHasCalculated] = useSessionDocumentState<boolean>(
    'hasCalculated',
    false,
  );
  const [error, setError] = useState('');
  const notify = useWorkbenchMemory((s) => s.notify);

  const shift = (days: number) => {
    if (!baseDate) {
      setError('Pick a date first.');
      return;
    }
    const next = addDaysToDate(baseDate, days);
    if (!next) {
      setError('That date could not be parsed. Use YYYY-MM-DD.');
      return;
    }
    setError('');
    setShifted(next);
    notify(`Result ${next}`);
  };

  const calculate = () => {
    const diff = calculateDateDifference(startDate, endDate);
    if (!diff) {
      setError('Pick both a start and an end date.');
      return;
    }
    setError('');
    setResult(diff);
    setHasCalculated(true);
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Date Calculator</h1>
          <p>Shift dates by days or measure the gap between two dates</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>
            <IconDeviceDesktop size={18} />
            Session only
          </span>
        </div>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="wb-toolbar">
        <label>
          Date
          <Input
            aria-label="Base date"
            type="date"
            value={baseDate}
            onChange={(e) => setBaseDate(e.target.value)}
          />
        </label>
        <label>
          Days
          <Input
            aria-label="Days to add or subtract"
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
          />
        </label>
        <Button type="button" className="wb-button primary" onClick={() => shift(delta)}>
          <IconCalendarPlus size={22} stroke={1.7} aria-hidden="true" />
          Add / subtract
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setBaseDate(todayIsoDay())}
        >
          Today
        </Button>
      </div>
      {shifted ? (
        <div className="wb-setting-row">
          <span>
            <strong>Shifted date</strong>
            <small>
              {baseDate} {delta >= 0 ? '+' : ''} {delta} days
            </small>
          </span>
          <span data-testid="shifted-date">{shifted}</span>
        </div>
      ) : null}

      <div className="wb-toolbar">
        <label>
          Start date
          <Input
            aria-label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End date
          <Input
            aria-label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <Button
          type="button"
          className="wb-button primary"
          disabled={!startDate || !endDate}
          onClick={calculate}
        >
          <IconEqual size={22} stroke={1.7} aria-hidden="true" />
          Calculate difference
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => {
            const today = todayIsoDay();
            setStartDate(today);
            setEndDate(addDaysToDate(today, 7) ?? today);
          }}
        >
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
      </div>

      {hasCalculated ? (
        <div>
          {DATE_RESULT_LABELS.map(({ key, label }) => (
            <div className="wb-setting-row" key={key}>
              <span>
                <strong>{label}</strong>
              </span>
              <span data-testid={`diff-${key}`}>{result[key].toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="wb-empty">
          <h2>No difference yet</h2>
          <p>Pick two dates and press Calculate difference.</p>
        </div>
      )}
    </>
  );
}
