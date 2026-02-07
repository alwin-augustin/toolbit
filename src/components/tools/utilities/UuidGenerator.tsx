import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Key, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToolCard } from "@/components/ToolCard"
import { useUrlState } from "@/hooks/use-url-state"
import { useToolHistory } from "@/hooks/use-tool-history"

export default function UuidGenerator() {
    const [uuids, setUuids] = useState<string[]>([])
    const [count, setCount] = useState(1)
    const { toast } = useToast()
    const shareState = useMemo(() => ({ count }), [count])
    const { getShareUrl } = useUrlState(shareState, (state) => {
        setCount(typeof state.count === "number" ? state.count : 1)
    })
    const { addEntry } = useToolHistory("uuid-generator", "UUID Generator")

    const generateUuid = () => {
        return crypto.randomUUID()
    }

    const generateUuids = () => {
        const newUuids = Array.from({ length: count }, generateUuid)
        setUuids(newUuids)
        addEntry({ input: String(count), output: newUuids.join("\n"), metadata: { action: "generate" } })
    }

    const generateSingle = () => {
        const newUuid = generateUuid()
        setUuids([newUuid])
        addEntry({ input: "1", output: newUuid, metadata: { action: "generate-single" } })
    }

    const copyToClipboard = (uuid: string) => {
        navigator.clipboard.writeText(uuid)
        toast({ description: "UUID copied to clipboard!" })
    }

    const copyAllToClipboard = () => {
        navigator.clipboard.writeText(uuids.join('\n'))
        toast({ description: `${uuids.length} UUIDs copied to clipboard!` })
    }

    return (
        <ToolCard
            title="UUID / GUID Generator"
            description="Generate unique identifiers (UUIDs/GUIDs)"
            icon={<Key className="h-5 w-5" />}
            shareUrl={getShareUrl()}
            history={{
                toolId: "uuid-generator",
                toolName: "UUID Generator",
                onRestore: (entry) => {
                    setUuids(entry.output ? entry.output.split("\n") : [])
                },
            }}
        >
            <div className="flex gap-2 items-end">
                <div className="space-y-2 flex-1">
                    <label htmlFor="uuid-count" className="text-sm font-medium">
                        Number of UUIDs
                    </label>
                    <Input
                        id="uuid-count"
                        type="number"
                        min={1}
                        max={100}
                        value={count}
                        onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        data-testid="input-count"
                    />
                </div>
                <Button onClick={generateUuids} data-testid="button-generate">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate
                </Button>
            </div>

            <div className="flex gap-2">
                <Button onClick={generateSingle} variant="outline" data-testid="button-generate-single">
                    Generate Single UUID
                </Button>
                {uuids.length > 1 && (
                    <Button onClick={copyAllToClipboard} variant="outline" data-testid="button-copy-all">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                    </Button>
                )}
            </div>

            {uuids.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    <label className="text-sm font-medium">
                        Generated UUIDs ({uuids.length})
                    </label>
                    {uuids.map((uuid, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input
                                value={uuid}
                                readOnly
                                className="font-mono text-sm"
                                data-testid={`uuid-${index}`}
                            />
                            <Button
                                onClick={() => copyToClipboard(uuid)}
                                variant="outline"
                                size="icon"
                                data-testid={`button-copy-${index}`}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </ToolCard>
    )
}
