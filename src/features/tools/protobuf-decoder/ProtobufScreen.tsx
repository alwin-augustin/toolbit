import { useMemo } from 'react';
import {
  IconCircleCheckFilled,
  IconCopy,
  IconDeviceDesktop,
  IconSparkles,
} from '@tabler/icons-react';
import { CodeEditor } from '@/shared/CodeEditor';
import { useDocumentField, useSessionDocumentState } from '@/shared/document-state';
import { useWorkbenchMemory } from '@/shared/workbench-memory';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';

export interface DecodedField {
  fieldNumber: number;
  wireType: number;
  wireTypeName: string;
  value: string | number | DecodedField[];
}

export type ProtobufFormat = 'hex' | 'base64';

export interface ProtobufOutcome {
  fields: DecodedField[] | null;
  error: string;
  valid: boolean | null;
}

export interface FlatField {
  label: string;
  detail: string;
}

export const PROTOBUF_SAMPLE_HEX =
  '08 96 01 12 0b 48 65 6c 6c 6f 20 57 6f 72 6c 64 18 01 22 08 0a 04 4a 6f 68 6e 10 1e';

const WIRE_TYPES: Record<number, string> = {
  0: 'Varint',
  1: '64-bit',
  2: 'Length-delimited',
  5: '32-bit',
};

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (!clean) throw new Error('Invalid hex string length');
  const normalized = clean.length % 2 === 0 ? clean : `0${clean}`;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    const b = parseInt(normalized.substring(i, i + 2), 16);
    if (isNaN(b)) throw new Error(`Invalid hex at position ${i}`);
    bytes[i / 2] = b;
  }
  return bytes;
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function decodeVarint(
  bytes: Uint8Array,
  offset: number,
): { value: number; bytesRead: number } {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  while (offset + bytesRead < bytes.length) {
    const b = bytes[offset + bytesRead];
    result |= (b & 0x7f) << shift;
    bytesRead++;
    if ((b & 0x80) === 0) break;
    shift += 7;
    if (shift > 35) throw new Error('Varint too long');
  }
  return { value: result, bytesRead };
}

export function decodeProtobuf(bytes: Uint8Array, offset = 0, length?: number): DecodedField[] {
  const fields: DecodedField[] = [];
  const end = length !== undefined ? offset + length : bytes.length;

  while (offset < end) {
    const tag = decodeVarint(bytes, offset);
    offset += tag.bytesRead;

    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 0x07;

    if (fieldNumber === 0) break;

    const field: DecodedField = {
      fieldNumber,
      wireType,
      wireTypeName: WIRE_TYPES[wireType] || `Unknown(${wireType})`,
      value: '',
    };

    switch (wireType) {
      case 0: {
        // Varint
        const v = decodeVarint(bytes, offset);
        field.value = v.value;
        offset += v.bytesRead;
        break;
      }
      case 1: {
        // 64-bit
        if (offset + 8 > end) throw new Error('Unexpected end of data for 64-bit field');
        const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
        field.value = view.getFloat64(0, true);
        offset += 8;
        break;
      }
      case 2: {
        // Length-delimited
        const len = decodeVarint(bytes, offset);
        offset += len.bytesRead;
        if (offset + len.value > end)
          throw new Error('Unexpected end of data for length-delimited field');
        const data = bytes.slice(offset, offset + len.value);

        // Try to decode as nested message
        try {
          const nested = decodeProtobuf(data, 0, data.length);
          if (nested.length > 0 && nested.every((f) => f.fieldNumber > 0 && f.fieldNumber < 1000)) {
            field.value = nested;
          } else {
            throw new Error('Not a valid nested message');
          }
        } catch {
          // Try as UTF-8 string
          try {
            const str = new TextDecoder('utf-8', { fatal: true }).decode(data);
            if (/^[\x20-\x7E\n\r\t]+$/.test(str)) {
              field.value = str;
            } else {
              field.value = `[${data.length} bytes] 0x${Array.from(data)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')}`;
            }
          } catch {
            field.value = `[${data.length} bytes] 0x${Array.from(data)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')}`;
          }
        }
        offset += len.value;
        break;
      }
      case 5: {
        // 32-bit
        if (offset + 4 > end) throw new Error('Unexpected end of data for 32-bit field');
        const view32 = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
        field.value = view32.getFloat32(0, true);
        offset += 4;
        break;
      }
      default:
        throw new Error(`Unknown wire type: ${wireType}`);
    }

    fields.push(field);
  }

  return fields;
}

export function fieldsToJson(fields: DecodedField[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const key = `field_${field.fieldNumber}`;
    if (Array.isArray(field.value)) {
      result[key] = fieldsToJson(field.value);
    } else {
      result[key] = field.value;
    }
  }
  return result;
}

