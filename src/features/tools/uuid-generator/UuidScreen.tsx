import { useMemo } from 'react';
import { IconCircleCheckFilled, IconCopy, IconFlask, IconRefresh } from '@tabler/icons-react';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';

export type UuidVersion = 'v4' | 'v7';

export const UUID_COUNTS = [1, 5, 10, 50] as const;

/** Well-known v4 example for the inspect box. */
export const UUID_SAMPLE = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export type UuidVariant = 'RFC 4122' | 'Reserved (NCS)' | 'Microsoft' | 'Future';

export interface UuidInspection {
  valid: boolean;
  version: number | null;
  variant: UuidVariant | null;
}

export function inspectUuid(value: string): UuidInspection {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) return { valid: false, version: null, variant: null };
  const version = parseInt(normalized[14], 16);
  const variantBits = parseInt(normalized[19], 16);
  const variant: UuidVariant =
    variantBits < 8
      ? 'Reserved (NCS)'
      : variantBits < 12
        ? 'RFC 4122'
        : variantBits < 14
          ? 'Microsoft'
          : 'Future';
  return { valid: true, version, variant };
}

export function formatUuid(value: string, uppercase: boolean, hyphens: boolean): string {
  const compact = value.trim().toLowerCase().replace(/-/g, '');
  const shaped = hyphens
    ? `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`
    : compact;
  return uppercase ? shaped.toUpperCase() : shaped;
}

export function uuidV7(): string {
  // RFC 9562 UUIDv7: 48-bit unix-ms timestamp + version/variant bits + randomness.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let ts = Date.now();
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuid(version: UuidVersion): string {
  return version === 'v4' ? crypto.randomUUID() : uuidV7();
}

export function generateUuids(version: UuidVersion, count: number): string[] {
  return Array.from({ length: Math.max(1, count) }, () => generateUuid(version));
}

export function UuidScreen() {
  const [version, setVersion] = useSessionDocumentState<UuidVersion>('version', 'v4');
  const [count, setCount] = useSessionDocumentState<number>('count', 5);
  const [uppercase, setUppercase] = useSessionDocumentState<boolean>('uppercase', false);
  const [hyphens, setHyphens] = useSessionDocumentState<boolean>('hyphens', true);
  const [uuids, setUuids] = useSessionDocumentState<string[]>('uuids', () =>
    generateUuids('v4', 5),
  );
  const [inspectInput, setInspectInput] = useDocumentField<string>('inspectInput', '');
  const notify = useWorkbenchMemory((s) => s.notify);

  const displayed = useMemo(
    () => uuids.map((u) => formatUuid(u, uppercase, hyphens)),
    [uuids, uppercase, hyphens],
  );

  const inspection = useMemo(
    () => (inspectInput.trim() ? inspectUuid(inspectInput) : null),
    [inspectInput],
  );

  const regenerate = () => setUuids(generateUuids(version, count));

  const copyText = async (text: string, message: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify(message);
    } catch {
      notify('Clipboard unavailable. Select the text and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>UUID</h1>
          <p>Generate UUIDs (v4 and time-ordered v7)</p>
        </div>
        <div className="wb-processing">
          <span>
            <IconCircleCheckFilled size={16} className="wb-green" />
            Runs on this device
          </span>
          <span>v4 random or v7 time-ordered</span>
        </div>
      </div>

      <div className="wb-toolbar">
        <label>
          Version
          <NativeSelect
            aria-label="UUID version"
            value={version}
            onChange={(e) => setVersion(e.target.value as UuidVersion)}
          >
            <NativeSelectOption value="v4">v4 — random</NativeSelectOption>
            <NativeSelectOption value="v7">v7 — time-ordered</NativeSelectOption>
          </NativeSelect>
        </label>
        <label>
          Count
          <NativeSelect
            aria-label="Batch count"
            value={UUID_COUNTS.includes(count as (typeof UUID_COUNTS)[number]) ? count : 5}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {UUID_COUNTS.map((n) => (
              <NativeSelectOption key={n} value={n}>
                {n}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <button type="button" className="wb-button primary" onClick={regenerate}>
          <IconRefresh size={22} stroke={1.7} aria-hidden="true" />
          Generate
        </button>
        <button
          type="button"
          className="wb-button"
          disabled={!displayed.length}
          onClick={() => copyText(displayed.join('\n'), 'UUIDs copied')}
        >
          <IconCopy size={22} stroke={1.7} aria-hidden="true" />
          Copy all
        </button>
      </div>

      <div className="wb-setting-row">
        <span>
          <strong>Uppercase</strong>
          <small>Render hexadecimal digits in upper case</small>
        </span>
        <Checkbox
          aria-label="Uppercase"
          checked={uppercase}
          onCheckedChange={(checked) => setUppercase(Boolean(checked))}
        />
      </div>
      <div className="wb-setting-row">
        <span>
          <strong>Hyphens</strong>
          <small>Keep the 8-4-4-4-12 grouping</small>
        </span>
        <Checkbox
          aria-label="Hyphens"
          checked={hyphens}
          onCheckedChange={(checked) => setHyphens(Boolean(checked))}
        />
      </div>

      <div>
        {displayed.length === 0 && <p className="wb-empty">Press Generate to create UUIDs.</p>}
        {displayed.map((u) => (
          <div className="wb-list-row" key={u}>
            <span>
              <strong>{u}</strong>
              <small>
                {version} · {u.length} characters
              </small>
            </span>
            <span className="wb-row-action">
              <button
                type="button"
                className="wb-button"
                aria-label={`Copy ${u}`}
                onClick={() => copyText(u, 'UUID copied')}
              >
                <IconCopy size={20} aria-hidden="true" />
                Copy
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="wb-toolbar">
        <label>
          Inspect a UUID
          <input
            aria-label="UUID to inspect"
            value={inspectInput}
            onChange={(e) => setInspectInput(e.target.value)}
            placeholder="Paste a UUID to inspect…"
          />
        </label>
        <button type="button" className="wb-button" onClick={() => setInspectInput(UUID_SAMPLE)}>
          <IconFlask size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </button>
      </div>

      {inspection && (
        <div>
          <div className="wb-setting-row">
            <span>
              <strong>Format</strong>
              <small>Strict 8-4-4-4-12 hexadecimal shape</small>
            </span>
            <span className={inspection.valid ? 'wb-green' : undefined}>
              {inspection.valid ? 'Valid UUID' : 'Not a UUID'}
            </span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Version</strong>
              <small>First digit of the third group</small>
            </span>
            <span>{inspection.version ?? '—'}</span>
          </div>
          <div className="wb-setting-row">
            <span>
              <strong>Variant</strong>
              <small>Leading bits of the fourth group</small>
            </span>
            <span>{inspection.variant ?? '—'}</span>
          </div>
        </div>
      )}
    </>
  );
}
