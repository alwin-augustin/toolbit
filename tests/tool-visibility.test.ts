import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALL_TOOLS, DESKTOP_HIDDEN_TOOL_IDS, TOOLS, toolsForTarget } from '@/content/tools.config';
import { capabilityCorpusHash } from '@/core/capability-graph';
import { localizeOrtWasmPaths, semanticModelSource } from '@/core/intent/semantic';

/**
 * Target visibility (web vs desktop) and its invariants.
 *
 * The packaged desktop app runs under a CSP with no remote origin, so the two
 * network tools are hidden from every desktop surface. What must NOT change
 * with the view: the capability corpus the vector asset was built against
 * (a shifted hash would silently disable semantic search) and validation
 * results. `vi.stubEnv` + `resetModules` re-imports the modules exactly as
 * `vite build --mode desktop` bakes them.
 */
describe('tool visibility per target', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps the full catalogue on the web target', () => {
    expect(toolsForTarget(ALL_TOOLS, 'web').map((tool) => tool.id)).toEqual(
      ALL_TOOLS.map((tool) => tool.id),
    );
    expect(TOOLS.length).toBe(ALL_TOOLS.length);
  });

  it('hides exactly the network tools on the desktop target, preserving order', () => {
    const desktop = toolsForTarget(ALL_TOOLS, 'desktop');
    expect(desktop.map((tool) => tool.id)).toEqual(
      ALL_TOOLS.map((tool) => tool.id).filter((id) => !DESKTOP_HIDDEN_TOOL_IDS.includes(id)),
    );
    for (const id of DESKTOP_HIDDEN_TOOL_IDS) {
      expect(
        ALL_TOOLS.some((tool) => tool.id === id),
        `${id} must exist in the catalogue`,
      ).toBe(true);
      expect(desktop.some((tool) => tool.id === id)).toBe(false);
    }
  });

  it('re-imports the catalogue and graph as the desktop build does', async () => {
    vi.stubEnv('VITE_TARGET', 'desktop');
    vi.resetModules();

    const [tools, graph] = await Promise.all([
      import('@/content/tools.config'),
      import('@/core/capability-graph'),
    ]);

    // The view shrinks…
    expect(tools.TOOLS.length).toBe(tools.ALL_TOOLS.length - DESKTOP_HIDDEN_TOOL_IDS.length);
    for (const id of DESKTOP_HIDDEN_TOOL_IDS) {
      expect(tools.TOOLS.some((tool) => tool.id === id)).toBe(false);
    }
    // …but the corpus, its hash (the vector asset was built against it) and
    // validation stay identical to the web target.
    expect(graph.capabilityCorpusHash()).toBe(capabilityCorpusHash());
    expect(graph.validateCapabilities()).toEqual([]);
    // Accessors and clusters stay pruned to what the target shows.
    expect(graph.pasteSuggestionsFor('api-request-builder')).toEqual([]);
    const clusterTools = graph.taskClusters().flatMap((cluster) => cluster.toolIds);
    expect(clusterTools.length).toBeGreaterThan(0);
    expect(clusterTools.some((id) => DESKTOP_HIDDEN_TOOL_IDS.includes(id))).toBe(false);
  });

  it('keeps hidden tools out of semantic results on the desktop target', async () => {
    vi.stubEnv('VITE_TARGET', 'desktop');
    vi.resetModules();

    const { blendSemantic } = await import('@/core/intent/blend');
    const blend = (hits: Array<[string, { toolId: string; score: number; lineIndex: number }]>) =>
      blendSemantic(
        { query: 'send an http request', suggestions: [], confident: false, resolvedBy: 'none' },
        new Map(hits),
        5,
      );

    // A hidden tool with the strongest cosine must not surface…
    const hiddenOnly = blend([
      ['api-request-builder', { toolId: 'api-request-builder', score: 0.95, lineIndex: 0 }],
    ]);
    expect(hiddenOnly.suggestions).toEqual([]);

    // …while a shown tool in the same query still does.
    const mixed = blend([
      ['api-request-builder', { toolId: 'api-request-builder', score: 0.95, lineIndex: 0 }],
      ['url-encoder', { toolId: 'url-encoder', score: 0.8, lineIndex: 0 }],
    ]);
    expect(mixed.suggestions.map((suggestion) => suggestion.toolId)).toEqual(['url-encoder']);
  });
});

describe('semantic model source', () => {
  it('loads from the bundle only in packaged desktop builds', () => {
    expect(semanticModelSource('web', false)).toBe('remote');
    expect(semanticModelSource('web', true)).toBe('remote');
    // `tauri dev` runs without the app CSP, so the download still works there.
    expect(semanticModelSource('desktop', true)).toBe('remote');
    expect(semanticModelSource('desktop', false)).toBe('local');
  });
});

describe('localized ONNX runtime paths', () => {
  it('re-points only the transformers CDN origin at the staged copy', () => {
    const paths = {
      mjs: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort-wasm-simd-threaded.asyncify.mjs',
      wasm: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort-wasm-simd-threaded.asyncify.wasm',
    };
    localizeOrtWasmPaths(paths);
    expect(paths).toEqual({
      mjs: '/ort/ort-wasm-simd-threaded.asyncify.mjs',
      wasm: '/ort/ort-wasm-simd-threaded.asyncify.wasm',
    });
  });

  it('handles URL instances the same way', () => {
    const paths: { wasm?: URL | string } = {
      wasm: new URL(
        'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0/dist/ort-wasm-simd-threaded.wasm',
      ),
    };
    localizeOrtWasmPaths(paths);
    expect(paths.wasm).toBe('/ort/ort-wasm-simd-threaded.wasm');
  });

  it('leaves non-CDN URLs and empty paths alone', () => {
    const paths = { wasm: 'https://example.com/ort-wasm-simd-threaded.wasm' };
    localizeOrtWasmPaths(paths);
    expect(paths).toEqual({ wasm: 'https://example.com/ort-wasm-simd-threaded.wasm' });
    const empty: { mjs?: URL | string } = {};
    localizeOrtWasmPaths(empty);
    expect(empty).toEqual({});
  });
});
