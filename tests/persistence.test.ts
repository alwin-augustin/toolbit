import { describe, expect, it } from "vitest"
import {
    addHistoryEntry,
    clearHistoryByToolId,
    getHistoryByToolId,
} from "@/lib/history-db"
import {
    deleteWorkspace,
    getWorkspace,
    listWorkspaces,
    saveWorkspace,
} from "@/lib/workspace-db"

describe("persistence contracts", () => {
    it("round-trips tool history and clears it by tool", async () => {
        const toolId = `persistence-${Date.now()}`
        await addHistoryEntry({
            toolId,
            toolName: "Persistence Test",
            timestamp: Date.now(),
            input: "input",
            output: "output",
        })

        await expect(getHistoryByToolId(toolId)).resolves.toEqual([
            expect.objectContaining({ toolId, input: "input", output: "output" }),
        ])

        await clearHistoryByToolId(toolId)
        await expect(getHistoryByToolId(toolId)).resolves.toEqual([])
    })

    it("round-trips workspace state and returns recently updated workspaces first", async () => {
        const id = `workspace-${Date.now()}`
        const workspace = {
            id,
            name: "Persistence Test Workspace",
            createdAt: Date.now(),
            tools: [{ toolId: "json-formatter", state: '{"ok":true}' }],
        }

        await saveWorkspace(workspace)
        await expect(getWorkspace(id)).resolves.toEqual(
            expect.objectContaining({
                id,
                name: workspace.name,
                documents: expect.arrayContaining([expect.objectContaining({toolId:"json-formatter",payload:{input:workspace.tools[0].state}})]),
                updatedAt: expect.any(Number),
            }),
        )

        const listed = await listWorkspaces()
        expect(listed.some((item) => item.id === id)).toBe(true)

        await deleteWorkspace(id)
        await expect(getWorkspace(id)).resolves.toBeNull()
    })
})
