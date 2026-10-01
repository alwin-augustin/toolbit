import { safeStorage } from "@/lib/preferences";
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { TOOLS } from "@/config/tools.config"

export interface PipelineStep {
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

function normalizePipeline(pipeline: PipelineStep[]): PipelineStep[] {
    const validTools = new Map(TOOLS.map((tool) => [tool.id, tool]))
    return pipeline.reduce<PipelineStep[]>((steps, step) => {
        const tool = validTools.get(step.toolId)
        if (!tool || steps.at(-1)?.toolId === tool.id) return steps
        steps.push({ toolId: tool.id, toolName: tool.name, path: tool.path })
        return steps
    }, [])
}

export const useToolPipe = create<ToolPipeState>()(persist((set, get) => ({
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
            const pipeline = normalizePipeline([...state.pipeline, step])
            if (pipeline.length === state.pipeline.length) return state
            return { pipeline }
        }),
    clearPipeline: () => set({ pipeline: [], data: null, sourceToolId: null, updatedAt: null }),
}), {
    name: "toolbit-pipeline",
    storage: createJSONStorage(() => safeStorage),
    version: 2,
    migrate: () => ({ pipeline: [] }),
    partialize: (state) => ({ pipeline: state.pipeline }),
}))
