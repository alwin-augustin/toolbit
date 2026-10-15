/**
 * Local semantic reranking (P2).
 *
 * Loads the precomputed tool vectors and the `mixedbread-ai/mxbai-embed-xsmall-v1`
 * embedding model, both lazily and only when the user opts in. Nothing here
 * ever blocks a search: the palette asks for whatever is ready, and lexical
 * carries the surface until the model answers. Everything runs in the browser
 * tab — the model weights come from the Hugging Face CDN once and are cached
 * by the browser, queries never leave the device.
 *
 * Vectors are build artifacts: `scripts/generate-tool-embeddings.ts` writes
 * them and `tests/embeddings.test.ts` fails when the corpus outgrows them.
 */
import { capabilityCorpusHash } from '@/core/capability-graph';
import type { SemanticHit, SemanticVectorAsset } from '@/core/intent/types';

export const SEMANTIC_MODEL = 'mixedbread-ai/mxbai-embed-xsmall-v1';
export const SEMANTIC_DTYPE = 'q8';
export const SEMANTIC_ASSET_URL = '/embeddings/tool-capabilities.v1.json';

/** `off` until the preference is on; `failed` keeps the quiet lexical fallback. */
export type SemanticStatus = 'off' | 'loading' | 'ready' | 'failed';

export type ToolVectors = ReadonlyMap<string, readonly Float32Array[]>;

/** Dequantize the int8 asset back to unit-length float vectors. */
export function dequantizeVectors(asset: SemanticVectorAsset): Map<string, Float32Array[]> {
  const scale = asset.vectorScale > 0 ? asset.vectorScale : 1;
  const vectors = new Map<string, Float32Array[]>();
  for (const [toolId, rows] of Object.entries(asset.vectors)) {
    vectors.set(
      toolId,
      rows.map((row) => Float32Array.from(row, (value) => value / scale)),
    );
  }
  return vectors;
}

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : 0;
}

/** Best cosine per tool across its corpus lines. All tools, no filtering. */
export function semanticHitsFromVector(
  queryVector: ArrayLike<number>,
  vectors: ToolVectors,
): Map<string, SemanticHit> {
  const hits = new Map<string, SemanticHit>();
  for (const [toolId, rows] of vectors) {
    let best = Number.NEGATIVE_INFINITY;
    let lineIndex = 0;
    for (let index = 0; index < rows.length; index++) {
      const score = cosineSimilarity(queryVector, rows[index]);
      if (score > best) {
        best = score;
        lineIndex = index;
      }
    }
    if (Number.isFinite(best)) hits.set(toolId, { toolId, score: best, lineIndex });
  }
  return hits;
}

/** The slice of the transformers.js feature-extraction pipeline we call. */
interface Extractor {
  (
    text: string,
    options: { pooling: 'mean'; normalize: true },
  ): Promise<{
    tolist(): number[][];
  }>;
}

let status: SemanticStatus = 'off';
const listeners = new Set<() => void>();
let vectors: Map<string, Float32Array[]> | null = null;
let extractor: Extractor | null = null;
/** Serializes inference; concurrent runs on one WASM session just queue anyway. */
let queue: Promise<unknown> = Promise.resolve();
const hitCache = new Map<string, ReadonlyMap<string, SemanticHit>>();
const HIT_CACHE_LIMIT = 16;

function setStatus(next: SemanticStatus) {
  if (status === next) return;
  status = next;
  for (const listener of listeners) listener();
}

export function semanticStatus(): SemanticStatus {
  return status;
}

export function subscribeSemantic(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Idempotent: begins loading the vectors and model once the preference is on. */
export function startSemantic(): void {
  if (status === 'loading' || status === 'ready') return;
  setStatus('loading');
  void load()
    .then(() => setStatus('ready'))
    .catch(() => setStatus('failed'));
}

/** The preference went off. Loaded weights stay warm for a later re-enable. */
export function stopSemantic(): void {
  setStatus('off');
}

async function load(): Promise<void> {
  if (!vectors) {
    const response = await fetch(SEMANTIC_ASSET_URL);
    if (!response.ok) throw new Error(`vectors unavailable: HTTP ${response.status}`);
    const asset = (await response.json()) as SemanticVectorAsset;
    if (asset.corpusHash !== capabilityCorpusHash()) throw new Error('tool vectors are stale');
    const width = Object.values(asset.vectors)[0]?.[0]?.length;
    if (!width || width !== asset.dim) throw new Error('vectors malformed');
    vectors = dequantizeVectors(asset);
  }
  if (!extractor) {
    const { pipeline } = await import('@huggingface/transformers');
    extractor = (await pipeline('feature-extraction', SEMANTIC_MODEL, {
      dtype: SEMANTIC_DTYPE,
    })) as unknown as Extractor;
  }
}

/**
 * Cosine hits for a query, or null while the model is off/loading/failed.
 * Never rejects: an inference failure degrades to lexical for that query.
 */
export async function semanticHitsFor(
  query: string,
): Promise<ReadonlyMap<string, SemanticHit> | null> {
  const trimmed = query.trim();
  const active = vectors;
  const model = extractor;
  if (status !== 'ready' || !active || !model || trimmed.length < 2) return null;
  const cached = hitCache.get(trimmed);
  if (cached) return cached;

  const run = queue.then(async () => {
    const output = await model(trimmed, { pooling: 'mean', normalize: true });
    return output.tolist()[0] ?? [];
  });
  queue = run.catch(() => undefined);
  let queryVector: number[];
  try {
    queryVector = await run;
  } catch {
    return null;
  }
  const hits = semanticHitsFromVector(queryVector, active);
  if (hitCache.size >= HIT_CACHE_LIMIT) {
    const oldest = hitCache.keys().next().value;
    if (oldest != null) hitCache.delete(oldest);
  }
  hitCache.set(trimmed, hits);
  return hits;
}

/** Test-only: return the module to its first-visit state. */
export function resetSemanticState(): void {
  status = 'off';
  vectors = null;
  extractor = null;
  queue = Promise.resolve();
  hitCache.clear();
  for (const listener of listeners) listener();
}
