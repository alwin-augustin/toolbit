import { describe, it, expect, vi } from 'vitest';
describe('live analytics boundary', () => {
  it('sanitizes every event, rejects unknown events, honors opt-out and rotates identity', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'synthetic-test-key');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://example.invalid');
    const sender = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', sender);
    const { track, EVENT_NAMES, posthog } = await import('@/lib/telemetry');
    const { usePreferences } = await import('@/lib/preferences');
    const secret = 'CANARY_DO_NOT_TRANSMIT';
    for (const event of EVENT_NAMES)
      posthog.capture(event, {
        input: secret,
        output: secret,
        message: secret,
        headers: { authorization: secret },
        path: `/json-formatter?token=${secret}`,
        tool_id: 'json-formatter',
      });
    expect(sender).toHaveBeenCalledTimes(EVENT_NAMES.length);
    for (const call of sender.mock.calls) {
      expect(call[1].body).not.toContain(secret);
      expect(JSON.parse(call[1].body).properties.$process_person_profile).toBe(false);
      expect(call[1].credentials).toBe('omit');
      expect(call[1].referrerPolicy).toBe('no-referrer');
    }
    sender.mockClear();
    posthog.capture('$autocapture', {});
    expect(sender).not.toHaveBeenCalled();
    const old = localStorage.getItem('toolbit:analytics-anonymous-id');
    usePreferences.getState().update({ analytics: false });
    track('tool_opened', { tool_id: 'json-formatter' });
    expect(sender).not.toHaveBeenCalled();
    expect(localStorage.getItem('toolbit:analytics-anonymous-id')).toBeNull();
    usePreferences.getState().update({ analytics: true });
    expect(localStorage.getItem('toolbit:analytics-anonymous-id')).not.toBe(old);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
