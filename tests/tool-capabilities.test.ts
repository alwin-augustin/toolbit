import { describe, expect, it } from 'vitest';
import {
  capabilityCorpusHash,
  capabilityCorpusLineKinds,
  capabilityCorpusLines,
  capabilityOf,
  capabilityReason,
  nextActionsFor,
  pasteSuggestionsFor,
  taskClusters,
  toolIdsByInputType,
  toolsForOperation,
  validateCapabilities,
} from '@/core/capability-graph';
import { validateToolRegistry } from '@/core/tool-registry';
import { CAPABILITIES } from '@/content/tool-capabilities';
import { TOOLS } from '@/content/tools.config';

describe('capability model', () => {
  it('covers every tool exactly once, with no orphans', () => {
    expect(validateCapabilities()).toEqual([]);
    expect(Object.keys(CAPABILITIES)).toHaveLength(TOOLS.length);
    for (const tool of TOOLS) expect(capabilityOf(tool.id), tool.id).toBeDefined();
  });

  it('is part of the registry health check', () => {
    expect(validateToolRegistry()).toEqual([]);
  });

  it('keeps intents and operations non-trivial', () => {
    for (const tool of TOOLS) {
      const capability = CAPABILITIES[tool.id];
      expect(capability.intents.length, tool.id).toBeGreaterThan(0);
      expect(capability.operations.length, tool.id).toBeGreaterThan(0);
      for (const intent of capability.intents) expect(intent.trim()).not.toBe('');
    }
  });
});

describe('capability graph', () => {
  it('indexes tools by input type in catalogue order', () => {
    const ids = toolIdsByInputType('json');
    expect(ids).toContain('json-formatter');
    expect(ids).toContain('json-validator');
    expect(ids).toContain('api-request-builder');
    const catalogueOrder = TOOLS.map((tool) => tool.id).filter((id) => ids.includes(id));
    expect([...ids]).toEqual(catalogueOrder);
  });

  it('indexes tools by operation', () => {
    expect(toolsForOperation('validate')).toContain('json-validator');
    expect(toolsForOperation('validate')).toContain('nginx-config-validator');
    expect(toolsForOperation('merge')).toEqual(['pdf-tools']);
  });

  it('returns handoffs in declared order, capped, never self-referencing', () => {
    expect(nextActionsFor('json-formatter')).toEqual(['json-validator', 'diff-tool']);
    expect(nextActionsFor('json-formatter', 1)).toEqual(['json-validator']);
    for (const tool of TOOLS) {
      const actions = nextActionsFor(tool.id, 2);
      expect(actions.length).toBeLessThanOrEqual(2);
      expect(actions).not.toContain(tool.id);
      for (const action of actions) expect(capabilityOf(action), action).toBeDefined();
    }
  });

  it('expands a paste into the anchor plus its handoff edges', () => {
    expect(pasteSuggestionsFor('json-formatter')).toEqual([
      'json-formatter',
      'json-validator',
      'diff-tool',
      'yaml-formatter',
    ]);
    // The anchor survives the cap even when the edges are longer.
    expect(pasteSuggestionsFor('jwt-decoder')).toEqual([
      'jwt-decoder',
      'timestamp-converter',
      'json-formatter',
    ]);
    expect(pasteSuggestionsFor('json-formatter', 2)).toEqual(['json-formatter', 'json-validator']);
    expect(pasteSuggestionsFor('not-a-tool')).toEqual([]);
    for (const tool of TOOLS) {
      const suggestions = pasteSuggestionsFor(tool.id);
      expect(suggestions.length).toBeLessThanOrEqual(4);
      expect(suggestions[0]).toBe(tool.id);
    }
  });

  it('gives every suggested tool a reason in its own words', () => {
    expect(capabilityReason('json-validator')).toBe('validate json against a schema');
    expect(capabilityReason('crontab-generator')).toBe('build a cron expression');
    expect(capabilityReason('not-a-tool')).toBeNull();
    for (const tool of TOOLS) expect(capabilityReason(tool.id), tool.id).toBeTruthy();
  });

  it('exposes task clusters with only known tools', () => {
    const clusters = taskClusters();
    expect(clusters.length).toBeGreaterThanOrEqual(4);
    for (const cluster of clusters) {
      expect(cluster.toolIds.length).toBeGreaterThan(0);
      for (const id of cluster.toolIds) expect(capabilityOf(id), id).toBeDefined();
    }
  });
});

describe('embedding corpus', () => {
  it('derives deterministic lines from name, description, intents, and keywords', () => {
    const lines = capabilityCorpusLines('json-formatter');
    expect(lines[0]).toBe('JSON Formatter: Format, minify, and validate JSON data');
    expect(lines).toContain('make json readable');
    expect(lines.at(-1)).toBe('pretty print');

    const tool = TOOLS.find((entry) => entry.id === 'lorem-ipsum-generator');
    expect(capabilityCorpusLines('lorem-ipsum-generator').at(-1)).toBe(tool?.keywords?.at(-1));
  });

  it('names each corpus line position', () => {
    const kinds = capabilityCorpusLineKinds('json-formatter');
    expect(kinds.length).toBe(capabilityCorpusLines('json-formatter').length);
    expect(kinds[0]).toBe('name');
    expect(kinds[kinds.length - 1]).toBe('keyword');
    expect(kinds.filter((kind) => kind === 'intent').length).toBe(6);
    expect(capabilityCorpusLineKinds('not-a-tool')).toEqual([]);
  });

  it('fingerprints the corpus deterministically', () => {
    const hash = capabilityCorpusHash();
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
    expect(capabilityCorpusHash()).toBe(hash);
  });

  it('returns no lines for an unknown tool', () => {
    expect(capabilityCorpusLines('not-a-tool')).toEqual([]);
  });
});
