import { describe, expect, it } from 'vitest';
import {
  CHMOD_SAMPLE,
  describeMode,
  parseMode,
  toOctal,
  toSymbolic,
} from '@/features/tools/chmod-calculator/ChmodScreen';
import {
  compareSemver,
  explainComparison,
  parseSemver,
  SEMVER_SAMPLE,
  sortVersions,
  splitEntries,
  type Semver,
} from '@/features/tools/semver-tools/SemverScreen';

/** Parsed or bust: every version literal below is expected to be valid. */
function parsed(input: string): Semver {
  const result = parseSemver(input);
  if (!result.ok) throw new Error(`Expected ${input} to parse: ${result.error}`);
  return result.v;
}

describe('chmod: octal and symbolic rendering', () => {
  it('renders the common modes', () => {
    expect(toSymbolic(0o755)).toBe('rwxr-xr-x');
    expect(toSymbolic(0o644)).toBe('rw-r--r--');
    expect(toSymbolic(0o600)).toBe('rw-------');
    expect(toSymbolic(0o777)).toBe('rwxrwxrwx');
    expect(toSymbolic(0)).toBe('---------');
  });

  it('shows s/S and t/T in the execute position', () => {
    expect(toSymbolic(0o4755)).toBe('rwsr-xr-x');
    expect(toSymbolic(0o1777)).toBe('rwxrwxrwt');
    expect(toSymbolic(0o2775)).toBe('rwxrwsr-x');
    // Capital letters mark a special bit whose execute bit is clear.
    expect(toSymbolic(0o4644)).toBe('rwSr--r--');
    expect(toSymbolic(0o1776)).toBe('rwxrwxrwT');
  });

  it('writes four octal digits only when a special bit is set', () => {
    expect(toOctal(0)).toBe('000');
    expect(toOctal(0o644)).toBe('644');
    expect(toOctal(0o755)).toBe('755');
    expect(toOctal(0o2775)).toBe('2775');
    expect(toOctal(0o4755)).toBe('4755');
    expect(toOctal(0o1777)).toBe('1777');
  });
});

describe('chmod: parsing', () => {
  it('reads 3- and 4-digit octal modes', () => {
    expect(parseMode('755')).toEqual({ ok: true, mode: 0o755 });
    expect(parseMode('0755')).toEqual({ ok: true, mode: 0o755 });
    expect(parseMode('4755')).toEqual({ ok: true, mode: 0o4755 });
    expect(parseMode(' 644 ')).toEqual({ ok: true, mode: 0o644 });
    expect(parseMode(CHMOD_SAMPLE)).toEqual({ ok: true, mode: 0o755 });
  });

  it('reads symbolic modes, including a leading file type', () => {
    expect(parseMode('rwxr-xr-x')).toEqual({ ok: true, mode: 0o755 });
    expect(parseMode('rw-r--r--')).toEqual({ ok: true, mode: 0o644 });
    expect(parseMode('rwsr-xr-x')).toEqual({ ok: true, mode: 0o4755 });
    expect(parseMode('rwSr--r--')).toEqual({ ok: true, mode: 0o4644 });
    expect(parseMode('rwxrwxrwt')).toEqual({ ok: true, mode: 0o1777 });
    expect(parseMode('drwxr-xr-x')).toEqual({ ok: true, mode: 0o755 });
    expect(parseMode('-rw-r--r--')).toEqual({ ok: true, mode: 0o644 });
  });

  it('rejects anything that is not a mode', () => {
    for (const bad of ['899', 'abcd', 'rwx', 'rwxr-xr-xz', '85', '12345', '']) {
      expect(parseMode(bad).ok).toBe(false);
    }
  });

  it('round-trips modes through both renderings', () => {
    for (const mode of [0, 0o600, 0o644, 0o755, 0o777, 0o4644, 0o4755, 0o1777, 0o2775]) {
      expect(parseMode(toOctal(mode))).toEqual({ ok: true, mode });
      expect(parseMode(toSymbolic(mode))).toEqual({ ok: true, mode });
    }
  });
});

