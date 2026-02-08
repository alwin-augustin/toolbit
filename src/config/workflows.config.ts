export interface PresetWorkflow {
    id: string
    name: string
    description: string
    tools: string[]
}

export const PRESET_WORKFLOWS: PresetWorkflow[] = [
    {
        id: "api-debug",
        name: "API Debug",
        description: "Request → JSON format → Base64 encode",
        tools: ["api-request-builder", "json-formatter", "base64-encoder"],
    },
    {
        id: "jwt-inspection",
        name: "JWT Inspection",
        description: "Decode JWT → Format JSON → Hash payload",
        tools: ["jwt-decoder", "json-formatter", "hash-generator"],
    },
    {
        id: "data-pipeline",
        name: "Data Pipeline",
        description: "CSV → JSON → YAML",
        tools: ["csv-to-json", "json-formatter", "yaml-formatter"],
    },
    {
        id: "security-audit",
        name: "Security Audit",
        description: "Decode JWT → Hash → Base64 encode",
        tools: ["jwt-decoder", "hash-generator", "base64-encoder"],
    },
]
