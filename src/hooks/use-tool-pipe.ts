import { create } from "zustand"

interface PipelineStep {
    toolId: string
    toolName: string
    path: string
}

interface ToolPipeState {
    data: string | null
    sourceToolId: string | null
    updatedAt: number | null
    pipeline: PipelineStep[]
    setPipeData: (data: string, sourceToolId: string) => void
    consumePipeData: () => { data: string; sourceToolId: string | null } | null
    clearPipe: () => void
    addPipelineStep: (step: PipelineStep) => void
    clearPipeline: () => void
}

export const useToolPipe = create<ToolPipeState>((set, get) => ({
    data: null,
    sourceToolId: null,
    updatedAt: null,
    pipeline: [],
    setPipeData: (data, sourceToolId) =>
        set({ data, sourceToolId, updatedAt: Date.now() }),
    consumePipeData: () => {
        const { data, sourceToolId } = get()
        if (!data) return null
        set({ data: null })
        return { data, sourceToolId }
    },
    clearPipe: () => set({ data: null, sourceToolId: null, updatedAt: null, pipeline: [] }),
    addPipelineStep: (step) =>
        set((state) => {
            // Avoid duplicate consecutive entries
            const last = state.pipeline[state.pipeline.length - 1]
            if (last?.toolId === step.toolId) return state
            return { pipeline: [...state.pipeline, step] }
        }),
    clearPipeline: () => set({ pipeline: [] }),
}))