describe('chmod: descriptions', () => {
  it('describes 755 in plain words, sharing a line between group and others', () => {
    expect(describeMode(0o755)).toEqual([
      'Owner can read, write, and execute',
      'Group and others cannot write',
      'Setuid: no',
      'Setgid: no',
      'Sticky: no',
      'Octal 755',
    ]);
  });

  it('describes 644 from what is missing', () => {
    expect(describeMode(0o644)).toEqual([
      'Owner cannot execute',
      'Group and others cannot write or execute',
      'Setuid: no',
      'Setgid: no',
      'Sticky: no',
      'Octal 644',
    ]);
  });

  it('states special bits and the four-digit octal', () => {
    expect(describeMode(0o4755)).toContain('Setuid: yes');
    expect(describeMode(0o4755)).toContain('Octal 4755');
    expect(describeMode(0o2775)).toContain('Setgid: yes');
    expect(describeMode(0o1777)).toContain('Sticky: yes');
    expect(describeMode(0)).toContain('Owner, group, and others cannot read, write, or execute');
  });
});

describe('semver: parsing', () => {
  it('normalizes 1- and 2-part versions and an optional leading v', () => {
    expect(parsed('1').normalized).toBe('1.0.0');
    expect(parsed('1.2').normalized).toBe('1.2.0');
    expect(parsed('v1.2').normalized).toBe('1.2.0');
    expect(parsed('V2.0.0-rc.1').normalized).toBe('2.0.0-rc.1');
  });

  it('keeps build metadata apart from the prerelease', () => {
    expect(parsed('1.0.0-alpha+build.5')).toMatchObject({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: ['alpha'],
      build: ['build', '5'],
      normalized: '1.0.0-alpha+build.5',
    });
    expect(parsed('1.0.0+build').normalized).toBe('1.0.0+build');
  });

  it('rejects shapes semver.org does not allow', () => {
    for (const bad of ['1.0.0.0', '01.2.3', '1..2', '1.2.x', '-1.0.0', '1.0.0-', '1.0.0-01', '']) {
      expect(parseSemver(bad).ok).toBe(false);
    }
  });
});

describe('semver: precedence', () => {
  const chain = [
    '1.0.0-alpha',
    '1.0.0-alpha.1',
    '1.0.0-alpha.beta',
    '1.0.0-beta',
    '1.0.0-beta.2',
    '1.0.0-beta.11',
    '1.0.0-rc.1',
    '1.0.0',
  ];

  it('follows the semver.org §11 chain link by link', () => {
    for (let i = 0; i < chain.length - 1; i++) {
      expect(compareSemver(parsed(chain[i]), parsed(chain[i + 1]))).toBe(-1);
      expect(compareSemver(parsed(chain[i + 1]), parsed(chain[i]))).toBe(1);
    }
  });

  it('sorts the chain exactly, ascending and descending', () => {
    expect(sortVersions(chain, 'asc').sorted).toEqual(chain);
    expect(sortVersions([...chain].reverse(), 'asc').sorted).toEqual(chain);
    expect(sortVersions(chain, 'desc').sorted).toEqual([...chain].reverse());
  });

  it('ignores build metadata for ranking but keeps it in normalization', () => {
    expect(compareSemver(parsed('1.0.0+build'), parsed('1.0.0'))).toBe(0);
    expect(compareSemver(parsed('1.0.0+a.1'), parsed('1.0.0+a.2'))).toBe(0);
    expect(parsed('1.0.0+build').normalized).toBe('1.0.0+build');
  });

  it('ranks 1- and 2-part versions like their fully written forms', () => {
    expect(compareSemver(parsed('1.2'), parsed('v1.2.0'))).toBe(0);
    expect(compareSemver(parsed('1.2'), parsed('1.2.1'))).toBe(-1);
    expect(compareSemver(parsed('1.2'), parsed('1.1.9'))).toBe(1);
  });

  it('compares prerelease identifiers numerically before alphanumerically', () => {
    expect(compareSemver(parsed('1.0.0-2'), parsed('1.0.0-11'))).toBe(-1);
    expect(compareSemver(parsed('1.0.0-alpha'), parsed('1.0.0-2'))).toBe(1);
    expect(compareSemver(parsed('1.0.0-alpha.1'), parsed('1.0.0-alpha.beta'))).toBe(-1);
  });
});

