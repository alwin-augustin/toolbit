#!/usr/bin/env node
/**
 * Renders the Open Graph cards into public/.
 *
 * Social platforms want a wide 1200x630 card, not the square app icon. This
 * builds the site card (public/og-image.png) plus one card per tool,
 * comparison, guide, and blog page (public/og/<slug>.png), from the brand
 * tokens, and screenshots them with headless Chromium.
 *
 *     node scripts/generate-og-image.mjs            # everything
 *     node scripts/generate-og-image.mjs --site     # just the site card
 *
 * The PNGs are committed, so a normal build never runs this. Re-run it when
 * the branding changes or a page is added.
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

import {
  TOOL_PAGES,
  COMPARISON_PAGES,
  GUIDE_PAGES,
  BLOG_POSTS,
} from '../src/content/seo/seo-content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteOnly = process.argv.includes('--site');

/**
 * Prefers chrome-headless-shell: full Chrome's new headless mode only paints
 * the visible viewport into a screenshot, which silently clips the bottom of a
 * fixed-size card. The shell captures the whole document at exactly the size
 * we asked for.
 */
function findChromium() {
  const shells = [];
  const browsers = [];

  if (process.env.CHROME_PATH) browsers.unshift(process.env.CHROME_PATH);
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    const pw = process.env.PLAYWRIGHT_BROWSERS_PATH;
    shells.push(
      ...globSync(path.join(pw, 'chromium_headless_shell-*/chrome-linux/headless_shell')),
    );
    browsers.push(
      ...globSync(path.join(pw, 'chromium-*/chrome-linux/chrome')),
      ...globSync(path.join(pw, 'chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium')),
    );
  }
  shells.push('/usr/bin/chrome-headless-shell');
  browsers.push(
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );

  const shell = shells.find((candidate) => existsSync(candidate));
  if (shell) return { binary: shell, isShell: true };

  const browser = browsers.find((candidate) => candidate && existsSync(candidate));
  if (browser) return { binary: browser, isShell: false };

  throw new Error(
    'Could not find a Chromium binary. Set CHROME_PATH to a Chrome, Chromium, or chrome-headless-shell executable and re-run.',
  );
}

const fontData = readFileSync(
  path.join(root, 'src/shared/ds/assets/fonts/Geist[wght].woff2'),
).toString('base64');
const monoData = readFileSync(
  path.join(root, 'src/shared/ds/assets/fonts/JetBrainsMono[wght].woff2'),
).toString('base64');
const logo = readFileSync(path.join(root, 'public/icon.svg')).toString('base64');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const CARD_CSS = `
  @font-face {
    font-family: 'Geist';
    src: url(data:font/woff2;base64,${fontData}) format('woff2');
    font-weight: 100 900;
  }
  @font-face {
    font-family: 'JetBrains Mono';
    src: url(data:font/woff2;base64,${monoData}) format('woff2');
    font-weight: 100 900;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    font-family: 'Geist', system-ui, sans-serif;
    background: hsl(230 7% 10%);
    background-image:
      radial-gradient(900px 520px at 88% -12%, hsl(226 76% 63% / 0.30), transparent 62%),
      radial-gradient(700px 420px at -6% 108%, hsl(187 75% 60% / 0.13), transparent 60%);
    color: hsl(0 0% 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 72px;
    position: relative;
    overflow: hidden;
  }
  .grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(hsl(0 0% 100% / 0.035) 1px, transparent 1px),
      linear-gradient(90deg, hsl(0 0% 100% / 0.035) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .row { display: flex; align-items: center; gap: 20px; position: relative; }
  .mark { width: 68px; height: 68px; border-radius: 18px; }
  .wordmark { font-size: 46px; font-weight: 700; letter-spacing: -0.025em; }
  .eyebrow {
    position: relative;
    margin-top: 40px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 21px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: hsl(227 100% 78%);
  }
  h1 {
    position: relative;
    font-size: 66px;
    line-height: 1.08;
    font-weight: 700;
    letter-spacing: -0.035em;
    max-width: 940px;
  }
  h1.small { font-size: 56px; }
  h1 .accent { color: hsl(227 100% 78%); }
  .sub {
    position: relative;
    margin-top: 20px;
    font-size: 28px;
    line-height: 1.4;
    color: hsl(224 12% 74%);
    max-width: 900px;
  }
  .chips { position: relative; display: flex; flex-wrap: wrap; gap: 11px; margin-top: 30px; }
  .chip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    padding: 9px 16px;
    border-radius: 999px;
    border: 1px solid hsl(0 0% 100% / 0.14);
    background: hsl(0 0% 100% / 0.05);
    color: hsl(224 14% 84%);
  }
  .footer {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 56px;
    display: flex;
    align-items: center;
    gap: 28px;
    font-size: 24px;
    font-weight: 500;
    color: hsl(224 12% 70%);
  }
  .footer .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: hsl(130 48% 62%);
  }
  .footer .url { margin-left: auto; font-family: 'JetBrains Mono', monospace; color: hsl(227 100% 78%); }
`;

function cardHtml(bodyHtml) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>${CARD_CSS}</style></head>
<body>
  <div class="grid"></div>
  <div>
    <div class="row">
      <img class="mark" src="data:image/svg+xml;base64,${logo}" alt="">
      <span class="wordmark">Toolbit</span>
    </div>
