#!/usr/bin/env node
/**
 * Renders the 1200x630 Open Graph card into public/og-image.png.
 *
 * Social platforms want a wide card, not the square app icon, so this builds
 * one from the brand tokens and screenshots it with headless Chromium. Run it
 * again whenever the brand copy or palette changes:
 *
 *     node scripts/generate-og-image.mjs
 *
 * Chromium is located via PLAYWRIGHT_BROWSERS_PATH, CHROME_PATH, or the usual
 * system install locations. The generated PNG is committed, so a normal build
 * never needs this script.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
        shells.push(...globSync(path.join(pw, 'chromium_headless_shell-*/chrome-linux/headless_shell')));
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

const fontData = readFileSync(path.join(root, 'src/ds/assets/fonts/Geist[wght].ttf')).toString('base64');
const monoData = readFileSync(path.join(root, 'src/ds/assets/fonts/JetBrainsMono[wght].ttf')).toString('base64');
const logo = readFileSync(path.join(root, 'public/icon.svg')).toString('base64');

const tools = [
    'JSON Formatter',
    'JWT Decoder',
    'Base64 Encoder',
    'Regex Tester',
    'UUID Generator',
    'SQL Formatter',
];

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Geist';
    src: url(data:font/ttf;base64,${fontData}) format('truetype');
    font-weight: 100 900;
  }
  @font-face {
    font-family: 'JetBrains Mono';
    src: url(data:font/ttf;base64,${monoData}) format('truetype');
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
  h1 {
    position: relative;
    font-size: 66px;
    line-height: 1.08;
    font-weight: 700;
    letter-spacing: -0.035em;
    max-width: 940px;
  }
  h1 .accent { color: hsl(227 100% 78%); }
  .sub {
    position: relative;
    margin-top: 22px;
    font-size: 30px;
    line-height: 1.35;
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
</style>
</head>
<body>
  <div class="grid"></div>
  <div>
    <div class="row">
      <img class="mark" src="data:image/svg+xml;base64,${logo}" alt="">
      <span class="wordmark">Toolbit</span>
    </div>
    <h1 style="margin-top:38px">40+ developer tools<br><span class="accent">that never upload your data</span></h1>
    <div class="chips">
      ${tools.map((tool) => `<span class="chip">${tool}</span>`).join('\n      ')}
    </div>
  </div>
  <div class="footer">
    <span><span class="dot"></span>&nbsp; Offline</span>
    <span>Local-first</span>
    <span>No uploads</span>
    <span>No tracking</span>
    <span class="url">toolbit.app</span>
  </div>
</body>
</html>`;

const work = mkdtempSync(path.join(tmpdir(), 'toolbit-og-'));
try {
    const page = path.join(work, 'og.html');
    const shot = path.join(work, 'og-image.png');
    writeFileSync(page, html);

    const { binary, isShell } = findChromium();
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

    const target = path.join(root, 'public/og-image.png');
    copyFileSync(shot, target);
    console.log(`Wrote ${path.relative(root, target)}`);
} finally {
    rmSync(work, { recursive: true, force: true });
}
