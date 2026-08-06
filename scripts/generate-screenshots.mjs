#!/usr/bin/env node
/**
 * Captures real screenshots of the running app into public/screenshots/.
 *
 * These serve two purposes: the PWA manifest's `screenshots` array, which is
 * what turns a bare install prompt into a rich one, and the images the README
 * links to. Both were previously referenced but not produced by anything.
 *
 *     npm run web:build
 *     node scripts/generate-screenshots.mjs
 *
 * The script serves ./dist itself, so the build must exist first. Output is
 * committed; a normal build never runs this.
 */

import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, copyFileSync, rmSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

// The static server below runs in this process, so the browser must be
// launched asynchronously — execFileSync would block the event loop and the
// page's own requests would never be answered.
const run = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'public/screenshots');
const PORT = 4199;

if (!existsSync(path.join(dist, 'index.html'))) {
    console.error('dist/index.html not found — run `npm run web:build` first.');
    process.exit(1);
}

function findChromium() {
    const shells = globSync(
        path.join(process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/nonexistent', 'chromium_headless_shell-*/chrome-linux/headless_shell'),
    );
    if (shells.length) return { binary: shells[0], isShell: true };

    const browsers = [
        process.env.CHROME_PATH,
        ...globSync(path.join(process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/nonexistent', 'chromium-*/chrome-linux/chrome')),
        '/usr/bin/chromium',
        '/usr/bin/google-chrome',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter((candidate) => candidate && existsSync(candidate));

    if (!browsers.length) throw new Error('No Chromium binary found. Set CHROME_PATH and re-run.');
    return { binary: browsers[0], isShell: false };
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml',
};

/** Static file server with SPA fallback, so an unknown path still boots the app. */
const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const candidates = [
        path.join(dist, url),
        path.join(dist, url, 'index.html'),
        path.join(dist, `${url}.html`),
        path.join(dist, 'index.html'),
    ];

    for (const candidate of candidates) {
        if (!candidate.startsWith(dist)) continue;
        if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;
        res.writeHead(200, { 'Content-Type': MIME[path.extname(candidate)] ?? 'application/octet-stream' });
        res.end(readFileSync(candidate));
        return;
    }

    res.writeHead(404).end('not found');
});

const shots = [
    { name: 'app-home', url: '/', width: 1440, height: 900 },
    { name: 'tool-view', url: '/json-formatter', width: 1440, height: 900 },
    { name: 'jwt-decoder', url: '/jwt-decoder', width: 1440, height: 900 },
    { name: 'mobile-home', url: '/', width: 430, height: 860 },
];

const { binary, isShell } = findChromium();
const work = mkdtempSync(path.join(tmpdir(), 'toolbit-shots-'));

await new Promise((resolve) => server.listen(PORT, resolve));

try {
    mkdirSync(outDir, { recursive: true });

    for (const shot of shots) {
        const file = path.join(work, `${shot.name}.png`);
        const profile = mkdtempSync(path.join(work, 'profile-'));

        // A fresh profile per shot so one run's localStorage (theme, history)
        // never leaks into the next.
        await run(
            binary,
            [
                ...(isShell ? [] : ['--headless=new']),
                '--no-sandbox',
                '--disable-gpu',
                '--hide-scrollbars',
                '--force-device-scale-factor=1',
                `--user-data-dir=${profile}`,
                `--window-size=${shot.width},${shot.height}`,
                '--virtual-time-budget=8000',
                `--screenshot=${file}`,
                `http://localhost:${PORT}${shot.url}`,
            ],
            { timeout: 60_000 },
        );

        const target = path.join(outDir, `${shot.name}.png`);
        copyFileSync(file, target);

        try {
            execFileSync(
                'python3',
                [
                    '-c',
                    [
                        'import sys',
                        'from PIL import Image',
                        'p = sys.argv[1]',
                        'im = Image.open(p).convert("RGB")',
                        'im.quantize(colors=192, dither=Image.Dither.FLOYDSTEINBERG).save(p, optimize=True)',
                    ].join('\n'),
                    target,
                ],
                { stdio: 'pipe' },
            );
        } catch {
            // Pillow is optional; a full-colour screenshot is still correct.
        }

        console.log(`  ${shot.name}.png  ${shot.width}x${shot.height}  ${(statSync(target).size / 1024).toFixed(0)} kB`);
    }

    console.log(`Wrote ${shots.length} screenshots to ${path.relative(root, outDir)}/`);
} finally {
    server.close();
    rmSync(work, { recursive: true, force: true });
}
