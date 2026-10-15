/**
 * Lexical intent matching.
 *
 * Deterministic, synchronous, dependency-free — the floor that never fails.
 * The scorer blends four evidence sources per tool: the name, keywords,
 * natural-language intents, and the type/operation vocabulary. Typo tolerance
 * is one edit on tokens of four characters or more; inflection is a shared
 * four-character stem. Ranking is stable: score first, catalogue order second.
 *
 * `docs/intent-discovery.md` §4 covers how the semantic layer blends into this.
 */
import { TOOLS } from '@/content/tools.config';
import { capabilityOf } from '@/core/capability-graph';
import type {
  IntentResolution,
  IntentSuggestion,
  MatchField,
  ResolveOptions,
} from '@/core/intent/types';

/** Grammatical glue. Removed from token matching; phrases still use raw text. */
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'my',
  'this',
  'it',
  'of',
  'in',
  'on',
  'and',
  'or',
  'for',
  'with',
  'is',
  'are',
  'do',
  'does',
  'i',
  'how',
  'what',
  'when',
  'why',
  'will',
  'be',
  'can',
  'you',
  'that',
  'at',
  'as',
  'by',
  'from',
  'me',
  'please',
  'help',
  'need',
  'want',
]);

/** Query-side expansions for words no tool vocabulary contains. */
const SYNONYMS: Record<string, readonly string[]> = {
  colour: ['color'],
  prettyprint: ['pretty', 'print'],
  urlencode: ['url', 'encode'],
  urldecode: ['url', 'decode'],
  guid: ['uuid'],
};

type MatchKind = 'exact' | 'prefix' | 'stem' | 'fuzzy';

/** Weights per field and match kind. Name > keyword > intent > type/operation. */
const WEIGHTS: Record<MatchField, Record<MatchKind, number>> = {
  name: { exact: 12, prefix: 8, stem: 6, fuzzy: 5 },
  keyword: { exact: 7, prefix: 5, stem: 4, fuzzy: 3 },
  intent: { exact: 5, prefix: 4, stem: 3, fuzzy: 2 },
  type: { exact: 2, prefix: 1, stem: 1, fuzzy: 0 },
};

/** One edit max, same-length-ish, on tokens of four characters or more. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    edits++;
    if (edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

/** Query tokens with stopwords removed and synonyms expanded. */
export function expandTokens(tokens: readonly string[]): string[] {
  const content = tokens.filter((token) => !STOPWORDS.has(token));
  const kept = content.length > 0 ? content : [...tokens];
  return kept.flatMap((token) => (SYNONYMS[token] ? [token, ...SYNONYMS[token]] : [token]));
}

export function matchToken(queryToken: string, token: string): MatchKind | null {
  if (queryToken === token) return 'exact';
  if (queryToken.length >= 3 && token.startsWith(queryToken)) return 'prefix';
  if (queryToken.length >= 4 && queryToken.startsWith(token) && token.length >= 3) return 'prefix';
  if (queryToken.length >= 5 && token.length >= 5) {
    let shared = 0;
    const max = Math.min(queryToken.length, token.length);
    while (shared < max && queryToken[shared] === token[shared]) shared++;
    if (shared >= 4) return 'stem';
  }
  if (queryToken.length >= 4 && token.length >= 4 && withinOneEdit(queryToken, token))
    return 'fuzzy';
  return null;
}

interface ToolTokens {
  toolId: string;
  name: string;
  nameTokens: string[];
  keywordTokens: string[];
  intents: Array<{ text: string; tokens: string[] }>;
  typeTokens: string[];
  opTokens: string[];
}

const INDEX: readonly ToolTokens[] = TOOLS.map((tool) => {
  const capability = capabilityOf(tool.id);
  return {
    toolId: tool.id,
    name: tool.name,
    nameTokens: tokenize(tool.name),
    keywordTokens: tokenize((tool.keywords ?? []).join(' ')),
    intents: (capability?.intents ?? []).map((text) => ({ text, tokens: tokenize(text) })),
    typeTokens: [...(capability?.inputTypes ?? [])],
    opTokens: [...(capability?.operations ?? [])],
  };
});

const FIELD_PRIORITY: Record<MatchField, number> = { name: 3, keyword: 2, intent: 1, type: 0 };

interface Scored {
  suggestion: IntentSuggestion;
  fieldPriority: number;
}

function bestMatch(
  queryToken: string,
  tokens: readonly string[],
): { kind: MatchKind; token: string } | null {
  let best: { kind: MatchKind; token: string } | null = null;
  const rank: Record<MatchKind, number> = { exact: 3, prefix: 2, stem: 1, fuzzy: 0 };
  for (const token of tokens) {
    const kind = matchToken(queryToken, token);
    if (kind && (!best || rank[kind] > rank[best.kind])) best = { kind, token };
    if (best?.kind === 'exact') break;
  }
  return best;
}

