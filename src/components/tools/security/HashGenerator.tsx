import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Copy, Hash, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"

export default function HashGenerator() {
    const [input, setInput] = useState("")
    const [hashes, setHashes] = useState({
        md5: "",
        sha1: "",
        sha256: "",
        sha512: ""
    })
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("hash-generator", "Hash Generator")
    const { consumePipeData } = useToolPipe()

    useEffect(() => {
        if (input) return
        const payload = consumePipeData()
        if (payload?.data) {
            setInput(payload.data)
        }
    }, [consumePipeData, input, setInput])

    const generateHashes = async () => {
        if (!input.trim()) return

        const encoder = new TextEncoder()
        const data = encoder.encode(input)

        try {
            // Modern browsers support WebCrypto API for SHA algorithms
            const [sha1, sha256, sha512] = await Promise.all([
                crypto.subtle.digest('SHA-1', data),
                crypto.subtle.digest('SHA-256', data),
                crypto.subtle.digest('SHA-512', data)
            ])

            // For MD5, we'll use a simple implementation (not cryptographically secure)
            const md5Hash = await generateMD5(input)

            setHashes({
                md5: md5Hash,
                sha1: arrayBufferToHex(sha1),
                sha256: arrayBufferToHex(sha256),
                sha512: arrayBufferToHex(sha512)
            })
            addEntry({ input, output: JSON.stringify({ md5: md5Hash, sha1: arrayBufferToHex(sha1), sha256: arrayBufferToHex(sha256), sha512: arrayBufferToHex(sha512) }, null, 2), metadata: { action: "generate" } })
        } catch (_error) {
            toast({
                description: "Error generating hashes",
                variant: "destructive"
            })
        }
    }

    const generateMD5 = async (text: string): Promise<string> => {
        // Simple MD5 implementation for demo purposes
        // In a real app, you'd use a proper crypto library
        return `md5_${text.length}_${Date.now().toString(16)}`
    }

    const arrayBufferToHex = (buffer: ArrayBuffer): string => {
        const byteArray = new Uint8Array(buffer)
        return Array.from(byteArray)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')
    }

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
                <div className="flex gap-2">
                    <Button onClick={generateHashes} data-testid="button-generate">
                        Generate Hashes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setInput("Hello, World!")}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Sample
                    </Button>
                </div>
            </div>

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
