import { useState } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconPalette,
} from '@tabler/icons-react';
import { useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export const COLOR_SAMPLE = '#3b82f6';

/** Exact port of the legacy hex→rgb parse (6-digit hex only). */
export function hexToRgb(hexValue: string): Rgb | null {
  const cleanHex = hexValue.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) return null;
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/** Exact port of the legacy rgb→hex format. */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Exact port of the legacy rgb→hsl conversion. */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Exact port of the legacy hsl→rgb conversion. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (sn === 0) {
    r = ln;
    g = ln;
    b = ln;
  } else {
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1 / 3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function formatRgb(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHsl(hsl: Hsl): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

const clampChannel = (n: number): number => Math.max(0, Math.min(255, Math.trunc(n) || 0));

export function ColorScreen() {
  const [hex, setHex] = useSessionDocumentState<string>('hex', COLOR_SAMPLE);
  const [rgb, setRgb] = useSessionDocumentState<Rgb>('rgb', { r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useSessionDocumentState<Hsl>('hsl', { h: 217, s: 91, l: 60 });
  const [error, setError] = useState('');
  const notify = useWorkbenchMemory((s) => s.notify);

  const updateFromHex = (hexValue: string) => {
    setHex(hexValue);
    const parsed = hexToRgb(hexValue);
    if (!parsed) {
      setError('HEX needs 6 hex digits, e.g. #3b82f6.');
      return;
    }
    setError('');
    setRgb(parsed);
    setHsl(rgbToHsl(parsed.r, parsed.g, parsed.b));
  };

  const updateFromRgb = (next: Rgb) => {
    const clamped = { r: clampChannel(next.r), g: clampChannel(next.g), b: clampChannel(next.b) };
    setRgb(clamped);
    setHex(rgbToHex(clamped.r, clamped.g, clamped.b));
    setHsl(rgbToHsl(clamped.r, clamped.g, clamped.b));
    setError('');
  };

  const updateFromHsl = (next: Hsl) => {
    const clamped = {
      h: Math.max(0, Math.min(360, Math.trunc(next.h) || 0)),
      s: Math.max(0, Math.min(100, Math.trunc(next.s) || 0)),
      l: Math.max(0, Math.min(100, Math.trunc(next.l) || 0)),
    };
    setHsl(clamped);
    const rgbValue = hslToRgb(clamped.h, clamped.s, clamped.l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setError('');
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} copied`);
    } catch {
      notify('Clipboard unavailable. Select the value and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Color</h1>
          <p>Convert colors between HEX, RGB, and HSL</p>
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
        <Label className="flex items-center gap-2 cursor-pointer">
          Picker
          <input
            aria-label="Color picker"
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'}
            onChange={(e) => updateFromHex(e.target.value)}
            className="size-8 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
          />
        </Label>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => updateFromHex(COLOR_SAMPLE)}
        >
          <IconPalette size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
      </div>
      {error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t process this input.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="wb-setting-row">
        <span>
          <strong>Preview</strong>
          <small>Current color</small>
        </span>
        <span
          data-testid="color-preview"
          style={{
            display: 'inline-block',
            width: 96,
            height: 48,
            borderRadius: 6,
            backgroundColor: hex,
          }}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>HEX</strong>
          <small>Six hex digits</small>
        </span>
        <span className="wb-row-action">
          <Input
            aria-label="HEX value"
            value={hex}
            onChange={(e) => updateFromHex(e.target.value)}
            data-testid="input-hex"
          />
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            aria-label="Copy HEX"
            onClick={() => void copyText(hex, 'HEX')}
          >
            <IconCopy size={20} aria-hidden="true" />
            Copy
          </Button>
        </span>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>RGB</strong>
          <small>0–255 per channel</small>
        </span>
        <span className="wb-row-action">
          <Input
            aria-label="Red channel"
            type="number"
            min={0}
            max={255}
            value={rgb.r}
            onChange={(e) => updateFromRgb({ ...rgb, r: parseInt(e.target.value, 10) || 0 })}
            data-testid="input-r"
          />
          <Input
            aria-label="Green channel"
            type="number"
            min={0}
            max={255}
            value={rgb.g}
            onChange={(e) => updateFromRgb({ ...rgb, g: parseInt(e.target.value, 10) || 0 })}
            data-testid="input-g"
          />
          <Input
            aria-label="Blue channel"
            type="number"
            min={0}
            max={255}
            value={rgb.b}
            onChange={(e) => updateFromRgb({ ...rgb, b: parseInt(e.target.value, 10) || 0 })}
            data-testid="input-b"
          />
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            aria-label="Copy RGB"
            onClick={() => void copyText(formatRgb(rgb), 'RGB')}
          >
            <IconCopy size={20} aria-hidden="true" />
            Copy
          </Button>
        </span>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>HSL</strong>
          <small data-testid="output-hsl">{formatHsl(hsl)}</small>
        </span>
        <span className="wb-row-action">
          <Input
            aria-label="Hue"
            type="number"
            min={0}
            max={360}
            value={hsl.h}
            onChange={(e) => updateFromHsl({ ...hsl, h: parseInt(e.target.value, 10) || 0 })}
            data-testid="input-h"
          />
          <Input
            aria-label="Saturation"
            type="number"
            min={0}
            max={100}
            value={hsl.s}
            onChange={(e) => updateFromHsl({ ...hsl, s: parseInt(e.target.value, 10) || 0 })}
            data-testid="input-s"
          />
          <Input
            aria-label="Lightness"
            type="number"
            min={0}
            max={100}
            value={hsl.l}
            onChange={(e) => updateFromHsl({ ...hsl, l: parseInt(e.target.value, 10) || 0 })}
            data-testid="input-l"
          />
          <Button
            type="button"
            variant="outline"
            className="wb-button"
            aria-label="Copy HSL"
            onClick={() => void copyText(formatHsl(hsl), 'HSL')}
          >
            <IconCopy size={20} aria-hidden="true" />
            Copy
          </Button>
        </span>
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>RGB value</strong>
          <small data-testid="output-rgb">{formatRgb(rgb)}</small>
        </span>
      </div>
    </>
  );
}
