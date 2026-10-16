import { useEffect, useMemo } from 'react';
import {
  IconCircleCheck,
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconEraser,
  IconSparkles,
} from '@tabler/icons-react';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { usePublishedResult } from '@/shared/result-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export type Base = 'bin' | 'oct' | 'dec' | 'hex';

export type BaseChoice = 'auto' | Base;

export type ParseResult =
  { ok: true; value: bigint; base: Base; negative: boolean } | { ok: false; error: string };

export interface BigIntConversion {
  bin: string;
  oct: string;
  dec: string;
  hex: string;
  groupedBin: string;
  bitLength: number;
  bytes: number;
  twosComplement64: string | null;
}

export type FloatWidth = 32 | 64;

export type FloatBitsResult =
  { ok: true; hex: string; bits: string; roundTrip: string } | { ok: false; error: string };

export type FloatTextResult =
  { ok: true; hex: string; bits: string; value: string } | { ok: false; error: string };

export const NUMBER_BASE_SAMPLE = '0xff';

const BASE_NAMES: Record<Base, string> = {
  bin: 'binary',
  oct: 'octal',
  dec: 'decimal',
  hex: 'hex',
};

const BASE_PREFIXES: Record<Base, string> = { bin: '0b', oct: '0o', dec: '', hex: '0x' };

const DIGIT_RULES: Record<Base, { allowed: RegExp; hint: string }> = {
  bin: { allowed: /[01]/, hint: 'Binary uses only 0 and 1.' },
  oct: { allowed: /[0-7]/, hint: 'Octal uses only 0-7.' },
  dec: { allowed: /[0-9]/, hint: 'Decimal uses only 0-9.' },
  hex: { allowed: /[0-9a-f]/, hint: 'Hex uses only 0-9 and a-f.' },
};

/** A leading 0x/0b/0o picks the base; anything else is read as decimal. */
function detectBase(digits: string): Base {
  const head = digits.slice(0, 2).toLowerCase();
  if (head === '0x') return 'hex';
  if (head === '0b') return 'bin';
  if (head === '0o') return 'oct';
  return 'dec';
}

export function parseBigIntInput(input: string, base: BaseChoice): ParseResult {
  // Spaces, underscores and commas are digit separators, never digits.
  const cleaned = input.replace(/[\s_,]/g, '');
  if (!cleaned) return { ok: false, error: 'Enter a number.' };

  let rest = cleaned;
  let sign = 1n;
  if (rest.startsWith('-') || rest.startsWith('+')) {
    if (rest.startsWith('-')) sign = -1n;
    rest = rest.slice(1);
  }
  if (!rest) return { ok: false, error: 'Enter digits after the sign.' };

  const resolved = base === 'auto' ? detectBase(rest) : base;
  const prefix = BASE_PREFIXES[resolved];
  if (prefix && rest.toLowerCase().startsWith(prefix)) rest = rest.slice(prefix.length);
  if (!rest) return { ok: false, error: `Enter digits after the ${prefix} prefix.` };

  const digits = rest.toLowerCase();
  const invalid = [...digits].find((digit) => !DIGIT_RULES[resolved].allowed.test(digit));
  if (invalid) {
    return {
      ok: false,
      error: `"${invalid}" is not a valid ${BASE_NAMES[resolved]} digit. ${DIGIT_RULES[resolved].hint}`,
    };
  }

  const magnitude = resolved === 'dec' ? BigInt(digits) : BigInt(`${prefix}${digits}`);
  const value = sign * magnitude;
  return { ok: true, value, base: resolved, negative: value < 0n };
}

/** Right-aligned 4-bit groups, so the binary form reads in nibbles. */
function groupBinary(bin: string): string {
  const groups: string[] = [];
  for (let end = bin.length; end > 0; end -= 4) {
    groups.unshift(bin.slice(Math.max(0, end - 4), end));
  }
  return groups.join(' ');
}

/** Every base at once, plus the 64-bit wrap for negative values. */
export function convertBigInt(value: bigint): BigIntConversion {
  const magnitude = value < 0n ? -value : value;
  const bin = magnitude.toString(2);
  const bitLength = magnitude === 0n ? 0 : bin.length;
  return {
    bin: value.toString(2),
    oct: value.toString(8),
    dec: value.toString(10),
    hex: value.toString(16),
    groupedBin: (value < 0n ? '-' : '') + groupBinary(bin),
    bitLength,
    bytes: Math.ceil(bitLength / 8),
    twosComplement64: value < 0n ? BigInt.asUintN(64, value).toString(16).padStart(16, '0') : null,
  };
}

