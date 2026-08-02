import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Button, Tabs } from "@/ds/components";
import { CodeEditor } from "@/v2/CodeEditor";
import { Panel, PanelHeader, CopyAction, ValidityBadge, EditorSplit } from "@/v2/EditorPanels";
import { useEditorStatus } from "@/v2/workspace-store";
import { useUrlState } from "@/hooks/use-url-state";
import { useToolHistory } from "@/hooks/use-tool-history";

interface DecodedField {
    fieldNumber: number
    wireType: number
    wireTypeName: string
    value: string | number | DecodedField[]
}

const WIRE_TYPES: Record<number, string> = {
    0: "Varint",
    1: "64-bit",
    2: "Length-delimited",
    5: "32-bit",
}

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.replace(/[^0-9a-fA-F]/g, "")
    if (!clean) throw new Error("Invalid hex string length")
    const normalized = clean.length % 2 === 0 ? clean : `0${clean}`
    const bytes = new Uint8Array(normalized.length / 2)
    for (let i = 0; i < normalized.length; i += 2) {
        const b = parseInt(normalized.substring(i, i + 2), 16)
        if (isNaN(b)) throw new Error(`Invalid hex at position ${i}`)
        bytes[i / 2] = b
    }
    return bytes
}

function base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64.trim())
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

function decodeVarint(bytes: Uint8Array, offset: number): { value: number; bytesRead: number } {
    let result = 0
    let shift = 0
    let bytesRead = 0
    while (offset + bytesRead < bytes.length) {
        const b = bytes[offset + bytesRead]
        result |= (b & 0x7f) << shift
        bytesRead++
        if ((b & 0x80) === 0) break
        shift += 7
        if (shift > 35) throw new Error("Varint too long")
    }
    return { value: result, bytesRead }
}

function decodeProtobuf(bytes: Uint8Array, offset = 0, length?: number): DecodedField[] {
    const fields: DecodedField[] = []
    const end = length !== undefined ? offset + length : bytes.length

    while (offset < end) {
        const tag = decodeVarint(bytes, offset)
        offset += tag.bytesRead

        const fieldNumber = tag.value >>> 3
        const wireType = tag.value & 0x07

        if (fieldNumber === 0) break

        const field: DecodedField = {
            fieldNumber,
            wireType,
            wireTypeName: WIRE_TYPES[wireType] || `Unknown(${wireType})`,
            value: "",
        }

        switch (wireType) {
            case 0: { // Varint
                const v = decodeVarint(bytes, offset)
                field.value = v.value
                offset += v.bytesRead
                break
            }
            case 1: { // 64-bit
                if (offset + 8 > end) throw new Error("Unexpected end of data for 64-bit field")
                const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8)
                field.value = view.getFloat64(0, true)
                offset += 8
                break
            }
            case 2: { // Length-delimited
                const len = decodeVarint(bytes, offset)
                offset += len.bytesRead
                if (offset + len.value > end) throw new Error("Unexpected end of data for length-delimited field")
                const data = bytes.slice(offset, offset + len.value)

                // Try to decode as nested message
                try {
                    const nested = decodeProtobuf(data, 0, data.length)
                    if (nested.length > 0 && nested.every(f => f.fieldNumber > 0 && f.fieldNumber < 1000)) {
                        field.value = nested
                    } else {
                        throw new Error("Not a valid nested message")
                    }
                } catch {
                    // Try as UTF-8 string
                    try {
                        const str = new TextDecoder("utf-8", { fatal: true }).decode(data)
                        if (/^[\x20-\x7E\n\r\t]+$/.test(str)) {
                            field.value = str
                        } else {
                            field.value = `[${data.length} bytes] 0x${Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("")}`
                        }
                    } catch {
                        field.value = `[${data.length} bytes] 0x${Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("")}`
                    }
                }
                offset += len.value
                break
            }
            case 5: { // 32-bit
                if (offset + 4 > end) throw new Error("Unexpected end of data for 32-bit field")
                const view32 = new DataView(bytes.buffer, bytes.byteOffset + offset, 4)
                field.value = view32.getFloat32(0, true)
                offset += 4
                break
            }
            default:
                throw new Error(`Unknown wire type: ${wireType}`)
        }

        fields.push(field)
    }

    return fields
}

function fieldsToJson(fields: DecodedField[]): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const field of fields) {
        const key = `field_${field.fieldNumber}`
        if (Array.isArray(field.value)) {
            result[key] = fieldsToJson(field.value)
        } else {
            result[key] = field.value
        }
    }
    return result
}

const mono: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" };

