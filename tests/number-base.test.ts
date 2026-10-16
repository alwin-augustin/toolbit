import { describe, expect, it } from 'vitest';
import {
  NUMBER_BASE_SAMPLE,
  convertBigInt,
  conversionLines,
  describeFloatValue,
  floatBitsToText,
  parseBigIntInput,
  textToFloatBits,
  type BaseChoice,
  type FloatWidth,
} from '@/features/tools/number-base-converter/NumberBaseScreen';

/** Parses and fails loudly, so each assertion reads from the value. */
function parsed(input: string, base: BaseChoice = 'auto') {
  const result = parseBigIntInput(input, base);
  if (!result.ok) throw new Error(`expected ${JSON.stringify(input)} to parse: ${result.error}`);
  return result;
}

function parseError(input: string, base: BaseChoice = 'auto'): string {
  const result = parseBigIntInput(input, base);
  if (result.ok) throw new Error(`expected ${JSON.stringify(input)} to be rejected`);
  return result.error;
}

function encoded(input: string, width: FloatWidth) {
  const result = textToFloatBits(input, width);
  if (!result.ok) throw new Error(`expected ${JSON.stringify(input)} to encode: ${result.error}`);
  return result;
}

function encodeError(input: string, width: FloatWidth): string {
  const result = textToFloatBits(input, width);
  if (result.ok) throw new Error(`expected ${JSON.stringify(input)} to be rejected`);
  return result.error;
}

function decoded(input: string, width: FloatWidth) {
  const result = floatBitsToText(input, width);
  if (!result.ok) throw new Error(`expected ${JSON.stringify(input)} to decode: ${result.error}`);
  return result;
}

function decodeError(input: string, width: FloatWidth): string {
  const result = floatBitsToText(input, width);
  if (result.ok) throw new Error(`expected ${JSON.stringify(input)} to be rejected`);
  return result.error;
}

describe('number base parsing', () => {
  it('reads 0xff as hex without being told', () => {
    expect(parsed('0xff')).toEqual({ ok: true, value: 255n, base: 'hex', negative: false });
  });

  it('detects the 0b, 0o and 0x prefixes, upper or lower case', () => {
    expect(parsed('0b1010').base).toBe('bin');
    expect(parsed('0B1010').value).toBe(10n);
    expect(parsed('0o17').value).toBe(15n);
    expect(parsed('0O17').base).toBe('oct');
    expect(parsed('0XFF').value).toBe(255n);
  });

  it('reads unprefixed digits as decimal', () => {
    // The screen documents this: a bare 1010 is one thousand and ten.
    expect(parsed('1010').base).toBe('dec');
    expect(parsed('1010').value).toBe(1010n);
    expect(parsed('12', 'auto').base).toBe('dec');
  });

  it('allows a sign in front of a prefix', () => {
    expect(parsed('-0x10')).toMatchObject({ value: -16n, base: 'hex', negative: true });
    expect(parsed('+0b11')).toMatchObject({ value: 3n, base: 'bin', negative: false });
  });

  it('ignores spaces, underscores and commas as separators', () => {
    expect(parsed('1_000', 'dec').value).toBe(1000n);
    expect(parsed('ff ff', 'hex').value).toBe(65535n);
    expect(parsed('1,000,000').value).toBe(1000000n);
    expect(parsed(' 0x_ff ').value).toBe(255n);
  });

  it('accepts a matching prefix under an explicit base', () => {
    expect(parsed('0xff', 'hex').value).toBe(255n);
    expect(parsed('0b11', 'bin').value).toBe(3n);
    expect(parsed('0o7', 'oct').value).toBe(7n);
  });

  it('rejects digits that belong to another base', () => {
    expect(parseError('12', 'bin')).toContain('binary');
    expect(parseError('8', 'oct')).toContain('octal');
    expect(parseError('g', 'hex')).toContain('hex');
    expect(parseError('0x10', 'dec')).toContain('decimal');
  });

  it('rejects empty input, a bare sign and a bare prefix', () => {
    expect(parseError('')).toBe('Enter a number.');
    expect(parseError('   ')).toBe('Enter a number.');
    expect(parseError('-', 'dec')).toContain('sign');
    expect(parseError('0x')).toContain('0x');
  });

  it('treats -0 as plain zero', () => {
    expect(parsed('-0')).toEqual({ ok: true, value: 0n, base: 'dec', negative: false });
  });
});

