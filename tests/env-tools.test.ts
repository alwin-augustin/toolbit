import { describe, expect, it } from 'vitest';
import {
  ENV_SAMPLE,
  ENV_SAMPLE_COMPARE,
  diffEnv,
  envToJson,
  formatEnvDiff,
  parseEnv,
  validateEnv,
} from '@/features/tools/env-tools/EnvScreen';

describe('parseEnv', () => {
  it('skips blank lines and comments, and strips trailing comments from unquoted values', () => {
    const parsed = parseEnv('# full line comment\n\nA=1 # trailing\nB=2#kept');
    expect(parsed.entries).toEqual([
      { key: 'A', value: '1', line: 3, quoted: 'none' },
      { key: 'B', value: '2#kept', line: 4, quoted: 'none' },
    ]);
    expect(parsed.errors).toEqual([]);
    expect(parsed.duplicates).toEqual([]);
  });

  it('accepts the export prefix, dotted keys, and leading indentation', () => {
    const parsed = parseEnv('export APP_ENV=dev\n  export PG.DUMP=on');
    expect(parsed.entries).toEqual([
      { key: 'APP_ENV', value: 'dev', line: 1, quoted: 'none' },
      { key: 'PG.DUMP', value: 'on', line: 2, quoted: 'none' },
    ]);
    expect(parsed.errors).toEqual([]);
  });

  it('decodes double-quoted escapes but keeps single-quoted text literal', () => {
    const parsed = parseEnv('D="a\\nb\\t\\"c\\"\\\\d"\nS=\'a\\nb\'');
    expect(parsed.entries).toEqual([
      { key: 'D', value: 'a\nb\t"c"\\d', line: 1, quoted: 'double' },
      { key: 'S', value: 'a\\nb', line: 2, quoted: 'single' },
    ]);
  });

  it('keeps empty values and splits on the first equals sign only', () => {
    const parsed = parseEnv('EMPTY=\nEQUATION=a=b=c\n');
    expect(parsed.entries).toEqual([
      { key: 'EMPTY', value: '', line: 1, quoted: 'none' },
      { key: 'EQUATION', value: 'a=b=c', line: 2, quoted: 'none' },
    ]);
  });

  it('parses CRLF input', () => {
    const parsed = parseEnv('A=1\r\nB="x" # note\r\n');
    expect(parsed.entries).toEqual([
      { key: 'A', value: '1', line: 1, quoted: 'none' },
      { key: 'B', value: 'x', line: 2, quoted: 'double' },
    ]);
    expect(parsed.errors).toEqual([]);
  });

  it('takes whitespace after the equals sign out of the value, but not out of a hash', () => {
    const parsed = parseEnv('A= "x"\nB= #not-a-value\nC=#value');
    expect(parsed.entries).toEqual([
      { key: 'A', value: 'x', line: 1, quoted: 'double' },
      { key: 'B', value: '', line: 2, quoted: 'none' },
      { key: 'C', value: '#value', line: 3, quoted: 'none' },
    ]);
  });

  it('reports malformed lines with their line numbers and raw text', () => {
    const parsed = parseEnv('GOOD=1\nJUST_TEXT\n1BAD=x\n=x\nA =1\n');
    expect(parsed.entries).toEqual([{ key: 'GOOD', value: '1', line: 1, quoted: 'none' }]);
    expect(parsed.errors).toEqual([
      { line: 2, message: 'Missing "="', raw: 'JUST_TEXT' },
      { line: 3, message: 'Invalid key "1BAD"', raw: '1BAD=x' },
      { line: 4, message: 'Missing key before "="', raw: '=x' },
      { line: 5, message: 'Invalid key "A "', raw: 'A =1' },
    ]);
  });

  it('reports unterminated quotes and text after a closing quote', () => {
    const parsed = parseEnv('A="x y" # note\nB="unterminated\nC=\'a\'b\n');
    expect(parsed.entries).toEqual([{ key: 'A', value: 'x y', line: 1, quoted: 'double' }]);
    expect(parsed.errors).toEqual([
      { line: 2, message: 'Unterminated double-quoted value', raw: 'B="unterminated' },
      { line: 3, message: 'Unexpected text after the closing quote', raw: "C='a'b" },
    ]);
  });

  it('collects duplicate keys with every line number', () => {
    const parsed = parseEnv('A=1\nB=2\nA=3\nA=4');
    expect(parsed.entries.map((entry) => entry.value)).toEqual(['1', '2', '3', '4']);
    expect(parsed.duplicates).toEqual([{ key: 'A', lines: [1, 3, 4] }]);
  });
});