function renderFields(fields: DecodedField[], depth = 0): ReactNode {
    return fields.map((field, i) => (
        <div key={i} style={{ ...mono, paddingLeft: depth * 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "2px 0" }}>
                <span style={{ color: "hsl(var(--code-key))", whiteSpace: "nowrap" }}>
                    field {field.fieldNumber}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "hsl(var(--text-faint))", whiteSpace: "nowrap" }}>
                    ({field.wireTypeName})
                </span>
                {!Array.isArray(field.value) && (
                    <>
                        <span style={{ color: "hsl(var(--text-muted))" }}>=</span>
                        <span style={{ color: "hsl(var(--code-string))", wordBreak: "break-all" }}>
                            {typeof field.value === "string" ? `"${field.value}"` : String(field.value)}
                        </span>
                    </>
                )}
            </div>
            {Array.isArray(field.value) && (
                <div style={{ borderLeft: "1px solid hsl(var(--border-faint))", marginLeft: 8 }}>
                    {renderFields(field.value, depth + 1)}
                </div>
            )}
        </div>
    ))
}

const SAMPLE_HEX = "08 96 01 12 0b 48 65 6c 6c 6f 20 57 6f 72 6c 64 18 01 22 0a 0a 04 4a 6f 68 6e 10 1e"

type Format = "hex" | "base64";

export default function ProtobufDecoder() {
    const [input, setInput] = useState("")
    const [format, setFormat] = useState<Format>("hex")
    const setStatus = useEditorStatus((s) => s.setStatus);
    const shareState = useMemo(() => ({ input, format }), [input, format])
    useUrlState(shareState, (state) => {
        setInput(typeof state.input === "string" ? state.input : "")
        setFormat(state.format === "base64" ? "base64" : "hex")
    })
    const { addEntry } = useToolHistory("protobuf-decoder", "Protobuf Decoder")

    const result = useMemo(() => {
        if (!input.trim()) return { decoded: null as DecodedField[] | null, error: "", valid: null as boolean | null }
        try {
            const bytes = format === "hex" ? hexToBytes(input) : base64ToBytes(input)
            const fields = decodeProtobuf(bytes)
            if (fields.length === 0) throw new Error("No fields decoded - input may not be valid protobuf")
            return { decoded: fields, error: "", valid: true as boolean | null }
        } catch (err) {
            return {
                decoded: null,
                error: err instanceof Error ? err.message : "Decode failed",
                valid: false as boolean | null,
            }
        }
    }, [input, format])

    useEffect(() => {
        setStatus({
            valid: result.valid,
            validityLabel: result.valid === null ? "" : result.valid ? "Decoded" : "Invalid protobuf",
        });
    }, [result.valid, setStatus]);

    useEffect(() => {
        if (result.valid !== true || !result.decoded) return;
        const fields = result.decoded;
        const t = setTimeout(
            () =>
                addEntry({
                    input: JSON.stringify({ format, input }),
                    output: JSON.stringify(fieldsToJson(fields), null, 2),
                    metadata: { action: "decode" },
                }),
            1500
        );
        return () => clearTimeout(t);
    }, [input, format, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

    const copyText = result.decoded ? JSON.stringify(fieldsToJson(result.decoded), null, 2) : ""

    return (
        <EditorSplit>
            <Panel>
                <PanelHeader
                    title={`Raw protobuf (${format})`}
                    action={
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Tabs
                                variant="segment"
                                value={format}
                                onChange={(v) => setFormat(v as Format)}
                                items={[
                                    { value: "hex", label: "Hex" },
                                    { value: "base64", label: "Base64" },
                                ]}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setInput(SAMPLE_HEX)
                                    setFormat("hex")
                                }}
                            >
                                Load sample
                            </Button>
                        </div>
                    }
                />
                <CodeEditor
                    value={input}
                    onChange={setInput}
                    reportStatus
                    placeholder={format === "hex" ? "08 96 01 12 0b 48 65 6c 6c 6f…" : "CJYBEgtIZWxsbyBXb3JsZBgB…"}
                />
            </Panel>
            <Panel>
                <PanelHeader
                    title="Decoded fields"
                    badge={<ValidityBadge valid={result.valid} validLabel="decoded" invalidLabel="invalid" />}
                    action={<CopyAction text={copyText} />}
                />
                <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
                    {result.error && (
                        <p style={{ margin: 0, ...mono, color: "hsl(var(--danger))" }}>{result.error}</p>
                    )}
                    {result.decoded && renderFields(result.decoded)}
                    {!result.decoded && !result.error && (
                        <p style={{ margin: 0, padding: "24px 0", textAlign: "center", fontSize: "var(--text-sm)", color: "hsl(var(--text-faint))" }}>
                            Paste protobuf data to decode
                        </p>
                    )}
                </div>
                <div
                    style={{
                        padding: "8px 12px",
                        borderTop: "1px solid hsl(var(--border-faint))",
                        fontSize: "var(--text-xs)",
                        color: "hsl(var(--text-faint))",
                        flexShrink: 0,
                    }}
                >
                    Schema-less decoding: field numbers and wire types are shown. For full type information, use a .proto schema file.
                </div>
            </Panel>
        </EditorSplit>
    )
}
