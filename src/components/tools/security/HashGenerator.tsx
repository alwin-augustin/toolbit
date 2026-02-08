import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Copy, Hash, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"
import { ToolEmptyState } from "@/components/ToolEmptyState"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"

const WORKER_THRESHOLD = 10_000 // Use worker for inputs > 10KB

interface HashResult {
    md5: string
    sha1: string
    sha256: string
    sha512: string
}

// Inline MD5 for small inputs (main thread)
function md5(input: string): string {
    const k = new Uint32Array([
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
        0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
        0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
        0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
        0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
        0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
        0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
        0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
        0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
    ])
    const s = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ]
    const bytes: number[] = []
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i)
        if (code < 0x80) bytes.push(code)
        else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
        else if (code < 0xd800 || code >= 0xe000)
            bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
        else {
            const cp = 0x10000 + (((code & 0x3ff) << 10) | (input.charCodeAt(++i) & 0x3ff))
            bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
        }
    }
    const bitLen = bytes.length * 8
    bytes.push(0x80)
    while (bytes.length % 64 !== 56) bytes.push(0)
    for (let i = 0; i < 8; i++) bytes.push((bitLen >>> (i * 8)) & 0xff)
    let a0 = 0x67452301 >>> 0, b0 = 0xefcdab89 >>> 0, c0 = 0x98badcfe >>> 0, d0 = 0x10325476 >>> 0
    for (let offset = 0; offset < bytes.length; offset += 64) {
        const M = new Uint32Array(16)
        for (let j = 0; j < 16; j++)
            M[j] = bytes[offset + j * 4] | (bytes[offset + j * 4 + 1] << 8) | (bytes[offset + j * 4 + 2] << 16) | (bytes[offset + j * 4 + 3] << 24)
        let A = a0, B = b0, C = c0, D = d0
        for (let i = 0; i < 64; i++) {
            let F: number, g: number
            if (i < 16) { F = (B & C) | (~B & D); g = i }
            else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
            else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
            else { F = C ^ (B | ~D); g = (7 * i) % 16 }
            F = (F + A + k[i] + M[g]) >>> 0; A = D; D = C; C = B
            B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0
        }
        a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0
    }
    const toHex = (n: number) => { let h = ""; for (let i = 0; i < 4; i++) h += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0"); return h }
    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0)
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
    const byteArray = new Uint8Array(buffer)
    let hex = ""
    for (let i = 0; i < byteArray.length; i++) hex += byteArray[i].toString(16).padStart(2, "0")
    return hex
}

