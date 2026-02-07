import { useState, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { Download, Image, Trash2, Upload } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"

type OutputFormat = "image/png" | "image/jpeg" | "image/webp"

interface ImageInfo {
    name: string
    width: number
    height: number
    size: number
    type: string
    dataUrl: string
    file: File
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
    { value: "image/png", label: "PNG", ext: "png" },
    { value: "image/jpeg", label: "JPEG", ext: "jpg" },
    { value: "image/webp", label: "WebP", ext: "webp" },
]

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageConverter() {
    const [images, setImages] = useState<ImageInfo[]>([])
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png")
    const [quality, setQuality] = useState(85)
    const [resizeWidth, setResizeWidth] = useState<number | "">("")
    const [resizeHeight, setResizeHeight] = useState<number | "">("")
    const [maintainAspect, setMaintainAspect] = useState(true)
    const [convertedUrl, setConvertedUrl] = useState("")
    const [convertedSize, setConvertedSize] = useState(0)
    const [processing, setProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({
            outputFormat,
            quality,
            resizeWidth,
            resizeHeight,
            maintainAspect,
        }),
        [outputFormat, quality, resizeWidth, resizeHeight, maintainAspect],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setOutputFormat(state.outputFormat === "image/jpeg" || state.outputFormat === "image/webp" ? state.outputFormat : "image/png")
        setQuality(typeof state.quality === "number" ? state.quality : 85)
        setResizeWidth(typeof state.resizeWidth === "number" ? state.resizeWidth : "")
        setResizeHeight(typeof state.resizeHeight === "number" ? state.resizeHeight : "")
        setMaintainAspect(state.maintainAspect !== false)
    })

    const loadImage = useCallback((file: File): Promise<ImageInfo> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const img = new window.Image()
                img.onload = () => {
                    resolve({
                        name: file.name,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        size: file.size,
                        type: file.type,
                        dataUrl: reader.result as string,
                        file,
                    })
                }
                img.onerror = () => reject(new Error("Failed to load image"))
                img.src = reader.result as string
            }
            reader.onerror = () => reject(new Error("Failed to read file"))
            reader.readAsDataURL(file)
        })
    }, [])

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const loaded: ImageInfo[] = []
        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) {
                toast({ description: `${file.name} is not an image`, variant: "destructive" })
                continue
            }
            try {
                const info = await loadImage(file)
                loaded.push(info)
            } catch {
                toast({ description: `Failed to load ${file.name}`, variant: "destructive" })
            }
        }

        if (loaded.length > 0) {
            setImages(loaded)
            setConvertedUrl("")
            // Set default resize dimensions from first image
            setResizeWidth(loaded[0].width)
            setResizeHeight(loaded[0].height)
        }
        e.target.value = ""
    }, [loadImage, toast])

    const handleWidthChange = useCallback((w: number) => {
        setResizeWidth(w)
        if (maintainAspect && images.length > 0) {
            const ratio = images[0].height / images[0].width
            setResizeHeight(Math.round(w * ratio))
        }
    }, [maintainAspect, images])

    const handleHeightChange = useCallback((h: number) => {
        setResizeHeight(h)
        if (maintainAspect && images.length > 0) {
            const ratio = images[0].width / images[0].height
            setResizeWidth(Math.round(h * ratio))
        }
    }, [maintainAspect, images])

    const convert = useCallback(async () => {
        if (images.length === 0) return

        setProcessing(true)
        try {
            const img = new window.Image()
            img.src = images[0].dataUrl

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = () => reject()
            })

            const canvas = document.createElement("canvas")
            const targetW = typeof resizeWidth === "number" && resizeWidth > 0 ? resizeWidth : img.naturalWidth
            const targetH = typeof resizeHeight === "number" && resizeHeight > 0 ? resizeHeight : img.naturalHeight
            canvas.width = targetW
            canvas.height = targetH

            const ctx = canvas.getContext("2d")!
            // White background for JPEG (which doesn't support transparency)
            if (outputFormat === "image/jpeg") {
                ctx.fillStyle = "#ffffff"
                ctx.fillRect(0, 0, targetW, targetH)
            }
            ctx.drawImage(img, 0, 0, targetW, targetH)

            const qualityValue = outputFormat === "image/png" ? undefined : quality / 100
            const dataUrl = canvas.toDataURL(outputFormat, qualityValue)

            // Calculate output size
            const base64Length = dataUrl.split(",")[1].length
            const outputSize = Math.ceil(base64Length * 0.75)

            setConvertedUrl(dataUrl)
            setConvertedSize(outputSize)

            const savings = ((1 - outputSize / images[0].size) * 100).toFixed(1)
            toast({
                description: `Converted! ${formatSize(images[0].size)} → ${formatSize(outputSize)} (${Number(savings) > 0 ? savings + "% smaller" : "larger"})`,
            })
        } catch {
            toast({ description: "Conversion failed", variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }, [images, outputFormat, quality, resizeWidth, resizeHeight, toast])

    const download = useCallback(() => {
        if (!convertedUrl) return
        const ext = FORMAT_OPTIONS.find(f => f.value === outputFormat)?.ext || "png"
        const baseName = images[0]?.name.replace(/\.[^.]+$/, "") || "converted"
        const a = document.createElement("a")
        a.href = convertedUrl
        a.download = `${baseName}.${ext}`
        a.click()
    }, [convertedUrl, outputFormat, images])

    const clear = () => {
        setImages([])
        setConvertedUrl("")
        setConvertedSize(0)
        setResizeWidth("")
        setResizeHeight("")
    }

    return (
        <ToolCard
            title="Image Converter & Optimizer"
            description="Convert between PNG, JPEG, and WebP with resize and quality control"
            icon={<Image className="h-5 w-5" />}
            shareUrl={getShareUrl()}
        >
            {/* Upload */}
            <div className="space-y-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Image
                </Button>
            </div>

            {images.length > 0 && (
                <>
                    {/* Source Info */}
                    <div className="rounded-md border p-3 space-y-2">
                        <div className="text-sm font-medium">Source</div>
                        <div className="flex gap-4 items-center">
                            <img
                                src={images[0].dataUrl}
                                alt="Source"
                                className="w-24 h-24 object-contain rounded border bg-muted/30"
                            />
                            <div className="text-sm space-y-1">
                                <div><span className="text-muted-foreground">File:</span> {images[0].name}</div>
                                <div><span className="text-muted-foreground">Size:</span> {formatSize(images[0].size)}</div>
                                <div><span className="text-muted-foreground">Dimensions:</span> {images[0].width} x {images[0].height}px</div>
                                <div><span className="text-muted-foreground">Type:</span> {images[0].type}</div>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Output Format</label>
                            <div className="flex gap-1">
                                {FORMAT_OPTIONS.map(f => (
                                    <Button
                                        key={f.value}
                                        variant={outputFormat === f.value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setOutputFormat(f.value)}
                                    >
                                        {f.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {outputFormat !== "image/png" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quality: {quality}%</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={100}
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Smaller file</span>
                                    <span>Better quality</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resize</label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    min={1}
                                    max={10000}
                                    value={resizeWidth}
                                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                                    placeholder="Width"
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">x</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10000}
                                    value={resizeHeight}
                                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                                    placeholder="Height"
                                    className="w-24"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={maintainAspect}
                                    onChange={(e) => setMaintainAspect(e.target.checked)}
                                    className="rounded"
                                />
                                Maintain aspect ratio
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button onClick={convert} disabled={processing}>
                            {processing ? "Converting..." : "Convert"}
                        </Button>
                        <Button variant="outline" onClick={clear}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </div>

                    {/* Output */}
                    {convertedUrl && (
                        <div className="rounded-md border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Result</div>
                                <div className="text-sm text-muted-foreground">
                                    {formatSize(convertedSize)}
                                </div>
                            </div>
                            <div className="flex justify-center bg-muted/30 rounded p-4">
                                <img
                                    src={convertedUrl}
                                    alt="Converted"
                                    className="max-w-full max-h-64 object-contain rounded"
                                />
                            </div>
                            <Button onClick={download}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    )}
                </>
            )}
        </ToolCard>
    )
}
