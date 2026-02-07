import { create } from "zustand"

interface ToolPipeState {
    data: string | null
    sourceToolId: string | null
    updatedAt: number | null
    setPipeData: (data: string, sourceToolId: string) => void
    consumePipeData: () => { data: string; sourceToolId: string | null } | null
    clearPipe: () => void
}

export const useToolPipe = create<ToolPipeState>((set, get) => ({
    data: null,
    sourceToolId: null,
    updatedAt: null,
    setPipeData: (data, sourceToolId) =>
        set({ data, sourceToolId, updatedAt: Date.now() }),
    consumePipeData: () => {
        const { data, sourceToolId } = get()
        if (!data) return null
        set({ data: null })
        return { data, sourceToolId }
    },
    clearPipe: () => set({ data: null, sourceToolId: null, updatedAt: null }),
}))
