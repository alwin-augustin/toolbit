import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"

export default function JwtDecoder() {
    const [jwt, setJwt] = useState("")
    const [decoded, setDecoded] = useState({
        header: "",
        payload: "",
        signature: "",
        valid: false
    })
    const { toast } = useToast()

    const decodeJwt = () => {
        try {
            const parts = jwt.split('.')
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format - must have 3 parts separated by dots')
            }

            const [headerB64, payloadB64, signature] = parts

            // Decode header and payload
            const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')))
            const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))

            setDecoded({
                header: JSON.stringify(header, null, 2),
                payload: JSON.stringify(payload, null, 2),
                signature: signature,
                valid: true
            })
        } catch (error) {
            setDecoded({
                header: `Error: ${error instanceof Error ? error.message : 'Invalid JWT'}`,
                payload: "",
                signature: "",
                valid: false
            })
        }
    }

    const copyToClipboard = (text: string, part: string) => {
        navigator.clipboard.writeText(text)
        toast({ description: `${part} copied to clipboard!` })
    }

    const loadSampleJwt = () => {
        // Sample JWT for testing
        const sample = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        setJwt(sample)
    }

    return (
        <ToolCard
            title="JWT Decoder"
            description="Decode JSON Web Tokens (JWT) to view header, payload, and signature"
            icon={<Shield className="h-5 w-5" />}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="jwt-input" className="text-sm font-medium">
                        JWT Token
                    </label>
                    <Textarea
                        id="jwt-input"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={jwt}
                        onChange={(e) => setJwt(e.target.value)}
                        className="h-20 font-mono text-sm"
                        data-testid="input-jwt"
                    />
                    <div className="flex gap-2">
                        <Button onClick={decodeJwt} data-testid="button-decode">
                            Decode JWT
                        </Button>
                        <Button onClick={loadSampleJwt} variant="outline" data-testid="button-sample">
                            Load Sample
                        </Button>
                    </div>
                </div>

                {decoded.header && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Header</label>
                                <Button
                                    onClick={() => copyToClipboard(decoded.header, "Header")}
                                    variant="outline"
                                    size="sm"
                                    data-testid="button-copy-header"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </Button>
                            </div>
                            <Textarea
                                value={decoded.header}
                                readOnly
                                className={`h-32 font-mono text-sm ${decoded.valid ? '' : 'text-destructive'}`}
                                data-testid="output-header"
                            />
                        </div>

                        {decoded.payload && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Payload</label>
                                    <Button
                                        onClick={() => copyToClipboard(decoded.payload, "Payload")}
                                        variant="outline"
                                        size="sm"
                                        data-testid="button-copy-payload"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                                <Textarea
                                    value={decoded.payload}
                                    readOnly
                                    className="h-32 font-mono text-sm"
                                    data-testid="output-payload"
                                />
                            </div>
                        )}

                        {decoded.signature && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Signature</label>
                                    <Button
                                        onClick={() => copyToClipboard(decoded.signature, "Signature")}
                                        variant="outline"
                                        size="sm"
                                        data-testid="button-copy-signature"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                                <Textarea
                                    value={decoded.signature}
                                    readOnly
                                    className="h-16 font-mono text-sm"
                                    data-testid="output-signature"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolCard>
    )
}