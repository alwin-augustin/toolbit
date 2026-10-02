import { TOOLS } from '@/config/tools.config';
import { DEFINITIONS, type JsonValue } from './tool-contract';
import { canPersistTool } from './tool-policy';
export interface ToolDocumentV1 {
  id: string;
  toolId: string;
  toolVersion: number;
  options: Record<string, JsonValue>;
  payload?: Record<string, JsonValue>;
  updatedAt: number;
}
export interface WorkspaceV1 {
  schemaVersion: 1;
  productVersion: string;
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
  documents: ToolDocumentV1[];
  activeDocumentId?: string;
  layout: { density: 'compact' | 'comfortable'; inspectorOpen: boolean };
  tools: Array<{ toolId: string; state: string }>;
}
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
export function parseWorkspace(raw: string): WorkspaceV1 {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    throw new Error('Workspace is too large (maximum 2 MB).');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Choose a valid JSON workspace file.');
  }
  if (!record(data)) throw new Error('Workspace must be an object.');
  if (data.schemaVersion !== undefined && data.schemaVersion !== 1)
    throw new Error('This workspace version is unsupported. Keep the original file.');
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 200)
    throw new Error('Workspace needs a name of 1–200 characters.');
  const documents =
    data.schemaVersion === 1
      ? data.documents
      : Array.isArray(data.tools)
        ? data.tools.map((tool: unknown, index: number) => {
            if (!record(tool)) throw new Error('Invalid legacy tool.');
            let payload: unknown;
            try {
              payload = JSON.parse(String(tool.state));
            } catch {
              throw new Error('Invalid legacy tool state.');
            }
            // Some early workspaces stored a bare JSON payload; preserve it as input.
            return {
              id: `legacy-${index}`,
              toolId: tool.toolId,
              toolVersion: 1,
              options: {},
              payload:
                record(payload) && ('input' in payload || 'output' in payload)
                  ? payload
                  : { input: String(tool.state) },
              updatedAt: Date.now(),
            };
          })
        : null;
  if (!Array.isArray(documents) || documents.length > 100)
    throw new Error('Workspace needs at most 100 documents.');
  const ids = new Set<string>();
  const known = new Set(TOOLS.map((t) => t.id));
  const valid = documents.map((document: unknown) => {
    if (
      !record(document) ||
      typeof document.id !== 'string' ||
      !document.id ||
      ids.has(document.id)
    )
      throw new Error('Document IDs must be unique.');
    ids.add(document.id);
    if (typeof document.toolId !== 'string' || !known.has(document.toolId))
      throw new Error('Workspace contains an unknown tool. Keep the original file for recovery.');
    if (document.toolVersion !== 1)
      throw new Error('Unsupported tool version. Keep the original file.');
    if (!record(document.options)) throw new Error('Document options must be an object.');
    const def = DEFINITIONS[document.toolId];
    if (def)
      for (const [key, value] of Object.entries(document.options)) {
        if (!(key in def.defaultOptions) || typeof value !== typeof def.defaultOptions[key])
          throw new Error(`Invalid settings for ${document.toolId}.`);
      }
    if (document.payload !== undefined && !record(document.payload))
      throw new Error('Document data must be an object.');
    if (document.payload && !canPersistTool(document.toolId))
      throw new Error(
        'Workspace contains secret tool data. Remove that document’s payload before importing; retain the original file for recovery.',
      );
    if (
      document.toolId === 'json-formatter' &&
      document.options.indent !== undefined &&
      ![0, 2, 4, 8].includes(Number(document.options.indent))
    )
      throw new Error('Invalid JSON indentation.');
    if (
      document.toolId === 'base64-encoder' &&
      document.options.mode !== undefined &&
      !['encode', 'decode'].includes(String(document.options.mode))
    )
      throw new Error('Invalid Base64 mode.');
    return {
      id: document.id,
      toolId: document.toolId,
      toolVersion: 1,
      options: document.options as Record<string, JsonValue>,
      payload: document.payload as Record<string, JsonValue> | undefined,
      updatedAt: typeof document.updatedAt === 'number' ? document.updatedAt : Date.now(),
    };
  });
  const layout = record(data.layout) ? data.layout : {};
  if (layout.density !== undefined && !['compact', 'comfortable'].includes(String(layout.density)))
    throw new Error('Unsupported workspace layout.');
  if (
    data.activeDocumentId !== undefined &&
    (typeof data.activeDocumentId !== 'string' || !ids.has(data.activeDocumentId))
  )
    throw new Error('Active document is missing.');
  return {
    schemaVersion: 1,
    productVersion: '1.0.0',
    id: typeof data.id === 'string' ? data.id : crypto.randomUUID(),
    name: data.name,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    documents: valid,
    activeDocumentId: data.activeDocumentId as string | undefined,
    layout: {
      density: layout.density === 'compact' ? 'compact' : 'comfortable',
      inspectorOpen: layout.inspectorOpen === true,
    },
    tools: valid.map((d) => ({ toolId: d.toolId, state: JSON.stringify(d.payload || {}) })),
  };
}
export function workspaceSnapshot(
  name: string,
  documents: ToolDocumentV1[],
  activeDocumentId: string | null,
  layout: WorkspaceV1['layout'],
  includeData = false,
): WorkspaceV1 {
  const docs = documents.map((d) => ({
    ...d,
    payload: includeData && canPersistTool(d.toolId) ? d.payload : undefined,
  }));
  return {
    schemaVersion: 1,
    productVersion: '1.0.0',
    id: crypto.randomUUID(),
    name: name.trim() || 'Workspace',
    createdAt: Date.now(),
    documents: docs,
    activeDocumentId: activeDocumentId || undefined,
    layout,
    tools: docs.map((d) => ({ toolId: d.toolId, state: JSON.stringify(d.payload || {}) })),
  };
}
