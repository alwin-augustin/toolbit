import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

export default function ColorConverter() {
    const [hex, setHex] = useState("#3b82f6")
    const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 })
    const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 })
    const { toast } = useToast()
    const shareState = useMemo(() => ({ hex }), [hex])
    const { getShareUrl } = useUrlState(shareState, (state) => {
        const nextHex = typeof state.hex === "string" ? state.hex : "#3b82f6"
        setHex(nextHex)
        updateFromHex(nextHex)
    })
    const { addEntry } = useToolHistory("color-converter", "Color Converter")

    useEffect(() => {
        updateFromHex(hex)
    }, [])

    const updateFromHex = (hexValue: string) => {
        const cleanHex = hexValue.replace('#', '')
        if (cleanHex.length === 6) {
            const r = parseInt(cleanHex.substr(0, 2), 16)
            const g = parseInt(cleanHex.substr(2, 2), 16)
            const b = parseInt(cleanHex.substr(4, 2), 16)

            setRgb({ r, g, b })
            setHsl(rgbToHsl(r, g, b))
        }
    }

    const updateFromRgb = (r: number, g: number, b: number) => {
        const hexValue = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
        setHex(hexValue)
        setHsl(rgbToHsl(r, g, b))
    }

    const updateFromHsl = (h: number, s: number, l: number) => {
        const rgbValue = hslToRgb(h, s, l)
        setRgb(rgbValue)
        const hexValue = `#${((1 << 24) + (rgbValue.r << 16) + (rgbValue.g << 8) + rgbValue.b).toString(16).slice(1)}`
        setHex(hexValue)
    }

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255
        g /= 255
        b /= 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0
        let s = 0
        const l = (max + min) / 2

        if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break
                case g: h = (b - r) / d + 2; break
                case b: h = (r - g) / d + 4; break
            }
            h /= 6
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        }
    }

    const hslToRgb = (h: number, s: number, l: number) => {
        h /= 360
        s /= 100
        l /= 100

        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
        }

        let r, g, b

        if (s === 0) {
            r = g = b = l
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            r = hue2rgb(p, q, h + 1/3)
            g = hue2rgb(p, q, h)
            b = hue2rgb(p, q, h - 1/3)
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        }
    }

    const copyToClipboard = (value: string, format: string) => {
        navigator.clipboard.writeText(value)
        toast({ description: `${format} value copied to clipboard!` })
        addEntry({ input: hex, output: value, metadata: { action: "copy", format } })
    }

    return (
        <ToolCard
            title="Color Converter & Picker"
            description="Convert between HEX, RGB, and HSL color formats"
            icon={<Palette className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "color-converter",
                toolName: "Color Converter",
                onRestore: (entry) => {
                    const nextHex = entry.input || "#3b82f6"
                    setHex(nextHex)
                    updateFromHex(nextHex)
                },
            }}
        >
            <div className="flex items-center gap-4">
                <div
                    className="w-24 h-24 rounded-md border border"
                    style={{ backgroundColor: hex }}
                    data-testid="color-preview"
                />
                <Input
                    type="color"
                    value={hex}
                    onChange={(e) => {
                        setHex(e.target.value)
                        updateFromHex(e.target.value)
                    }}
                    className="w-24 h-24 p-1 border-0"
                    data-testid="color-picker"
                />
            </div>

            <div className="space-y-3">
                <div className="space-y-2">
                    <label className="text-sm font-medium">HEX</label>
                    <div className="flex gap-2">
                        <Input
                            value={hex}
                            onChange={(e) => {
                                setHex(e.target.value)
                                updateFromHex(e.target.value)
                            }}
                            className="font-mono"
                            data-testid="input-hex"
                        />
                        <Button
                            onClick={() => copyToClipboard(hex, "HEX")}
                            variant="outline"
                            size="icon"
                            data-testid="button-copy-hex"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">RGB</label>
                    <div className="grid grid-cols-3 gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb.r}
                            onChange={(e) => {
                                const newRgb = { ...rgb, r: parseInt(e.target.value) || 0 }
                                setRgb(newRgb)
                                updateFromRgb(newRgb.r, newRgb.g, newRgb.b)
                            }}
                            placeholder="R"
                            data-testid="input-r"
                        />
                        <Input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb.g}
                            onChange={(e) => {
                                const newRgb = { ...rgb, g: parseInt(e.target.value) || 0 }
                                setRgb(newRgb)
                                updateFromRgb(newRgb.r, newRgb.g, newRgb.b)
                            }}
                            placeholder="G"
                            data-testid="input-g"
                        />
                        <Input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb.b}
                            onChange={(e) => {
                                const newRgb = { ...rgb, b: parseInt(e.target.value) || 0 }
                                setRgb(newRgb)
                                updateFromRgb(newRgb.r, newRgb.g, newRgb.b)
                            }}
                            placeholder="B"
                            data-testid="input-b"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                            readOnly
                            className="font-mono"
                            data-testid="output-rgb"
                        />
                        <Button
                            onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "RGB")}
                            variant="outline"
                            size="icon"
                            data-testid="button-copy-rgb"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">HSL</label>
                    <div className="grid grid-cols-3 gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={360}
                            value={hsl.h}
                            onChange={(e) => {
                                const newHsl = { ...hsl, h: parseInt(e.target.value) || 0 }
                                setHsl(newHsl)
                                updateFromHsl(newHsl.h, newHsl.s, newHsl.l)
                            }}
                            placeholder="H"
                            data-testid="input-h"
                        />
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={hsl.s}
                            onChange={(e) => {
                                const newHsl = { ...hsl, s: parseInt(e.target.value) || 0 }
                                setHsl(newHsl)
                                updateFromHsl(newHsl.h, newHsl.s, newHsl.l)
                            }}
                            placeholder="S"
                            data-testid="input-s"
                        />
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={hsl.l}
                            onChange={(e) => {
                                const newHsl = { ...hsl, l: parseInt(e.target.value) || 0 }
                                setHsl(newHsl)
                                updateFromHsl(newHsl.h, newHsl.s, newHsl.l)
                            }}
                            placeholder="L"
                            data-testid="input-l"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                            readOnly
                            className="font-mono"
                            data-testid="output-hsl"
                        />
                        <Button
                            onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "HSL")}
                            variant="outline"
                            size="icon"
                            data-testid="button-copy-hsl"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </ToolCard>
    )
}
