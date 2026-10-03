import { describe, expect, it } from 'vitest';
import {
  addDaysToDate,
  calculateDateDifference,
} from '@/features/tools/date-calculator/DateCalcScreen';
import {
  createSeededRandom,
  formatFakeRecords,
  generateFakeRecords,
  type FakeRecord,
} from '@/features/tools/fake-data-generator/FakeDataScreen';
import { generateLorem } from '@/features/tools/lorem-ipsum-generator/LoremScreen';
import {
  formatHsl,
  formatRgb,
  hexToRgb,
  hslToRgb,
  rgbToHex,
  rgbToHsl,
} from '@/features/tools/color-converter/ColorScreen';
import { convertUnitValue } from '@/features/tools/unit-converter/UnitScreen';
import {
  formatImageSize,
  heightForWidth,
  needsWhiteBackground,
  outputFileName,
  qualityForFormat,
  widthForHeight,
} from '@/features/tools/image-converter/ImageScreen';
import {
  formatPdfSize,
  moveEntry,
  parsePageIndices,
  rotateFileName,
  splitFileName,
  validatePdfUpload,
} from '@/features/tools/pdf-tools/PdfScreen';

describe('date math', () => {
  it('ports the legacy difference breakdown exactly', () => {
    expect(calculateDateDifference('2024-01-01', '2024-01-08')).toEqual({
      years: 0,
      months: 0,
      weeks: 1,
      days: 7,
      hours: 168,
      minutes: 10080,
      seconds: 604800,
    });
  });

  it('is order-independent via absolute gap', () => {
    expect(calculateDateDifference('2024-01-08', '2024-01-01')).toEqual(
      calculateDateDifference('2024-01-01', '2024-01-08'),
    );
  });

  it('returns zeros for the same date', () => {
    expect(calculateDateDifference('2024-05-05', '2024-05-05')).toMatchObject({ days: 0 });
  });

  it('covers a leap day inside the gap', () => {
    expect(calculateDateDifference('2024-02-28', '2024-03-01')?.days).toBe(2);
  });

  it('returns null for missing or invalid input', () => {
    expect(calculateDateDifference('', '2024-01-01')).toBeNull();
    expect(calculateDateDifference('nope', '2024-01-01')).toBeNull();
  });

  it('adds and subtracts calendar days', () => {
    expect(addDaysToDate('2024-01-01', 7)).toBe('2024-01-08');
    expect(addDaysToDate('2024-01-08', -7)).toBe('2024-01-01');
    expect(addDaysToDate('2023-12-31', 1)).toBe('2024-01-01');
  });

  it('lands on Feb 29 when adding across a leap day', () => {
    expect(addDaysToDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysToDate('2024-02-28', 2)).toBe('2024-03-01');
  });

  it('stays DST-safe across the spring-forward weekend', () => {
    // US DST 2026 starts Mar 8; calendar math must not skip or repeat a day.
    expect(addDaysToDate('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDaysToDate('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDaysToDate('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('returns null for bad shift input', () => {
    expect(addDaysToDate('', 1)).toBeNull();
    expect(addDaysToDate('nope', 1)).toBeNull();
  });
});

describe('seeded fake data', () => {
  it('replays the same fixtures for one seed', () => {
    expect(generateFakeRecords(5, 42)).toEqual(generateFakeRecords(5, 42));
  });

  it('diverges for different seeds', () => {
    expect(generateFakeRecords(5, 1)).not.toEqual(generateFakeRecords(5, 2));
  });

  it('emits a stable PRNG stream', () => {
    const a = createSeededRandom(7);
    const b = createSeededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('formats JSON with the selected fields only', () => {
    const records: FakeRecord[] = generateFakeRecords(2, 9);
    const parsed = JSON.parse(formatFakeRecords(records, 'json', ['firstName', 'email']));
    expect(parsed).toHaveLength(2);
    expect(Object.keys(parsed[0]).sort()).toEqual(['email', 'firstName']);
  });

  it('formats CSV with header plus quoted rows', () => {
    const records: FakeRecord[] = generateFakeRecords(2, 9);
    const lines = formatFakeRecords(records, 'csv', ['firstName', 'lastName']).split('\n');
    expect(lines[0]).toBe('firstName,lastName');
    expect(lines).toHaveLength(3);
  });

  it('formats SQL inserts and escapes quotes', () => {
    const records: FakeRecord[] = [
      {
        firstName: "O'Brien",
        lastName: 'Lee',
        email: 'o@x.com',
        phone: '1',
        address: 'a',
        city: 'c',
        state: 's',
        zip: 'z',
        company: 'co',
      },
    ];
    expect(formatFakeRecords(records, 'sql', ['firstName', 'lastName'])).toBe(
      "INSERT INTO users (firstName, lastName) VALUES ('O''Brien', 'Lee');",
    );
  });
});

describe('lorem counts', () => {
  const zero = () => 0;

  it('emits exactly N words', () => {
    const words = generateLorem(
      'words',
      10,
      { startWithLorem: false, htmlOutput: false },
      zero,
    ).split(' ');
    expect(words).toHaveLength(10);
  });

  it('forces the lorem/ipsum opening in words mode', () => {
    const words = generateLorem(
      'words',
      5,
      { startWithLorem: true, htmlOutput: false },
      zero,
    ).split(' ');
    expect(words.slice(0, 2)).toEqual(['lorem', 'ipsum']);
  });

  it('emits exactly N sentences', () => {
    const text = generateLorem('sentences', 4, { startWithLorem: false, htmlOutput: false }, zero);
    expect(text.split('. ').length).toBe(4);
  });

  it('replaces the first sentence with the classic opener', () => {
    const text = generateLorem('sentences', 2, { startWithLorem: true, htmlOutput: false }, zero);
    expect(text.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')).toBe(true);
  });

  it('emits exactly N paragraphs and wraps HTML when asked', () => {
    const plain = generateLorem(
      'paragraphs',
      3,
      { startWithLorem: false, htmlOutput: false },
      zero,
    );
    expect(plain.split('\n\n')).toHaveLength(3);
    const html = generateLorem('paragraphs', 2, { startWithLorem: false, htmlOutput: true }, zero);
    expect(html.split('\n\n').every((p) => p.startsWith('<p>') && p.endsWith('</p>'))).toBe(true);
  });
});

describe('color round-trips', () => {
  it('parses the sample hex into rgb and hsl', () => {
    expect(hexToRgb('#3b82f6')).toEqual({ r: 59, g: 130, b: 246 });
    expect(rgbToHsl(59, 130, 246)).toEqual({ h: 217, s: 91, l: 60 });
  });

  it('rejects non-6-digit hex', () => {
    expect(hexToRgb('#fff')).toBeNull();
    expect(hexToRgb('not-a-color')).toBeNull();
  });

  it('round-trips primary colors through hex', () => {
    for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000']) {
      const rgb = hexToRgb(hex);
      expect(rgb).not.toBeNull();
      expect(rgbToHex(rgb!.r, rgb!.g, rgb!.b)).toBe(hex);
    }
  });

  it('round-trips rgb through hsl for saturated colors', () => {
    for (const rgb of [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 128, b: 0 },
      { r: 59, g: 130, b: 246 },
    ]) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const back = hslToRgb(hsl.h, hsl.s, hsl.l);
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
    }
  });

  it('maps red to the known hsl anchor', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('formats css strings', () => {
    expect(formatRgb({ r: 1, g: 2, b: 3 })).toBe('rgb(1, 2, 3)');
    expect(formatHsl({ h: 1, s: 2, l: 3 })).toBe('hsl(1, 2%, 3%)');
  });
});

describe('unit conversions', () => {
  it('converts length within the metric system', () => {
    expect(convertUnitValue(1, 'km', 'm')).toBe(1000);
  });

  it('converts across imperial and metric', () => {
    expect(convertUnitValue(1, 'mi', 'km')).toBeCloseTo(1.609344, 5);
  });

  it('converts freezing point between temperature scales', () => {
    expect(convertUnitValue(32, 'F', 'C')).toBeCloseTo(0, 5);
  });

  it('is the identity for same-unit conversion', () => {
    expect(convertUnitValue(5, 'kg', 'kg')).toBe(5);
  });
});

describe('image helpers', () => {
  it('formats byte sizes like the legacy tool', () => {
    expect(formatImageSize(500)).toBe('500 B');
    expect(formatImageSize(2048)).toBe('2.0 KB');
    expect(formatImageSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('requires a white base only for JPEG', () => {
    expect(needsWhiteBackground('image/jpeg')).toBe(true);
    expect(needsWhiteBackground('image/png')).toBe(false);
    expect(needsWhiteBackground('image/webp')).toBe(false);
  });

  it('ignores quality for PNG and scales lossy quality', () => {
    expect(qualityForFormat('image/png', 85)).toBeUndefined();
    expect(qualityForFormat('image/jpeg', 85)).toBe(0.85);
    expect(qualityForFormat('image/webp', 1)).toBe(0.01);
  });

  it('derives output names from the source file', () => {
    expect(outputFileName('photo.heic', 'image/jpeg')).toBe('photo.jpg');
    expect(outputFileName('photo.png', 'image/webp')).toBe('photo.webp');
  });

  it('locks aspect ratio for resize math', () => {
    expect(heightForWidth(800, 600, 400)).toBe(300);
    expect(widthForHeight(800, 600, 300)).toBe(400);
  });
});

describe('pdf helpers', () => {
  it('parses mixed range specs and clamps to the document', () => {
    expect(parsePageIndices('1-3', 10)).toEqual([0, 1, 2]);
    expect(parsePageIndices('1,3,5-6', 10)).toEqual([0, 2, 4, 5]);
    expect(parsePageIndices('8-99', 10)).toEqual([7, 8, 9]);
    expect(parsePageIndices('0,99', 10)).toEqual([]);
  });

  it('names split and rotate downloads like the legacy tool', () => {
    expect(splitFileName('1-3')).toBe('split_p1-3.pdf');
    expect(rotateFileName(90)).toBe('rotated_90deg.pdf');
  });

  it('formats byte sizes like the legacy tool', () => {
    expect(formatPdfSize(500)).toBe('500 B');
    expect(formatPdfSize(2048)).toBe('2.0 KB');
  });

  it('rejects non-PDF types and oversized files', () => {
    expect(validatePdfUpload('a.png', 'image/png', 10)).toBe('a.png is not a PDF');
    expect(validatePdfUpload('a.pdf', 'application/pdf', 60 * 1024 * 1024)).toBe(
      'a.pdf exceeds 50MB limit',
    );
    expect(validatePdfUpload('a.pdf', 'application/pdf', 10)).toBeNull();
  });

  it('reorders merge entries without mutating the ends', () => {
    expect(moveEntry(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveEntry(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveEntry(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
  });
});

// Canvas conversion (ImageScreen) and pdf-lib merge/split/rotate (PdfScreen)
// run only against live DOM/canvas and real PDF bytes, so they stay
// component-level behavior here; the pure helpers above cover the logic.
describe.skip('dom-only operations', () => {
  it.skip('image canvas convert + download needs a browser canvas (skipped: no canvas in unit env)', () => {});
  it.skip('pdf-lib merge/split/rotate needs real PDF bytes (skipped: DOM/file-level ops)', () => {});
});
