import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * A private tool stays out of analytics entirely. Payloads are already stripped
 * by `sanitizeProperties`; this pins the second half of the promise — that an
 * event *naming* a secret tool is not sent either, however it names it: as the
 * page route, as `tool_id`, or as either end of a discovery handoff.
 */
describe('private tools stay out of analytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('drops events that name a secret tool', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'synthetic-test-key');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://example.invalid');
    const sender = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', sender);
    const { track } = await import('@/core/telemetry');
    const { usePreferences } = await import('@/core/preferences');
    usePreferences.getState().update({ analytics: true });

    track('page_viewed', { route: 'notes' });
    track('tool_opened', { tool_id: 'notes' });
    track('discovery_suggestion_accepted', {
      tool_id: 'notes',
      discovery_source: 'palette',
      resolved_by: 'name',
    });
    // Handoffs carry the private tool on a different pair of properties.
    track('discovery_handoff', { from_tool_id: 'notes', to_tool_id: 'json-formatter' });
    track('discovery_handoff', { from_tool_id: 'json-formatter', to_tool_id: 'notes' });
    expect(sender).not.toHaveBeenCalled();

    // A normal tool is unaffected.
    track('page_viewed', { route: 'json-formatter' });
    expect(sender).toHaveBeenCalledTimes(1);
  });
});

/**
 * Notes must still be discoverable — a private tool is not a hidden one — but
 * it must not hand its private text onward: every `related` edge would carry the
 * note into a tool that records history or offers to share it.
 */
describe('Notes and the capability graph', () => {
  it('has a capability record, so discovery can find it', async () => {
    const { capabilityOf, capabilityReason } = await import('@/core/capability-graph');
    const capability = capabilityOf('notes');
    expect(capability).toBeDefined();
    expect(capability?.intents.length).toBeGreaterThan(0);
    expect(capability?.operations.length).toBeGreaterThan(0);
    expect(capabilityReason('notes')).toBeTruthy();
  });

  it('offers no Next Useful Action, so nothing carries the note out', async () => {
    const { nextActionsFor, pasteSuggestionsFor } = await import('@/core/capability-graph');
    expect(nextActionsFor('notes')).toEqual([]);
    // The paste expansion still anchors on Notes itself, just with no edges.
    expect(pasteSuggestionsFor('notes')).toEqual(['notes']);
  });
});