${bodyHtml}
  </div>
  <div class="footer">
    <span><span class="dot"></span>&nbsp; Offline</span>
    <span>Local-first</span>
    <span>No uploads</span>
    <span>No tracking</span>
    <span class="url">toolbit.app</span>
  </div>
</body></html>`;
}

/**
 * Trim a description to fit under the heading, preferring whole sentences.
 * Splits only on a full stop followed by a capital, so ".proto" and "X.509"
 * survive intact.
 */
function subtitle(text, limit = 118) {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*Toolbit$/, '')
    .trim();
  if (clean.length <= limit) return clean;

  const sentences = clean.split(/(?<=\.)\s+(?=[A-Z])/);
  let kept = '';
  for (const sentence of sentences) {
    const next = kept ? `${kept} ${sentence}` : sentence;
    if (next.length > limit) break;
    kept = next;
  }
  if (kept) return kept;

  const cut = clean.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * Palette-quantises a card in place. Flat brand colours over a gradient
 * compress badly at 24-bit: 128 colours with dithering is visually identical
 * at card size and roughly a third of the bytes. Skipped with a warning if
 * Pillow is not installed, since the uncompressed card is still correct.
 */
function quantise(file) {
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
          'q = im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)',
          'q.save(p, optimize=True)',
        ].join('\n'),
        file,
      ],
      { stdio: 'pipe' },
    );
    return true;
  } catch {
    return false;
  }
}

const siteCard =
  cardHtml(`    <h1 style="margin-top:38px">40+ developer tools<br><span class="accent">that never upload your data</span></h1>
    <div class="chips">
      ${[
        'JSON Formatter',
        'JWT Decoder',
        'Base64 Encoder',
        'Regex Tester',
        'UUID Generator',
        'SQL Formatter',
      ]
        .map((tool) => `<span class="chip">${tool}</span>`)
        .join('\n      ')}
    </div>`);

function contentCard({ eyebrow, heading, sub, chips = [] }) {
  return cardHtml(`    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1 class="${heading.length > 26 ? 'small' : ''}" style="margin-top:14px">${escapeHtml(heading)}</h1>
    <div class="sub">${escapeHtml(sub)}</div>${
      chips.length
        ? `\n    <div class="chips">${chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')}</div>`
        : ''
    }`);
}

/* ------------------------------------------------------------- render loop */

const cards = [
  { target: path.join(root, 'public/og-image.png'), html: siteCard, label: 'og-image.png' },
];

if (!siteOnly) {
  const ogDir = path.join(root, 'public/og');
  mkdirSync(ogDir, { recursive: true });

  for (const tool of TOOL_PAGES) {
    cards.push({
      target: path.join(ogDir, `${tool.slug}.png`),
      label: `og/${tool.slug}.png`,
      html: contentCard({
        eyebrow: 'Developer tool',
        heading: tool.name,
        sub: subtitle(tool.description),
        chips: ['Runs in your browser', 'No uploads', 'Free'],
      }),
    });
  }

  for (const page of COMPARISON_PAGES) {
    cards.push({
      target: path.join(ogDir, `compare-${page.slug}.png`),
      label: `og/compare-${page.slug}.png`,
      html: contentCard({
        eyebrow: 'Comparison',
        heading: `Toolbit vs ${page.competitor}`,
        sub: subtitle(page.description),
      }),
    });
  }

  for (const page of GUIDE_PAGES) {
    cards.push({
      target: path.join(ogDir, `${page.slug}.png`),
      label: `og/${page.slug}.png`,
      html: contentCard({
        eyebrow: 'Guide',
        heading: page.h1,
        sub: subtitle(page.description),
      }),
    });
  }

  for (const post of BLOG_POSTS) {
    cards.push({
      target: path.join(ogDir, `blog-${post.slug}.png`),
      label: `og/blog-${post.slug}.png`,
      html: contentCard({
        eyebrow: 'Blog',
        heading: post.h1,
        sub: subtitle(post.description),
      }),
    });
  }
}

const { binary, isShell } = findChromium();
const work = mkdtempSync(path.join(tmpdir(), 'toolbit-og-'));

try {
  let bytes = 0;
  let quantised = 0;

  for (const card of cards) {
    const page = path.join(work, 'card.html');
    const shot = path.join(work, 'card.png');
    writeFileSync(page, card.html);
    rmSync(shot, { force: true });

    execFileSync(
      binary,
      [
        ...(isShell ? [] : ['--headless=new']),
        '--no-sandbox',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--window-size=1200,630',
        `--screenshot=${shot}`,
        `file://${page}`,
      ],
      { stdio: 'pipe' },
    );

    mkdirSync(path.dirname(card.target), { recursive: true });
    copyFileSync(shot, card.target);
    if (quantise(card.target)) quantised += 1;
    bytes += readFileSync(card.target).length;
  }

  console.log(
    `Wrote ${cards.length} Open Graph card(s), ${(bytes / 1024 / 1024).toFixed(2)} MB total`,
  );
  if (quantised < cards.length) {
    console.warn(
      `  ! ${cards.length - quantised} card(s) left at full colour — install Pillow (pip install pillow) to shrink them`,
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
