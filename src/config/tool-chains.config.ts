import { DEFINITIONS, compatible, inputType, outputType, type JsonValue } from '@/lib/tool-contract';
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

export const getChainTargets = (toolId: string, options?: Record<string,JsonValue>): string[] => {
    const source=DEFINITIONS[toolId]; if(!source)return TOOL_CHAINS[toolId]||[];
    const type=outputType({toolId,options:options||source.defaultOptions});
    return Object.values(DEFINITIONS).filter(target=>target.id!==toolId && compatible(type,inputType({toolId:target.id,options:target.defaultOptions}))).map(target=>target.id);
}
