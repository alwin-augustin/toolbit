import { create } from "zustand"
import { type Workspace } from "@/lib/workspace-db"

type RestoreMap = Record<string, string>

interface WorkspaceState {
    active: Workspace | null
    restoreByTool: RestoreMap
    pendingTools: string[]
    setWorkspace: (workspace: Workspace) => void
    clearWorkspace: () => void
    consumeState: (toolId: string) => string | null
    popNextTool: () => string | null
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
    active: null,
    restoreByTool: {},
    pendingTools: [],
    setWorkspace: (workspace) => {
        const restoreByTool: RestoreMap = {}
        workspace.tools.forEach((tool) => {
            restoreByTool[tool.toolId] = tool.state
        })
        set({
            active: workspace,
            restoreByTool,
            pendingTools: workspace.tools.map((tool) => tool.toolId),
        })
    },
    clearWorkspace: () => set({ active: null, restoreByTool: {}, pendingTools: [] }),
    consumeState: (toolId) => {
        const current = get().restoreByTool
        const state = current[toolId]
        if (!state) return null
        const next = { ...current }
        delete next[toolId]
        set({ restoreByTool: next })
        return state
    },
    popNextTool: () => {
        const [next, ...rest] = get().pendingTools
        if (!next) return null
        set({ pendingTools: rest })
        return next
    },
}))
