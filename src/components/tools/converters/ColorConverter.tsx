import { useSessionDocumentState } from '@/v2/document-state';
import { copyText } from '@/lib/clipboard';
import { useState, useEffect, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, IconButton, Input, Tooltip } from '@/ds/components';
import { ToolPage, Field, Row, SectionTitle } from '@/v2/restyle-kit';
import { useUrlState } from '@/hooks/use-url-state';
import { useToolHistory } from '@/hooks/use-tool-history';

/** Copy button that also records the copy into tool history. */
function CopyValue({ text, onCopy }: { text: string; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip label={copied ? 'Copied' : 'Copy value'} side="left">
      <IconButton
        size="sm"
        title="Copy"
        onClick={async () => {
          if (!(await copyText(text))) return;
          onCopy(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </IconButton>
    </Tooltip>
  );
}

export default function ColorConverter() {
  const [hex, setHex] = useSessionDocumentState('hex', '#3b82f6');
  const [rgb, setRgb] = useSessionDocumentState('rgb', { r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useSessionDocumentState('hsl', { h: 217, s: 91, l: 60 });
  const shareState = useMemo(() => ({ hex }), [hex]);
  useUrlState(shareState, (state) => {
    const nextHex = typeof state.hex === 'string' ? state.hex : '#3b82f6';
    setHex(nextHex);
    updateFromHex(nextHex);
  });
  const { addEntry } = useToolHistory('color-converter', 'Color Converter');

  useEffect(() => {
    updateFromHex(hex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFromHex = (hexValue: string) => {
    const cleanHex = hexValue.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substr(0, 2), 16);
      const g = parseInt(cleanHex.substr(2, 2), 16);
      const b = parseInt(cleanHex.substr(4, 2), 16);

      setRgb({ r, g, b });
      setHsl(rgbToHsl(r, g, b));
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const hexValue = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    setHex(hexValue);
    setHsl(rgbToHsl(r, g, b));
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    const hexValue = `#${((1 << 24) + (rgbValue.r << 16) + (rgbValue.g << 8) + rgbValue.b).toString(16).slice(1)}`;
    setHex(hexValue);
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const recordCopy = (format: string) => (value: string) => {
    addEntry({ input: hex, output: value, metadata: { action: 'copy', format } });
  };

  return (
    <ToolPage>
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle>Preview</SectionTitle>
          <Row gap={16}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: hex,
              }}
              data-testid="color-preview"
            />
            <input
              type="color"
              value={hex}
              onChange={(e) => {
                setHex(e.target.value);
                updateFromHex(e.target.value);
              }}
              style={{
                width: 96,
                height: 96,
                padding: 4,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                background: 'hsl(var(--surface-1))',
                cursor: 'pointer',
              }}
              data-testid="color-picker"
            />
          </Row>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'grid', gap: 16 }}>
          <SectionTitle>Formats</SectionTitle>

          <Field label="HEX">
            <Row wrap={false}>
              <Input
                mono
                value={hex}
                onChange={(e) => {
                  setHex(e.target.value);
                  updateFromHex(e.target.value);
                }}
                style={{ flex: 1 }}
                data-testid="input-hex"
              />
              <CopyValue text={hex} onCopy={recordCopy('HEX')} />
            </Row>
          </Field>

          <Field label="RGB">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Input
                type="number"
                min={0}
                max={255}
                value={rgb.r}
                onChange={(e) => {
                  const newRgb = { ...rgb, r: parseInt(e.target.value) || 0 };
                  setRgb(newRgb);
                  updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
                }}
                placeholder="R"
                data-testid="input-r"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={rgb.g}
                onChange={(e) => {
                  const newRgb = { ...rgb, g: parseInt(e.target.value) || 0 };
                  setRgb(newRgb);
                  updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
                }}
                placeholder="G"
                data-testid="input-g"
              />
              <Input
                type="number"
                min={0}
                max={255}
                value={rgb.b}
                onChange={(e) => {
                  const newRgb = { ...rgb, b: parseInt(e.target.value) || 0 };
                  setRgb(newRgb);
                  updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
                }}
                placeholder="B"
                data-testid="input-b"
              />
            </div>
            <Row wrap={false}>
              <Input
                mono
                value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                readOnly
                style={{ flex: 1 }}
                data-testid="output-rgb"
              />
              <CopyValue text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onCopy={recordCopy('RGB')} />
            </Row>
          </Field>

          <Field label="HSL">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Input
                type="number"
                min={0}
                max={360}
                value={hsl.h}
                onChange={(e) => {
                  const newHsl = { ...hsl, h: parseInt(e.target.value) || 0 };
                  setHsl(newHsl);
                  updateFromHsl(newHsl.h, newHsl.s, newHsl.l);
                }}
                placeholder="H"
                data-testid="input-h"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={hsl.s}
                onChange={(e) => {
                  const newHsl = { ...hsl, s: parseInt(e.target.value) || 0 };
                  setHsl(newHsl);
                  updateFromHsl(newHsl.h, newHsl.s, newHsl.l);
                }}
                placeholder="S"
                data-testid="input-s"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={hsl.l}
                onChange={(e) => {
                  const newHsl = { ...hsl, l: parseInt(e.target.value) || 0 };
                  setHsl(newHsl);
                  updateFromHsl(newHsl.h, newHsl.s, newHsl.l);
                }}
                placeholder="L"
                data-testid="input-l"
              />
            </div>
            <Row wrap={false}>
              <Input
                mono
                value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                readOnly
                style={{ flex: 1 }}
                data-testid="output-hsl"
              />
              <CopyValue text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} onCopy={recordCopy('HSL')} />
            </Row>
          </Field>
        </div>
      </Card>
    </ToolPage>
  );
}
