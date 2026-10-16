import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '@/platform/service-worker';

/**
 * Service-worker registration (PRIVACY.md §4.9, read-trigger row for
 * `src/platform/service-worker.ts`).
 *
 * The option asserted here is load-bearing. `public/_headers` declares
 * `/sw.js` as `max-age=0, must-revalidate`, but `toolbit.app`'s zone sets a
 * Browser Cache TTL of 14400 s, which Cloudflare applies to the cached asset's
 * browser-facing `Cache-Control` (verified 2026-10-16: production returns
 * `max-age=14400` for `/sw.js` while every security header from the `/*` block
 * is present). Without `updateViaCache: 'none'` the browser answers its own
 * update check from the HTTP cache, so a deployed worker — and any privacy or
 * security fix inside it — stays invisible for up to four hours.
 *
 * The other half of the contract is what registration must NOT do: it adds no
 * runtime caching (§4.9 keeps the precache to build assets), and a denied or
 * failed registration is silent so tools still run (P8).
 */

type Register = (url: string, options?: RegistrationOptions) => Promise<unknown>;

function stubBrowser(register: Register) {
  vi.stubGlobal('navigator', { serviceWorker: { register } });
  // The module registers immediately when the document is already loaded.
  Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('registerServiceWorker', () => {
  it('registers /sw.js with updateViaCache "none" in production', () => {
    vi.stubEnv('PROD', true);
    const register = vi.fn().mockResolvedValue(undefined);
    stubBrowser(register);

    registerServiceWorker();

    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith('/sw.js', { updateViaCache: 'none' });
  });

  it('never registers outside a production build', () => {
    const register = vi.fn().mockResolvedValue(undefined);
    stubBrowser(register);

    registerServiceWorker();

    expect(register).not.toHaveBeenCalled();
  });

  it('never registers in the packaged desktop build (VITE_DISABLE_PWA)', () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_DISABLE_PWA', 'true');
    const register = vi.fn().mockResolvedValue(undefined);
    stubBrowser(register);

    registerServiceWorker();

    expect(register).not.toHaveBeenCalled();
  });

  it('does nothing when the browser has no service worker support', () => {
    vi.stubEnv('PROD', true);
    vi.stubGlobal('navigator', {});

    expect(() => registerServiceWorker()).not.toThrow();
  });

  it('swallows a refused registration — a blocked worker never breaks a tool', async () => {
    vi.stubEnv('PROD', true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const register = vi.fn().mockRejectedValue(new Error('denied'));
    stubBrowser(register);

    expect(() => registerServiceWorker()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(register).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
