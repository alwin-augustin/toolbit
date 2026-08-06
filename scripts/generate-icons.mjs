#!/usr/bin/env node
/**
 * Generates every icon in the project from one source of truth:
 * src/ds/assets/logo-mark.svg, the design-system brand mark.
 *
 *     node scripts/generate-icons.mjs
 *
 * Before this existed the repo carried three different marks plus a set of
 * PWA icons that were solid black squares with no artwork at all. Everything
 * below is derived, so there is now exactly one file to change.
 *
 * Outputs (all committed; a normal build never runs this):
 *   public/icon.svg                     rounded tile, the SVG favicon
 *   public/mask-icon.svg                monochrome glyph for Safari pinned tabs
 *   public/favicon{.ico,-16,-32}        classic favicons
 *   public/icon-64, pwa-{64,192,512}    PWA icons
 *   public/apple-touch-icon.png         full-bleed square, iOS applies its own mask
 *   public/maskable-icon-512x512.png    glyph inside the 80% safe zone
 *   src/assets/app-logo.svg             kept in step with public/icon.svg
 *
 * Rendering goes through headless Chromium; resizing and .ico packing need
 * Pillow (pip install pillow).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'src/ds/assets/logo-mark.svg');

function findChromium() {
    const shells = globSync(
        path.join(
            process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/nonexistent',
            'chromium_headless_shell-*/chrome-linux/headless_shell',
        ),
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

const source = readFileSync(SOURCE, 'utf8').trim();

/** The tile background and the glyph on top of it, pulled apart. */
const gradient = source.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
const tile = source.match(/<rect width="64" height="64"[^>]*><\/rect>/)?.[0];
const glyph = source
    .replace(/<svg[^>]*>|<\/svg>/g, '')
    .replace(gradient ?? '', '')
    .replace(tile ?? '', '')
    .trim();

if (!gradient || !tile || !glyph) {
    throw new Error(`Could not parse ${path.relative(root, SOURCE)} — expected a <defs>, a 64x64 tile, and a glyph.`);
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;

/** Rounded tile — the everyday app icon. */
const roundedSvg = source;

/** Square tile — iOS and Android apply their own mask, so ours must not clip. */
const squareSvg = svg(`${gradient}${tile.replace(' rx="14"', '')}${glyph}`);

/**
 * Maskable icon: Android may crop to a circle of 80% diameter, so the glyph
 * sits at 62% scale, centred, over a full-bleed background.
 */
const maskableSvg = svg(
    `${gradient}${tile.replace(' rx="14"', '')}<g transform="translate(12.16 12.16) scale(0.62)">${glyph}</g>`,
);

/** Safari pinned tab: one layer, solid black, transparent background. */
const maskIconSvg = svg(
    `\n  <!-- Safari recolours this with the \`color\` attribute on <link rel="mask-icon">. -->\n  ${glyph
        .replace(/stroke="#fff"/g, 'stroke="#000000"')
        .replace(/fill="#ffffff"/g, 'fill="#000000"')
        .replace(/fill="hsl\([^)]*\)"/g, 'fill="#000000"')}\n`,
);

const { binary, isShell } = findChromium();
const work = mkdtempSync(path.join(tmpdir(), 'toolbit-icons-'));

/** Renders an SVG string to a transparent PNG. `name` keeps the temp files distinct. */
function render(name, svgMarkup, size) {
    const page = path.join(work, `${name}.html`);
    const shot = path.join(work, `${name}-${size}.png`);
    writeFileSync(
        page,
        `<!doctype html><html><head><meta charset="utf-8"><style>
         *{margin:0;padding:0}
         html,body{width:${size}px;height:${size}px;background:transparent}
         svg{display:block;width:${size}px;height:${size}px}
         </style></head><body>${svgMarkup}</body></html>`,
    );

    execFileSync(
        binary,
        [
            ...(isShell ? [] : ['--headless=new']),
            '--no-sandbox',
            '--disable-gpu',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            '--default-background-color=00000000',
            `--window-size=${size},${size}`,
            `--screenshot=${shot}`,
            `file://${page}`,
        ],
        { stdio: 'pipe' },
    );

    return shot;
}

/** Resize a rendered master with Pillow, and pack .ico files. */
function emit(masterPath, targets) {
    execFileSync(
        'python3',
        [
            '-c',
            [
                'import sys',
                'from PIL import Image',
                'master = Image.open(sys.argv[1]).convert("RGBA")',
                'for spec in sys.argv[2:]:',
                '    out, size = spec.rsplit("=", 1)',
                '    if out.endswith(".ico"):',
                '        sizes = [(int(s), int(s)) for s in size.split(",")]',
                '        master.resize(max(sizes), Image.LANCZOS).save(out, sizes=sizes)',
                '    elif out.endswith(".icns"):',
                '        master.resize((int(size), int(size)), Image.LANCZOS).save(out)',
                '    else:',
                '        n = int(size)',
                '        master.resize((n, n), Image.LANCZOS).save(out, optimize=True)',
            ].join('\n'),
            masterPath,
            ...targets,
        ],
        { stdio: 'pipe' },
    );
}

try {
    // Vector outputs first: the OG-card generator and the static pages embed
    // public/icon.svg directly, so it has to be right before anything else runs.
    writeFileSync(path.join(root, 'public/icon.svg'), `${roundedSvg}\n`);
    writeFileSync(path.join(root, 'src/assets/app-logo.svg'), `${roundedSvg}\n`);
    writeFileSync(path.join(root, 'public/mask-icon.svg'), `${maskIconSvg}\n`);

    const rounded = render('rounded', roundedSvg, 1024);
    const square = render('square', squareSvg, 1024);
    const maskable = render('maskable', maskableSvg, 1024);

    const p = (rel) => path.join(root, rel);

    emit(rounded, [
        `${p('public/favicon-16x16.png')}=16`,
        `${p('public/favicon-32x32.png')}=32`,
        `${p('public/icon-64.png')}=64`,
        `${p('public/pwa-64x64.png')}=64`,
        `${p('public/pwa-192x192.png')}=192`,
        `${p('public/pwa-512x512.png')}=512`,
        `${p('public/favicon.ico')}=16,32,48`,
    ]);

    emit(square, [`${p('public/apple-touch-icon.png')}=180`]);
    emit(maskable, [`${p('public/maskable-icon-512x512.png')}=512`]);

    const written = [
        'public/icon.svg',
        'public/mask-icon.svg',
        'src/assets/app-logo.svg',
        'public/favicon.ico',
        'public/favicon-16x16.png',
        'public/favicon-32x32.png',
        'public/icon-64.png',
        'public/pwa-64x64.png',
        'public/pwa-192x192.png',
        'public/pwa-512x512.png',
        'public/apple-touch-icon.png',
        'public/maskable-icon-512x512.png',
    ];

    for (const rel of written) {
        console.log(`  ${rel.padEnd(36)} ${(statSync(p(rel)).size / 1024).toFixed(1).padStart(7)} kB`);
    }
    console.log(`Generated ${written.length} icons from ${path.relative(root, SOURCE)}`);
} finally {
    rmSync(work, { recursive: true, force: true });
}