describe('semver: sorting', () => {
  it('keeps the valid entries sorted and names the invalid ones', () => {
    const outcome = sortVersions(['1.2.0', 'nope', '1.0.0'], 'asc');
    expect(outcome.sorted).toEqual(['1.0.0', '1.2.0']);
    expect(outcome.invalid).toHaveLength(1);
    expect(outcome.invalid[0]).toMatchObject({ line: 2, raw: 'nope' });
    expect(outcome.invalid[0].error).toBeTruthy();
  });

  it('orders descending when asked', () => {
    expect(sortVersions(['1.0.0', '2.0.0', '1.5.0'], 'desc').sorted).toEqual([
      '2.0.0',
      '1.5.0',
      '1.0.0',
    ]);
  });

  it('numbers invalid entries by their 1-based position', () => {
    const outcome = sortVersions(['oops', '1.0.0', 'also-oops'], 'asc');
    expect(outcome.invalid.map((entry) => entry.line)).toEqual([1, 3]);
  });

  it('sorts the bundled sample without skipping anything', () => {
    const outcome = sortVersions(SEMVER_SAMPLE.split('\n'), 'asc');
    expect(outcome.invalid).toEqual([]);
    expect(outcome.sorted).toHaveLength(SEMVER_SAMPLE.split('\n').length);
    expect(outcome.sorted[0]).toBe('0.9.5');
    expect(outcome.sorted[outcome.sorted.length - 1]).toBe('v2.0.0');
  });

  it('splits on newlines, spaces, and commas while tracking physical lines', () => {
    expect(splitEntries('1.0.0, 1.2\n\n2.0.0')).toEqual([
      { raw: '1.0.0', line: 1 },
      { raw: '1.2', line: 1 },
      { raw: '2.0.0', line: 3 },
    ]);
  });
});

describe('semver: explanations', () => {
  it('explains a prerelease as lower than its release', () => {
    expect(explainComparison(parsed('1.2.0-rc.1'), parsed('1.2.0'))).toBe(
      '1.2.0-rc.1 is lower than 1.2.0 because a prerelease sorts before the release.',
    );
    // The sentence names the lower version first whichever way the pair arrives.
    expect(explainComparison(parsed('1.2.0'), parsed('1.2.0-rc.1'))).toBe(
      '1.2.0-rc.1 is lower than 1.2.0 because a prerelease sorts before the release.',
    );
  });

  it('explains the reason inside a prerelease', () => {
    expect(explainComparison(parsed('1.0.0-beta.2'), parsed('1.0.0-beta.11'))).toBe(
      '1.0.0-beta.2 is lower than 1.0.0-beta.11 because prerelease 2 sorts before 11 numerically.',
    );
    expect(explainComparison(parsed('1.0.0-alpha'), parsed('1.0.0-beta'))).toBe(
      '1.0.0-alpha is lower than 1.0.0-beta because prerelease alpha sorts before beta alphabetically.',
    );
    expect(explainComparison(parsed('1.0.0-alpha'), parsed('1.0.0-alpha.1'))).toBe(
      '1.0.0-alpha is lower than 1.0.0-alpha.1 because its prerelease set is shorter and all earlier identifiers match.',
    );
    expect(explainComparison(parsed('1.0.0-alpha'), parsed('1.0.0-2'))).toBe(
      '1.0.0-2 is lower than 1.0.0-alpha because a numeric prerelease identifier sorts before an alphanumeric one.',
    );
  });

  it('explains a difference in the core numbers', () => {
    expect(explainComparison(parsed('1.5.0'), parsed('2.0.0'))).toBe(
      '1.5.0 is lower than 2.0.0 because its major number is lower (1 < 2).',
    );
    expect(explainComparison(parsed('1.2.3'), parsed('1.3.0'))).toBe(
      '1.2.3 is lower than 1.3.0 because its minor number is lower (2 < 3).',
    );
  });

  it('names build metadata when it is the only difference', () => {
    expect(explainComparison(parsed('1.0.0+build'), parsed('1.0.0'))).toBe(
      '1.0.0+build and 1.0.0 rank the same because build metadata is ignored.',
    );
  });

  it('says when the two are the same version', () => {
    expect(explainComparison(parsed('1.0.0'), parsed('v1.0.0'))).toBe(
      '1.0.0 and 1.0.0 are the same version.',
    );
  });
});
