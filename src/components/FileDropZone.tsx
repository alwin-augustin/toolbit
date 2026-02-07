import { useState, useCallback, useRef } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface FileDropZoneProps {
    onFileContent: (content: string) => void
    accept?: string[]
    maxSizeKB?: number
    children: React.ReactNode
    className?: string
}

const DEFAULT_MAX_SIZE_KB = 5120 // 5MB

export function FileDropZone({
    onFileContent,
    accept,
    maxSizeKB = DEFAULT_MAX_SIZE_KB,
    children,
    className,
}: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const dragCounter = useRef(0)
    const { toast } = useToast()

    const validateFile = useCallback(
        (file: File): string | null => {
            if (file.size > maxSizeKB * 1024) {
                return `File too large (max ${maxSizeKB}KB)`
            }
            if (accept && accept.length > 0) {
                const ext = "." + file.name.split(".").pop()?.toLowerCase()
                const matchesExtension = accept.some((a) => a.startsWith(".") && a.toLowerCase() === ext)
                const matchesMime = accept.some((a) => !a.startsWith(".") && file.type.startsWith(a))
                if (!matchesExtension && !matchesMime) {
                    return `Unsupported file type. Accepted: ${accept.join(", ")}`
                }
            }
            return null
        },
        [accept, maxSizeKB],
    )

    const readFile = useCallback(
        (file: File) => {
            const error = validateFile(file)
            if (error) {
                toast({ description: error, variant: "destructive" })
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const text = e.target?.result
                if (typeof text === "string") {
                    onFileContent(text)
                    toast({ description: `Loaded ${file.name}` })
                }
            }
            reader.onerror = () => {
                toast({ description: "Failed to read file", variant: "destructive" })
            }
            reader.readAsText(file)
        },
        [onFileContent, validateFile, toast],
    )

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current++
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current--
        if (dragCounter.current === 0) {
            setIsDragging(false)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            dragCounter.current = 0
            setIsDragging(false)

            const files = e.dataTransfer.files
            if (files.length > 0) {
                readFile(files[0])
            }
        },
        [readFile],
    )

    return (
        <div
            className={cn("relative", className)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <Upload className="h-8 w-8" />
                        <span className="text-sm font-medium">Drop file here</span>
                    </div>
                </div>
            )}
        </div>
    )
}