/** The Copy-all block: one labelled line per base. */
export function conversionLines(converted: BigIntConversion): string {
  const lines = [
    `Binary: ${converted.bin}`,
    `Octal: ${converted.oct}`,
    `Decimal: ${converted.dec}`,
    `Hex: ${converted.hex}`,
  ];
  if (converted.twosComplement64) {
    lines.push(`Two's complement (64-bit): ${converted.twosComplement64}`);
  }
  return lines.join('\n');
}

const FLOAT_DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

/** Render a number the way it round-trips, keeping -0 and the non-finites named. */
function numberText(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  if (Object.is(value, -0)) return '-0';
  return String(value);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBits(hex: string): string {
  return [...hex].map((digit) => parseInt(digit, 16).toString(2).padStart(4, '0')).join(' ');
}

/** Decimal number → the bits the chosen width stores, and what they read back as. */
export function textToFloatBits(input: string, width: FloatWidth): FloatBitsResult {
  const text = input.trim();
  if (!text) return { ok: false, error: 'Enter a decimal number.' };
  if (!FLOAT_DECIMAL.test(text)) {
    return {
      ok: false,
      error: `"${text}" is not a decimal number. NaN, Infinity and hex patterns are not accepted here.`,
    };
  }
  const value = Number(text);
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'This value overflows every float; enter a smaller number.' };
  }
  // A float32 overflow would store Infinity, as if the number had fit.
  if (width === 32 && !Number.isFinite(Math.fround(value))) {
    return { ok: false, error: 'This value overflows a 32-bit float. Use the 64-bit double.' };
  }
  const buffer = new ArrayBuffer(width / 8);
  const view = new DataView(buffer);
  // Byte order is irrelevant to the pattern; big-endian just fixes where the
  // sign and exponent digits land in the hex text.
  if (width === 32) view.setFloat32(0, value, false);
  else view.setFloat64(0, value, false);
  const hex = bytesToHex(new Uint8Array(buffer));
  const roundTrip = width === 32 ? view.getFloat32(0, false) : view.getFloat64(0, false);
  return { ok: true, hex, bits: hexToBits(hex), roundTrip: numberText(roundTrip) };
}

/** A raw or 0x-prefixed hex pattern of the exact width → the number it encodes. */
export function floatBitsToText(input: string, width: FloatWidth): FloatTextResult {
  const cleaned = input.replace(/[\s_,]/g, '').replace(/^0x/i, '');
  if (!cleaned) return { ok: false, error: 'Enter hex bits.' };
  const digits = cleaned.toLowerCase();
  const invalid = [...digits].find((digit) => !/[0-9a-f]/.test(digit));
  if (invalid) {
    return {
      ok: false,
      error: `"${invalid}" is not a valid hex digit. ${DIGIT_RULES.hex.hint}`,
    };
  }
  const expected = width === 32 ? 8 : 16;
  if (digits.length !== expected) {
    return {
      ok: false,
      error: `${width}-bit bits need exactly ${expected} hex digits; this has ${digits.length}.`,
    };
  }
  const buffer = new ArrayBuffer(width / 8);
  const view = new DataView(buffer);
  for (let i = 0; i < digits.length; i += 2) {
    view.setUint8(i / 2, parseInt(digits.slice(i, i + 2), 16));
  }
  const value = width === 32 ? view.getFloat32(0, false) : view.getFloat64(0, false);
  return { ok: true, hex: digits, bits: hexToBits(digits), value: numberText(value) };
}

/** Name for NaN, the infinities, negative zero and denormals, for the pane's note. */
export function describeFloatValue(value: number, width: FloatWidth): string | null {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return 'Infinity';
  if (value === -Infinity) return '-Infinity';
  if (Object.is(value, -0)) return 'Negative zero';
  const minNormal = width === 32 ? 2 ** -126 : 2 ** -1022;
  if (value !== 0 && Math.abs(value) < minNormal) return 'Subnormal (denormal)';
  return null;
}

type FloatDirection = 'number-to-bits' | 'bits-to-number';

type FloatView =
  { ok: true; hex: string; bits: string; value: string } | { ok: false; error: string };

/** The last good conversion, kept on screen while the input is unreadable. */
interface ReadValue {
  base: Base;
  converted: BigIntConversion;
}

const BASE_ROWS: { key: Base; label: string }[] = [
  { key: 'bin', label: 'Binary' },
  { key: 'oct', label: 'Octal' },
  { key: 'dec', label: 'Decimal' },
  { key: 'hex', label: 'Hex' },
];

