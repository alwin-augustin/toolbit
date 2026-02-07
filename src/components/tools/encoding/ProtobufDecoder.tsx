import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Binary, FileCode } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

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

function renderFields(fields: DecodedField[], depth = 0): React.ReactNode {
    return fields.map((field, i) => (
        <div key={i} className="font-mono text-sm" style={{ paddingLeft: `${depth * 16}px` }}>
            <div className="flex items-baseline gap-2 py-0.5">
                <span className="text-blue-600 dark:text-blue-400">field {field.fieldNumber}</span>
                <span className="text-xs text-muted-foreground">({field.wireTypeName})</span>
                {!Array.isArray(field.value) && (
                    <>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-green-700 dark:text-green-300 break-all">
                            {typeof field.value === "string" ? `"${field.value}"` : String(field.value)}
                        </span>
                    </>
                )}
            </div>
            {Array.isArray(field.value) && (
                <div className="border-l border-border/50 ml-2">
                    {renderFields(field.value, depth + 1)}
                </div>
            )}
        </div>
    ))
}

const SAMPLE_HEX = "08 96 01 12 0b 48 65 6c 6c 6f 20 57 6f 72 6c 64 18 01 22 0a 0a 04 4a 6f 68 6e 10 1e"

export default function ProtobufDecoder() {
    const [input, setInput] = useState("")
    const [format, setFormat] = useState<"hex" | "base64">("hex")
    const [decoded, setDecoded] = useState<DecodedField[] | null>(null)
    const [error, setError] = useState("")
    const { toast } = useToast()
    const shareState = useMemo(() => ({ input, format }), [input, format])
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setInput(typeof state.input === "string" ? state.input : "")
        setFormat(state.format === "base64" ? "base64" : "hex")
    })
    const { addEntry } = useToolHistory("protobuf-decoder", "Protobuf Decoder")

    const decode = useCallback(() => {
        if (!input.trim()) {
            setDecoded(null)
            setError("")
            return
        }
        try {
            const bytes = format === "hex" ? hexToBytes(input) : base64ToBytes(input)
            const fields = decodeProtobuf(bytes)
            if (fields.length === 0) throw new Error("No fields decoded - input may not be valid protobuf")
            setDecoded(fields)
            setError("")
            addEntry({ input: JSON.stringify({ format, input }), output: JSON.stringify(fieldsToJson(fields), null, 2), metadata: { action: "decode" } })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Decode failed")
            setDecoded(null)
            addEntry({ input: JSON.stringify({ format, input }), output: "error", metadata: { action: "decode" } })
        }
    }, [input, format, addEntry])

    const copyJson = useCallback(() => {
        if (!decoded) return
        const json = fieldsToJson(decoded)
        navigator.clipboard.writeText(JSON.stringify(json, null, 2))
        toast({ title: "JSON copied" })
    }, [decoded, toast])

    return (
        <ToolCard
            title="Protobuf Decoder"
            description="Decode raw Protocol Buffer binary data into readable fields"
            icon={<Binary className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "protobuf-decoder",
                toolName: "Protobuf Decoder",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { input?: string; format?: string }
                        setInput(parsed.input || "")
                        setFormat(parsed.format === "base64" ? "base64" : "hex")
                    } catch {
                        setInput(entry.input || "")
                    }
                },
            }}
        >
            <div className="space-y-4">
                <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium">Input Format:</label>
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as "hex" | "base64")}
                        className="rounded border bg-background px-2 py-1 text-sm"
                    >
                        <option value="hex">Hex</option>
                        <option value="base64">Base64</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => { setInput(SAMPLE_HEX); setFormat("hex") }}>
                        Load Sample
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Raw Protobuf ({format})</label>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={format === "hex" ? "08 96 01 12 0b 48 65 6c 6c 6f..." : "CJYBEgtIZWxsbyBXb3JsZBgB..."}
                            className="font-mono text-sm min-h-[300px]"
                        />
                        <Button onClick={decode} className="w-full">
                            <FileCode className="h-4 w-4 mr-1" /> Decode
                        </Button>
                    </div>

                    {/* Output */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Decoded Fields</label>
                            {decoded && (
                                <Button variant="outline" size="sm" onClick={copyJson}>
                                    <Copy className="h-4 w-4 mr-1" /> Copy JSON
                                </Button>
                            )}
                        </div>
                        <div className="min-h-[300px] border rounded-md p-3 bg-muted/30 overflow-auto">
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            {decoded && renderFields(decoded)}
                            {!decoded && !error && (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Paste protobuf data and click Decode
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Schema-less decoding: field numbers and wire types are shown. For full type information, use a .proto schema file.
                </p>
            </div>
        </ToolCard>
    )
}
