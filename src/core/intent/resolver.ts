/**
 * The intent resolver seam.
 *
 * One entry point — `resolveIntent` — so surfaces never choose a matching
 * strategy. Today it composes the lexical resolver and blends in the local
 * semantic reranker when its scores are ready (`core/intent/semantic.ts`,
 * P2 of `docs/intent-discovery.md`); a future remote decision layer would
 * plug in here without touching callers.
 */
import { blendSemantic } from '@/core/intent/blend';
import { lexicalResolve } from '@/core/intent/lexical';
import type { IntentResolution, ResolveOptions } from '@/core/intent/types';

export function resolveIntent(query: string, options: ResolveOptions = {}): IntentResolution {
  const limit = options.limit ?? 8;
  const semantic = options.semantic;
  // With semantic scores in hand, keep a deeper lexical pool so a tool the
  // embeddings lift is still in the race.
  const lexical = lexicalResolve(query, {
    limit: semantic && semantic.size > 0 ? Math.max(limit * 2, 12) : limit,
  });
  if (!semantic || semantic.size === 0) return lexical;
  return blendSemantic(lexical, semantic, limit);
}
