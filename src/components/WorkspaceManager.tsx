import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { FolderOpen, Plus, Download, Upload, Trash2, Play } from "lucide-react"
import { listWorkspaces, saveWorkspace, deleteWorkspace, type Workspace, type WorkspaceToolState } from "@/lib/workspace-db"
import { getRecentHistory, type ToolHistoryEntry } from "@/lib/history-db"
import { useWorkspace } from "@/hooks/use-workspace"
import { TOOLS } from "@/config/tools.config"
import { PRESET_WORKFLOWS } from "@/config/workflows.config"
import { useLocation } from "wouter"

function buildWorkspaceFromHistory(name: string, entries: ToolHistoryEntry[]): Workspace {
    const latestByTool = new Map<string, ToolHistoryEntry>()
    entries.forEach((entry) => {
        if (!latestByTool.has(entry.toolId)) {
            latestByTool.set(entry.toolId, entry)
        }
    })
    const tools: WorkspaceToolState[] = Array.from(latestByTool.values()).map((entry) => ({
        toolId: entry.toolId,
        state: JSON.stringify({ input: entry.input, output: entry.output, metadata: entry.metadata }),
    }))
    return {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
        tools,
    }
}

function buildWorkspaceFromTools(name: string, toolIds: string[]): Workspace {
    return {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
        tools: toolIds.map((toolId) => ({ toolId, state: JSON.stringify({ input: "", output: "" }) })),
    }
}

interface WorkspaceManagerProps {
    showTrigger?: boolean
}

export function WorkspaceManager({ showTrigger = true }: WorkspaceManagerProps) {
    const [open, setOpen] = useState(false)
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [, setLocation] = useLocation()
    const { setWorkspace } = useWorkspace()

    const refresh = async () => {
        setLoading(true)
        const list = await listWorkspaces()
        setWorkspaces(list)
        setLoading(false)
    }

    useEffect(() => {
        if (open) refresh()
    }, [open])

    useEffect(() => {
        const handleOpen = () => setOpen(true)
        window.addEventListener("open-workspaces", handleOpen)
        return () => window.removeEventListener("open-workspaces", handleOpen)
    }, [])

    const existingNames = useMemo(() => new Set(workspaces.map((w) => w.name)), [workspaces])

    const uniqueName = (base: string) => {
        if (!existingNames.has(base)) return base
        let i = 2
        while (existingNames.has(`${base} ${i}`)) i++
        return `${base} ${i}`
    }

    const handleCreateFromHistory = async () => {
        const workspaceName = uniqueName(name.trim() || "Workspace")
        const entries = await getRecentHistory(200)
        if (entries.length === 0) return
        const workspace = buildWorkspaceFromHistory(workspaceName, entries)
        await saveWorkspace(workspace)
        setName("")
        await refresh()
    }

    const handleCreatePreset = async (preset: { name: string; tools: string[] }) => {
        const workspaceName = uniqueName(preset.name)
        const workspace = buildWorkspaceFromTools(workspaceName, preset.tools)
        await saveWorkspace(workspace)
        await refresh()
    }

    const handleLoad = (workspace: Workspace) => {
        setWorkspace(workspace)
        const firstToolId = workspace.tools[0]?.toolId
        const firstTool = TOOLS.find((t) => t.id === firstToolId)
        if (firstTool) {
            setLocation(firstTool.path)
        }
        setOpen(false)
    }

    const handleExport = (workspace: Workspace) => {
        const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${workspace.name.replace(/\s+/g, "_").toLowerCase()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImport = async (file: File) => {
        const text = await file.text()
        const parsed = JSON.parse(text) as Workspace
        const workspace: Workspace = {
            ...parsed,
            id: crypto.randomUUID(),
            name: uniqueName(parsed.name || "Imported Workspace"),
            createdAt: Date.now(),
        }
        await saveWorkspace(workspace)
        await refresh()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Workspaces">
                    <FolderOpen className="h-4 w-4" />
                </Button>
            )}
            <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Workspaces</SheetTitle>
                    <SheetDescription>
                        Save and load sets of tool configurations. All data stays local.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-4 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Create Workspace</label>
                        <div className="flex gap-2">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Workspace name"
                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                            />
                            <Button onClick={handleCreateFromHistory}>
                                <Plus className="h-4 w-4 mr-1" />
                                From History
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Creates a workspace using the latest saved history entry per tool.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Presets</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_WORKFLOWS.map((preset) => (
                                <Button key={preset.id} variant="outline" size="sm" onClick={() => handleCreatePreset(preset)}>
                                    {preset.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Saved Workspaces</label>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="h-3.5 w-3.5 mr-1" />
                                    Import
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/json"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleImport(file)
                                        e.target.value = ""
                                    }}
                                />
                            </div>
                        </div>
                        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                        {!loading && workspaces.length === 0 && (
                            <div className="text-sm text-muted-foreground">No workspaces yet.</div>
                        )}
                        <div className="space-y-2">
                            {workspaces.map((workspace) => (
                                <div key={workspace.id} className="flex items-center gap-2 border rounded-md p-2">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{workspace.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {workspace.tools.length} tools · {new Date(workspace.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleLoad(workspace)}>
                                        <Play className="h-3.5 w-3.5 mr-1" />
                                        Load
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleExport(workspace)}>
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={async () => {
                                        await deleteWorkspace(workspace.id)
                                        await refresh()
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
