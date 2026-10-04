import { describe, expect, it } from 'vitest';
import {
  JWT_SAMPLE,
  base64UrlDecode,
  claimAnnotation,
  decodeJwt,
  isJwtExpired,
} from '@/features/tools/jwt-decoder/JwtScreen';
import {
  UUID_SAMPLE,
  formatUuid,
  generateUuids,
  inspectUuid,
  isUuid,
} from '@/features/tools/uuid-generator/UuidScreen';
import {
  buildCronExpression,
  explainCron,
  nextCronRuns,
  parseCronSchedule,
  splitCronFields,
} from '@/features/tools/cron-parser/CronScreen';

describe('jwt decode helpers', () => {
  it('decodes the unsigned sample token', () => {
    const decoded = decodeJwt(JWT_SAMPLE);
    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decoded.payload).toEqual({ sub: '1234', name: 'Ada', iat: 1790942400 });
    expect(decoded.signature).toBe('');
  });

  it('round-trips base64url segments', () => {
    expect(base64UrlDecode('eyJzdWIiOiIxMjM0In0')).toBe('{"sub":"1234"}');
  });

  it('rejects tokens without three parts', () => {
    expect(() => decodeJwt('onlyone')).toThrow('three dot-separated parts');
    expect(() => decodeJwt('a.b.c.d')).toThrow('three dot-separated parts');
    expect(() => decodeJwt('   ')).toThrow('three dot-separated parts');
  });

  it('rejects segments that are not JSON', () => {
    // 'aGVsbG8' is base64url for "hello", which is not JSON.
    expect(() => decodeJwt('aGVsbG8.aGVsbG8.')).toThrow(SyntaxError);
  });

  it('detects expiry against a fixed clock', () => {
    expect(isJwtExpired({ exp: 1000 }, 2000000)).toBe(true);
    expect(isJwtExpired({ exp: 9999999999 }, 2000)).toBe(false);
    expect(isJwtExpired({}, 2000)).toBe(false);
    expect(isJwtExpired({ exp: 'tomorrow' }, 2000)).toBe(false);
  });

  it('annotates time claims and flags expired tokens', () => {
    const expired = claimAnnotation('exp', 1000, 2000000);
    expect(expired).toContain('expired');
    expect(claimAnnotation('exp', 9999999999, 2000)).not.toContain('expired');
    expect(claimAnnotation('iat', 1790942400, 2000)).not.toBeNull();
    expect(claimAnnotation('sub', '1234', 2000)).toBeNull();
    expect(claimAnnotation('exp', 'soon', 2000)).toBeNull();
  });
});

describe('uuid helpers', () => {
  it('generates bulk v4 UUIDs that are unique and well-formed', () => {
    const batch = generateUuids('v4', 5);
    expect(batch).toHaveLength(5);
    expect(new Set(batch).size).toBe(5);
    for (const id of batch) {
      expect(isUuid(id)).toBe(true);
      expect(inspectUuid(id).version).toBe(4);
    }
  });

  it('generates time-ordered v7 UUIDs', () => {
    const batch = generateUuids('v7', 3);
    expect(batch).toHaveLength(3);
    for (const id of batch) {
      expect(inspectUuid(id)).toEqual({ valid: true, version: 7, variant: 'RFC 4122' });
    }
  });

  it('validates UUID shapes case-insensitively', () => {
    expect(isUuid(UUID_SAMPLE)).toBe(true);
    expect(isUuid(UUID_SAMPLE.toUpperCase())).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('f47ac10b58cc4372a5670e02b2c3d479')).toBe(false);
    expect(isUuid('')).toBe(false);
  });

  it('inspects version and variant of pasted UUIDs', () => {
    expect(inspectUuid(UUID_SAMPLE)).toEqual({ valid: true, version: 4, variant: 'RFC 4122' });
    expect(inspectUuid('  f47ac10b-58cc-4372-a567-0e02b2c3d479  ')).toEqual({
      valid: true,
      version: 4,
      variant: 'RFC 4122',
    });
    expect(inspectUuid('garbage')).toEqual({ valid: false, version: null, variant: null });
  });

  it('formats case and hyphen grouping', () => {
    expect(formatUuid(UUID_SAMPLE, false, true)).toBe(UUID_SAMPLE);
    expect(formatUuid(UUID_SAMPLE, true, true)).toBe(UUID_SAMPLE.toUpperCase());
    expect(formatUuid(UUID_SAMPLE, false, false)).toBe('f47ac10b58cc4372a5670e02b2c3d479');
    expect(formatUuid(UUID_SAMPLE, true, false)).toBe('F47AC10B58CC4372A5670E02B2C3D479');
  });
});

describe('cron helpers', () => {
  const FROM = new Date('2026-10-02T12:00:00.000Z');

  it('explains a known weekday-morning expression', () => {
    expect(explainCron('0 9 * * 1-5')).toBe('At 09:00 AM, Monday through Friday');
  });

  it('lists the next runs in UTC from a fixed date', () => {
    expect(nextCronRuns('0 9 * * 1-5', 5, FROM)).toEqual([
      '2026-10-05T09:00:00.000Z',
      '2026-10-06T09:00:00.000Z',
      '2026-10-07T09:00:00.000Z',
      '2026-10-08T09:00:00.000Z',
      '2026-10-09T09:00:00.000Z',
    ]);
  });

  it('resolves every-minute runs to consecutive minutes', () => {
    expect(nextCronRuns('* * * * *', 3, FROM)).toEqual([
      '2026-10-02T12:01:00.000Z',
      '2026-10-02T12:02:00.000Z',
      '2026-10-02T12:03:00.000Z',
    ]);
  });

  it('rejects invalid expressions', () => {
    expect(() => explainCron('not a cron')).toThrow();
    expect(() => nextCronRuns('not a cron', 5, FROM)).toThrow();
    expect(() => parseCronSchedule('', FROM)).toThrow();
  });

  it('round-trips build and split for a known expression', () => {
    const fields = { minute: '0', hour: '9', day: '*', month: '*', weekday: '1-5' };
    expect(buildCronExpression(fields)).toBe('0 9 * * 1-5');
    expect(splitCronFields('0 9 * * 1-5')).toEqual(fields);
  });

  it('falls back to wildcards for malformed builder input', () => {
    expect(splitCronFields('')).toEqual({
      minute: '*',
      hour: '*',
      day: '*',
      month: '*',
      weekday: '*',
    });
    expect(splitCronFields('0 9')).toEqual({
      minute: '*',
      hour: '*',
      day: '*',
      month: '*',
      weekday: '*',
    });
  });
});
