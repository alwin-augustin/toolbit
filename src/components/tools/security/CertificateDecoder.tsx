import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Lock, CheckCircle, AlertCircle, Clock } from "lucide-react"
import * as asn1js from "asn1js"
import * as pkijs from "pkijs"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

interface CertInfo {
    subject: Record<string, string>
    issuer: Record<string, string>
    serialNumber: string
    notBefore: Date
    notAfter: Date
    signatureAlgorithm: string
    publicKeyAlgorithm: string
    publicKeySize: string
    sans: string[]
    fingerprints: { sha1: string; sha256: string }
    isValid: boolean
    validityStatus: "valid" | "expired" | "not_yet_valid"
    extensions: { name: string; critical: boolean; value: string }[]
}

const OID_MAP: Record<string, string> = {
    "2.5.4.3": "CN",
    "2.5.4.6": "C",
    "2.5.4.7": "L",
    "2.5.4.8": "ST",
    "2.5.4.10": "O",
    "2.5.4.11": "OU",
    "1.2.840.113549.1.1.1": "RSA",
    "1.2.840.113549.1.1.5": "SHA-1 with RSA",
    "1.2.840.113549.1.1.11": "SHA-256 with RSA",
    "1.2.840.113549.1.1.12": "SHA-384 with RSA",
    "1.2.840.113549.1.1.13": "SHA-512 with RSA",
    "1.2.840.10045.2.1": "EC",
    "1.2.840.10045.4.3.2": "ECDSA with SHA-256",
    "1.2.840.10045.4.3.3": "ECDSA with SHA-384",
    "2.5.29.17": "Subject Alternative Name",
    "2.5.29.15": "Key Usage",
    "2.5.29.37": "Extended Key Usage",
    "2.5.29.19": "Basic Constraints",
    "2.5.29.14": "Subject Key Identifier",
    "2.5.29.35": "Authority Key Identifier",
    "2.5.29.31": "CRL Distribution Points",
    "1.3.6.1.5.5.7.1.1": "Authority Information Access",
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const blocks: string[] = []
    const pemBlockRegex = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g
    let match: RegExpExecArray | null
    while ((match = pemBlockRegex.exec(pem)) !== null) {
        const label = match[1] || ""
        if (label.includes("CERTIFICATE")) {
            blocks.push(match[2] || "")
        }
    }

    const candidates = blocks.length > 0 ? blocks : [pem]

    for (const body of candidates) {
        const cleaned = body.replace(/[^A-Za-z0-9+/=]/g, "")
        if (!cleaned) continue
        const padding = cleaned.length % 4 === 0 ? "" : "=".repeat(4 - (cleaned.length % 4))
        const b64 = `${cleaned}${padding}`
        try {
            const binary = atob(b64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i)
            }
            return bytes.buffer
        } catch {
            // try next candidate
        }
    }

    throw new Error("Invalid PEM/base64 data. Ensure the certificate is complete.")
}

function rdnToObject(rdn: pkijs.RelativeDistinguishedNames): Record<string, string> {
    const result: Record<string, string> = {}
    for (const typeAndValue of rdn.typesAndValues) {
        const oid = typeAndValue.type
        const name = OID_MAP[oid] || oid
        result[name] = typeAndValue.value.valueBlock.value as string
    }
    return result
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, "0").toUpperCase())
        .join(":")
}

async function computeFingerprint(data: ArrayBuffer, algo: string): Promise<string> {
    const hash = await crypto.subtle.digest(algo, data)
    return arrayBufferToHex(hash)
}

