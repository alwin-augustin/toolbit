import { describe, expect, it } from 'vitest';
import {
  dedupeLines,
  lineCount,
  numberLines,
  removeEmptyLines,
  replaceText,
  reverseLines,
  shuffleLines,
  sortLines,
  TEXT_TOOLS_SAMPLE,
  trimLines,
} from '@/features/tools/text-tools/TextToolsScreen';

describe('sortLines', () => {
  it('sorts alphabetically in both directions', () => {
    expect(sortLines('pear\napple\nfig', 'asc', false)).toBe('apple\nfig\npear');
    expect(sortLines('pear\napple\nfig', 'desc', false)).toBe('pear\nfig\napple');
  });

  it('orders numeric lines by value, not lexicographically', () => {
    expect(sortLines('10 apples\n9 plums\n100 oranges', 'asc', true)).toBe(
      '9 plums\n10 apples\n100 oranges',
    );
    expect(sortLines('10 apples\n9 plums\n100 oranges', 'desc', true)).toBe(
      '100 oranges\n10 apples\n9 plums',
    );
    // The same lines without numeric mode sort as text, where "10" precedes "9".
    expect(sortLines('10\n9', 'asc', false)).toBe('10\n9');
  });

  it('falls back to locale compare for lines without a leading number', () => {
    expect(sortLines('beta\nalpha', 'asc', true)).toBe('alpha\nbeta');
  });

  it('keeps the original order of lines that share a leading number', () => {
    // Both lines are keyed by 2; stability is what keeps zebras before apples.
    expect(sortLines('2 zebras\n2 apples\n1 dog', 'asc', true)).toBe('1 dog\n2 zebras\n2 apples');
    expect(sortLines('2 zebras\n2 apples', 'desc', true)).toBe('2 zebras\n2 apples');
  });

  it('preserves a single trailing newline', () => {
    expect(sortLines('b\na\n', 'asc', false)).toBe('a\nb\n');
  });
});

describe('dedupeLines', () => {
  it('removes later duplicates and counts them', () => {
    expect(dedupeLines('a\nb\na\nc\nb\n', false)).toEqual({ text: 'a\nb\nc\n', removed: 2 });
  });

  it('treats lines as equal ignoring case only when asked', () => {
    expect(dedupeLines('Apple\napple\nAPPLE', true)).toEqual({ text: 'Apple', removed: 2 });
    expect(dedupeLines('Apple\napple\nAPPLE', false)).toEqual({
      text: 'Apple\napple\nAPPLE',
      removed: 0,
    });
  });

  it('keeps one of repeated blank lines', () => {
    expect(dedupeLines('a\n\n\nb\n', false)).toEqual({ text: 'a\n\nb\n', removed: 1 });
  });
});

describe('reverseLines', () => {
  it('reverses line order and nothing else', () => {
    expect(reverseLines('one\ntwo\nthree')).toBe('three\ntwo\none');
    expect(reverseLines('one\ntwo\n')).toBe('two\none\n');
  });
});

describe('numberLines', () => {
  it('formats each numbering style', () => {
    expect(numberLines('alpha\nbeta', 'dot')).toBe('1. alpha\n2. beta');
    expect(numberLines('alpha\nbeta', 'pipe')).toBe('1 | alpha\n2 | beta');
    expect(numberLines('alpha\nbeta', 'word')).toBe('alpha 1\nbeta 2');
  });

  it('preserves a trailing newline', () => {
    expect(numberLines('alpha\n', 'dot')).toBe('1. alpha\n');
  });
});

