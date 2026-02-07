import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Shield, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"
import { useToolPipe } from "@/hooks/use-tool-pipe"
import { useWorkspace } from "@/hooks/use-workspace"

type Tab = "decode" | "generate"

function base64UrlDecode(str: string): string {
    const padded = str + "=".repeat((4 - (str.length % 4)) % 4)
    return atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
}

function base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function formatTimeClaim(epoch: number): { date: string; relative: string; expired: boolean } {
    const d = new Date(epoch * 1000)
    const now = Date.now()
    const diff = epoch * 1000 - now
    const absDiff = Math.abs(diff)

    const mins = Math.floor(absDiff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    let relative: string
    if (days > 0) relative = `${days}d ${hours % 24}h`
    else if (hours > 0) relative = `${hours}h ${mins % 60}m`
    else relative = `${mins}m`

    return {
        date: d.toLocaleString(),
        relative: diff > 0 ? `in ${relative}` : `${relative} ago`,
        expired: diff < 0,
    }
}

async function hmacSign(payload: string, header: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const data = encoder.encode(`${header}.${payload}`)
    const sig = await crypto.subtle.sign("HMAC", key, data)
    const bytes = new Uint8Array(sig)
    let binary = ""
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.lBTQmKFHnpGmOe2PObMRCG9GMAKpSChav4woD3Y9YeA"

const SAMPLE_PAYLOAD = `{
  "sub": "1234567890",
  "name": "Jane Doe",
  "admin": false,
  "iat": ${Math.floor(Date.now() / 1000)},
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`

export default function JwtDecoder() {
    const [activeTab, setActiveTab] = useState<Tab>("decode")
    const [jwt, setJwt] = useState("")
    const [secret, setSecret] = useState("")
    const [header, setHeader] = useState("")
    const [payload, setPayload] = useState("")
    const [signature, setSignature] = useState("")
    const [error, setError] = useState("")
    const [sigStatus, setSigStatus] = useState<"valid" | "invalid" | "unchecked">("unchecked")
    const [timeClaims, setTimeClaims] = useState<Record<string, ReturnType<typeof formatTimeClaim>>>({})

    // Generate tab state
    const [genPayload, setGenPayload] = useState(SAMPLE_PAYLOAD)
    const [genSecret, setGenSecret] = useState("your-256-bit-secret")
    const [genOutput, setGenOutput] = useState("")

    const { toast } = useToast()
    const shareState = useMemo(
        () => ({
            activeTab,
            jwt,
            genPayload,
        }),
        [activeTab, jwt, genPayload],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setActiveTab(state.activeTab === "generate" ? "generate" : "decode")
        setJwt(typeof state.jwt === "string" ? state.jwt : "")
        setGenPayload(typeof state.genPayload === "string" ? state.genPayload : SAMPLE_PAYLOAD)
    })
    const { addEntry } = useToolHistory("jwt-decoder", "JWT Decoder")
    const { consumePipeData } = useToolPipe()
    const consumeWorkspaceState = useWorkspace((state) => state.consumeState)

    useEffect(() => {
        if (jwt) return
        const workspaceState = consumeWorkspaceState("jwt-decoder")
        if (workspaceState) {
            try {
                const parsed = JSON.parse(workspaceState) as { input?: string }
                setJwt(parsed.input || "")
                setActiveTab("decode")
            } catch {
                setJwt(workspaceState)
            }
            return
        }
        const payload = consumePipeData()
        if (payload?.data) {
            setJwt(payload.data)
            setActiveTab("decode")
        }
    }, [consumePipeData, jwt, consumeWorkspaceState])

    const decodeJwt = useCallback(() => {
        setError("")
        setSigStatus("unchecked")
        setTimeClaims({})

        try {
            const parts = jwt.trim().split(".")
            if (parts.length !== 3) throw new Error("Invalid JWT: must have 3 parts separated by dots")

            const headerJson = base64UrlDecode(parts[0])
            const payloadJson = base64UrlDecode(parts[1])

            // Validate JSON
            const headerObj = JSON.parse(headerJson)
            const payloadObj = JSON.parse(payloadJson)

            setHeader(JSON.stringify(headerObj, null, 2))
            setPayload(JSON.stringify(payloadObj, null, 2))
            setSignature(parts[2])

            // Parse time claims
            const claims: Record<string, ReturnType<typeof formatTimeClaim>> = {}
            if (payloadObj.exp) claims.exp = formatTimeClaim(payloadObj.exp)
            if (payloadObj.iat) claims.iat = formatTimeClaim(payloadObj.iat)
            if (payloadObj.nbf) claims.nbf = formatTimeClaim(payloadObj.nbf)
            setTimeClaims(claims)
            addEntry({
                input: jwt,
                output: JSON.stringify(payloadObj, null, 2),
                metadata: { action: "decode" },
            })
        } catch (e) {
            setError((e as Error).message)
            setHeader("")
            setPayload("")
            setSignature("")
            addEntry({ input: jwt, output: "error", metadata: { action: "decode" } })
        }
    }, [jwt, addEntry])

    const verifySignature = useCallback(async () => {
        if (!jwt.trim() || !secret.trim()) {
            toast({ description: "Enter JWT and secret key", variant: "destructive" })
            return
        }
        try {
            const parts = jwt.trim().split(".")
            if (parts.length !== 3) throw new Error("Invalid JWT")

            const expectedSig = await hmacSign(parts[1], parts[0], secret)
            setSigStatus(expectedSig === parts[2] ? "valid" : "invalid")
        } catch {
            setSigStatus("invalid")
        }
    }, [jwt, secret, toast])

    const reEncode = useCallback(() => {
        try {
            // Validate the edited payload is valid JSON
            JSON.parse(payload)
            const headerB64 = base64UrlEncode(header.replace(/\s+/g, "").length > 0 ? header : '{"alg":"none","typ":"JWT"}')
            const payloadB64 = base64UrlEncode(payload)
            const unsignedJwt = `${headerB64}.${payloadB64}.`
            setJwt(unsignedJwt)
            toast({ description: "JWT re-encoded (unsigned)" })
        } catch {
            toast({ description: "Invalid JSON in payload", variant: "destructive" })
        }
    }, [header, payload, toast])

    const generateJwt = useCallback(async () => {
        try {
            JSON.parse(genPayload)
            const headerB64 = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
            const payloadB64 = base64UrlEncode(genPayload.replace(/\n/g, "").replace(/\s{2,}/g, ""))
            const sig = await hmacSign(payloadB64, headerB64, genSecret)
            const output = `${headerB64}.${payloadB64}.${sig}`
            setGenOutput(output)
            addEntry({ input: genPayload, output, metadata: { action: "generate" } })
        } catch (e) {
            toast({ description: `Error: ${(e as Error).message}`, variant: "destructive" })
        }
    }, [genPayload, genSecret, toast, addEntry])

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast({ description: `${label} copied!` })
    }

    return (
        <ToolCard
            title="JWT Decoder"
            description="Decode, verify, edit, and generate JSON Web Tokens"
            icon={<Shield className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "jwt-decoder",
                toolName: "JWT Decoder",
                onRestore: (entry) => {
                    setJwt(entry.input || "")
                },
            }}
            pipeSource={{
                toolId: "jwt-decoder",
                output: payload || "",
            }}
        >
            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {(["decode", "generate"] as const).map(tab => (
                    <button
                        key={tab}
                        className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                            activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "decode" && (
                <div className="space-y-4">
                    {/* JWT Input */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">JWT Token</label>
                        <Textarea
                            value={jwt}
                            onChange={(e) => setJwt(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="h-20 font-mono text-sm"
                            data-testid="input-jwt"
                        />
                        <div className="flex gap-2">
                            <Button onClick={decodeJwt} data-testid="button-decode">Decode</Button>
                            <Button variant="outline" onClick={() => { setJwt(SAMPLE_JWT); }} data-testid="button-sample">
                                Sample
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    {/* Signature Verification */}
                    {header && (
                        <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                            <label className="text-sm font-medium">Verify Signature (HMAC-SHA256)</label>
                            <div className="flex gap-2">
                                <Input
                                    value={secret}
                                    onChange={(e) => { setSecret(e.target.value); setSigStatus("unchecked") }}
                                    placeholder="Enter secret key..."
                                    className="flex-1 font-mono text-sm"
                                    type="password"
                                />
                                <Button variant="outline" size="sm" onClick={verifySignature}>
                                    Verify
                                </Button>
                            </div>
                            {sigStatus !== "unchecked" && (
                                <div className={`flex items-center gap-1.5 text-sm font-medium ${
                                    sigStatus === "valid" ? "text-green-600" : "text-red-600"
                                }`}>
                                    {sigStatus === "valid" ? (
                                        <><CheckCircle className="h-4 w-4" /> Signature Valid</>
                                    ) : (
                                        <><XCircle className="h-4 w-4" /> Signature Invalid</>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Time Claims */}
                    {Object.keys(timeClaims).length > 0 && (
                        <div className="space-y-1.5 p-3 border rounded-md bg-muted/30">
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> Token Timestamps
                            </label>
                            <div className="space-y-1">
                                {Object.entries(timeClaims).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-2 text-sm font-mono">
                                        <span className="font-bold w-8">{key}:</span>
                                        <span>{val.date}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                            key === "exp"
                                                ? val.expired
                                                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                                    : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                            {val.relative}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Decoded Header */}
                    {header && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-red-500">Header</label>
                                <Button variant="outline" size="sm" onClick={() => copy(header, "Header")}>
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                </Button>
                            </div>
                            <Textarea
                                value={header}
                                onChange={(e) => setHeader(e.target.value)}
                                className="h-24 font-mono text-sm"
                            />
                        </div>
                    )}

                    {/* Decoded Payload (editable) */}
                    {payload && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-purple-500">Payload (editable)</label>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" onClick={reEncode}>
                                        Re-encode
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => copy(payload, "Payload")}>
                                        <Copy className="h-3 w-3 mr-1" /> Copy
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                value={payload}
                                onChange={(e) => setPayload(e.target.value)}
                                className="h-40 font-mono text-sm"
                            />
                        </div>
                    )}

                    {/* Signature */}
                    {signature && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-blue-500">Signature</label>
                                <Button variant="outline" size="sm" onClick={() => copy(signature, "Signature")}>
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                </Button>
                            </div>
                            <div className="p-2 border rounded-md font-mono text-sm break-all bg-muted/30">
                                {signature}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "generate" && (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Algorithm</label>
                        <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-md border">
                            HS256 (HMAC-SHA256)
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Payload (JSON)</label>
                        <Textarea
                            value={genPayload}
                            onChange={(e) => setGenPayload(e.target.value)}
                            className="h-40 font-mono text-sm"
                            placeholder='{"sub": "1234567890", "name": "John Doe"}'
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Secret Key</label>
                        <Input
                            value={genSecret}
                            onChange={(e) => setGenSecret(e.target.value)}
                            className="font-mono text-sm"
                            placeholder="your-secret-key"
                        />
                    </div>

                    <Button onClick={generateJwt}>Generate JWT</Button>

                    {genOutput && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Generated JWT</label>
                                <Button variant="outline" size="sm" onClick={() => copy(genOutput, "JWT")}>
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                </Button>
                            </div>
                            <Textarea
                                value={genOutput}
                                readOnly
                                className="h-24 font-mono text-sm"
                            />
                        </div>
                    )}
                </div>
            )}
        </ToolCard>
    )
}
