/**
 * Capability graph.
 *
 * The single accessor over `content/tool-capabilities.ts`. Consumers — the
 * intent resolver, the palette, paste suggestions, Next Useful Action — read
 * the graph, never the raw records, so indexing and validation live in one
 * place and cannot drift apart.
 *
 * See `docs/intent-discovery.md`.
 */
import {
  CAPABILITIES,
  TASK_CLUSTERS,
  TOOL_DATA_TYPES,
  TOOL_OPERATIONS,
  type ToolCapability,
  type ToolDataType,
  type ToolOperation,
} from '@/content/tool-capabilities';
import { ALL_TOOLS, TOOLS } from '@/content/tools.config';

/** What this build shows; accessors, edges and clusters are pruned to it. */
const TOOL_IDS: ReadonlySet<string> = new Set(TOOLS.map((tool) => tool.id));

/**
 * The full catalogue. Corpus lines, the staleness hash and validation read
 * this, never `TOOL_IDS`: the vector asset and the capability records are
 * data that must compare equal in every target (the desktop build hides two
 * tools from the view; it does not shrink the corpus).
 */
const ALL_TOOL_IDS: ReadonlySet<string> = new Set(ALL_TOOLS.map((tool) => tool.id));

const BY_INPUT_TYPE: ReadonlyMap<ToolDataType, readonly string[]> = (() => {
  const map = new Map<ToolDataType, string[]>();
  for (const type of TOOL_DATA_TYPES) map.set(type, []);
  for (const tool of TOOLS) {
    for (const type of CAPABILITIES[tool.id]?.inputTypes ?? []) map.get(type)?.push(tool.id);
  }
  return map;
})();

const BY_OPERATION: ReadonlyMap<ToolOperation, readonly string[]> = (() => {
  const map = new Map<ToolOperation, string[]>();
  for (const op of TOOL_OPERATIONS) map.set(op, []);
  for (const tool of TOOLS) {
    for (const op of CAPABILITIES[tool.id]?.operations ?? []) map.get(op)?.push(tool.id);
  }
  return map;
})();

export function capabilityOf(toolId: string): ToolCapability | undefined {
  return CAPABILITIES[toolId];
}

/** Tool ids consuming a data type, in catalogue order. */
export function toolIdsByInputType(type: ToolDataType): readonly string[] {
  return BY_INPUT_TYPE.get(type) ?? [];
}

/** Tool ids performing an operation, in catalogue order. */
export function toolsForOperation(op: ToolOperation): readonly string[] {
  return BY_OPERATION.get(op) ?? [];
}

/**
 * Ordered next steps after using a tool: its explicit `related` edges, pruned
 * to known ids, capped. Empty is a valid answer — no handoff is better than a
 * fabricated one.
 */
export function nextActionsFor(toolId: string, limit = 2): readonly string[] {
  const related = CAPABILITIES[toolId]?.related ?? [];
  return related.filter((id) => id !== toolId && TOOL_IDS.has(id)).slice(0, limit);
}

/**
 * Paste suggestions for a detected tool: the detector's own answer first, then
 * its curated handoff edges — the useful operation set for the pasted data
 * (a detected JSON gets format, validate, compare, convert…), not one tool.
 * Unknown anchors yield nothing; the anchor itself is never dropped by the cap.
 */
export function pasteSuggestionsFor(detectedToolId: string, limit = 4): readonly string[] {
  if (!TOOL_IDS.has(detectedToolId)) return [];
  return [detectedToolId, ...nextActionsFor(detectedToolId, Math.max(0, limit - 1))];
}

/**
 * Why a tool is offered, in the user's own words: the first intent from its
 * capability record ("validate json against a schema"). Suggestions must be
 * able to say why they are shown; this is that sentence for graph-driven
 * surfaces — paste expansion and Next Useful Action.
 */
export function capabilityReason(toolId: string): string | null {
  return CAPABILITIES[toolId]?.intents[0] ?? null;
}

/**
 * Task clusters with any unknown ids pruned (validation reports them), and
 * clusters that end up empty in this build dropped — a target that hides
 * tools must not render a heading with nothing under it.
 */