describe('shuffleLines', () => {
  it('is deterministic for a fixed seed buffer and preserves the line multiset', () => {
    const seed = new Uint32Array([3, 1, 4, 1, 5, 9, 2, 6]);
    const first = shuffleLines('a\nb\nc\nd\ne', seed);
    const second = shuffleLines('a\nb\nc\nd\ne', seed);
    expect(first.text).toBe(second.text);
    expect(first.text.split('\n').slice().sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('actually reorders lines and keeps a trailing newline', () => {
    const shuffled = shuffleLines('a\nb\nc', new Uint32Array([0, 0, 0]));
    expect(shuffled.text).not.toBe('a\nb\nc');
    const withNewline = shuffleLines('a\nb\n', new Uint32Array([7]));
    expect(withNewline.text.endsWith('\n')).toBe(true);
    expect(lineCount(withNewline.text)).toBe(2);
  });
});

describe('trimLines', () => {
  it('trims every line and the text as a whole', () => {
    expect(trimLines('  alpha  \n  beta  ')).toBe('alpha\nbeta');
    expect(trimLines('\n  alpha  \n\n  beta  \n')).toBe('alpha\n\nbeta\n');
  });
});

describe('removeEmptyLines', () => {
  it('removes empty and whitespace-only lines', () => {
    expect(removeEmptyLines('alpha\n\n  \nbeta\n')).toBe('alpha\nbeta\n');
    expect(removeEmptyLines('\n\nalpha')).toBe('alpha');
  });
});

describe('replaceText', () => {
  it('expands $1 group references in regex mode', () => {
    expect(replaceText('John Smith', '(\\w+) (\\w+)', '$2 $1', true, true)).toEqual({
      ok: true,
      text: 'Smith John',
      count: 1,
    });
  });

  it('reports invalid regexes instead of throwing', () => {
    const result = replaceText('abc', '(', '', true, true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unterminated/i);
  });

  it('treats an empty search as an error in both modes', () => {
    expect(replaceText('abc', '', 'x', false, true).ok).toBe(false);
    expect(replaceText('abc', '', 'x', true, true).ok).toBe(false);
  });

  it('counts every literal occurrence', () => {
    expect(replaceText('a-a-a', 'a', 'b', false, true)).toEqual({
      ok: true,
      text: 'b-b-b',
      count: 3,
    });
  });

  it('honours the case-sensitivity flag in both modes', () => {
    expect(replaceText('Cat cat', 'cat', 'dog', false, true)).toEqual({
      ok: true,
      text: 'Cat dog',
      count: 1,
    });
    expect(replaceText('Cat cat', 'cat', 'dog', false, false)).toEqual({
      ok: true,
      text: 'dog dog',
      count: 2,
    });
    expect(replaceText('Cat cat', 'cat', 'dog', true, true)).toEqual({
      ok: true,
      text: 'Cat dog',
      count: 1,
    });
    expect(replaceText('Cat cat', 'cat', 'dog', true, false)).toEqual({
      ok: true,
      text: 'dog dog',
      count: 2,
    });
  });

  it('does not match across lines without the m and s flags', () => {
    // ^ and $ anchor the whole string in JavaScript regexes, so a per-line
    // pattern needs the m flag, which this tool never adds.
    expect(replaceText('foo\nfoo', '^foo$', 'bar', true, true)).toEqual({
      ok: true,
      text: 'foo\nfoo',
      count: 0,
    });
    // . does not cross a newline without s, so a cross-line pattern is inert.
    expect(replaceText('a\nb', 'a.b', 'x', true, true)).toEqual({
      ok: true,
      text: 'a\nb',
      count: 0,
    });
  });

  it('keeps a trailing newline and multi-line text intact', () => {
    expect(replaceText('one\ntwo\n', 'two', 'three', false, true)).toEqual({
      ok: true,
      text: 'one\nthree\n',
      count: 1,
    });
  });
});

describe('TEXT_TOOLS_SAMPLE', () => {
  it('carries duplicates, a blank line, and numeric lines for the demo', () => {
    expect(lineCount(TEXT_TOOLS_SAMPLE)).toBeGreaterThanOrEqual(8);
    expect(dedupeLines(TEXT_TOOLS_SAMPLE, false).removed).toBeGreaterThan(0);
    expect(TEXT_TOOLS_SAMPLE.split('\n').some((line) => line.trim() === '')).toBe(true);
    expect(TEXT_TOOLS_SAMPLE.split('\n').some((line) => /^\s*\d+/.test(line))).toBe(true);
  });
});
