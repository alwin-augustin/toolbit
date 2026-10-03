/** Register the final-site worker generated after SEO pages, once per page load. */
export function registerServiceWorker() {
  if (
    !import.meta.env.PROD ||
    import.meta.env.VITE_DISABLE_PWA === 'true' ||
    !('serviceWorker' in navigator)
  )
    return;
  const register = () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Offline/private contexts must not prevent tools from running. */
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
