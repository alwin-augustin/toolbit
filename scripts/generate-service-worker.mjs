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
  navigateFallbackDenylist: [/^\/(?:assets|og|screenshots)\//],
});
for (const warning of warnings) console.warn(warning);
console.log(`PWA: precached final site (${count} entries), including generated deep links.`);
