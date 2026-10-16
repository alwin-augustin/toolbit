/**
 * The script `download.html` ships, and the whole of its behaviour: send the
 * visitor to the build their machine can run.
 *
 * The page is complete without it — all four builds are on it as links — so a
 * browser that refuses the client hint, or runs no scripts at all, still has a
 * way to download.
 */
import { installerFor, type PlatformHints } from '@/platform/downloads';

type UserAgentData = {
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>;
};

async function platformHints(): Promise<PlatformHints> {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  try {
    const highEntropy = await data?.getHighEntropyValues?.(['architecture']);
    return { architecture: highEntropy?.architecture, touchPoints: navigator.maxTouchPoints };
  } catch {
    // A refused hint is not an error: the user agent alone still decides.
    return { touchPoints: navigator.maxTouchPoints };
  }
}

void platformHints().then((hints) => {
  const installer = installerFor(navigator.userAgent, hints);
  // `replace`, not `assign`. The response is a file, so the page stays and the
  // download starts; if a build ever answered with a document instead, the back
  // button must not land here and start a second download.
  if (installer) window.location.replace(installer.path);
});
