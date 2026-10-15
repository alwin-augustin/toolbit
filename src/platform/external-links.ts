import { isDesktopHost } from '@/platform/desktop';

/**
 * True when following `href` would leave the app: an absolute http(s) address on
 * another origin. Fragments, relative paths, `mailto:` and `tel:` all stay in
 * the app's own hands.
 */
export function isExternalUrl(href: string, base: string): boolean {
  try {
    const target = new URL(href, base);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
    return target.origin !== new URL(base).origin;
  } catch {
    return false;
  }
}

/**
 * Keep the installed app on its own page.
 *
 * In a browser an external link is unremarkable — the chrome has a back button
 * and an address bar. The installed app has neither: the webview *is* the
 * window, so a link inside rendered content (a Markdown preview, a decoded
 * certificate, a copied snippet) would replace the workspace with a remote page
 * the user cannot navigate back from. The link is copied instead, which keeps
 * the destination reachable without handing the window over.
 *
 * The listener is installed in the capture phase and cancels the event, so it
 * also covers modifier-clicks, middle-clicks and `target="_blank"` anchors.
 */
export function installExternalLinkGuard(notify: (message: string) => void): () => void {
  if (!isDesktopHost() || typeof document === 'undefined') return () => {};

  const onActivate = (event: Event) => {
    const target = event.target as Element | null;
    const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor) return;
    if (!isExternalUrl(anchor.getAttribute('href') ?? '', window.location.href)) return;
    event.preventDefault();
    event.stopPropagation();
    const destination = anchor.href;
    void navigator.clipboard?.writeText?.(destination).then(
      () => notify('Link copied — open it in your browser'),
      () => notify(`Open this link in your browser: ${destination}`),
    );
  };

  document.addEventListener('click', onActivate, true);
  document.addEventListener('auxclick', onActivate, true);
  return () => {
    document.removeEventListener('click', onActivate, true);
    document.removeEventListener('auxclick', onActivate, true);
  };
}
