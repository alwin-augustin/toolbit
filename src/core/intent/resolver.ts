/**
 * The intent resolver seam.
 *
 * One entry point — `resolveIntent` — so surfaces never choose a matching
 * strategy. Today it composes the lexical resolver; the semantic reranker
 * (P2 of `docs/intent-discovery.md`) plugs in here without touching callers.
 */
import { lexicalResolve } from '@/core/intent/lexical';
import type { IntentResolution, ResolveOptions } from '@/core/intent/types';

export function resolveIntent(query: string, options?: ResolveOptions): IntentResolution {
  return lexicalResolve(query, options);
}
