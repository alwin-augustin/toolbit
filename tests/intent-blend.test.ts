import { describe, expect, it } from 'vitest';
import { blendSemantic, semanticStrength } from '@/core/intent/blend';
import { capabilityCorpusLineKinds, capabilityCorpusLines } from '@/core/capability-graph';
import type { IntentResolution, IntentSuggestion, SemanticHit } from '@/core/intent/types';

const suggestion = (
  toolId: string,
  score: number,
  reasons: string[] = [`For “${toolId}”`],
): IntentSuggestion => ({ toolId, score, reasons, matchedBy: 'keyword' });

const resolution = (suggestions: IntentSuggestion[]): IntentResolution => ({
  query: 'q',
  suggestions,
  confident: false,
  resolvedBy: 'keyword',
});

const hit = (toolId: string, score: number, lineIndex = 1): SemanticHit => ({
  toolId,
  score,
  lineIndex,
});

const hits = (...entries: SemanticHit[]) => new Map(entries.map((entry) => [entry.toolId, entry]));

describe('semantic strength', () => {
  it('maps cosine similarity onto the window where real matches live', () => {
    expect(semanticStrength(0.3)).toBe(0);
    expect(semanticStrength(0.35)).toBe(0);
    expect(semanticStrength(0.575)).toBeCloseTo(0.5, 5);
    expect(semanticStrength(0.85)).toBe(1);
    expect(semanticStrength(1)).toBe(1);
  });
});

describe('blending semantic hits into a lexical resolution', () => {
  it('leaves the lexical resolution untouched when there is nothing to blend', () => {
    const lexical = resolution([suggestion('json-formatter', 20)]);
    expect(blendSemantic(lexical, new Map(), 8)).toBe(lexical);
  });

  it('lifts the tool whose corpus phrase matches over a keyword tie', () => {
    // "check my yaml is valid": lexical ties json-validator and nginx above
    // yaml-formatter on the generic verb "validate"; the corpus phrase decides.
    const lexical = resolution([
      suggestion('json-validator', 19.93),
      suggestion('nginx-config-validator', 19.93),
      suggestion('yaml-formatter', 19.07),
    ]);
    const blended = blendSemantic(
      lexical,
      hits(
        hit('yaml-formatter', 0.905),
        hit('json-validator', 0.502),
        hit('nginx-config-validator', 0.5),
      ),
      8,
    );

    expect(blended.suggestions[0].toolId).toBe('yaml-formatter');
    expect(blended.suggestions[0].reasons).toEqual(['For “yaml-formatter”']);
    expect(blended.confident).toBe(true);
    expect(blended.resolvedBy).toBe('mixed');
  });

  it('keeps weak cosines out of both ranking and confidence', () => {
    // "git rebase interactive" is not in the catalogue: a lone weak lexical
    // match must not become a confident answer.
    const lexical = resolution([suggestion('git-diff-viewer', 13.2)]);
    const blended = blendSemantic(lexical, hits(hit('git-diff-viewer', 0.44)), 8);

    expect(blended.suggestions.map((entry) => entry.toolId)).toEqual(['git-diff-viewer']);
    expect(blended.confident).toBe(false);
    expect(blended.resolvedBy).toBe('keyword');
  });

  it('does not admit semantic-only candidates below the floor', () => {
    const lexical = resolution([suggestion('strip-whitespace', 9)]);
    const blended = blendSemantic(lexical, hits(hit('pdf-tools', 0.49)), 8);

    expect(blended.suggestions.map((entry) => entry.toolId)).toEqual(['strip-whitespace']);
  });

  it('admits a semantic-only candidate with the reason for its matched line', () => {
    const lineIndex = capabilityCorpusLineKinds('jwt-decoder').indexOf('intent');
    const line = capabilityCorpusLines('jwt-decoder')[lineIndex];
    const lexical = resolution([suggestion('json-formatter', 20)]);
    const blended = blendSemantic(lexical, hits(hit('jwt-decoder', 0.6, lineIndex)), 8);

    const entrant = blended.suggestions.find((entry) => entry.toolId === 'jwt-decoder');
    expect(entrant).toBeDefined();
    expect(entrant?.reasons).toEqual([`For “${line}”`]);
    expect(entrant?.matchedBy).toBe('intent');
    // The top itself was pure lexical evidence, so the attribution stays.
    expect(blended.resolvedBy).toBe('keyword');
  });

  it('names the tool when the name line is what matched', () => {
    const lexical = resolution([]);
    const blended = blendSemantic(lexical, hits(hit('uuid-generator', 0.7, 0)), 8);

    expect(blended.suggestions[0].reasons).toEqual(['Matches “UUID Generator”']);
    expect(blended.suggestions[0].matchedBy).toBe('name');
    // Semantic evidence alone never reaches the confidence floor.
    expect(blended.confident).toBe(false);
    expect(blended.resolvedBy).toBe('name');
  });

  it('requires a margin over the runner-up for confidence', () => {
    const lexical = resolution([suggestion('csv-to-json', 16), suggestion('json-formatter', 14)]);
    const blended = blendSemantic(
      lexical,
      hits(hit('csv-to-json', 0.85), hit('json-formatter', 0.8)),
      8,
    );

    expect(blended.suggestions.map((entry) => entry.toolId)).toEqual([
      'csv-to-json',
      'json-formatter',
    ]);
    expect(blended.confident).toBe(false);
  });

  it('keeps the limit and rejects unknown tools nowhere', () => {
    const lexical = resolution([suggestion('json-formatter', 20)]);
    const blended = blendSemantic(lexical, hits(hit('json-formatter', 0.9)), 1);
    expect(blended.suggestions).toHaveLength(1);
  });
});
