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
}

export interface IntentResolver {
  readonly id: string;
  resolve(query: string, options?: ResolveOptions): IntentResolution;
}