/** Decode hex/base64 input; empty input yields no fields and no error. */
export function decodeProtobufInput(input: string, format: ProtobufFormat): ProtobufOutcome {
  if (!input.trim()) return { fields: null, error: '', valid: null };
  try {
    const bytes = format === 'hex' ? hexToBytes(input) : base64ToBytes(input);
    const fields = decodeProtobuf(bytes);
    if (fields.length === 0) throw new Error('No fields decoded - input may not be valid protobuf');
    return { fields, error: '', valid: true };
  } catch (err) {
    return {
      fields: null,
      error: err instanceof Error ? err.message : 'Decode failed',
      valid: false,
    };
  }
}

export function flattenFields(fields: DecodedField[], prefix = ''): FlatField[] {
  const rows: FlatField[] = [];
  for (const field of fields) {
    const label = `${prefix}field_${field.fieldNumber}`;
    if (Array.isArray(field.value)) {
      rows.push({ label, detail: field.wireTypeName });
      rows.push(...flattenFields(field.value, `${label}.`));
    } else {
      const rendered = typeof field.value === 'string' ? `"${field.value}"` : String(field.value);
      rows.push({ label, detail: `${field.wireTypeName} = ${rendered}` });
    }
  }
  return rows;
}

export function ProtobufScreen() {
  const [input, setInput] = useDocumentField<string>('input', '');
  const [format, setFormat] = useSessionDocumentState<ProtobufFormat>('format', 'hex');
  const [showJson, setShowJson] = useSessionDocumentState<boolean>('showJson', false);
  const wrap = useWorkbenchMemory((s) => s.wrap);
  const notify = useWorkbenchMemory((s) => s.notify);

  const outcome = useMemo(() => decodeProtobufInput(input, format), [input, format]);
  const rows = useMemo(
    () => (outcome.fields ? flattenFields(outcome.fields) : []),
    [outcome.fields],
  );
  const jsonText = useMemo(
    () => (outcome.fields ? JSON.stringify(fieldsToJson(outcome.fields), null, 2) : ''),
    [outcome.fields],
  );

  const copyJson = async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      notify('Decoded JSON copied');
    } catch {
      notify('Clipboard unavailable. Select the JSON and copy it.');
    }
  };

  return (
    <>
      <div className="wb-workspace-heading">
        <div>
          <h1>Protobuf</h1>
          <p>Decode protobuf wire format</p>
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
        <ToggleGroup
          value={[format]}
          onValueChange={(v) => setFormat((v[0] ?? 'hex') as 'hex' | 'base64')}
          variant="outline"
        >
          <ToggleGroupItem value="hex">Hex</ToggleGroupItem>
          <ToggleGroupItem value="base64">Base64</ToggleGroupItem>
        </ToggleGroup>
        <Button
          type="button"
          variant="outline"
          className="wb-button"
          onClick={() => {
            setInput(PROTOBUF_SAMPLE_HEX);
            setFormat('hex');
          }}
        >
          <IconSparkles size={22} stroke={1.7} aria-hidden="true" />
          Load sample
        </Button>
        <Button
          type="button"
          variant={showJson ? 'default' : 'outline'}
          className={`wb-button${showJson ? ' primary' : ''}`}
          onClick={() => setShowJson(!showJson)}
          aria-expanded={showJson}
        >
          JSON view
        </Button>
      </div>
      {outcome.error ? (
        <div className="wb-error-banner" role="alert">
          <strong>Couldn&apos;t decode this input.</strong>
          <span>{outcome.error}</span>
        </div>
      ) : null}
      <div className="wb-editors">
        <section className="wb-editor-pane" aria-label="Encoded input panel">
          <div className="wb-pane-header">
            <h2>Input ({format})</h2>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            wrap={wrap}
            label="Protobuf input"
            placeholder={
              format === 'hex' ? '08 96 01 12 0b 48 65 6c 6c 6f...' : 'CJYBEgtIZWxsbyBXb3JsZBgB...'
            }
          />
          <div className="wb-pane-footer">
            <span>{input.length} characters</span>
          </div>
        </section>
        <section className="wb-editor-pane" aria-label="Decoded fields panel">
          <div className="wb-pane-header">
            <h2>Fields{rows.length > 0 ? ` (${rows.length})` : ''}</h2>
            <div className="wb-copy-actions">
              <Button
                type="button"
                className="wb-button primary"
                disabled={!jsonText}
                onClick={() => void copyJson()}
              >
                <IconCopy size={22} stroke={1.7} aria-hidden="true" />
                Copy JSON
              </Button>
            </div>
          </div>
          {showJson ? (
            <CodeEditor
              value={jsonText}
              readOnly
              wrap={wrap}
              label="Decoded JSON"
              language="json"
              placeholder="Decoded JSON will appear here..."
            />
          ) : rows.length > 0 ? (
            <div>
              {rows.map((row) => (
                <div key={row.label} className="wb-list-row">
                  <span>
                    <strong>{row.label}</strong>
                    <small>{row.detail}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="wb-empty">
              <h2>No fields yet</h2>
              <p>Paste hex or base64 protobuf data to decode its fields.</p>
            </div>
          )}
          <div className="wb-pane-footer">
            <span>Schema-less decoding: field numbers and wire types only.</span>
          </div>
        </section>
      </div>
    </>
  );
}