export function taskClusters(): ReadonlyArray<{ id: string; title: string; toolIds: string[] }> {
  return TASK_CLUSTERS.map((cluster) => ({
    id: cluster.id,
    title: cluster.title,
    toolIds: cluster.toolIds.filter((id) => TOOL_IDS.has(id)),
  })).filter((cluster) => cluster.toolIds.length > 0);
}

/**
 * The exact lines embedded into vectors for a tool, in order: the name and
 * description, then each intent, then each keyword. One meaning per line, so
 * the semantic reranker can name the line it matched — the same way lexical
 * reasons do. The embedding generator and `capabilityCorpusHash()` must agree
 * on this; change one, change both.
 */
export function capabilityCorpusLines(toolId: string): readonly string[] {
  const tool = ALL_TOOLS.find((entry) => entry.id === toolId);
  if (!tool) return [];
  const capability = CAPABILITIES[toolId];
  const lines = [`${tool.name}: ${tool.description}`];
  for (const intent of capability?.intents ?? []) lines.push(intent);
  for (const keyword of tool.keywords ?? []) lines.push(keyword);
  return lines;
}

/** What each corpus line is, by position. Aligns with `capabilityCorpusLines`. */
export type CorpusLineKind = 'name' | 'intent' | 'keyword';

export function capabilityCorpusLineKinds(toolId: string): readonly CorpusLineKind[] {
  const tool = ALL_TOOLS.find((entry) => entry.id === toolId);
  if (!tool) return [];
  const capability = CAPABILITIES[toolId];
  return [
    'name',
    ...Array<'intent'>((capability?.intents ?? []).length).fill('intent'),
    ...Array<'keyword'>((tool.keywords ?? []).length).fill('keyword'),
  ];
}

/** FNV-1a over every corpus line, in catalogue order. Detects stale vectors. */
export function capabilityCorpusHash(): string {
  let hash = 0x811c9dc5;
  const text = ALL_TOOLS.map(
    (tool) => `${tool.id}\n${capabilityCorpusLines(tool.id).join('\n')}`,
  ).join('\n---\n');
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Build-time integrity of the capability model. Empty array means healthy. */
export function validateCapabilities(): string[] {
  const errors: string[] = [];
  const knownTypes = new Set<string>(TOOL_DATA_TYPES);
  const knownOps = new Set<string>(TOOL_OPERATIONS);

  for (const tool of ALL_TOOLS) {
    const capability = CAPABILITIES[tool.id];
    if (!capability) {
      errors.push(`Tool ${tool.id} has no capability record.`);
      continue;
    }
    if (capability.intents.length === 0) errors.push(`Tool ${tool.id} has no intents.`);
    if (capability.intents.some((intent) => intent.trim().length === 0))
      errors.push(`Tool ${tool.id} has an empty intent.`);
    for (const type of capability.inputTypes)
      if (!knownTypes.has(type)) errors.push(`Tool ${tool.id} uses unknown input type "${type}".`);
    for (const op of capability.operations)
      if (!knownOps.has(op)) errors.push(`Tool ${tool.id} uses unknown operation "${op}".`);

    const seen = new Set<string>();
    for (const related of capability.related) {
      if (related === tool.id) errors.push(`Tool ${tool.id} lists itself in related.`);
      else if (!ALL_TOOL_IDS.has(related))
        errors.push(`Tool ${tool.id} references unknown tool "${related}".`);
      if (seen.has(related)) errors.push(`Tool ${tool.id} lists "${related}" twice in related.`);
      seen.add(related);
    }
  }

  for (const id of Object.keys(CAPABILITIES))
    if (!ALL_TOOL_IDS.has(id)) errors.push(`Capability record "${id}" matches no tool.`);

  const clusterIds = new Set<string>();
  for (const cluster of TASK_CLUSTERS) {
    if (clusterIds.has(cluster.id)) errors.push(`Task cluster id "${cluster.id}" is duplicated.`);
    clusterIds.add(cluster.id);
    if (cluster.toolIds.length === 0) errors.push(`Task cluster "${cluster.id}" is empty.`);
    const seen = new Set<string>();
    for (const toolId of cluster.toolIds) {
      if (!ALL_TOOL_IDS.has(toolId))
        errors.push(`Task cluster "${cluster.id}" references unknown tool "${toolId}".`);
      if (seen.has(toolId)) errors.push(`Task cluster "${cluster.id}" lists "${toolId}" twice.`);
      seen.add(toolId);
    }
  }

  return errors;
}
