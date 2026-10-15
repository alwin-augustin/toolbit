import { describe, it, expect, vi } from 'vitest';
describe('live analytics boundary', () => {
  it('sanitizes every event, rejects unknown events, honors opt-out and rotates identity', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'synthetic-test-key');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://example.invalid');
    const sender = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', sender);
    const { track, EVENT_NAMES, posthog } = await import('@/core/telemetry');
    const { usePreferences } = await import('@/core/preferences');
    // Analytics is opt-in, so this test states its premise rather than relying on
    // a default: consent on means everything below has to be sanitized.
    usePreferences.getState().update({ analytics: true });
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

  it('honours a browser privacy signal without rewriting the stored preference', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'synthetic-test-key');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://example.invalid');
    const sender = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', sender);
    const { track, privacySignalRefused } = await import('@/core/telemetry');
    const { usePreferences } = await import('@/core/preferences');
    usePreferences.getState().update({ analytics: true });

    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' });
    expect(privacySignalRefused()).toBe(true);
    track('tool_opened', { tool_id: 'json-formatter' });
    expect(sender).not.toHaveBeenCalled();
    expect(usePreferences.getState().analytics).toBe(true);

    // Global Privacy Control is the same refusal.
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: null });
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      value: true,
    });
    track('tool_opened', { tool_id: 'json-formatter' });
    expect(sender).not.toHaveBeenCalled();

    // With no signal raised, the event goes out again.
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      value: false,
    });
    track('tool_opened', { tool_id: 'json-formatter' });
    expect(sender).toHaveBeenCalledTimes(1);

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
