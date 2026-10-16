import { useMemo, useState } from 'react';
import {
  IconCircleCheckFilled,
  IconClock,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
} from '@tabler/icons-react';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

/** A wall-clock reading, before any zone has claimed it. */
export interface WallClock {
  year: number;
  /** 1–12. */
  month: number;
  /** 1–31, and a real day in that month. */
  day: number;
  /** 0–23. */
  hour: number;
  /** 0–59. */
  minute: number;
}

export interface WallClockResolution {
  instant: Date;
  /** How the zone carried the requested wall clock. */
  kind: 'exact' | 'nonexistent' | 'ambiguous';
}

/** Only used when the runtime does not expose Intl.supportedValuesOf. */
const COMMON_TIME_ZONES: string[] = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'America/Argentina/Buenos_Aires',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Rome',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

/** A fixed winter morning: 09:30 in New York is 23:30 the same day in Tokyo. */
export const TZ_SAMPLE: { from: string; to: string; wallClock: string } = {
  from: 'America/New_York',
  to: 'Asia/Tokyo',
  wallClock: '2026-01-15T09:30',
};

const DAY_MS = 86_400_000;

interface ZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

/** One formatter per zone, reused so the selectors stay cheap to re-render. */
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      // h23 keeps midnight at 00, where en-US otherwise likes to say 24.
      hourCycle: 'h23',
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The numeric fields a zone shows at an instant, or null for a bad zone or date. */
function zoneParts(instant: Date, timeZone: string): ZoneParts | null {
  if (!isValidTimeZone(timeZone) || Number.isNaN(instant.getTime())) return null;
  const parts = new Map<string, string>();
  for (const part of partsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') parts.set(part.type, part.value);
  }
  const zone: ZoneParts = {
    year: Number(parts.get('year')),
    month: Number(parts.get('month')),
    day: Number(parts.get('day')),
    hour: Number(parts.get('hour')),
    minute: Number(parts.get('minute')),
    second: Number(parts.get('second')),
  };
  return Object.values(zone).some((value) => !Number.isFinite(value)) ? null : zone;
}

/** The reading treated as if it were UTC, in milliseconds. */
function wallClockMs(wall: WallClock): number {
  // setUTCFullYear takes years < 100 literally, where Date.UTC maps them into
  // the 1900s.
  const date = new Date(0);
  date.setUTCFullYear(wall.year, wall.month - 1, wall.day);
  date.setUTCHours(wall.hour, wall.minute, 0, 0);
  return date.getTime();
}

/** Fields are in range and name a real calendar day. */
function isWallClock(wall: WallClock): boolean {
  if (!Number.isInteger(wall.year) || wall.year < 1 || wall.year > 9999) return false;
  if (!Number.isInteger(wall.month) || wall.month < 1 || wall.month > 12) return false;
  if (!Number.isInteger(wall.day) || wall.day < 1 || wall.day > 31) return false;
  if (!Number.isInteger(wall.hour) || wall.hour < 0 || wall.hour > 23) return false;
  if (!Number.isInteger(wall.minute) || wall.minute < 0 || wall.minute > 59) return false;
  // A rolled-over day such as 31 April must read as out of range, so the date
  // has to survive the round trip through a real Date.
  const probe = new Date(wallClockMs(wall));
  return (
    probe.getUTCFullYear() === wall.year &&
    probe.getUTCMonth() === wall.month - 1 &&
    probe.getUTCDate() === wall.day
  );
}

/** "America/New_York" reads as "New York" in a sentence. */
function zoneLabel(timeZone: string): string {
  const segment = timeZone.split('/').pop() ?? timeZone;
  return segment.replace(/_/g, ' ');
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** IANA zone ids for the selectors. */
export function listTimeZones(): string[] {
  let zones: string[];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = [];
  }
  if (zones.length === 0) zones = COMMON_TIME_ZONES;
  // Intl keeps UTC out of its canonical list, but the To default is UTC, so
  // the selectors have to offer it whichever source answered.
  return zones.includes('UTC') ? zones : ['UTC', ...zones];
}

