import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, QrCode } from "lucide-react"
import QRCode from "qrcode"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

type QrMode = "text" | "url" | "wifi" | "vcard"

function buildWifiString(ssid: string, password: string, encryption: string): string {
    return `WIFI:T:${encryption};S:${ssid};P:${password};;`
}

function buildVCard(name: string, phone: string, email: string): string {
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`
}

export default function QrCodeGenerator() {
    const [mode, setMode] = useState<QrMode>("text")
    const [text, setText] = useState("")
    const [url, setUrl] = useState("")
    const [wifiSsid, setWifiSsid] = useState("")
    const [wifiPassword, setWifiPassword] = useState("")
    const [wifiEncryption, setWifiEncryption] = useState("WPA")
    const [vcardName, setVcardName] = useState("")
    const [vcardPhone, setVcardPhone] = useState("")
    const [vcardEmail, setVcardEmail] = useState("")
    const [size, setSize] = useState(256)
    const [qrDataUrl, setQrDataUrl] = useState("")
    const [qrSvg, setQrSvg] = useState("")
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({
            mode,
            text,
            url,
            wifiSsid,
            wifiPassword,
            wifiEncryption,
            vcardName,
            vcardPhone,
            vcardEmail,
            size,
        }),
        [mode, text, url, wifiSsid, wifiPassword, wifiEncryption, vcardName, vcardPhone, vcardEmail, size],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setMode(state.mode === "url" || state.mode === "wifi" || state.mode === "vcard" ? state.mode : "text")
        setText(typeof state.text === "string" ? state.text : "")
        setUrl(typeof state.url === "string" ? state.url : "")
        setWifiSsid(typeof state.wifiSsid === "string" ? state.wifiSsid : "")
        setWifiPassword(typeof state.wifiPassword === "string" ? state.wifiPassword : "")
        setWifiEncryption(typeof state.wifiEncryption === "string" ? state.wifiEncryption : "WPA")
        setVcardName(typeof state.vcardName === "string" ? state.vcardName : "")
        setVcardPhone(typeof state.vcardPhone === "string" ? state.vcardPhone : "")
        setVcardEmail(typeof state.vcardEmail === "string" ? state.vcardEmail : "")
        setSize(typeof state.size === "number" ? state.size : 256)
    })
    const { addEntry } = useToolHistory("qr-code-generator", "QR Code Generator")

    const getContent = useCallback((): string => {
        switch (mode) {
            case "text": return text
            case "url": return url
            case "wifi": return buildWifiString(wifiSsid, wifiPassword, wifiEncryption)
            case "vcard": return buildVCard(vcardName, vcardPhone, vcardEmail)
        }
    }, [mode, text, url, wifiSsid, wifiPassword, wifiEncryption, vcardName, vcardPhone, vcardEmail])

    const generate = useCallback(async () => {
        const content = getContent()
        if (!content.trim()) {
            toast({ description: "Enter content to generate QR code", variant: "destructive" })
            return
        }

        try {
            const dataUrl = await QRCode.toDataURL(content, {
                width: size,
                margin: 2,
                color: { dark: "#000000", light: "#ffffff" },
            })
            setQrDataUrl(dataUrl)

            const svg = await QRCode.toString(content, {
                type: "svg",
                width: size,
                margin: 2,
            })
            setQrSvg(svg)
        } catch (err) {
            toast({ description: `Error: ${(err as Error).message}`, variant: "destructive" })
        }
    }, [getContent, size, toast])

    // Auto-generate on content change
    useEffect(() => {
        const content = getContent()
        if (content.trim()) {
            const timer = setTimeout(() => generate(), 300)
            return () => clearTimeout(timer)
        } else {
            setQrDataUrl("")
            setQrSvg("")
        }
    }, [getContent, generate])

    const downloadPng = () => {
        if (!qrDataUrl) return
        const a = document.createElement("a")
        a.href = qrDataUrl
        a.download = "qrcode.png"
        a.click()
    }

    const downloadSvg = () => {
        if (!qrSvg) return
        const blob = new Blob([qrSvg], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "qrcode.svg"
        a.click()
        URL.revokeObjectURL(url)
    }

    const copyToClipboard = () => {
        const content = getContent()
        navigator.clipboard.writeText(content)
        toast({ description: "Content copied!" })
        addEntry({
            input: JSON.stringify({ mode, content }),
            output: content,
            metadata: { action: "copy" },
        })
    }

    return (
        <ToolCard
            title="QR Code Generator"
            description="Generate QR codes for text, URLs, WiFi, and contacts"
            icon={<QrCode className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "qr-code-generator",
                toolName: "QR Code Generator",
                onRestore: (entry) => {
                    try {
                        const parsed = JSON.parse(entry.input || "{}") as { mode?: QrMode; content?: string }
                        setMode(parsed.mode === "url" || parsed.mode === "wifi" || parsed.mode === "vcard" ? parsed.mode : "text")
                        if (parsed.mode === "text") setText(parsed.content || "")
                        if (parsed.mode === "url") setUrl(parsed.content || "")
                    } catch {
                        // ignore
                    }
                },
            }}
        >
            {/* Mode Selector */}
            <div className="flex gap-2 flex-wrap">
                {(["text", "url", "wifi", "vcard"] as QrMode[]).map((m) => (
                    <Button
                        key={m}
                        variant={mode === m ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMode(m)}
                        className="capitalize"
                    >
                        {m === "vcard" ? "vCard" : m === "wifi" ? "WiFi" : m === "url" ? "URL" : "Text"}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    {mode === "text" && (
                        <div className="space-y-2">
                            <label htmlFor="qr-text" className="text-sm font-medium">Text</label>
                            <Textarea
                                id="qr-text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Enter text to encode..."
                                className="min-h-[120px]"
                            />
                        </div>
                    )}

                    {mode === "url" && (
                        <div className="space-y-2">
                            <label htmlFor="qr-url" className="text-sm font-medium">URL</label>
                            <Input
                                id="qr-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                    )}

                    {mode === "wifi" && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label htmlFor="wifi-ssid" className="text-sm font-medium">Network Name (SSID)</label>
                                <Input id="wifi-ssid" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="MyNetwork" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="wifi-pass" className="text-sm font-medium">Password</label>
                                <Input id="wifi-pass" type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Password" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Encryption</label>
                                <div className="flex gap-2">
                                    {["WPA", "WEP", "nopass"].map((enc) => (
                                        <Button key={enc} variant={wifiEncryption === enc ? "default" : "outline"} size="sm" onClick={() => setWifiEncryption(enc)}>
                                            {enc === "nopass" ? "None" : enc}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "vcard" && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label htmlFor="vcard-name" className="text-sm font-medium">Full Name</label>
                                <Input id="vcard-name" value={vcardName} onChange={(e) => setVcardName(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="vcard-phone" className="text-sm font-medium">Phone</label>
                                <Input id="vcard-phone" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} placeholder="+1 234 567 8900" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="vcard-email" className="text-sm font-medium">Email</label>
                                <Input id="vcard-email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} placeholder="john@example.com" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="qr-size" className="text-sm font-medium">Size: {size}px</label>
                        <input
                            id="qr-size"
                            type="range"
                            min={128}
                            max={512}
                            step={32}
                            value={size}
                            onChange={(e) => setSize(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Output Section */}
                <div className="space-y-4 flex flex-col items-center">
                    {qrDataUrl ? (
                        <>
                            <div className="rounded-lg border bg-white p-4">
                                <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex gap-2 flex-wrap justify-center">
                                <Button variant="outline" size="sm" onClick={downloadPng}>
                                    <Download className="h-4 w-4 mr-1" />
                                    PNG
                                </Button>
                                <Button variant="outline" size="sm" onClick={downloadSvg}>
                                    <Download className="h-4 w-4 mr-1" />
                                    SVG
                                </Button>
                                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy Content
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-48 rounded-lg border border-dashed text-muted-foreground">
                            <span className="text-sm">QR code will appear here</span>
                        </div>
                    )}
                </div>
            </div>
        </ToolCard>
    )
}