describe('base conversion', () => {
  it('keeps the 0xff family in every base', () => {
    expect(convertBigInt(255n)).toEqual({
      bin: '11111111',
      oct: '377',
      dec: '255',
      hex: 'ff',
      groupedBin: '1111 1111',
      bitLength: 8,
      bytes: 1,
      twosComplement64: null,
    });
  });

  it('groups binary into nibbles from the right', () => {
    expect(convertBigInt(5n).groupedBin).toBe('101');
    expect(convertBigInt(256n).groupedBin).toBe('1 0000 0000');
  });

  it('keeps integers past 2^53 exact', () => {
    const decimal = parsed('18446744073709551615');
    expect(decimal.base).toBe('dec');
    expect(decimal.value.toString()).toBe('18446744073709551615');
    expect(convertBigInt(decimal.value)).toMatchObject({
      dec: '18446744073709551615',
      hex: 'ffffffffffffffff',
      bitLength: 64,
      bytes: 8,
    });
    const fromHex = parsed('ffffffffffffffff', 'hex');
    expect(fromHex.value).toBe(18446744073709551615n);
    // 16 full nibbles, so no padding to explain away.
    expect(convertBigInt(fromHex.value).groupedBin.split(' ')).toHaveLength(16);
  });

  it("wraps negative values into 64-bit two's complement", () => {
    expect(convertBigInt(-1n).twosComplement64).toBe('ffffffffffffffff');
    expect(convertBigInt(-255n).twosComplement64).toBe('ffffffffffffff01');
    expect(convertBigInt(-1n).dec).toBe('-1');
    expect(convertBigInt(-255n).groupedBin).toBe('-1111 1111');
    expect(convertBigInt(255n).twosComplement64).toBeNull();
  });

  it('reads zero as no bits and rounds the byte width up', () => {
    expect(convertBigInt(0n)).toMatchObject({ groupedBin: '0', bitLength: 0, bytes: 0 });
    expect(convertBigInt(255n)).toMatchObject({ bitLength: 8, bytes: 1 });
    expect(convertBigInt(256n)).toMatchObject({ bitLength: 9, bytes: 2 });
    expect(convertBigInt(2n ** 64n)).toMatchObject({ bitLength: 65, bytes: 9 });
  });

  it('writes one labelled line per base for Copy all', () => {
    expect(conversionLines(convertBigInt(255n))).toBe(
      'Binary: 11111111\nOctal: 377\nDecimal: 255\nHex: ff',
    );
    expect(conversionLines(convertBigInt(-1n))).toContain(
      "Two's complement (64-bit): ffffffffffffffff",
    );
  });
});