/** The browser's zone, or UTC when the runtime will not name a usable one. */
export function defaultTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isValidTimeZone(zone) ? zone : 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * The zone's offset at an instant, in milliseconds: UTC + offset = local.
 *
 * Intl only formats instants, it cannot invert a wall clock, so the offset is
 * recovered the standard way: format the instant in the zone, rebuild those
 * fields as if they were UTC, and take the difference.
 */
export function getZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = zoneParts(instant, timeZone);
  if (!parts) return NaN;
  const local = new Date(0);
  local.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  local.setUTCHours(parts.hour, parts.minute, parts.second, instant.getMilliseconds());
  return local.getTime() - instant.getTime();
}

/** The wall clock a zone shows at an instant. */
export function wallClockInZone(instant: Date, timeZone: string): WallClock | null {
  const parts = zoneParts(instant, timeZone);
  if (!parts) return null;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

/**
 * Resolve a wall clock in a zone to an instant.
 *
 * An offset cannot be inverted directly, because a zone can skip a wall time
 * (spring forward) or repeat it (fall back). The offsets in play around the
 * nominal instant are enough to enumerate the candidates: read the offset with
 * the wall clock treated as UTC — the usual one-step adjustment — and sample a
 * day either side, which brackets the DST step. An overlap hides a second
 * candidate that plain iteration to a fixpoint can never see. Each candidate
 * is then verified by formatting its instant back into the zone: two matches
 * mean the clock fell back (keep the earlier offset), one match is the instant,
 * and no match means the wall time never existed, in which case the candidate
 * that reads just after the requested time is the forward-adjusted one.
 */
export function wallClockToInstant(
  wall: WallClock,
  timeZone: string,
): WallClockResolution | null {
  if (!isValidTimeZone(timeZone) || !isWallClock(wall)) return null;
  const wallMs = wallClockMs(wall);
  const offsets = new Set<number>();
  for (const probeMs of [wallMs - DAY_MS, wallMs, wallMs + DAY_MS]) {
    const offset = getZoneOffsetMs(new Date(probeMs), timeZone);
    if (!Number.isFinite(offset)) return null;
    offsets.add(offset);
  }
  const readings = [...offsets].map((offset) => {
    const instant = new Date(wallMs - offset);
    const reading = wallClockInZone(instant, timeZone);
    const deltaMs = reading ? wallClockMs(reading) - wallMs : 0;
    return { instant, deltaMs };
  });
  const exact = readings.filter((reading) => reading.deltaMs === 0);
  if (exact.length > 0) {
    exact.sort((a, b) => a.instant.getTime() - b.instant.getTime());
    return { instant: exact[0].instant, kind: exact.length > 1 ? 'ambiguous' : 'exact' };
  }
  const after = readings.filter((reading) => reading.deltaMs > 0);
  const candidates = after.length > 0 ? after : readings;
  const chosen = candidates.reduce((best, reading) =>
    Math.abs(reading.deltaMs) < Math.abs(best.deltaMs) ? reading : best,
  );
  return { instant: chosen.instant, kind: 'nonexistent' };
}

/** Format an instant as seen in a zone; extra options go straight to Intl. */
export function formatInZone(
  instant: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (!isValidTimeZone(timeZone) || Number.isNaN(instant.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { timeZone, ...options }).format(instant);
}

/**
 * The zone's offset at an instant as text, e.g. "GMT+05:30".
 *
 * `longOffset` is a zone-name option, so the offset has to be read out of the
 * formatted parts; asked for on its own it still renders the whole default
 * date-time string around it.
 */
export function formatZoneOffset(instant: Date, timeZone: string): string {
  if (!isValidTimeZone(timeZone) || Number.isNaN(instant.getTime())) return '';
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(instant);
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
}

/**
 * How the To zone's clock compares with the From zone's at an instant, e.g.
 * "Tokyo is 14 hours ahead of New York". Minutes appear only when the two
 * offsets do not line up on the hour.
 */
export function describeDifference(
  fromZone: string,
  toZone: string,
  instant: Date,
): string {
  const fromOffset = getZoneOffsetMs(instant, fromZone);
  const toOffset = getZoneOffsetMs(instant, toZone);
  if (!Number.isFinite(fromOffset) || !Number.isFinite(toOffset)) return '';
  const diffMinutes = Math.round((toOffset - fromOffset) / 60_000);
  if (diffMinutes === 0) {
    return `${zoneLabel(toZone)} is on the same clock as ${zoneLabel(fromZone)}`;
  }
  const total = Math.abs(diffMinutes);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  const direction = diffMinutes > 0 ? 'ahead of' : 'behind';
  return `${zoneLabel(toZone)} is ${parts.join(' ')} ${direction} ${zoneLabel(fromZone)}`;
}

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/** Parse a datetime-local value; seconds are accepted but only minutes are kept. */
export function parseDatetimeLocal(value: string): WallClock | null {
  const match = DATETIME_LOCAL_PATTERN.exec(value);
  if (!match) return null;
  const wall: WallClock = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  return isWallClock(wall) ? wall : null;
}

/** The value a datetime-local input expects back. */
export function formatDatetimeLocal(wall: WallClock): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${pad(wall.year, 4)}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`;
}

export function TimezoneScreen() {
  const [fromZone, setFromZone] = useSessionDocumentState<string>('fromZone', () =>
    defaultTimeZone(),
  );
  const [toZone, setToZone] = useSessionDocumentState<string>('toZone', 'UTC');
  // The entered time is the wall clock in the From zone, so the initial value
  // is "now" there. Computed once: recomputing would move it on every render.
  const [initialWallClock] = useState(() => {
    const now = wallClockInZone(new Date(), fromZone);
    return now ? formatDatetimeLocal(now) : '';
  });
  const [wallClock, setWallClock] = useDocumentField<string>('wallClock', initialWallClock);
  const notify = useWorkbenchMemory((s) => s.notify);

  const zoneOptions = useMemo(() => {
    const zones = listTimeZones();
    // A zone chosen earlier can be missing from the current Intl list; keep it
    // selectable so the stored choice is not silently rewritten.
    const missing = [fromZone, toZone].filter((zone) => !zones.includes(zone));
    return missing.length > 0 ? [...missing, ...zones] : zones;
  }, [fromZone, toZone]);

  const parsed = useMemo(() => parseDatetimeLocal(wallClock), [wallClock]);
  const conversion = useMemo(
    () => (parsed ? wallClockToInstant(parsed, fromZone) : null),
    [parsed, fromZone],
  );
  const output = useMemo(() => {
    if (!conversion) return null;
    const { instant } = conversion;
    return {
      zoneTime: formatInZone(instant, toZone, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
      offsetText: formatZoneOffset(instant, toZone),
      utcIso: instant.toISOString(),
      unixSeconds: Math.floor(instant.getTime() / 1000),
      difference: describeDifference(fromZone, toZone, instant),
    };
  }, [conversion, toZone, fromZone]);

  // The pane reads as "what you entered" → "what it is over there", and that
  // whole block is what Copy result and Save Result… write out.
  const resultBlock = output
    ? [
        `Entered: ${wallClock} (${fromZone})`,
        `Time in ${toZone}: ${output.zoneTime}`,
        `Offset: ${output.offsetText}`,
        `UTC: ${output.utcIso}`,
        `Unix timestamp (seconds): ${output.unixSeconds}`,
        `Difference: ${output.difference}`,
      ].join('\n')
    : '';
  usePublishedResult(resultBlock, 'Converted time', 'txt');

  const warning =
    conversion?.kind === 'nonexistent'
      ? `That local time does not exist in ${fromZone} (clocks jumped forward); using the adjusted instant.`
      : conversion?.kind === 'ambiguous'
        ? 'That local time occurs twice (clocks fell back); using the earlier offset.'
        : '';
  const error =
    wallClock.trim() !== '' && !parsed
      ? 'Enter a date and time such as 2026-01-15T09:30.'
      : '';

  const setToNow = () => {
    const now = wallClockInZone(new Date(), fromZone);
    if (now) setWallClock(formatDatetimeLocal(now));
  };

  const copyResult = async () => {
    if (!resultBlock) return;
    try {
      await navigator.clipboard.writeText(resultBlock);
      notify('Result copied');
    } catch {
      notify('Clipboard unavailable. Select the result and copy it.');
    }
  };

  const loadSample = () => {
    setFromZone(TZ_SAMPLE.from);
    setToZone(TZ_SAMPLE.to);
    setWallClock(TZ_SAMPLE.wallClock);
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Timezone Converter</h1>
          <p>Convert a time between time zones</p>
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

      <div className="wb-setting-row">
        <span>
          <strong>From</strong>
          <small>The zone the entered time is written in.</small>
        </span>
        <NativeSelect
          aria-label="From timezone"
          value={fromZone}
          onChange={(e) => setFromZone(e.target.value)}
        >
          {zoneOptions.map((zone) => (
            <NativeSelectOption key={zone} value={zone}>
              {zone}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>To</strong>
          <small>The zone to convert that time into.</small>
        </span>
        <NativeSelect
          aria-label="To timezone"
          value={toZone}
          onChange={(e) => setToZone(e.target.value)}
        >
          {zoneOptions.map((zone) => (
            <NativeSelectOption key={zone} value={zone}>
              {zone}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Time in {fromZone}</strong>
          <small>Local wall-clock time; the conversion updates as you type.</small>
        </span>
        <Input
          aria-label={`Time in ${fromZone}`}
          type="datetime-local"
          value={wallClock}
          onChange={(e) => setWallClock(e.target.value)}
        />
      </div>

      <div className="wb-toolbar">
        <Button
          type="button"
          className="wb-button primary"
          disabled={!resultBlock}
          onClick={() => void copyResult()}
        >
          <IconCopy size={16} stroke={1.7} aria-hidden="true" />
          Copy result
        </Button>
        <Button type="button" variant="outline" className="wb-button" onClick={setToNow}>
          <IconClock size={16} stroke={1.7} aria-hidden="true" />
          Use current time
        </Button>
        <Button type="button" variant="outline" className="wb-button" onClick={loadSample}>
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
      </div>

      {warning ? (
        <div className="wb-warning-banner" role="status">
          <span>{warning}</span>
        </div>
      ) : null}

      {output ? (
        <div>
          <div className="wb-setting-row">
            <span>
              <strong>Time in {toZone}</strong>
              <small>The entered instant on the To zone&apos;s clock.</small>
            </span>
            <span data-testid="zone-time">{output.zoneTime}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Offset</strong>
              <small>{toZone} offset from UTC at this instant.</small>
            </span>
            <span data-testid="zone-offset">{output.offsetText}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>UTC</strong>
              <small>The same instant in UTC.</small>
            </span>
            <span data-testid="zone-utc">{output.utcIso}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Unix timestamp</strong>
              <small>Seconds since 1 January 1970 UTC.</small>
            </span>
            <span data-testid="zone-unix">{output.unixSeconds}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Difference</strong>
              <small>Zone offsets compared at this instant.</small>
            </span>
            <span data-testid="zone-difference">{output.difference}</span>
          </div>
        </div>
      ) : (
        <div className="wb-empty">
          <h2>No conversion yet</h2>
          <p>Enter a time to convert it between the two zones.</p>
        </div>
      )}
    </>
  );
}
