import { describe, expect, it } from 'vitest';
import { arrayBufferToHex, computeDigests, md5 } from '@/features/tools/hash-generator/HashScreen';
import { convertCases } from '@/features/tools/case-converter/CaseScreen';
import { computeWordStats, readingTimeText } from '@/features/tools/word-counter/WordScreen';

describe('hash digests', () => {
  it('computes the MD5 test-suite vectors', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5('Hello, World!')).toBe('65a8e27d8879283831b664bd8b7f0ad4');
  });

  it('hex-encodes buffers without dropping leading zeros', () => {
    expect(arrayBufferToHex(new Uint8Array([0, 15, 255]).buffer)).toBe('000fff');
  });

  it('computes all four digests for "abc"', async () => {
    expect(await computeDigests('abc')).toEqual({
      md5: '900150983cd24fb0d6963f7d28e17f72',
      sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
      sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      sha512:
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    });
  });

  it('computes all four digests for "Hello, World!"', async () => {
    expect(await computeDigests('Hello, World!')).toEqual({
      md5: '65a8e27d8879283831b664bd8b7f0ad4',
      sha1: '0a0a9f2a6772942557ab5355d76af442f8f65e01',
      sha256: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
      sha512:
        '374d794a95cdcfd8b35993185fef9ba368f160d8daf432d08ba9f1ed1e5abe6cc69291e0fa2fe0006a52570ef18c19def4e617c33ce52ef0a6e5fbe318cb0387',
    });
  });
});

describe('case conversion', () => {
  it('produces all 8 cases for a two-word input', () => {
    expect(convertCases('hello world')).toEqual({
      upper: 'HELLO WORLD',
      lower: 'hello world',
      title: 'Hello World',
      camel: 'helloWorld',
      pascal: 'HelloWorld',
      snake: 'hello_world',
      kebab: 'hello-world',
      constant: 'HELLO_WORLD',
    });
  });

  it('trims surrounding whitespace before converting', () => {
    const result = convertCases('  Hello World Example  ');
    expect(result.upper).toBe('HELLO WORLD EXAMPLE');
    expect(result.snake).toBe('hello_world_example');
    expect(result.kebab).toBe('hello-world-example');
    expect(result.constant).toBe('HELLO_WORLD_EXAMPLE');
    expect(result.camel).toBe('helloWorldExample');
    expect(result.pascal).toBe('HelloWorldExample');
  });

  it('returns empty strings for blank input', () => {
    expect(convertCases('   ')).toEqual({
      upper: '',
      lower: '',
      title: '',
      camel: '',
      pascal: '',
      snake: '',
      kebab: '',
      constant: '',
    });
  });
});

describe('word stats', () => {
  it('returns zeros for empty input', () => {
    expect(computeWordStats('')).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      sentences: 0,
    });
  });

  it('matches the legacy counts for a two-paragraph sample', () => {
    expect(computeWordStats('Hello world.\n\nSecond paragraph here.')).toEqual({
      characters: 36,
      charactersNoSpaces: 31,
      words: 5,
      lines: 3,
      paragraphs: 2,
      sentences: 2,
    });
  });

  it('counts lines, single paragraph, and unfinished sentences', () => {
    const stats = computeWordStats('one two three\nfour five');
    expect(stats.words).toBe(5);
    expect(stats.lines).toBe(2);
    expect(stats.paragraphs).toBe(1);
    expect(stats.sentences).toBe(1);
  });

  it('formats reading time at 200 words per minute', () => {
    expect(readingTimeText(0)).toBe('0 sec');
    expect(readingTimeText(100)).toBe('30 sec');
    expect(readingTimeText(200)).toBe('1 min');
    expect(readingTimeText(450)).toBe('2 min 15 sec');
  });
});