export default function HashGenerator() {
    const [input, setInput] = useState("")
    const [hashes, setHashes] = useState<HashResult>({ md5: "", sha1: "", sha256: "", sha512: "" })
    const [isComputing, setIsComputing] = useState(false)
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("hash-generator", "Hash Generator")
    const { consumePipeData } = useToolPipe()
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    useEffect(() => {
        if (input) return
        const payload = consumePipeData()
        if (payload?.data) {
            setInput(payload.data)
        }
    }, [consumePipeData, input, setInput])

    const computeWithWorker = useCallback((text: string): Promise<HashResult> => {
        const worker = new Worker(new URL("../../../workers/hash-worker.ts", import.meta.url), { type: "module" })
        return new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => { worker.terminate(); reject(new Error("Timeout")) }, 20_000)
            worker.onmessage = (e: MessageEvent) => {
                window.clearTimeout(timeout); worker.terminate()
                if (e.data?.ok) resolve({ md5: e.data.md5, sha1: e.data.sha1, sha256: e.data.sha256, sha512: e.data.sha512 })
                else reject(new Error(e.data?.error || "Worker failed"))
            }
            worker.onerror = (e) => { window.clearTimeout(timeout); worker.terminate(); reject(new Error(e.message)) }
            worker.postMessage({ text })
        })
    }, [])

    const computeMainThread = useCallback(async (text: string): Promise<HashResult> => {
        const encoder = new TextEncoder()
        const data = encoder.encode(text)
        const [sha1, sha256, sha512] = await Promise.all([
            crypto.subtle.digest("SHA-1", data),
            crypto.subtle.digest("SHA-256", data),
            crypto.subtle.digest("SHA-512", data),
        ])
        return {
            md5: md5(text),
            sha1: arrayBufferToHex(sha1),
            sha256: arrayBufferToHex(sha256),
            sha512: arrayBufferToHex(sha512),
        }
    }, [])

    const generateHashes = useCallback(async (text: string) => {
        if (!text.trim()) {
            setHashes({ md5: "", sha1: "", sha256: "", sha512: "" })
            return
        }
        setIsComputing(true)
        try {
            let result: HashResult
            if (text.length > WORKER_THRESHOLD && "Worker" in window) {
                try {
                    result = await computeWithWorker(text)
                } catch {
                    result = await computeMainThread(text)
                }
            } else {
                result = await computeMainThread(text)
            }
            setHashes(result)
            addEntry({ input: text, output: JSON.stringify(result, null, 2), metadata: { action: "generate" } })
        } catch {
            toast({ description: "Error generating hashes", variant: "destructive" })
        }
        setIsComputing(false)
    }, [addEntry, computeMainThread, computeWithWorker, toast])

    // Auto-compute with debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => generateHashes(input), 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [input, generateHashes])

    const copyToClipboard = (hash: string, type: string) => {
        navigator.clipboard.writeText(hash)
        toast({ description: `${type.toUpperCase()} hash copied to clipboard!` })
    }

    return (
        <ToolCard
            title="Hash Generator"
            description="Generate MD5, SHA-1, SHA-256, and SHA-512 hashes"
            icon={<Hash className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "hash-generator",
                toolName: "Hash Generator",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                },
            }}
        >
            <div className="space-y-2">
                <label htmlFor="hash-input" className="text-sm font-medium">
                    Input Text
                </label>
                <Textarea
                    id="hash-input"
                    placeholder="Enter text to hash..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-32 font-mono text-sm"
                    data-testid="input-hash"
                />
                <div className="flex gap-2 items-center">
                    <Button variant="ghost" size="sm" onClick={() => setInput("Hello, World!")}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Sample
                    </Button>
                    {isComputing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {!isComputing && input.trim() && <span className="text-xs text-muted-foreground">Auto-computed</span>}
                </div>
            </div>

            {!input.trim() && !Object.values(hashes).some(hash => hash) && (
                <ToolEmptyState
                    title="Enter text to generate hashes"
                    description="Generate MD5, SHA-1, SHA-256, and SHA-512 locally."
                    actions={
                        <>
                            <Button variant="outline" size="sm" onClick={() => setInput("Hello, World!")}>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Load sample text
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.dispatchEvent(new CustomEvent("open-snippets"))}
                            >
                                Browse snippets
                            </Button>
                        </>
                    }
                    hint="Tip: Hashes update only when you click Generate."
                />
            )}

            {Object.values(hashes).some(hash => hash) && (
                <div className="space-y-3">
                    {Object.entries({
                        md5: "MD5",
                        sha1: "SHA-1",
                        sha256: "SHA-256",
                        sha512: "SHA-512"
                    }).map(([key, label]) => (
                        <div key={key} className="space-y-2">
                            <label className="text-sm font-medium">{label}</label>
                            <div className="flex gap-2">
                                <Input
                                    value={hashes[key as keyof typeof hashes]}
                                    readOnly
                                    className="font-mono text-sm"
                                    data-testid={`output-${key}`}
                                />
                                <Button
                                    onClick={() => copyToClipboard(hashes[key as keyof typeof hashes], label)}
                                    disabled={!hashes[key as keyof typeof hashes]}
                                    variant="outline"
                                    size="icon"
                                    data-testid={`button-copy-${key}`}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ToolCard>
    )
}
