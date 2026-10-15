/**
 * Intent resolution types.
 *
 * A resolver turns free text into ranked suggestions drawn from the tool
 * registry — never generated names, never invented capabilities. The shape is
 * deliberately small: a suggestion is a tool id, a score, and the reasons a
 * person can read.
 *
 * See `docs/intent-discovery.md`.
 */

/** Which field of a tool's capability record the query actually hit. */
export type MatchField = 'name' | 'keyword' | 'intent' | 'type';

export interface IntentSuggestion {
  toolId: string;
  score: number;
  /** Human-facing explanation, most informative first. May be empty. */
  reasons: string[];
  /** The strongest field the query matched. */
  matchedBy: MatchField;
}

/**
 * One tool's best-matching corpus line, from the semantic reranker. Scores are
 * cosine similarities; the line index points into `capabilityCorpusLines` so a
 * reason can name the line the way lexical reasons do.
 */
export interface SemanticHit {
  toolId: string;
  score: number;
  lineIndex: number;
}

/** Shape of `public/embeddings/tool-capabilities.v1.json` (P2). */
export interface SemanticVectorAsset {
  /** Hugging Face model id the vectors came from. */
  model: string;
  /** Model dtype used at both generation and runtime. */
  dtype: string;
  /** Vector width (384 for mxbai-embed-xsmall-v1). */
  dim: number;
  /** Components are int8: `value = stored / vectorScale`. */
  vectorScale: number;
  /** `capabilityCorpusHash()` at generation time; mismatch means stale. */
  corpusHash: string;
  vectors: Record<string, number[][]>;
}

export interface IntentResolution {
  query: string;
  suggestions: IntentSuggestion[];
  /** True when the top suggestion is clearly ahead of the runner-up. */
  confident: boolean;
  /** What drove the ranking, for telemetry and UI messaging. */
  resolvedBy: 'name' | 'intent' | 'keyword' | 'type' | 'mixed' | 'none';
}

export interface ResolveOptions {
  /** Maximum suggestions returned. Defaults to 8. */
  limit?: number;
  /**
   * Semantic reranker output for this query, keyed by tool id. When present,
   * the resolver blends it into the lexical ranking; when absent, lexical
   * alone decides. Never awaited — see `core/intent/semantic.ts`.
   */
  semantic?: ReadonlyMap<string, SemanticHit>;
}

export interface IntentResolver {
  readonly id: string;
  resolve(query: string, options?: ResolveOptions): IntentResolution;
}
