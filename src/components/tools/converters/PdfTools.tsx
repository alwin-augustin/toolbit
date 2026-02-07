import { useState, useCallback, useRef, useMemo } from "react"
import { PDFDocument, degrees } from "pdf-lib"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToolCard } from "@/components/ToolCard"
import { useToast } from "@/hooks/use-toast"
import { FileText, Merge, Scissors, RotateCw, Trash2, Download, ArrowUp, ArrowDown } from "lucide-react"
import { useUrlState } from "@/hooks/use-url-state"

interface PdfFile {
    name: string
    data: ArrayBuffer
    pageCount: number
    size: number
}

type Mode = "merge" | "split" | "rotate"

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PdfTools() {
    const [mode, setMode] = useState<Mode>("merge")
    const [files, setFiles] = useState<PdfFile[]>([])
    const [splitRange, setSplitRange] = useState("1-3")
    const [rotateAngle, setRotateAngle] = useState(90)
    const [rotatePages, setRotatePages] = useState("all")
    const [processing, setProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const shareState = useMemo(
        () => ({ mode, splitRange, rotateAngle, rotatePages }),
        [mode, splitRange, rotateAngle, rotatePages],
    )
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setMode(state.mode === "split" || state.mode === "rotate" ? state.mode : "merge")
        setSplitRange(typeof state.splitRange === "string" ? state.splitRange : "1-3")
        setRotateAngle(typeof state.rotateAngle === "number" ? state.rotateAngle : 90)
        setRotatePages(typeof state.rotatePages === "string" ? state.rotatePages : "all")
    })

    const addFiles = useCallback(async (fileList: FileList) => {
        const newFiles: PdfFile[] = []
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i]
            if (file.type !== "application/pdf") {
                toast({ title: `${file.name} is not a PDF`, variant: "destructive" })
                continue
            }
            if (file.size > 50 * 1024 * 1024) {
                toast({ title: `${file.name} exceeds 50MB limit`, variant: "destructive" })
                continue
            }
            try {
                const data = await file.arrayBuffer()
                const pdf = await PDFDocument.load(data)
                newFiles.push({ name: file.name, data, pageCount: pdf.getPageCount(), size: file.size })
            } catch {
                toast({ title: `Failed to load ${file.name}`, variant: "destructive" })
            }
        }
        setFiles(prev => [...prev, ...newFiles])
    }, [toast])

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files)
        e.target.value = ""
    }, [addFiles])

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }, [])

    const moveFile = useCallback((index: number, direction: -1 | 1) => {
        setFiles(prev => {
            const next = [...prev]
            const target = index + direction
            if (target < 0 || target >= next.length) return prev
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }, [])

    const downloadPdf = useCallback((data: Uint8Array, filename: string) => {
        const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }, [])

    const mergePdfs = useCallback(async () => {
        if (files.length < 2) {
            toast({ title: "Need at least 2 PDFs to merge", variant: "destructive" })
            return
        }
        setProcessing(true)
        try {
            const merged = await PDFDocument.create()
            for (const file of files) {
                const source = await PDFDocument.load(file.data)
                const pages = await merged.copyPages(source, source.getPageIndices())
                for (const page of pages) merged.addPage(page)
            }
            const data = await merged.save()
            downloadPdf(data, "merged.pdf")
            toast({ title: `Merged ${files.length} PDFs (${formatSize(data.byteLength)})` })
        } catch (err) {
            toast({ title: `Merge failed: ${err instanceof Error ? err.message : "Unknown error"}`, variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }, [files, downloadPdf, toast])

    const splitPdf = useCallback(async () => {
        if (files.length < 1) {
            toast({ title: "Upload a PDF to split", variant: "destructive" })
            return
        }
        setProcessing(true)
        try {
            const source = await PDFDocument.load(files[0].data)
            const totalPages = source.getPageCount()

            // Parse page range (e.g., "1-3", "1,3,5", "1-3,5-7")
            const pageIndices: number[] = []
            for (const part of splitRange.split(",")) {
                const trimmed = part.trim()
                if (trimmed.includes("-")) {
                    const [start, end] = trimmed.split("-").map(Number)
                    for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
                        pageIndices.push(i - 1)
                    }
                } else {
                    const n = Number(trimmed)
                    if (n >= 1 && n <= totalPages) pageIndices.push(n - 1)
                }
            }

            if (pageIndices.length === 0) {
                toast({ title: "No valid pages in range", variant: "destructive" })
                return
            }

            const newPdf = await PDFDocument.create()
            const pages = await newPdf.copyPages(source, pageIndices)
            for (const page of pages) newPdf.addPage(page)

            const data = await newPdf.save()
            downloadPdf(data, `split_p${splitRange.replace(/[^0-9,-]/g, "")}.pdf`)
            toast({ title: `Extracted ${pageIndices.length} pages` })
        } catch (err) {
            toast({ title: `Split failed: ${err instanceof Error ? err.message : "Unknown error"}`, variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }, [files, splitRange, downloadPdf, toast])

    const rotatePdf = useCallback(async () => {
        if (files.length < 1) {
            toast({ title: "Upload a PDF to rotate", variant: "destructive" })
            return
        }
        setProcessing(true)
        try {
            const source = await PDFDocument.load(files[0].data)
            const totalPages = source.getPageCount()

            let pageIndices: number[]
            if (rotatePages === "all") {
                pageIndices = Array.from({ length: totalPages }, (_, i) => i)
            } else {
                pageIndices = []
                for (const part of rotatePages.split(",")) {
                    const trimmed = part.trim()
                    if (trimmed.includes("-")) {
                        const [s, e] = trimmed.split("-").map(Number)
                        for (let i = Math.max(1, s); i <= Math.min(totalPages, e); i++) pageIndices.push(i - 1)
                    } else {
                        const n = Number(trimmed)
                        if (n >= 1 && n <= totalPages) pageIndices.push(n - 1)
                    }
                }
            }

            for (const idx of pageIndices) {
                const page = source.getPage(idx)
                page.setRotation(degrees((page.getRotation().angle + rotateAngle) % 360))
            }

            const data = await source.save()
            downloadPdf(data, `rotated_${rotateAngle}deg.pdf`)
            toast({ title: `Rotated ${pageIndices.length} pages by ${rotateAngle}°` })
        } catch (err) {
            toast({ title: `Rotate failed: ${err instanceof Error ? err.message : "Unknown error"}`, variant: "destructive" })
        } finally {
            setProcessing(false)
        }
    }, [files, rotateAngle, rotatePages, downloadPdf, toast])

    const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0)
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return (
        <ToolCard
            title="PDF Tools"
            description="Merge, split, and rotate PDFs — all processing happens in your browser"
            icon={<FileText className="h-5 w-5" />}
            shareUrl={getShareUrl()}
        >
            <div className="space-y-4">
                {/* Mode Selector */}
                <div className="flex gap-1">
                    <Button variant={mode === "merge" ? "default" : "outline"} size="sm" onClick={() => setMode("merge")}>
                        <Merge className="h-4 w-4 mr-1" /> Merge
                    </Button>
                    <Button variant={mode === "split" ? "default" : "outline"} size="sm" onClick={() => setMode("split")}>
                        <Scissors className="h-4 w-4 mr-1" /> Split / Extract
                    </Button>
                    <Button variant={mode === "rotate" ? "default" : "outline"} size="sm" onClick={() => setMode("rotate")}>
                        <RotateCw className="h-4 w-4 mr-1" /> Rotate
                    </Button>
                </div>

                {/* File Upload */}
                <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files) addFiles(e.dataTransfer.files) }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        multiple={mode === "merge"}
                        onChange={handleFileInput}
                        className="hidden"
                    />
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Click or drag PDF files here {mode === "merge" ? "(multiple)" : "(single)"}
                    </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{files.length} file{files.length !== 1 ? "s" : ""} — {totalPages} pages — {formatSize(totalSize)}</span>
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setFiles([])}>
                                Clear all
                            </Button>
                        </div>
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded border bg-muted/20 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="flex-1 truncate font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{file.pageCount} pg</span>
                                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                                {mode === "merge" && (
                                    <>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveFile(i, -1)} disabled={i === 0}>
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveFile(i, 1)} disabled={i === files.length - 1}>
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(i)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mode-specific options */}
                {mode === "split" && files.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Page Range (e.g., 1-3 or 1,3,5-7)</label>
                        <div className="flex gap-2">
                            <Input
                                value={splitRange}
                                onChange={(e) => setSplitRange(e.target.value)}
                                placeholder="1-3"
                                className="font-mono"
                            />
                            <Button onClick={splitPdf} disabled={processing}>
                                <Download className="h-4 w-4 mr-1" /> {processing ? "Processing..." : "Extract Pages"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total pages: {files[0]?.pageCount || 0}
                        </p>
                    </div>
                )}

                {mode === "rotate" && files.length > 0 && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Rotation Angle</label>
                                <select
                                    value={rotateAngle}
                                    onChange={(e) => setRotateAngle(Number(e.target.value))}
                                    className="w-full rounded border bg-background px-2 py-1.5 text-sm"
                                >
                                    <option value={90}>90° clockwise</option>
                                    <option value={180}>180°</option>
                                    <option value={270}>270° clockwise</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Pages</label>
                                <Input
                                    value={rotatePages}
                                    onChange={(e) => setRotatePages(e.target.value)}
                                    placeholder="all or 1-3,5"
                                    className="text-sm"
                                />
                            </div>
                        </div>
                        <Button onClick={rotatePdf} disabled={processing} className="w-full">
                            <RotateCw className="h-4 w-4 mr-1" /> {processing ? "Processing..." : "Rotate & Download"}
                        </Button>
                    </div>
                )}

                {mode === "merge" && files.length >= 2 && (
                    <Button onClick={mergePdfs} disabled={processing} className="w-full">
                        <Merge className="h-4 w-4 mr-1" /> {processing ? "Merging..." : `Merge ${files.length} PDFs`}
                    </Button>
                )}

                <p className="text-xs text-muted-foreground">
                    All processing happens locally in your browser. No files are uploaded to any server.
                </p>
            </div>
        </ToolCard>
    )
}
