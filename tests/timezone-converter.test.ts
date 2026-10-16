import { describe, expect, it } from 'vitest';
import {
  TZ_SAMPLE,
  defaultTimeZone,
  describeDifference,
  formatDatetimeLocal,
  formatZoneOffset,
  getZoneOffsetMs,
  isValidTimeZone,
  listTimeZones,
  parseDatetimeLocal,
  wallClockInZone,
  wallClockToInstant,
} from '@/features/tools/timezone-converter/TimezoneScreen';

/** Parse a literal the tests stand behind, failing loudly instead of loosely. */
function wallAt(value: string) {
  const wall = parseDatetimeLocal(value);
  if (!wall) throw new Error(`expected ${value} to parse`);
  return wall;
}

describe('timezone offsets', () => {
  it('reads the offset a zone has at an instant', () => {
    const summer = new Date('2026-07-01T12:00:00Z');
    expect(getZoneOffsetMs(summer, 'Asia/Tokyo')).toBe(32400000);
    expect(getZoneOffsetMs(summer, 'America/New_York')).toBe(-14400000);
    expect(getZoneOffsetMs(summer, 'Europe/Paris')).toBe(7200000);

    const winter = new Date('2026-01-15T12:00:00Z');
    expect(getZoneOffsetMs(winter, 'America/New_York')).toBe(-18000000);
    expect(getZoneOffsetMs(winter, 'Europe/Paris')).toBe(3600000);
  });

  it('treats UTC as zero and rejects unknown zones', () => {
    expect(getZoneOffsetMs(new Date('2026-07-01T12:00:00Z'), 'UTC')).toBe(0);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
    expect(Number.isNaN(getZoneOffsetMs(new Date('2026-07-01T12:00:00Z'), 'Not/AZone'))).toBe(
      true,
    );
  });

  it('reads the wall clock a zone shows at an instant', () => {
    expect(wallClockInZone(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toEqual({
      year: 2026,
      month: 1,
      day: 15,
      hour: 7,
      minute: 0,
    });
    expect(wallClockInZone(new Date('2026-07-01T12:00:00Z'), 'Asia/Kolkata')).toEqual({
      year: 2026,
      month: 7,
      day: 1,
      hour: 17,
      minute: 30,
    });
  });
});

describe('wallClockToInstant', () => {
  it('resolves an exact wall clock in winter and in summer', () => {
    const winter = wallClockToInstant(wallAt('2026-01-15T09:30'), 'America/New_York');
    expect(winter?.kind).toBe('exact');
    expect(winter?.instant.toISOString()).toBe('2026-01-15T14:30:00.000Z');

    const summer = wallClockToInstant(wallAt('2026-07-01T09:00'), 'Europe/Paris');
    expect(summer?.kind).toBe('exact');
    expect(summer?.instant.toISOString()).toBe('2026-07-01T07:00:00.000Z');
  });

  it('flags a spring-forward gap and lands on the adjusted instant', () => {
    // 02:00 EST jumps to 03:00 EDT on 2026-03-08, so 02:30 never happened.
    const gap = wallClockToInstant(wallAt('2026-03-08T02:30'), 'America/New_York');
    expect(gap?.kind).toBe('nonexistent');
    expect(gap?.instant.toISOString()).toBe('2026-03-08T07:30:00.000Z');
  });

  it('flags a fall-back overlap and picks the earlier offset', () => {
    // 02:00 EDT falls back to 01:00 EST on 2026-11-01, so 01:30 happened twice.
    const overlap = wallClockToInstant(wallAt('2026-11-01T01:30'), 'America/New_York');
    expect(overlap?.kind).toBe('ambiguous');
    expect(overlap?.instant.toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });

  it('returns null for an unknown zone or an impossible date', () => {
    expect(wallClockToInstant(wallAt('2026-01-15T09:30'), 'Not/AZone')).toBeNull();
    const impossible = { year: 2026, month: 2, day: 30, hour: 9, minute: 30 };
    expect(wallClockToInstant(impossible, 'UTC')).toBeNull();
  });
});

describe('describeDifference', () => {
  it('names the zone that runs ahead and stays sign-aware', () => {
    // In January New York is on EST, so Tokyo runs 14 hours ahead; July is 13
    // because New York has moved to EDT while Tokyo does not change.
    expect(
      describeDifference(
        'America/New_York',
        'Asia/Tokyo',
        new Date('2026-01-15T12:00:00Z'),
      ),
    ).toContain('14 hours ahead');
    const summer = new Date('2026-07-01T12:00:00Z');
    expect(describeDifference('America/New_York', 'Asia/Tokyo', summer)).toContain('13 hours ahead');
    expect(describeDifference('Asia/Tokyo', 'America/New_York', summer)).toContain('13 hours behind');
  });

  it('includes minutes only when the offsets are not whole hours apart', () => {
    const summer = new Date('2026-07-01T12:00:00Z');
    expect(describeDifference('UTC', 'Asia/Kolkata', summer)).toContain('5 hours 30 minutes ahead');
    expect(describeDifference('America/New_York', 'Europe/Paris', summer)).toBe(
      'Paris is 6 hours ahead of New York',
    );
    expect(describeDifference('Europe/London', 'Europe/Paris', summer)).toBe(
      'Paris is 1 hour ahead of London',
    );
  });
});

describe('parseDatetimeLocal', () => {
  it('round-trips a datetime-local value', () => {
    const wall = parseDatetimeLocal('2026-01-15T09:30');
    expect(wall).toEqual({ year: 2026, month: 1, day: 15, hour: 9, minute: 30 });
    expect(wall && formatDatetimeLocal(wall)).toBe('2026-01-15T09:30');
  });

  it('accepts seconds the input may include but keeps minutes', () => {
    expect(parseDatetimeLocal('2026-01-15T09:30:45')).toEqual({
      year: 2026,
      month: 1,
      day: 15,
      hour: 9,
      minute: 30,
    });
  });

  it('rejects malformed and out-of-range values', () => {
    expect(parseDatetimeLocal('')).toBeNull();
    expect(parseDatetimeLocal('2026-01-15')).toBeNull();
    expect(parseDatetimeLocal('2026-01-15 09:30')).toBeNull();
    expect(parseDatetimeLocal('09:30')).toBeNull();
    expect(parseDatetimeLocal('2026-13-01T09:30')).toBeNull();
    expect(parseDatetimeLocal('2026-02-30T09:30')).toBeNull();
    expect(parseDatetimeLocal('2026-01-15T24:00')).toBeNull();
    expect(parseDatetimeLocal('2026-01-15T09:60')).toBeNull();
  });
});

describe('zone list and default', () => {
  it('offers UTC even though Intl leaves it out of the canonical list', () => {
    const zones = listTimeZones();
    expect(zones.length).toBeGreaterThan(20);
    expect(zones).toContain('UTC');
    expect(new Set(zones).size).toBe(zones.length);
  });

  it('defaults to a usable zone', () => {
    expect(isValidTimeZone(defaultTimeZone())).toBe(true);
  });
});

describe('TZ_SAMPLE', () => {
  it('pins the cross-zone sample and resolves it', () => {
    expect(TZ_SAMPLE).toEqual({
      from: 'America/New_York',
      to: 'Asia/Tokyo',
      wallClock: '2026-01-15T09:30',
    });
    const sample = wallClockToInstant(wallAt(TZ_SAMPLE.wallClock), TZ_SAMPLE.from);
    expect(sample).toEqual({ instant: new Date('2026-01-15T14:30:00.000Z'), kind: 'exact' });
  });
});

describe('formatZoneOffset', () => {
  it('renders the offset name for a half-hour zone', () => {
    expect(formatZoneOffset(new Date('2026-07-01T12:00:00Z'), 'Asia/Kolkata')).toMatch(
      /(?:GMT|UTC)\+0?5:30/,
    );
    expect(formatZoneOffset(new Date('2026-07-01T12:00:00Z'), 'UTC')).toMatch(/(?:GMT|UTC)/);
    expect(formatZoneOffset(new Date('2026-07-01T12:00:00Z'), 'Not/AZone')).toBe('');
  });
});
