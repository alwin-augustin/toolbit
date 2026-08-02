import { describe, expect, it } from "vitest"
import { getChainTargets } from "@/config/tool-chains.config"
import { useToolPipe } from "@/hooks/use-tool-pipe"

describe("pipeline behavior", () => {
    it("only offers compatible destinations", () => {
        expect(getChainTargets("base64-encoder")).toEqual(["json-formatter", "url-encoder", "hash-generator"])
        expect(getChainTargets("uuid-generator")).toEqual([])
    })

    it("does not append the same tool repeatedly", () => {
        useToolPipe.getState().clearPipeline()
        const step = { toolId: "base64-encoder", toolName: "stale", path: "/wrong" }
        useToolPipe.getState().addPipelineStep(step)
        useToolPipe.getState().addPipelineStep(step)

        expect(useToolPipe.getState().pipeline).toEqual([
            { toolId: "base64-encoder", toolName: "Base64 Encoder", path: "/app/base64-encoder" },
        ])
        useToolPipe.getState().clearPipeline()
    })
})
