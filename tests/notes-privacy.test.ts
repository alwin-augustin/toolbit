import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * A private tool stays out of analytics entirely. Payloads are already stripped
 * by `sanitizeProperties`; this pins the second half of the promise — that the
 * *presence* event (a page view or a tool-open) for a secret tool is not sent
 * either, by tool_id or by route.
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
    expect(sender).not.toHaveBeenCalled();

    // A normal tool is unaffected.
    track('page_viewed', { route: 'json-formatter' });
    expect(sender).toHaveBeenCalledTimes(1);
  });
});
