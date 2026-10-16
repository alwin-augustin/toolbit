/**
 * The embedding asset is a build artifact, and this is the keeper of its
 * honesty: vectors embed exactly the lines `capabilityCorpusHash()`
 * fingerprints, and a change to any tool name, description, intent or keyword
 * fails here until `npm run embeddings:generate` is re-run. CI never loads
 * the model; it only reads the committed asset.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { capabilityCorpusHash, capabilityCorpusLines } from '@/core/capability-graph';
import { TOOLS } from '@/content/tools.config';
import { cosineSimilarity, dequantizeVectors } from '@/core/intent/semantic';
import type { SemanticVectorAsset } from '@/core/intent/types';

const asset = JSON.parse(
  readFileSync('public/embeddings/tool-capabilities.v1.json', 'utf8'),
) as SemanticVectorAsset;

const norm = (row: Float32Array) => {
  let sum = 0;
  for (const value of row) sum += value * value;
  return Math.sqrt(sum);
};

describe('tool embedding asset', () => {
  it('was generated from the current capability corpus', () => {
    expect(asset.corpusHash, 'vectors are stale — run `npm run embeddings:generate`').toBe(
      capabilityCorpusHash(),
    );
  });

  it('covers every tool, line, and dimension of the corpus', () => {
    expect(asset.dim).toBe(384);
    expect(asset.vectorScale).toBe(127);
    expect(Object.keys(asset.vectors).sort()).toEqual(TOOLS.map((tool) => tool.id).sort());
    for (const tool of TOOLS) {
      const rows = asset.vectors[tool.id];
      expect(rows.length, `${tool.id} line count`).toBe(capabilityCorpusLines(tool.id).length);
      for (const row of rows) {
        expect(row.length, `${tool.id} vector width`).toBe(asset.dim);
        for (const value of row) {
          expect(Number.isInteger(value)).toBe(true);
          expect(Math.abs(value)).toBeLessThanOrEqual(asset.vectorScale);
        }
      }
    }
  });

  it('dequantizes to unit-length vectors', () => {
    for (const [toolId, rows] of dequantizeVectors(asset)) {
      for (const row of rows) {
        expect(norm(row), `${toolId} vector norm`).toBeGreaterThan(0.98);
        expect(norm(row), `${toolId} vector norm`).toBeLessThan(1.02);
        expect(cosineSimilarity(row, row)).toBeCloseTo(1, 3);
      }
    }
  });
});
