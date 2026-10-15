import { beforeEach, describe, expect, it, vi } from 'vitest';
import { capabilityCorpusHash } from '@/core/capability-graph';
import { TOOLS } from '@/content/tools.config';
import {
  cosineSimilarity,
  dequantizeVectors,
  resetSemanticState,
  semanticHitsFor,
  semanticHitsFromVector,
  semanticStatus,
  startSemantic,
  stopSemantic,
} from '@/core/intent/semantic';
import type { SemanticVectorAsset } from '@/core/intent/types';

/**
 * The model itself is mocked — loading real weights belongs to
 * `npm run eval:intent`. These tests hold the wiring: lazy load, statuses,
 * staleness refusal, and the fire-and-forget query path.
 */
const pipelineCalls = vi.hoisted(() => ({ count: 0 }));
const failingQueries = vi.hoisted(() => ({ text: '' }));
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(async () => {
    pipelineCalls.count++;
    return async (text: string) => {
      if (text === failingQueries.text) throw new Error('inference failed');
      return { tolist: () => [[1, 0, 0]] };
    };
  }),
}));

const asset = (overrides: Partial<SemanticVectorAsset> = {}): SemanticVectorAsset => ({
  model: 'mock-model',
  dtype: 'q8',
  dim: 3,
  vectorScale: 127,
  corpusHash: capabilityCorpusHash(),
  vectors: Object.fromEntries(TOOLS.map((tool) => [tool.id, [[127, 0, 0]]])),
  ...overrides,
});

let respond: (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
const fetchMock = vi.fn((url: string) => respond(url));

beforeEach(() => {
  resetSemanticState();
  pipelineCalls.count = 0;
  failingQueries.text = '';
  fetchMock.mockClear();
  respond = async () => ({ ok: true, json: async () => asset() });
  vi.stubGlobal('fetch', fetchMock);
});

describe('vector math', () => {
  it('dequantizes stored integers with the asset scale', () => {
    const vectors = dequantizeVectors({
      ...asset(),
      vectorScale: 100,
      vectors: { sample: [[100, -50, 0]] },
    });
    expect([...(vectors.get('sample')?.[0] ?? [])]).toEqual([1, -0.5, 0]);
  });

  it('measures cosine similarity and keeps the best line per tool', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 6);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);

    const hits = semanticHitsFromVector(
      [1, 0],
      new Map([
        ['a', [Float32Array.from([0, 1]), Float32Array.from([1, 0])]],
        ['b', [Float32Array.from([-1, 0])]],
      ]),
    );
    expect(hits.get('a')).toMatchObject({ toolId: 'a', lineIndex: 1 });
    expect(hits.get('a')?.score).toBeCloseTo(1, 6);
    expect(hits.get('b')?.score).toBeCloseTo(-1, 6);
  });
});

describe('semantic runtime', () => {
  it('is off until asked and answers nothing while off', async () => {
    expect(semanticStatus()).toBe('off');
    expect(await semanticHitsFor('make json readable')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads vectors and the model once, then answers queries', async () => {
    startSemantic();
    await vi.waitFor(() => expect(semanticStatus()).toBe('ready'));

    const hits = await semanticHitsFor('make json readable');
    expect(hits?.size).toBe(TOOLS.length);
    expect(hits?.get('json-formatter')).toMatchObject({ score: 1, lineIndex: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Disabling and re-enabling reuses the loaded weights.
    stopSemantic();
    expect(semanticStatus()).toBe('off');
    startSemantic();
    await vi.waitFor(() => expect(semanticStatus()).toBe('ready'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(pipelineCalls.count).toBe(1);
  });

  it('refuses stale vectors instead of mis-ranking', async () => {
    respond = async () => ({ ok: true, json: async () => asset({ corpusHash: 'deadbeef' }) });
    startSemantic();
    await vi.waitFor(() => expect(semanticStatus()).toBe('failed'));
    expect(await semanticHitsFor('make json readable')).toBeNull();
  });

  it('degrades to lexical when inference fails', async () => {
    startSemantic();
    await vi.waitFor(() => expect(semanticStatus()).toBe('ready'));

    failingQueries.text = 'explode';
    expect(await semanticHitsFor('explode')).toBeNull();
    // The queue recovers; the next query answers normally.
    expect((await semanticHitsFor('recover'))?.size).toBe(TOOLS.length);
  });
});
