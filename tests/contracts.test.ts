import { describe, it, expect } from 'vitest';
import { base64Transform, formatJson, DEFINITIONS } from '@/core/tool-contract';
import { parseWorkspace, workspaceSnapshot } from '@/core/workspace-schema';
import { useWorkspace } from '@/shared/workspace-store';
import { addHistoryEntry, getHistoryByToolId } from '@/core/history-db';
import { sanitizeProperties, EVENT_NAMES, routeName } from '@/core/telemetry';
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
});