describe('float text to bits', () => {
  it('encodes 1 exactly in both widths', () => {
    expect(encoded('1', 32)).toEqual({
      ok: true,
      hex: '3f800000',
      bits: '0011 1111 1000 0000 0000 0000 0000 0000',
      roundTrip: '1',
    });
    expect(encoded('1', 64)).toEqual({
      ok: true,
      hex: '3ff0000000000000',
      bits: '0011 1111 1111 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000',
      roundTrip: '1',
    });
  });

  it('rounds 0.1 to the float32 grid but not the double', () => {
    expect(encoded('0.1', 32).hex).toBe('3dcccccd');
    expect(encoded('0.1', 32).roundTrip).toBe('0.10000000149011612');
    expect(encoded('0.1', 64).hex).toBe('3fb999999999999a');
    expect(encoded('0.1', 64).roundTrip).toBe('0.1');
  });

  it('keeps the sign and negative zero', () => {
    expect(encoded('-1', 32).hex).toBe('bf800000');
    expect(encoded('-0', 64)).toMatchObject({ hex: '8000000000000000', roundTrip: '-0' });
  });

  it('accepts exponents and rejects words and hex patterns', () => {
    expect(encoded('6.022e23', 64).roundTrip).toBe('6.022e+23');
    expect(encodeError('NaN', 32)).toContain('decimal');
    expect(encodeError('Infinity', 64)).toContain('decimal');
    expect(encodeError('-Infinity', 64)).toContain('decimal');
    expect(encodeError('0x3f800000', 32)).toContain('decimal');
    expect(encodeError('', 32)).toBe('Enter a decimal number.');
  });

  it('rejects what the chosen width cannot hold', () => {
    expect(encodeError('1e40', 32)).toContain('32-bit');
    expect(encoded('1e40', 64).roundTrip).toBe('1e+40');
    expect(encodeError('1e400', 64)).toContain('overflows');
  });
});

describe('float bits to text', () => {
  it('decodes 0x3f800000 to 1', () => {
    expect(decoded('0x3f800000', 32)).toEqual({
      ok: true,
      hex: '3f800000',
      bits: '0011 1111 1000 0000 0000 0000 0000 0000',
      value: '1',
    });
  });

  it('takes raw or prefixed hex, with spaces allowed', () => {
    expect(decoded('3f800000', 32).value).toBe('1');
    expect(decoded('3F80 0000', 32).value).toBe('1');
    expect(decoded('3ff0000000000000', 64).value).toBe('1');
  });

  it('rejects the wrong number of hex digits for the width', () => {
    expect(decodeError('3f80', 32)).toContain('exactly 8');
    expect(decodeError('3f800000', 64)).toContain('exactly 16');
    expect(decodeError('0x3f800000', 64)).toContain('exactly 16');
  });

  it('rejects non-hex characters and an empty pattern', () => {
    expect(decodeError('zzzzzzzz', 32)).toContain('hex');
    expect(decodeError('0x', 32)).toBe('Enter hex bits.');
  });

  it('names NaN, the infinities and negative zero', () => {
    expect(decoded('7fc00000', 32).value).toBe('NaN');
    expect(decoded('7f800000', 32).value).toBe('Infinity');
    expect(decoded('ff800000', 32).value).toBe('-Infinity');
    expect(decoded('80000000', 32).value).toBe('-0');
  });

  it('keeps subnormals readable and names them', () => {
    const tiny = decoded('00000001', 32);
    expect(tiny.value).toBe('1.401298464324817e-45');
    expect(describeFloatValue(Number(tiny.value), 32)).toBe('Subnormal (denormal)');
    const smallest = decoded('0000000000000001', 64);
    expect(smallest.value).toBe('5e-324');
    expect(describeFloatValue(Number(smallest.value), 64)).toBe('Subnormal (denormal)');
  });

  it('round-trips a decoded float32 back through the encoder', () => {
    const value = decoded('3dcccccd', 32).value;
    expect(value).toBe('0.10000000149011612');
    expect(encoded(value, 32).hex).toBe('3dcccccd');
  });

  it('reports no special form for ordinary values', () => {
    expect(describeFloatValue(1, 32)).toBeNull();
    expect(describeFloatValue(-0, 64)).toBe('Negative zero');
    expect(describeFloatValue(Infinity, 32)).toBe('Infinity');
  });
});

describe('sample', () => {
  it('opens on a prefixed hex number that reads as 255', () => {
    expect(NUMBER_BASE_SAMPLE).toBe('0xff');
    const read = parsed(NUMBER_BASE_SAMPLE);
    expect(read.base).toBe('hex');
    expect(convertBigInt(read.value).dec).toBe('255');
  });
});
