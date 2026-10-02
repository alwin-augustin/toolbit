import { describe, it, expect, vi } from 'vitest';
import { base64Transform, formatJson, DEFINITIONS } from '@/lib/tool-contract';
import {
  exportRecipe,
  parseRecipe,
  recipeTemplates,
  runRecipe,
  saveRecipe,
  listRecipes,
} from '@/lib/recipes';
import { parseWorkspace, workspaceSnapshot } from '@/lib/workspace-schema';
import { useWorkspace } from '@/v2/workspace-store';
import { addHistoryEntry, getHistoryByToolId } from '@/lib/history-db';
import { sanitizeProperties, EVENT_NAMES, routeName } from '@/lib/telemetry';
const canary = 'CANARY_SECRET_4b7d';
describe('privacy and transformation contracts', () => {
  it('sanitizes every supported event and arbitrary error/log properties', () => {
    for (const name of EVENT_NAMES) {
      const raw = {
        event: name,
        input: canary,
        output: canary,
        url: `/json-formatter?token=${canary}`,
        headers: { Authorization: canary },
        workspace: canary,
        message: canary,
        tool_id: canary,
        error_code: canary,
        component: canary,
        release_id: canary,
        route: canary,
      };
      expect(JSON.stringify(sanitizeProperties(raw))).not.toContain(canary);
    }
    expect(routeName(`/json-formatter?token=${canary}#${canary}`)).toBe('json-formatter');
  });
  it.each([
    'password-generator',
    'totp-generator',
    'jwt-decoder',
    'certificate-decoder',
    'api-request-builder',
    'websocket-tester',
  ])('never writes %s history by default', async (toolId) => {
    await addHistoryEntry({ toolId, toolName: toolId, timestamp: Date.now(), input: canary });
    expect(await getHistoryByToolId(toolId)).toEqual([]);
  });
  it('warns on precision loss without mistaking strings for numbers', () => {
    expect(formatJson('{"n":9007199254740993}')).toMatchObject({
      ok: true,
      warning: expect.any(String),
    });
    expect(formatJson('{"n":"9007199254740993"}')).toMatchObject({ ok: true, warning: undefined });
  });
  it('preserves special JSON object keys while sorting', () => {
    const result = formatJson('{"z":1,"__proto__":{"safe":true}}', 2, true);
    expect(result.ok && Object.hasOwn(JSON.parse(result.value), '__proto__')).toBe(true);
  });
  it('accepts large JSON string tokens without a regex stack overflow', () => {
    const raw = JSON.stringify({ text: 'x'.repeat(1024 * 1024) });
    const result = formatJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.parse(result.value)).toEqual(JSON.parse(raw));
  });
  it('handles Unicode and rejects invalid UTF-8 Base64', () => {
    const result = base64Transform('Hello 🌍', 'encode', true);
    expect(result.ok && base64Transform(result.value, 'decode', true)).toEqual({
      ok: true,
      value: 'Hello 🌍',
    });
    expect(base64Transform('/w==', 'decode', false).ok).toBe(false);
  });
  it('honors transformation cancellation and input limits', async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await DEFINITIONS['json-formatter'].transform('{}', {}, controller.signal)).toEqual({
      ok: false,
      code: 'CANCELLED',
    });
    expect(DEFINITIONS['json-formatter'].parse('x'.repeat(11 * 1024 * 1024))).toEqual({
      ok: false,
      code: 'INPUT_TOO_LARGE',
    });
  });
});
describe('versioned documents and recipes', () => {
  it('opens repeated tools with independent state and excludes default payload persistence', () => {
    useWorkspace.setState({ tabs: [], activeTabId: null });
    const s = useWorkspace.getState();
    s.openTool('json-formatter', true);
    const a = useWorkspace.getState().activeTabId!;
    s.patchDocument(a, { payload: { input: canary }, options: { indent: 4 } });
    s.openTool('json-formatter', true);
    const b = useWorkspace.getState().activeTabId!;
    expect(a).not.toBe(b);
    s.patchDocument(b, { payload: { input: '{}' }, options: { indent: 2 } });
    const docs = useWorkspace.getState().tabs;
    expect(docs[0].payload?.input).toBe(canary);
    const snapshot = workspaceSnapshot('Test', docs, a, {
      density: 'comfortable',
      inspectorOpen: false,
    });
    expect(JSON.stringify(snapshot)).not.toContain(canary);
    const restored = parseWorkspace(
      JSON.stringify(
        workspaceSnapshot('Test', docs, a, { density: 'compact', inspectorOpen: true }, true),
      ),
    );
    expect(restored.documents[0].payload?.input).toBe(canary);
  });
  it('rejects malformed, future and oversized workspace imports', () => {
    expect(() => parseWorkspace('{bad')).toThrow('valid JSON');
    expect(() => parseWorkspace('{"schemaVersion":99}')).toThrow('unsupported');
    expect(() => parseWorkspace('x'.repeat(3 * 1024 * 1024))).toThrow('too large');
  });
  it('migrates legacy workspaces without removing repeated tools', () => {
    const result = parseWorkspace(
      JSON.stringify({
        name: 'Old',
        tools: [
          { toolId: 'json-formatter', state: '{"input":"a"}' },
          { toolId: 'json-formatter', state: '{"input":"b"}' },
        ],
      }),
    );
    expect(result.documents).toHaveLength(2);
    expect(result.documents[1].payload?.input).toBe('b');
  });
  it('runs, saves and round-trips a recipe with repeated Base64 steps', async () => {
    const recipe = recipeTemplates()[0];
    saveRecipe(recipe);
    const restored = parseRecipe(exportRecipe(listRecipes()[0]));
    expect(restored.steps.map((s) => s.toolId)).toEqual([
      'base64-encoder',
      'json-formatter',
      'base64-encoder',
    ]);
    const result = await runRecipe(restored, 'eyJvayI6dHJ1ZX0=');
    expect(result.result).toEqual({ ok: true, value: btoa('{\n  "ok": true\n}') });
    expect(exportRecipe(recipe)).not.toContain(canary);
  });
  it('executes the CSV and normalized-text hash fixtures', async () => {
    const templates = recipeTemplates();
    expect((await runRecipe(templates[1], 'name,age\nAda,37')).result).toEqual({
      ok: true,
      value: '[\n  {\n    "name": "Ada",\n    "age": "37"\n  }\n]',
    });
    expect((await runRecipe(templates[2], '  test  ')).result).toEqual({
      ok: true,
      value: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    });
  });
  it('identifies a failed step and stops before later work', async () => {
    const recipe = recipeTemplates()[0];
    const spy = vi.fn();
    const result = await runRecipe(recipe, 'invalid!', undefined, spy);
    expect(result.step).toBe(0);
    expect(result.result.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
