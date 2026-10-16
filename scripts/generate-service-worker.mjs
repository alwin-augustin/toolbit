import { generateSW } from 'workbox-build';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const dist = path.resolve('dist');
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(path.join(dir, entry.name))
      : [path.relative(dist, path.join(dir, entry.name)).replaceAll('\\', '/')],
  );
}
const pages = walk(dist).filter((file) => file.endsWith('/index.html'));

/**
 * Paths that must reach the network instead of the precached app shell.
 *
 * Two kinds live here. Every source in `public/_redirects` — the installer 302s
 * and the legacy `/app` + `/tools` 301s: a navigation to one of those has to be
 * answered by the edge, and the fallback below would otherwise serve the app
 * shell instead, so Cloudflare never sees the request and the visitor gets the
 * in-app 404. That is how the installer links quietly broke once. And
 * `/download` itself, which is not a redirect but the download page: the
 * manifest holds it as `/download.html`, so the precache never answers a bare
 * `/download`, and without this entry the fallback would serve the app shell
 * there too.
 *
 * Keep the list in step with `public/_redirects` — the check below fails the
 * build if a redirect source is not covered.
 */
const networkPaths = ['/download', '/app', '/tools'];

for (const line of readFileSync(path.resolve('public/_redirects'), 'utf8').split('\n')) {
  const source = line.trim().split(/\s+/)[0];
  if (!source || source.startsWith('#') || !source.startsWith('/')) continue;
  const root = `/${source.split('/')[1]}`;
  if (!networkPaths.includes(root))
    throw new Error(
      `public/_redirects answers ${source}, but the service worker would swallow it: add ${root} to networkPaths.`,
    );
}
const { count, warnings } = await generateSW({
  globDirectory: dist,
  swDest: path.join(dist, 'sw.js'),
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
  globIgnores: [
    'sw.js',
    'workbox-*.js',
    'og/**',
    'og-image.png',
    'screenshots/**',
    'structured-data.json',
    // Opt-in semantic search asset (~0.7 MB): fetched on demand by the users
    // who enable it, never precached for everyone.
    'embeddings/**',
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  additionalManifestEntries: pages.flatMap((file) => [
    {
      url: `/${file.slice(0, -'/index.html'.length)}`,
      revision: createHash('sha256')
        .update(readFileSync(path.join(dist, file)))
        .digest('hex'),
    },
  ]),
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: false,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [
    /^\/(?:assets|og|screenshots)\//,
    new RegExp(`^(?:${networkPaths.join('|')})(?:/|$)`),
  ],
});
for (const warning of warnings) console.warn(warning);
console.log(`PWA: precached final site (${count} entries), including generated deep links.`);
