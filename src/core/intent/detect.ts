/**
 * Paste detection, wrapped around the graph.
 *
 * `smart-detect.ts` stays what it is — precision-first detectors over the
 * pasted text — but its output here feeds the capability graph instead of
 * ending at a fixed tool: the detector's answer stays first, and the graph
 * adds the useful operation set for that data through the anchor's curated
 * handoff edges (format → validate → compare → convert…). This is the same
 * expansion Next Useful Action uses after a run, applied to a paste.
 *
 * See `docs/intent-discovery.md`.
 */
import { capabilityReason, pasteSuggestionsFor } from '@/core/capability-graph';
import { detectContentType } from '@/core/smart-detect';

export interface PasteSuggestion {
  toolId: string;
  /**
   * Why the tool is offered: the detector's finding for its own answer
   * ("Detected valid JSON"), the tool's first intent for graph expansions
   * ("validate json against a schema").
   */
  reason: string;
  /** True for the detector's own answer, false for graph expansions. */
  anchor: boolean;
}

/** Pasted text → the operation set for what it looks like. Capped at four. */
export function detectPasteSuggestions(text: string): PasteSuggestion[] {
  const [anchor] = detectContentType(text);
  if (!anchor) return [];
  return pasteSuggestionsFor(anchor.toolId, 4).flatMap<PasteSuggestion>((toolId) => {
    if (toolId === anchor.toolId) return [{ toolId, reason: anchor.reason, anchor: true }];
    const reason = capabilityReason(toolId);
    return reason ? [{ toolId, reason, anchor: false }] : [];
  });
}