async function decodeCertificate(pem: string): Promise<CertInfo> {
    const der = pemToArrayBuffer(pem)
    const asn1 = asn1js.fromBER(der)
    if (asn1.offset === -1) throw new Error("Invalid ASN.1 data")

    const cert = new pkijs.Certificate({ schema: asn1.result })

    const subject = rdnToObject(cert.subject)
    const issuer = rdnToObject(cert.issuer)
    const serialNumber = Array.from(new Uint8Array(cert.serialNumber.valueBlock.valueHexView))
        .map(b => b.toString(16).padStart(2, "0").toUpperCase())
        .join(":")
    const notBefore = cert.notBefore.value
    const notAfter = cert.notAfter.value
    const now = new Date()

    const signatureAlgorithm = OID_MAP[cert.signatureAlgorithm.algorithmId] || cert.signatureAlgorithm.algorithmId
    const publicKeyAlgorithm = OID_MAP[cert.subjectPublicKeyInfo.algorithm.algorithmId] || cert.subjectPublicKeyInfo.algorithm.algorithmId

    let publicKeySize = "Unknown"
    try {
        const pkRaw = cert.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView
        publicKeySize = `${(pkRaw.byteLength - 1) * 8} bits`
    } catch {
        // ignore
    }

    // SANs
    const sans: string[] = []
    const extensions: { name: string; critical: boolean; value: string }[] = []
    if (cert.extensions) {
        for (const ext of cert.extensions) {
            const name = OID_MAP[ext.extnID] || ext.extnID
            if (ext.extnID === "2.5.29.17") {
                // Subject Alternative Name
                try {
                    const sanExt = ext.parsedValue as pkijs.GeneralNames
                    if (sanExt && sanExt.names) {
                        for (const n of sanExt.names) {
                            if (n.type === 2) sans.push(n.value as string) // DNS
                            else if (n.type === 7) sans.push(`IP: ${n.value}`) // IP
                        }
                    }
                } catch {
                    // ignore
                }
            }
            extensions.push({
                name,
                critical: ext.critical,
                value: ext.extnID === "2.5.29.17" ? sans.join(", ") : name,
            })
        }
    }

    const [sha1, sha256] = await Promise.all([
        computeFingerprint(der, "SHA-1"),
        computeFingerprint(der, "SHA-256"),
    ])

    const validityStatus = now < notBefore ? "not_yet_valid" : now > notAfter ? "expired" : "valid"

    return {
        subject,
        issuer,
        serialNumber,
        notBefore,
        notAfter,
        signatureAlgorithm,
        publicKeyAlgorithm,
        publicKeySize,
        sans,
        fingerprints: { sha1, sha256 },
        isValid: validityStatus === "valid",
        validityStatus,
        extensions,
    }
}