function scoreTool(
  entry: ToolTokens,
  queryTokens: readonly string[],
  phrase: string,
): Scored | null {
  let score = 0;
  let matchedTokens = 0;
  const fieldTotals: Record<MatchField, number> = { name: 0, keyword: 0, intent: 0, type: 0 };
  const reasons: string[] = [];
  let matchedBy: MatchField | null = null;
  let bestPriority = -1;

  for (const queryToken of queryTokens) {
    let tokenScore = 0;

    const checks: Array<[MatchField, string[], boolean]> = [
      ['name', entry.nameTokens, false],
      ['keyword', entry.keywordTokens, false],
      ['intent', entry.intents.flatMap((intent) => intent.tokens), false],
      ['type', entry.typeTokens, false],
      ['type', entry.opTokens, true],
    ];

    for (const [field, tokens, isOperation] of checks) {
      const hit = bestMatch(queryToken, tokens);
      if (!hit) continue;
      const weight = WEIGHTS[field][hit.kind];
      tokenScore += weight;
      fieldTotals[field] += weight;
      if (hit.kind === 'fuzzy' && field === 'name' && reasons.length === 0)
        reasons.push(`Close to “${entry.name}”`);
      if (isOperation && hit.kind !== 'fuzzy' && reasons.length === 0)
        reasons.push(`Can ${hit.token}`);
    }

    if (tokenScore > 0) {
      score += Math.min(tokenScore, 18);
      matchedTokens++;
    }
  }

  if (matchedTokens === 0) return null;

  // Phrase evidence: the whole query matching a name, an intent, or a keyword.
  const lowerName = entry.name.toLowerCase();
  if (phrase === lowerName) {
    score += 40;
    reasons.unshift('Matches the name');
  } else if (phrase.length >= 4 && lowerName.includes(phrase)) {
    score += 10;
  }

  const exactIntent = entry.intents.find((intent) => intent.text === phrase);
  const partialIntent =
    !exactIntent && phrase.length >= 4
      ? entry.intents.find((intent) => intent.text.includes(phrase))
      : undefined;
  if (exactIntent) {
    score += 18;
    reasons.unshift(`For “${exactIntent.text}”`);
  } else if (partialIntent) {
    score += 10;
    reasons.unshift(`For “${partialIntent.text}”`);
  }

  const keywordPhrase = entry.keywordTokens.find(
    (token) => phrase.length >= 4 && token.includes(phrase),
  );
  if (keywordPhrase && reasons.length === 0) {
    score += 8;
    reasons.push(`Mentions “${keywordPhrase}”`);
  }

  if (reasons.length === 0 && Math.max(fieldTotals.intent, fieldTotals.keyword) > 0) {
    const witness = entry.intents.find((intent) =>
      intent.tokens.some((token) =>
        queryTokens.some((queryToken) => matchToken(queryToken, token)),
      ),
    );
    if (fieldTotals.intent >= fieldTotals.keyword && witness) reasons.push(`For “${witness.text}”`);
    else {
      const token = entry.keywordTokens.find((keywordToken) =>
        queryTokens.some((queryToken) => matchToken(queryToken, keywordToken)),
      );
      if (token) reasons.push(`Mentions “${token}”`);
    }
  }

  for (const field of ['name', 'keyword', 'intent', 'type'] as const) {
    if (fieldTotals[field] > 0 && FIELD_PRIORITY[field] > bestPriority) {
      bestPriority = FIELD_PRIORITY[field];
      matchedBy = field;
    }
  }

  // Coverage: a tool matching every query token beats one matching half of it.
  const coverage = matchedTokens / queryTokens.length;
  score *= 0.6 + 0.4 * coverage;

  return {
    suggestion: {
      toolId: entry.toolId,
      score: Math.round(score * 100) / 100,
      reasons: reasons.slice(0, 2),
      matchedBy: matchedBy ?? 'type',
    },
    fieldPriority: bestPriority,
  };
}

export function lexicalResolve(query: string, options: ResolveOptions = {}): IntentResolution {
  const phrase = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const tokens = expandTokens(tokenize(query));
  if (!phrase || tokens.length === 0)
    return { query: phrase, suggestions: [], confident: false, resolvedBy: 'none' };

  const scored: Scored[] = [];
  for (const entry of INDEX) {
    const result = scoreTool(entry, tokens, phrase);
    if (result) scored.push(result);
  }

  scored.sort(
    (a, b) => b.suggestion.score - a.suggestion.score || b.fieldPriority - a.fieldPriority,
  );

  const limit = options.limit ?? 8;
  const suggestions = scored.slice(0, limit).map((entry) => entry.suggestion);

  const top = suggestions[0];
  const second = suggestions[1];
  // A lone match needs stronger evidence than a clear winner among several:
  // "merge pdfs" is confident, "git rebase interactive" (one weak keyword hit) is not.
  const confident =
    top != null &&
    top.score >= 9 &&
    (second != null ? top.score >= second.score * 1.35 : top.score >= 18);

  return {
    query: phrase,
    suggestions,
    confident,
    resolvedBy: top ? top.matchedBy : 'none',
  };
}

export const lexicalResolver = {
  id: 'lexical',
  resolve: lexicalResolve,
};
