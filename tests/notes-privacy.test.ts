import { describe, expect, it } from 'vitest';

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
