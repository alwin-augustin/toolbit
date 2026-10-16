/**
 * Semantic blending (P2).
 *
 * The lexical resolver stays the floor: semantic evidence nudges its ranking,
 * never replaces it. Both sources are mapped to a common compound score in
 * [0, 1] — lexical saturates at the single-match confidence threshold, cosine
 * similarity is centred on the range where real queries land — so a task
 * phrase from the corpus (cosine ≈ 1) can lift the right tool over a keyword
 * tie, while a weak off-catalogue cosine stays below the confidence floor.
 *
 * Every knob here was set against `tests/intent-eval*.test.ts`; tune there,
 * not here.
 */
import { capabilityCorpusLineKinds, capabilityCorpusLines } from '@/core/capability-graph';
import { TOOLS } from '@/content/tools.config';
import type { IntentResolution, IntentSuggestion, SemanticHit } from '@/core/intent/types';

export const SEMANTIC_BLEND = {
  /** Lexical score that earns full credit ("the lone strong match" line). */
  lexicalFullCredit: 18,
  /** Weight split between the two evidence sources. */
  lexicalWeight: 0.55,
  semanticWeight: 0.45,
  /** Cosine ≤ center contributes nothing; ≥ center + width contributes full. */
  semanticCenter: 0.35,
  semanticWidth: 0.45,
  /** A semantic-only candidate must clear this cosine to enter the list. */
  entrantFloor: 0.5,
  /** At most this many semantic-only candidates join the lexical ones. */
  maxEntrants: 3,
  /** Confidence: floor, margin over the runner-up, and solo requirement. */
  confidentFloor: 0.65,
  confidentMargin: 1.3,
  confidentSolo: 0.75,
} as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** Cosine → [0, 1] over the window where real query matches live. */
export function semanticStrength(cosine: number): number {
  return clamp01((cosine - SEMANTIC_BLEND.semanticCenter) / SEMANTIC_BLEND.semanticWidth);
}

const NAME_BY_ID: ReadonlyMap<string, string> = new Map(TOOLS.map((tool) => [tool.id, tool.name]));

/** Tools this build shows; semantic hits for hidden ids are dropped. */
const VISIBLE_TOOL_IDS: ReadonlySet<string> = new Set(TOOLS.map((tool) => tool.id));

/** The reason a semantic hit can state, in the vocabulary lexical uses. */
export function semanticReason(toolId: string, lineIndex: number): string {
  const kind = capabilityCorpusLineKinds(toolId)[lineIndex];
  const text = capabilityCorpusLines(toolId)[lineIndex];
  if (kind === 'name') return `Matches “${NAME_BY_ID.get(toolId) ?? toolId}”`;
  if (kind === 'keyword') return text ? `Mentions “${text}”` : 'Related to the task';
  return text ? `For “${text}”` : 'Related to the task';
}

interface Candidate {
  toolId: string;
  suggestion: IntentSuggestion | null;
  lexScore: number;
  semantic: SemanticHit | null;
  compound: number;
  order: number;
}

/**
 * Blend semantic hits into a lexical resolution. Pure and synchronous — the
 * caller supplies whatever the reranker has finished computing, so search
 * never waits on a model.
 */
export function blendSemantic(
  lexical: IntentResolution,
  semantic: ReadonlyMap<string, SemanticHit>,
  limit: number,
): IntentResolution {
  // The vectors cover the full catalogue. A build that hides tools (the
  // desktop build hides the two network ones) must not let them back in
  // through the model.
  const visible = new Map([...semantic].filter(([toolId]) => VISIBLE_TOOL_IDS.has(toolId)));
  if (visible.size === 0) return lexical;

  const candidates = new Map<string, Candidate>();
  let order = 0;
  for (const suggestion of lexical.suggestions) {
    candidates.set(suggestion.toolId, {
      toolId: suggestion.toolId,
      suggestion,
      lexScore: suggestion.score,
      semantic: null,
      compound: 0,
      order: order++,
    });
  }
  const entrants = [...visible.values()]
    .filter((hit) => !candidates.has(hit.toolId) && hit.score >= SEMANTIC_BLEND.entrantFloor)
    .sort((a, b) => b.score - a.score)
    .slice(0, SEMANTIC_BLEND.maxEntrants);
  for (const hit of entrants) {
    candidates.set(hit.toolId, {
      toolId: hit.toolId,
      suggestion: null,
      lexScore: 0,
      semantic: hit,
      compound: 0,
      order: order++,
    });
  }

  for (const candidate of candidates.values()) {
    candidate.semantic = visible.get(candidate.toolId) ?? null;
    const lex = clamp01(candidate.lexScore / SEMANTIC_BLEND.lexicalFullCredit);
    const sem = candidate.semantic ? semanticStrength(candidate.semantic.score) : 0;
    candidate.compound = SEMANTIC_BLEND.lexicalWeight * lex + SEMANTIC_BLEND.semanticWeight * sem;
  }

  const ranked = [...candidates.values()].sort(
    (a, b) => b.compound - a.compound || b.lexScore - a.lexScore || a.order - b.order,
  );

  const suggestions = ranked.slice(0, limit).map((candidate): IntentSuggestion => {
    const hit = candidate.semantic;
    const reasons = candidate.suggestion?.reasons ?? [];
    if (reasons.length > 0) return { ...candidate.suggestion!, score: round(candidate.compound) };
    const fallback = hit ? semanticReason(candidate.toolId, hit.lineIndex) : 'Matches the task';
    return {
      toolId: candidate.toolId,
      score: round(candidate.compound),
      reasons: [fallback],
      matchedBy: hit ? matchedByLine(candidate.toolId, hit.lineIndex) : 'type',
    };
  });

  const top = ranked[0];
  const topSuggestion = suggestions[0];
  let resolvedBy = lexical.resolvedBy;
  if (top != null && topSuggestion != null) {
    const semDriven = top.semantic != null && top.semantic.score >= SEMANTIC_BLEND.entrantFloor;
    if (top.lexScore > 0 && semDriven) resolvedBy = 'mixed';
    else if (top.lexScore === 0) resolvedBy = topSuggestion.matchedBy;
  }

  const second = suggestions[1];
  const confident =
    topSuggestion != null &&
    topSuggestion.score >= SEMANTIC_BLEND.confidentFloor &&
    (second != null
      ? topSuggestion.score >= second.score * SEMANTIC_BLEND.confidentMargin
      : topSuggestion.score >= SEMANTIC_BLEND.confidentSolo);

  return { query: lexical.query, suggestions, confident, resolvedBy };
}

function matchedByLine(toolId: string, lineIndex: number): IntentSuggestion['matchedBy'] {
  const kind = capabilityCorpusLineKinds(toolId)[lineIndex];
  if (kind === 'name') return 'name';
  if (kind === 'keyword') return 'keyword';
  return 'intent';
}

const round = (value: number) => Math.round(value * 1000) / 1000;