describe('envToJson', () => {
  it('converts entries to a 2-space indented JSON object', () => {
    expect(envToJson('A=1\nB="x y"\nEMPTY=')).toEqual({
      ok: true,
      json: '{\n  "A": "1",\n  "B": "x y",\n  "EMPTY": ""\n}',
    });
  });

  it('keeps the last value of a duplicate key at the first position', () => {
    expect(envToJson('B=1\nA=2\nB=3')).toEqual({
      ok: true,
      json: '{\n  "B": "3",\n  "A": "2"\n}',
    });
  });

  it('refuses to convert while malformed lines remain', () => {
    const single = envToJson('BROKEN\n');
    expect(single.ok).toBe(false);
    if (!single.ok) expect(single.error).toContain('Malformed line 1');

    const many = envToJson('BROKEN\n1BAD=x');
    expect(many.ok).toBe(false);
    if (!many.ok) expect(many.error).toContain('Malformed lines 1, 2');
  });
});

describe('validateEnv', () => {
  it('reports a clean file as valid with counts', () => {
    const { ok, report } = validateEnv('A=1\nB="two words"\n# note\n');
    expect(ok).toBe(true);
    expect(report).toContain('Variables: 2');
    expect(report).toContain('Comments skipped: 1');
    expect(report).toContain('Blank lines: 0');
    expect(report).toContain('No issues found.');
  });

  it('turns duplicates and malformed lines into issues with line numbers', () => {
    const { ok, report } = validateEnv("A=1\nA=2\nBROKEN\nC='x'\n");
    expect(ok).toBe(false);
    expect(report).toContain('Duplicate keys:');
    expect(report).toContain('A (lines 1, 2)');
    expect(report).toContain('Missing "=" — BROKEN');
    expect(report).toContain('Not valid: 2 issues found.');
  });

  it('warns about unquoted values, empty values, and case-only keys without failing', () => {
    const { ok, report } = validateEnv('A=hello world\nB=$HOME/x\nC=\nDB_HOST=x\ndb_host=y\n');
    expect(ok).toBe(true);
    expect(report).toContain('Warnings:');
    expect(report).toContain('A is unquoted and contains spaces or $');
    expect(report).toContain('B is unquoted and contains spaces or $');
    expect(report).toContain('C has an empty value.');
    expect(report).toContain('Keys differ only by case: DB_HOST (line 4), db_host (line 5).');
  });

  it('counts blank lines without inventing one for a trailing newline', () => {
    const { report } = validateEnv('# head\n\nA=1\n\nB=2\n');
    expect(report).toContain('Variables: 2');
    expect(report).toContain('Comments skipped: 1');
    expect(report).toContain('Blank lines: 2');
    expect(validateEnv('').report).toContain('Blank lines: 0');
  });
});

describe('diffEnv', () => {
  it('sorts added, removed, and changed keys by key and counts unchanged', () => {
    const diff = diffEnv(
      'Z=1\nA=1\nSHARED=old\nSAME=1',
      'Y=1\nB=1\nSHARED=new\nSAME=1\nEXTRA=2',
    );
    expect(diff.added.map((entry) => entry.key)).toEqual(['B', 'EXTRA', 'Y']);
    expect(diff.added[0]).toEqual({ key: 'B', value: '1', line: 2 });
    expect(diff.removed.map((entry) => entry.key)).toEqual(['A', 'Z']);
    expect(diff.removed[0]).toEqual({ key: 'A', value: '1', line: 2 });
    expect(diff.changed).toEqual([{ key: 'SHARED', from: 'old', to: 'new', line: 3 }]);
    expect(diff.unchanged).toBe(1);
  });

  it('compares the last value of a duplicate key', () => {
    const diff = diffEnv('A=1\nA=2', 'A=2');
    expect(diff.changed).toEqual([]);
    expect(diff.unchanged).toBe(1);
  });

  it('treats case-only key differences as a removal and an addition', () => {
    expect(diffEnv('FOO=1', 'foo=1')).toEqual({
      added: [{ key: 'foo', value: '1', line: 1 }],
      removed: [{ key: 'FOO', value: '1', line: 1 }],
      changed: [],
      unchanged: 0,
    });
  });

  it('formats a summary with markers and an unchanged count', () => {
    const text = formatEnvDiff(diffEnv('A=1\nB=1', 'A=2\nC=1'));
    expect(text).toBe('+ C=1 (line 2)\n- B=1 (line 2)\n~ A: 1 -> 2 (line 1)\nUnchanged: 0');
    expect(formatEnvDiff(diffEnv('A=1', 'A=1'))).toBe('No differences found.\nUnchanged: 1');
  });
});

describe('sample data', () => {
  it('parses cleanly and carries a deliberate duplicate', () => {
    const parsed = parseEnv(ENV_SAMPLE);
    expect(parsed.errors).toEqual([]);
    expect(parsed.duplicates).toEqual([{ key: 'PORT', lines: [3, 8] }]);
  });

  it('shows added, removed, and changed keys against the compare sample', () => {
    const diff = diffEnv(ENV_SAMPLE, ENV_SAMPLE_COMPARE);
    expect(diff.added.map((entry) => entry.key)).toEqual(['FEATURE_FLAGS']);
    expect(diff.removed.map((entry) => entry.key)).toEqual(['LOG_LEVEL']);
    expect(diff.changed.map((change) => change.key)).toEqual(['APP_ENV', 'PORT']);
    expect(diff.unchanged).toBe(3);
  });
});
