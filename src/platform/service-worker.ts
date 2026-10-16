/**
 * Register the final-site worker generated after SEO pages, once per page load.
 *
 * `updateViaCache: 'none'` is load-bearing, not a preference. `public/_headers`
 * declares `/sw.js` as `max-age=0, must-revalidate`, but the zone's Browser
 * Cache TTL (14400 s, verified on `toolbit.app` 2026-10-16) rewrites the
 * browser-facing `Cache-Control` of that cached asset to `max-age=14400`. The
 * browser would then answer its own update check from the HTTP cache, hiding a
 * freshly deployed worker — and any privacy or security fix inside it — for up
 * to four hours. `'none'` makes every update check fetch the script over the
 * network instead. It grants nothing else: the precache stays build assets
 * only, with no runtime routes (PRIVACY.md §4.9).
 */
export function registerServiceWorker() {
  if (
    !import.meta.env.PROD ||
    import.meta.env.VITE_DISABLE_PWA === 'true' ||
    !('serviceWorker' in navigator)
  )
    return;
  const register = () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      /* Offline/private contexts must not prevent tools from running. */
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
