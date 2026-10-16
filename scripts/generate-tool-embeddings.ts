/**
 * Precompute the tool embeddings the semantic reranker reads.
 *
 * The corpus is exactly the lines `capabilityCorpusHash()` fingerprints —
 * change a tool's name, description, intents or keywords and regenerate, or
 * `tests/embeddings.test.ts` fails. The runtime
 * (`src/core/intent/semantic.ts`) uses the same model and dtype, so questions
 * and catalogue lines land in one vector space.
 *
 * Usage: npm run embeddings:generate
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';
import { TOOLS } from '@/content/tools.config';
import { capabilityCorpusHash, capabilityCorpusLines } from '@/core/capability-graph';

const MODEL = 'mixedbread-ai/mxbai-embed-xsmall-v1';
const DTYPE = 'q8';
/**
 * Corpus vectors are unit-length, so the runtime asset stores them as int8:
 * each component is `round(value * 127)`, keeping the asset ~300 KB instead
 * of ~850 KB with no measurable ranking loss. `semantic.ts` dequantizes with
 * the same constant.
 */
const VECTOR_SCALE = 127;
const OUTPUT = fileURLToPath(
  new URL('../public/embeddings/tool-capabilities.v1.json', import.meta.url),
);

const quantize = (value: number) => Math.max(-127, Math.min(127, Math.round(value * VECTOR_SCALE)));

/** `any` from the pipeline's dynamic Tensor; read fields structurally. */
interface TensorLike {
  dims: number[];
  tolist(): number[][];
}

async function main() {
  console.log(`Embedding ${TOOLS.length} tools with ${MODEL} (${DTYPE})…`);
  const extractor = await pipeline('feature-extraction', MODEL, { dtype: DTYPE });

  const vectors: Record<string, number[][]> = {};
  let dim = 0;
  let done = 0;
  for (const tool of TOOLS) {
    const lines = capabilityCorpusLines(tool.id);
    const output = (await extractor([...lines], {
      pooling: 'mean',
      normalize: true,
    })) as unknown as TensorLike;
    dim = output.dims[1] ?? dim;
    vectors[tool.id] = output.tolist().map((row) => row.map(quantize));
    process.stdout.write(`\r${++done}/${TOOLS.length} tools embedded`);
  }
  process.stdout.write('\n');

  const asset = {
    model: MODEL,
    dtype: DTYPE,
    dim,
    vectorScale: VECTOR_SCALE,
    corpusHash: capabilityCorpusHash(),
    vectors,
  };
  await mkdir(fileURLToPath(new URL('../public/embeddings/', import.meta.url)), {
    recursive: true,
  });
  await writeFile(OUTPUT, `${JSON.stringify(asset)}\n`);
  console.log(`Wrote ${OUTPUT} (dim ${dim}, corpus ${asset.corpusHash})`);
}

await main();
