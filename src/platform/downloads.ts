/**
 * Which desktop installer a visitor should be handed.
 *
 * The site has one version-free download address (`/download`) and four
 * stable-named builds behind it (`public/_redirects` → the `toolbit-downloads`
 * R2 bucket at `downloads.toolbit.app`). Cloudflare Pages matches paths, not
 * clients — `_redirects` has no user-agent condition — and this site ships no
 * Function on purpose (PRIVACY.md §4.9: static output, no runtime routes), so
 * the platform decision is made once, in the browser, on that page.
 *
 * The reason it exists at all: `/download` used to be a 302 to the about page,
 * so every link outside the app — this repo's README, the desktop docs, a URL
 * someone shared — landed on prose instead of a download.
 */

export type InstallerId = 'mac' | 'mac-intel' | 'windows' | 'linux';

export interface Installer {
  id: InstallerId;
  /** Version-free path `public/_redirects` resolves to the R2 object. */
  path: string;
  /** Shown on the page, and next to the build on the about page. */
  label: string;
}

export const MAC_INSTALLER: Installer = {
  id: 'mac',
  path: '/download/mac',
  label: 'macOS (Apple silicon)',
};
export const MAC_INTEL_INSTALLER: Installer = {
  id: 'mac-intel',
  path: '/download/mac-intel',
  label: 'macOS (Intel)',
};
export const WINDOWS_INSTALLER: Installer = {
  id: 'windows',
  path: '/download/windows',
  label: 'Windows',
};
export const LINUX_INSTALLER: Installer = {
  id: 'linux',
  path: '/download/linux',
  label: 'Linux',
};

/** Every build, in the order the page lists them. */
export const INSTALLERS: readonly Installer[] = [
  MAC_INSTALLER,
  MAC_INTEL_INSTALLER,
  WINDOWS_INSTALLER,
  LINUX_INSTALLER,
];

export interface PlatformHints {
  /**
   * `navigator.userAgentData.getHighEntropyValues(['architecture'])` — only
   * Chromium answers it, with `'arm'` or `'x86'`.
   */
  architecture?: string | undefined;
  /** `navigator.maxTouchPoints`: what tells an iPad from the Mac it claims to be. */
  touchPoints?: number | undefined;
}

/**
 * The build for this browser, or null when there is none to offer.
 *
 * Null is a real answer, not a failure: a phone or tablet has no build, and an
 * unknown agent is better off choosing for itself than getting a file its
 * machine cannot run. `download.html` lists all four builds either way.
 */
export function installerFor(userAgent: string, hints: PlatformHints = {}): Installer | null {
  // Most specific first. iOS reports "like Mac OS X", Android reports "Linux"
  // and ChromeOS reports "X11", so each would otherwise be handed a desktop
  // installer it cannot run. iPadOS 13+ asks for the desktop site outright.
  if (/iPhone|iPad|iPod/.test(userAgent)) return null;
  if (/Android/.test(userAgent)) return null;
  if (/Windows|Win32|Win64/.test(userAgent)) return WINDOWS_INSTALLER;
  if (/CrOS/.test(userAgent)) return LINUX_INSTALLER;
  if (/Linux|X11/.test(userAgent)) return LINUX_INSTALLER;
  if (/Mac OS X|Macintosh|Mac_PowerPC/.test(userAgent)) {
    // iPadOS reports "Macintosh" with touch enabled; a Mac reports no touch
    // points, so this cannot hide one.
    if ((hints.touchPoints ?? 0) > 1) return null;
    // Only Chromium reveals the CPU. Safari and Firefox say nothing, and every
    // Mac Apple has sold since 2020 is Apple silicon, so that is the default
    // and the Intel build stays one click away on the page.
    return hints.architecture === 'x86' ? MAC_INTEL_INSTALLER : MAC_INSTALLER;
  }
  return null;
}