const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA0MoHEoVOxJfFJW5HlKkEyj4MA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNDA3MDEwMDAwMDBaFw0yNDA5MjkwMDAwMDBaMBkxFzAVBgNVBAMT
DmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0OaR
VqPRcOEYvqPdH6phH+4qlr8v7iFQ9uNrD+QLe2tCDu2dI3+AwGJo7a2G3R9e9AK
q9PBB1dnS3uFJvG7UdJEOR12m7K0kkBZ/NBFSy/wfJSibzxaB1vI0qjL9PjOG+Tr
dOAhONaVDggR78x6Iz3vIOjLCfWIGq3TqREB8G1nCVRB1c9GQUfTzR3T9Imhj6ZN
5IFJzXO22M/BV9U5wGI+F4LrVGqz5bp4X0BEH7F9/oa9jJ9QLmbSMm0Z7r2rzhY
+8KLQlgy1enWDl5SQH2Ony6l3FN1WiN+QlO3T6+zIFIu7WUEY+BoS3LDBA4+tIY
Vt3r2iW6G25TWaNm5wIDAQABo4ICfzCCAnswDgYDVR0PAQH/BAQDAgWgMB0GA1Ud
JQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQW
BBR+f8JAVxUFH/2W8QmUTRqBHiOUPTAfBgNVHSMEGDAWgBQULrMXt1hWy65QCUDm
H6+dixTCxjBVBggrBgEFBQcBAQRJMEcwIQYIKwYBBQUHMAGGFWh0dHA6Ly9yMy5v
LmxlbmNyLm9yZzAiBggrBgEFBQcwAoYWaHR0cDovL3IzLmkubGVuY3Iub3JnLzAZ
BgNVHREEEjAQgg5leGFtcGxlLmNvbTATBgNVHSAEDDAKMAgGBmeBDAECATCCAQQG
CisGAQQB1nkCBAIEgfUEgfIA8AB2AHb/iD8KtvuVUcJhzPWHujS0pM27KdxoQgqf
5mdMWjp0AAABkGtpNYgAAAQDAEcwRQIgUy7HyJTPNBUwDyQJMMK7e4IxQN33rkK0
xrz5eSKvV6cCIQCYV0c5RfRn7P7XJ0GaVFMa/m0GxOMoR/SfLq5YhJJLOgB2AO7N
0GTV2xrOxVy3nbTNE6Iyh0Z8vOzew1FIWUZxH7WbAAABkGtpNVcAAAQDAEcwRQIh
ALoSpM/qE3gV8fN6M1c2cW0Rmi4pWNO7sX7XG9ckZ0fDAiA9DpeBZHO7NHHfF/QP
aCbOVj/3HDOFzFR80L2dDQ/9cjANBgkqhkiG9w0BAQsFAAOCAQEAQGBfU/z2Qqwk
MlBvwl0JJKFkmGKL+jmWwX8SqrgH5DYNzjEA6P8k8g7KqLvMuX4jVeMF2gJRBvKu
S4yW/jS5L7AwIkqEb+6KxGBpb80SN8GM8u4+l7YL/IW0k7R/bBh+dyrAGJhJEbfS
oRK3hHPFH8y1kJByz6zDaRPa80yj/YKjBPg7MWWSE7I1P8lMPhOAj/Jhz1+n3k1c
N1T+GVAAfrLrMC0MPN0fQ3gJi7K+8D4a8SYXJkL0RoTIjhQ3NXQD7VKMDN+c+oR+
qJ5VMlFdKJl1vj9FPr+j1aHR+KCf9FYPcPeBaJkRZ1WM8lxV3bOJ7BFYL6dO0u/a
4z/2bTKDRw==
-----END CERTIFICATE-----`

export default function CertificateDecoder() {
    const [input, setInput] = useState("")
    const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const { getShareUrl } = useUrlState(input, setInput)
    const { addEntry } = useToolHistory("certificate-decoder", "Certificate Decoder")

    const decode = useCallback(async () => {
        if (!input.trim()) {
            setCertInfo(null)
            setError("")
            return
        }
        setLoading(true)
        try {
            const info = await decodeCertificate(input)
            setCertInfo(info)
            setError("")
            addEntry({ input, output: JSON.stringify(info), metadata: { action: "decode" } })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to decode certificate")
            setCertInfo(null)
            addEntry({ input, output: "error", metadata: { action: "decode" } })
        } finally {
            setLoading(false)
        }
    }, [input, addEntry])

    const copyJson = useCallback(() => {
        if (!certInfo) return
        const json = {
            ...certInfo,
            notBefore: certInfo.notBefore.toISOString(),
            notAfter: certInfo.notAfter.toISOString(),
        }
        navigator.clipboard.writeText(JSON.stringify(json, null, 2))
        toast({ title: "Certificate details copied as JSON" })
    }, [certInfo, toast])

    const formatDate = (d: Date) => d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

    const validityBadge = (status: CertInfo["validityStatus"]) => {
        switch (status) {
            case "valid": return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" />Valid</span>
            case "expired": return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />Expired</span>
            case "not_yet_valid": return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />Not Yet Valid</span>
        }
    }

    const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex gap-3 py-1.5 border-b border-border/30 last:border-0">
            <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm font-mono break-all">{value}</span>
        </div>
    )

    return (
        <ToolCard
            title="Certificate Decoder"
            description="Decode and inspect SSL/TLS certificates (PEM format)"
            icon={<Lock className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "certificate-decoder",
                toolName: "Certificate Decoder",
                onRestore: (entry) => {
                    setInput(entry.input || "")
                },
            }}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">PEM Certificate</label>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            className="font-mono text-xs min-h-[350px]"
                        />
                        <div className="flex gap-2">
                            <Button onClick={decode} className="flex-1" disabled={loading || !input.trim()}>
                                {loading ? "Decoding..." : "Decode Certificate"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setInput(SAMPLE_PEM) }}>
                                Sample
                            </Button>
                        </div>
                    </div>

                    {/* Output */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Certificate Details</label>
                            {certInfo && (
                                <Button variant="outline" size="sm" onClick={copyJson}>
                                    <Copy className="h-4 w-4 mr-1" /> JSON
                                </Button>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-md border border-destructive/50 bg-destructive/5">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {certInfo && (
                            <div className="border rounded-md p-3 space-y-3 bg-muted/20 overflow-auto max-h-[500px]">
                                {/* Validity */}
                                <div className="flex items-center justify-between">
                                    {validityBadge(certInfo.validityStatus)}
                                </div>

                                {/* Subject */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Subject</h4>
                                    {Object.entries(certInfo.subject).map(([k, v]) => (
                                        <InfoRow key={k} label={k} value={v} />
                                    ))}
                                </div>

                                {/* Issuer */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issuer</h4>
                                    {Object.entries(certInfo.issuer).map(([k, v]) => (
                                        <InfoRow key={k} label={k} value={v} />
                                    ))}
                                </div>

                                {/* Dates */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Validity Period</h4>
                                    <InfoRow label="Not Before" value={formatDate(certInfo.notBefore)} />
                                    <InfoRow label="Not After" value={formatDate(certInfo.notAfter)} />
                                </div>

                                {/* Technical */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Technical Details</h4>
                                    <InfoRow label="Serial Number" value={<span className="text-xs">{certInfo.serialNumber}</span>} />
                                    <InfoRow label="Signature" value={certInfo.signatureAlgorithm} />
                                    <InfoRow label="Public Key" value={`${certInfo.publicKeyAlgorithm} (${certInfo.publicKeySize})`} />
                                </div>

                                {/* SANs */}
                                {certInfo.sans.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Subject Alternative Names</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {certInfo.sans.map((san, i) => (
                                                <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-muted">{san}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Fingerprints */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fingerprints</h4>
                                    <InfoRow label="SHA-1" value={<span className="text-xs">{certInfo.fingerprints.sha1}</span>} />
                                    <InfoRow label="SHA-256" value={<span className="text-xs break-all">{certInfo.fingerprints.sha256}</span>} />
                                </div>
                            </div>
                        )}

                        {!certInfo && !error && (
                            <div className="min-h-[350px] border rounded-md flex items-center justify-center bg-muted/30">
                                <p className="text-sm text-muted-foreground">Paste a PEM certificate and click Decode</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolCard>
    )
}
