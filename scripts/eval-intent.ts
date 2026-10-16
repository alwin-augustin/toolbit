/**
 * Eval v2 — the semantic pass over the golden query set.
 *
 * Loads the real embedding model and the committed vectors, reranks every
 * golden query through `resolveIntent`, and reports hit@3, off-catalogue
 * false confidences, and top-spot misses. Needs the model (~25 MB, cached
 * after the first run) and network; CI therefore runs only the lexical gate,
 * `tests/intent-eval.test.ts`.
 *
 * Usage: npm run eval:intent
 */
import { readFileSync } from 'node:fs';
import { pipeline } from '@huggingface/transformers';
import { CASES, OFF_CATALOGUE, TOP_SPOT_CASES } from '../tests/intent-golden-cases';
import { resolveIntent } from '@/core/intent/resolver';
import {
  dequantizeVectors,
  semanticHitsFromVector,
  SEMANTIC_DTYPE,
  SEMANTIC_MODEL,
} from '@/core/intent/semantic';
import type { SemanticVectorAsset } from '@/core/intent/types';

const asset = JSON.parse(
  readFileSync('public/embeddings/tool-capabilities.v1.json', 'utf8'),
) as SemanticVectorAsset;
const vectors = dequantizeVectors(asset);

console.log(`Loading ${SEMANTIC_MODEL} (${SEMANTIC_DTYPE})…`);
const extractor = await pipeline('feature-extraction', SEMANTIC_MODEL, {
  dtype: SEMANTIC_DTYPE,
});

async function resolve(query: string, limit = 3) {
  const output = (await extractor(query, { pooling: 'mean', normalize: true })) as unknown as {
    tolist(): number[][];
  };
  const hits = semanticHitsFromVector(output.tolist()[0] ?? [], vectors);
  return resolveIntent(query, { limit, semantic: hits });
}

let failures = 0;
const report = (label: string, problems: string[]) => {
  console.log(`${label}: ${problems.length === 0 ? 'ok' : 'FAIL'}`);
  for (const problem of problems) console.log(`  ${problem}`);
  if (problems.length > 0) failures++;
};

const misses: string[] = [];
const topSpotInfo: string[] = [];
for (const testCase of CASES) {
  const expected = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect];
  const semantic = await resolve(testCase.query);
  const top3 = semantic.suggestions.map((s) => s.toolId);
  if (!expected.some((id) => top3.includes(id)))
    misses.push(`“${testCase.query}” → ${top3.join(', ') || '(no results)'}`);
  const first = semantic.suggestions[0]?.toolId;
  if (first == null || !expected.includes(first))
    topSpotInfo.push(`“${testCase.query}” → ${first ?? '(no results)'}`);
}
report(`hit@3 (${CASES.length} queries)`, misses);
console.log(
  `top spot (info): ${CASES.length - topSpotInfo.length}/${CASES.length}` +
    (topSpotInfo.length > 0 ? `\n  ${topSpotInfo.join('\n  ')}` : ''),
);

const confident: string[] = [];
for (const query of OFF_CATALOGUE) {
  const resolution = await resolve(query);
  if (resolution.confident) confident.push(`“${query}” → ${resolution.suggestions[0]?.toolId}`);
}
report(`off-catalogue confidence (${OFF_CATALOGUE.length} queries)`, confident);

const wrongTop: string[] = [];
for (const testCase of TOP_SPOT_CASES) {
  const expected = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect];
  const first = (await resolve(testCase.query, 1)).suggestions[0]?.toolId;
  if (first == null || !expected.includes(first)) wrongTop.push(`“${testCase.query}” → ${first}`);
}
report(`top spot on hard paraphrases (${TOP_SPOT_CASES.length} queries)`, wrongTop);

process.exit(failures > 0 ? 1 : 0);
