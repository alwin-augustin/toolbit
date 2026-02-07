export const TOOL_CHAINS: Record<string, string[]> = {
    "json-formatter": ["base64-encoder", "hash-generator", "url-encoder", "diff-tool", "yaml-formatter", "xml-formatter"],
    "yaml-formatter": ["json-formatter", "base64-encoder", "hash-generator"],
    "xml-formatter": ["json-formatter", "base64-encoder", "hash-generator"],
    "csv-to-json": ["json-formatter", "base64-encoder"],
    "base64-encoder": ["json-formatter", "url-encoder", "hash-generator"],
    "url-encoder": ["base64-encoder", "hash-generator"],
    "jwt-decoder": ["json-formatter", "base64-encoder"],
    "sql-formatter": ["diff-tool"],
    "diff-tool": ["base64-encoder", "hash-generator"],
    "graphql-formatter": ["diff-tool", "base64-encoder"],
    "css-formatter": ["diff-tool"],
    "js-json-minifier": ["diff-tool", "base64-encoder"],
}

export const getChainTargets = (toolId: string): string[] => TOOL_CHAINS[toolId] || []