export function NumberBaseScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [sourceBase, setSourceBase] = useSessionDocumentState<BaseChoice>('sourceBase', 'auto');
  const [read, setRead] = useSessionDocumentState<ReadValue | null>('read', null);
  const [direction, setDirection] = useSessionDocumentState<FloatDirection>(
    'floatDirection',
    'number-to-bits',
  );
  const [width, setWidth] = useSessionDocumentState<FloatWidth>('floatWidth', 32);
  const [floatInput, setFloatInput] = useDocumentField<string>('floatInput', '');
  const notify = useWorkbenchMemory((s) => s.notify);

  const parsed = useMemo(
    () => (input.trim() ? parseBigIntInput(input, sourceBase) : null),
    [input, sourceBase],
  );

  // An unreadable input leaves the last good table on screen; an empty box
  // withdraws it instead, so Clear empties the pane.
  useEffect(() => {
    if (!parsed) setRead(null);
    else if (parsed.ok) setRead({ base: parsed.base, converted: convertBigInt(parsed.value) });
  }, [parsed, setRead]);

  const floatOutcome = useMemo<FloatView | null>(() => {
    if (!floatInput.trim()) return null;
    if (direction === 'number-to-bits') {
      const result = textToFloatBits(floatInput, width);
      return result.ok
        ? { ok: true, hex: result.hex, bits: result.bits, value: result.roundTrip }
        : result;
    }
    const result = floatBitsToText(floatInput, width);
    return result.ok
      ? { ok: true, hex: result.hex, bits: result.bits, value: result.value }
      : result;
  }, [direction, floatInput, width]);

  const floatNote = floatOutcome?.ok ? describeFloatValue(Number(floatOutcome.value), width) : null;

  // What Copy all writes is also what "Save Result…" should write.
  usePublishedResult(read ? conversionLines(read.converted) : '', 'Base conversions');

  const error = parsed && !parsed.ok ? parsed.error : '';

  const copyText = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  const resultStatus = error
    ? read
      ? `Showing the last good read (${BASE_NAMES[read.base]})`
      : 'Waiting for valid input'
    : read
      ? `Read as ${BASE_NAMES[read.base]}`
      : 'Waiting for input';

  const floatStatus = floatOutcome
    ? floatOutcome.ok
      ? `${width === 32 ? '32-bit float' : '64-bit double'} · ${
          direction === 'number-to-bits' ? 'number → bits' : 'bits → number'
        }`
      : 'Waiting for valid input'
    : 'Waiting for input';

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Number Base Converter</h1>
          <p>Convert between binary, octal, decimal, and hex</p>
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
      <div className="wb-toolbar">
        <Label className="flex items-center gap-2">
          Number
          <Input
            aria-label="Number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0xff"
          />
        </Label>
        <Label className="flex items-center gap-2">
          Base
          <NativeSelect
            aria-label="Source base"
            value={sourceBase}
            onChange={(e) => setSourceBase(e.target.value as BaseChoice)}
          >
            <NativeSelectOption value="auto">Auto-detect</NativeSelectOption>
            <NativeSelectOption value="bin">Binary</NativeSelectOption>
            <NativeSelectOption value="oct">Octal</NativeSelectOption>
            <NativeSelectOption value="dec">Decimal</NativeSelectOption>
            <NativeSelectOption value="hex">Hex</NativeSelectOption>
          </NativeSelect>
        </Label>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setInput(NUMBER_BASE_SAMPLE)}
        >
          <IconSparkles size={16} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => setInput('')}
          disabled={!input}
        >
          <IconEraser size={16} stroke={1.7} aria-hidden="true" />
          Clear
        </Button>
      </div>
      <p className="wb-note">
        Prefixes 0x, 0b and 0o pick hexadecimal, binary and octal. Without a prefix, digits are read
        as decimal. Spaces, underscores and commas are ignored as digit separators.
      </p>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <section className="wb-editor-pane" aria-label="Result panel">
        <div className="wb-pane-header">
          <h2>Result</h2>
          <div className="wb-copy-actions">
            <Button
              type="button"
              className="wb-button primary"
              disabled={!read}
              onClick={() => void copyText(read ? conversionLines(read.converted) : '', 'Result')}
            >
              <IconCopy size={16} stroke={1.7} aria-hidden="true" />
              Copy all
            </Button>
          </div>
        </div>
        {read ? (
          <div className="wb-pane-body">
            <div className="wb-setting-row">
              <span>
                <strong>Grouped binary</strong>
                <small>
                  {read.converted.bitLength} bits · {read.converted.bytes} byte
                  {read.converted.bytes === 1 ? '' : 's'}
                </small>
              </span>
              <span className="wb-row-action">
                <span className="font-mono break-all">{read.converted.groupedBin}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wb-icon-button"
                  aria-label="Copy grouped binary"
                  onClick={() => void copyText(read.converted.groupedBin, 'Grouped binary')}
                >
                  <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                </Button>
              </span>
            </div>
            {BASE_ROWS.map((row) => (
              <div key={row.key} className="wb-setting-row">
                <span>
                  <strong>{row.label}</strong>
                  <small className="font-mono break-all">{read.converted[row.key]}</small>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wb-icon-button"
                  aria-label={`Copy ${row.label}`}
                  onClick={() => void copyText(read.converted[row.key], row.label)}
                >
                  <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                </Button>
              </div>
            ))}
            {read.converted.twosComplement64 ? (
              <div className="wb-setting-row">
                <span>
                  <strong>Two&apos;s complement (64-bit)</strong>
                  <small className="font-mono break-all">{read.converted.twosComplement64}</small>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="wb-icon-button"
                  aria-label="Copy two's complement"
                  onClick={() =>
                    void copyText(read.converted.twosComplement64 ?? '', "Two's complement")
                  }
                >
                  <IconCopy size={16} stroke={1.7} aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="wb-empty">
            <h2>No conversion yet</h2>
            <p>Enter a number to see it in every base.</p>
          </div>
        )}
        <div className="wb-pane-footer">
          <span className="flex items-center gap-1">
            {read && !error ? (
              <IconCircleCheck size={16} stroke={1.7} className="wb-green" aria-hidden="true" />
            ) : null}
            {resultStatus}
          </span>
        </div>
      </section>
      <section className="wb-editor-pane" aria-label="IEEE-754 float panel">
        <div className="wb-pane-header">
          <h2>IEEE-754 float</h2>
        </div>
        <div className="wb-pane-body">
          <div className="wb-setting-row">
            <span>
              <strong>Direction</strong>
              <small>Which side of the bits you have</small>
            </span>
            <NativeSelect
              aria-label="Float direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as FloatDirection)}
            >
              <NativeSelectOption value="number-to-bits">Number → bits</NativeSelectOption>
              <NativeSelectOption value="bits-to-number">Bits → number</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Width</strong>
              <small>Storage format for the bit pattern</small>
            </span>
            <NativeSelect
              aria-label="Float width"
              value={String(width)}
              onChange={(e) => setWidth(e.target.value === '64' ? 64 : 32)}
            >
              <NativeSelectOption value="32">32-bit float</NativeSelectOption>
              <NativeSelectOption value="64">64-bit double</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>{direction === 'number-to-bits' ? 'Number' : 'Hex bits'}</strong>
              <small>
                {direction === 'number-to-bits'
                  ? 'Decimal, may round to the chosen width'
                  : `Exactly ${width === 32 ? 8 : 16} hex digits, 0x optional`}
              </small>
            </span>
            <Input
              aria-label={
                direction === 'number-to-bits' ? 'Number to encode' : 'Hex bits to decode'
              }
              value={floatInput}
              onChange={(e) => setFloatInput(e.target.value)}
              placeholder={
                direction === 'number-to-bits'
                  ? '0.1'
                  : width === 32
                    ? '0x3f800000'
                    : '0x3ff0000000000000'
              }
            />
          </div>
          {floatOutcome && !floatOutcome.ok ? (
            <div className="wb-error-banner m-3" role="alert">
              <strong>Couldn&apos;t process this input.</strong>
              <span>{floatOutcome.error}</span>
            </div>
          ) : null}
          {floatOutcome?.ok ? (
            <>
              <div className="wb-setting-row">
                <span>
                  <strong>Hex bits</strong>
                  <small className="font-mono break-all">0x{floatOutcome.hex}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>Bit string</strong>
                  <small className="font-mono break-all">{floatOutcome.bits}</small>
                </span>
              </div>
              <div className="wb-setting-row">
                <span>
                  <strong>{direction === 'number-to-bits' ? 'Round-trip value' : 'Value'}</strong>
                  <small className="font-mono break-all">{floatOutcome.value}</small>
                </span>
              </div>
              {floatNote ? (
                <div className="wb-setting-row">
                  <span>
                    <strong>Special form</strong>
                    <small>{floatNote}</small>
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="wb-pane-footer">
          <span>{floatStatus}</span>
        </div>
      </section>
    </>
  );
}
