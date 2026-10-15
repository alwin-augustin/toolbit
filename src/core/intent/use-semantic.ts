/**
 * React bindings for the semantic reranker.
 *
 * `useSemanticHits` is fire-and-forget: it returns whatever the model has
 * finished computing and nothing until then, so a surface never waits.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePreferences } from '@/core/preferences';
import {
  semanticHitsFor,
  semanticStatus,
  startSemantic,
  stopSemantic,
  subscribeSemantic,
  type SemanticStatus,
} from '@/core/intent/semantic';
import type { SemanticHit } from '@/core/intent/types';

/** Reads the preference, keeps the module in step, and tracks load state. */
export function useSemanticEnabled(): { enabled: boolean; status: SemanticStatus } {
  const enabled = usePreferences((state) => state.semanticSearch);
  const status = useSyncExternalStore(subscribeSemantic, semanticStatus, semanticStatus);
  useEffect(() => {
    if (enabled) startSemantic();
    else stopSemantic();
  }, [enabled]);
  return { enabled, status };
}

export function useSemanticHits(
  query: string,
  enabled: boolean,
  status: SemanticStatus,
): ReadonlyMap<string, SemanticHit> | null {
  const [hits, setHits] = useState<ReadonlyMap<string, SemanticHit> | null>(null);
  useEffect(() => {
    if (!enabled || status !== 'ready' || query.trim().length < 2) {
      setHits(null);
      return;
    }
    let cancelled = false;
    void semanticHitsFor(query)
      .then((result) => {
        if (!cancelled) setHits(result);
      })
      .catch(() => {
        if (!cancelled) setHits(null);
      });
    return () => {
      cancelled = true;
    };
  }, [query, enabled, status]);
  return hits;
}
