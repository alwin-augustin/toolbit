import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { INSTALLERS, installerFor, type PlatformHints } from '@/platform/downloads';

/**
 * The version-free download address, `/download`.
 *
 * Three things have to agree for it to work: the installer table this module
 * exports, the `public/_redirects` rows that turn each path into an object in
 * the R2 bucket, and the markup of `download.html`, which is what a visitor
 * whose browser reports no platform — or runs no scripts — actually sees. Any
 * one of them missing is a broken download, so they are compared here rather
 * than trusted: the 302 that used to send `/download` to the about page was
 * invisible to every test the repo had.
 */
const redirects = readFileSync(path.resolve(process.cwd(), 'public/_redirects'), 'utf8');
const downloadPage = readFileSync(path.resolve(process.cwd(), 'download.html'), 'utf8');

const redirectSources = redirects
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('/'))
  .map((line) => line.split(/\s+/)[0]);

const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const LEGACY_WINDOWS =
  'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko MSIE 9.0';
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IPAD_AS_MAC = MAC_SAFARI;
const UBUNTU_FIREFOX =
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

describe('installerFor', () => {
  const cases: Array<[string, string, PlatformHints, string | null]> = [
    ['Windows', WINDOWS, {}, 'windows'],
    ['a legacy Windows agent', LEGACY_WINDOWS, {}, 'windows'],
    ['an Apple silicon Mac that reports its CPU', MAC_CHROME, { architecture: 'arm' }, 'mac'],
    ['an Intel Mac that reports its CPU', MAC_CHROME, { architecture: 'x86' }, 'mac-intel'],
    // Safari and Firefox never answer the hint, so the arm build is the default.
    ['a Mac whose browser says nothing', MAC_SAFARI, {}, 'mac'],
    ['Linux', UBUNTU_FIREFOX, {}, 'linux'],
    [
      'ChromeOS',
      'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/141.0.0.0',
      {},
      'linux',
    ],
    // The hint is a Mac question: it must not move a Windows visitor.
    ['Windows with a CPU hint', WINDOWS, { architecture: 'x86' }, 'windows'],
    // No build exists for these, and a wrong installer is worse than a choice.
    ['an iPad asking for the desktop site', IPAD_AS_MAC, { touchPoints: 2 }, null],
    [
      'an iPad',
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      {},
      null,
    ],
    [
      'an iPhone',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      {},
      null,
    ],
    ['Android', ANDROID, {}, null],
    ['an unknown agent', 'curl/8.7.1', {}, null],
    ['an empty agent', '', {}, null],
  ];

  for (const [name, userAgent, hints, expected] of cases) {
    it(`hands ${name} the ${expected ?? 'chooser instead of a build'}`, () => {
      expect(installerFor(userAgent, hints)?.id ?? null).toBe(expected);
    });
  }

  it('cannot hide a real Mac behind the touch heuristic', () => {
    // macOS laptops and desktops report no touch points; only iPadOS does.
    expect(installerFor(MAC_SAFARI, { touchPoints: 0 })?.id).toBe('mac');
  });
});

describe('the installer table', () => {
  it('names one build per platform, each with a distinct version-free path', () => {
    expect(INSTALLERS.map((installer) => installer.id)).toEqual([
      'mac',
      'mac-intel',
      'windows',
      'linux',
    ]);
    const paths = INSTALLERS.map((installer) => installer.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const installer of INSTALLERS) {
      expect(installer.path).toMatch(/^\/download\/[a-z-]+$/);
      expect(installer.label.length).toBeGreaterThan(0);
    }
  });

  it('is exactly what public/_redirects resolves — no row missing, none extra', () => {
    const installerSources = redirectSources.filter((source) => source.startsWith('/download'));
    expect(installerSources).toEqual(INSTALLERS.map((installer) => installer.path));
  });

  it('leaves the bare /download path to the page, never to a redirect', () => {
    expect(redirectSources).not.toContain('/download');
  });

  it('is the list the download page shows, links and all', () => {
    for (const installer of INSTALLERS) {
      expect(downloadPage).toContain(`href="${installer.path}"`);
      expect(downloadPage).toContain(installer.label);
    }
  });

  it('runs the detection script from the page it belongs to', () => {
    expect(downloadPage).toContain('src="/src/app/download.ts"');
  });
});
