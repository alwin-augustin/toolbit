#!/usr/bin/env node
/**
 * Prerenders the crawlable surface of toolbit.app into dist/.
 *
 * The application itself is a client-rendered SPA, which means a crawler that
 * does not execute JavaScript sees an empty <div id="root">. This script fills
 * that gap without adding a server:
 *
 *   dist/index.html            gets real content injected into #root
 *   dist/<tool-slug>/          the app shell, with that tool described in #root
 *   dist/tools/index.html      tool directory
 *   dist/compare/<slug>/       comparison pages
 *   dist/blog/, dist/<guide>/  blog and long-form guides
 *   dist/sitemap.xml           every indexable URL
 *   dist/robots.txt            pointing at the sitemap
 *
 * Tool pages are the application: they reuse the built index.html verbatim and
 * only swap the head metadata and the contents of #root, so /json-formatter
 * boots straight into the JSON formatter while still serving a crawler real
 * text. The marketing pages around them are plain HTML with inlined CSS — no
 * bundle, no framework — so they render instantly.
 *
 * Run automatically as part of `npm run build`, or on its own:
 *
 *     node scripts/generate-seo-pages.mjs [--out dist]
 */

import { parse, parseFragment, serialize } from 'parse5';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SITE,
  CATEGORY_GROUPS,
  TOOL_PAGES,
  SITE_FAQ,
  WHY_TOOLBIT,
  COMPARISON_PAGES,
  GUIDE_PAGES,
  BLOG_POSTS,
  LEGAL_PAGES,
  POPULAR_TOOL_SLUGS,
  getToolPage,
  getToolPagesByCategory,
  absoluteUrl,
} from '../src/content/seo/seo-content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outArgIndex = process.argv.indexOf('--out');
const outDir = path.resolve(root, outArgIndex === -1 ? 'dist' : process.argv[outArgIndex + 1]);
const buildDate = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ utils */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}</script>`;

function writePage(pathname, html) {
  const target =
    pathname === '/'
      ? path.join(outDir, 'index.html')
      : path.join(outDir, pathname.replace(/^\//, ''), 'index.html');
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, html);
  return target;
}

/* --------------------------------------------------------------- template */

/**
 * The self-hosted faces the workspace uses, resolved to their hashed build
 * output. These pages inline their own CSS and load no app stylesheet, so
 * without this they would fall back to the system stack and lose the design
 * system's typography. Vite emits content-hashed font names, so they are
 * discovered from dist/assets rather than hard-coded.
 */
function fontFaceCss() {
  const fontsDir = path.join(outDir, 'assets');
  if (!existsSync(fontsDir)) return '';

  const files = readdirSync(fontsDir);
  const faces = [
    { family: 'Geist', file: files.find((f) => /^Geist.*\.woff2$/.test(f)) },
    // The Italic file sorts before the roman one, so match the roman by name.
    { family: 'JetBrains Mono', file: files.find((f) => /^JetBrainsMono_wght.*\.woff2$/.test(f)) },
  ];

  return faces
    .filter((face) => face.file)
    .map(
      (face) =>
        `@font-face{font-family:'${face.family}';src:url('/assets/${face.file}') format('woff2');font-weight:100 900;font-style:normal;font-display:swap;}`,
    )
    .join('\n');
}

const PAGE_CSS = `
/* Toolbit design tokens, inlined.
   These pages are served standalone, so they cannot import
   src/app/styles/tokens.css. Every value below is copied from that file —
   light from its :root block, dark from its .dark block — and the names are
   the design system's own, so a page's CSS reads like the app's. Keep the two
   in step: tokens.css is the source of truth, this is a mirror of it. */
:root {
  color-scheme: light;
  --tb-canvas: oklch(0.991 0.002 265);
  --tb-surface: oklch(1 0 0);
  --tb-sunken: oklch(0.978 0.003 265);
  --tb-raised: oklch(1 0 0);
  --tb-state-hover: oklch(0.955 0.004 265);
  --tb-line: oklch(0.936 0.005 265);
  --tb-line-strong: oklch(0.83 0.008 265);
  --tb-ink: oklch(0.183 0.011 265);
  --tb-ink-muted: oklch(0.502 0.016 265);
  --tb-ink-faint: oklch(0.596 0.014 265);
  --tb-brand: oklch(0.511 0.222 285);
  --tb-brand-hover: oklch(0.446 0.208 285);
  --tb-brand-ink: oklch(0.446 0.208 285);
  --tb-on-brand: oklch(1 0 0);
  --tb-brand-soft: oklch(0.968 0.019 285);
  --tb-brand-ring: oklch(0.585 0.203 285 / 0.45);
  --tb-z-base: 0;
  --tb-z-sticky: 10;
  --tb-z-rail: 20;
  --tb-z-drawer: 40;
  --tb-z-overlay: 50;
  --tb-z-popover: 60;
  --tb-z-toast: 70;
  --tb-z-skip: 80;
  --tb-radius-xs: 3px;
  --tb-radius-sm: 4px;
  --tb-radius-md: 6px;
  --tb-radius-lg: 9px;
  --tb-radius-xl: 13px;
  --tb-radius-full: 9999px;
  --tb-control-xs: 22px;
  --tb-control-sm: 28px;
  --tb-control-md: 32px;
  --tb-control-lg: 40px;
  --tb-shadow-xs: 0 1px 2px 0 oklch(0.2 0.02 265 / 0.06);
  --tb-shadow-sm: 0 1px 2px -1px oklch(0.2 0.02 265 / 0.09), 0 2px 4px -2px oklch(0.2 0.02 265 / 0.07);
  --tb-shadow-md: 0 2px 4px -2px oklch(0.2 0.02 265 / 0.1), 0 6px 14px -4px oklch(0.2 0.02 265 / 0.12);
  --tb-shadow-lg: 0 4px 8px -4px oklch(0.2 0.02 265 / 0.12), 0 16px 36px -12px oklch(0.2 0.02 265 / 0.2);
  --tb-shadow-focus: 0 0 0 2px var(--tb-canvas), 0 0 0 4px var(--tb-brand-ring);
  --tb-font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --tb-font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  --tb-text-2xs: 0.6875rem;
  --tb-text-xs: 0.75rem;
  --tb-text-sm: 0.8125rem;
  --tb-text-base: 0.875rem;
  --tb-text-md: 0.9375rem;
  --tb-text-lg: 1.0625rem;
  --tb-text-xl: 1.25rem;
  --tb-text-2xl: 1.5rem;
  --tb-text-3xl: 1.875rem;
  --tb-leading-tight: 1.25;
  --tb-leading-snug: 1.4;
  --tb-leading-normal: 1.55;
  --tb-tracking-tight: -0.011em;
  --tb-tracking-caps: 0.08em;
  --tb-duration-instant: 80ms;
  --tb-duration-fast: 130ms;
  --tb-duration-base: 190ms;
  --tb-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
html.dark {
  color-scheme: dark;
  --tb-canvas: oklch(0.128 0.009 265);
  --tb-surface: oklch(0.152 0.01 265);
  --tb-sunken: oklch(0.128 0.009 265);
  --tb-raised: oklch(0.183 0.011 265);
  --tb-state-hover: oklch(0.222 0.013 265);
  --tb-line: oklch(0.222 0.013 265);
  --tb-line-strong: oklch(0.322 0.015 265);
  --tb-ink: oklch(0.978 0.003 265);
  --tb-ink-muted: oklch(0.706 0.012 265);
  --tb-ink-faint: oklch(0.596 0.014 265);
  --tb-brand: oklch(0.68 0.17 285);
  --tb-brand-hover: oklch(0.75 0.16 285);
  --tb-brand-ink: oklch(0.8 0.13 285);
  --tb-on-brand: oklch(0.128 0.009 265);
  --tb-brand-soft: oklch(0.26 0.07 285);
  --tb-brand-ring: oklch(0.68 0.17 285 / 0.55);
  --tb-shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 0.4);
  --tb-shadow-sm: 0 1px 2px -1px oklch(0 0 0 / 0.5), 0 2px 4px -2px oklch(0 0 0 / 0.4);
  --tb-shadow-md: 0 2px 4px -2px oklch(0 0 0 / 0.5), 0 6px 14px -4px oklch(0 0 0 / 0.5);
  --tb-shadow-lg: 0 4px 10px -4px oklch(0 0 0 / 0.55), 0 18px 40px -12px oklch(0 0 0 / 0.6);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body {
  margin: 0;
  background: var(--tb-canvas);
  color: var(--tb-ink);
  font-family: var(--tb-font-sans);
  font-size: var(--tb-text-base);
  line-height: var(--tb-leading-normal);
  -webkit-font-smoothing: antialiased;
}
a { color: var(--tb-brand-ink); text-decoration: none; }
a:hover { text-decoration: underline; }
code, kbd, pre, samp { font-family: var(--tb-font-mono); }
/* One focus treatment everywhere, matching the app: a 2px brand ring drawn as
   a box-shadow, so it takes the shape of whatever it lands on. Setting a
   radius here would restyle a control the moment it was focused. */
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible {
  outline: none;
  box-shadow: var(--tb-shadow-focus);
}
.skip {
  position: absolute; left: 1rem; top: -4rem; z-index: var(--tb-z-skip);
  background: var(--tb-brand); color: var(--tb-on-brand); padding: .5rem 1rem;
  border-radius: var(--tb-radius-md);
  transition: top var(--tb-duration-fast) var(--tb-ease-out);
}
.skip:focus { top: 1rem; color: var(--tb-on-brand); }
.wrap { max-width: 64rem; margin: 0 auto; padding: 0 1.5rem; }
.topbar {
  position: sticky; top: 0; z-index: var(--tb-z-sticky);
  border-bottom: 1px solid var(--tb-line);
  background: var(--tb-canvas);
}
.topbar .wrap { display: flex; align-items: center; gap: 1.25rem; padding-top: .75rem; padding-bottom: .75rem; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: .5rem; font-weight: 600; color: var(--tb-ink); font-size: var(--tb-text-base); letter-spacing: var(--tb-tracking-tight); }
.brand img { width: 24px; height: 24px; }
.topbar nav { display: flex; gap: .25rem; font-size: var(--tb-text-sm); margin-left: auto; flex-wrap: wrap; }
.topbar nav a {
  color: var(--tb-ink-muted); padding: .375rem .625rem; border-radius: var(--tb-radius-md);
  transition: background-color var(--tb-duration-instant) var(--tb-ease-out), color var(--tb-duration-instant) var(--tb-ease-out);
}
.topbar nav a:hover { color: var(--tb-ink); background: var(--tb-state-hover); text-decoration: none; }
main { padding: 0 0 3rem; }
/* Flat band: a background step and one hairline, never a gradient. */
.hero {
  margin: 0 0 2rem; padding: 3rem 0 2.25rem;
  background: var(--tb-sunken);
  border-bottom: 1px solid var(--tb-line);
}
.hero .eyebrow {
  display: inline-block; font-size: var(--tb-text-2xs); font-weight: 600;
  letter-spacing: var(--tb-tracking-caps);
  text-transform: uppercase; color: var(--tb-brand-ink);
  background: var(--tb-brand-soft);
  border: 1px solid var(--tb-line);
  padding: .2rem .65rem; border-radius: var(--tb-radius-full); margin: 0 0 1rem;
}
.hero h1 { margin-top: 0; }
.hero .lede { font-size: var(--tb-text-lg); }
.stats { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; padding: 0; margin: 1.25rem 0 0; list-style: none; }
.stats li { margin: 0; font-size: var(--tb-text-sm); color: var(--tb-ink-muted); }
.stats strong { color: var(--tb-ink); font-size: var(--tb-text-md); margin-right: .3rem; }
.crumbs { font-size: var(--tb-text-sm); color: var(--tb-ink-muted); margin-bottom: 1.25rem; padding-top: 1.5rem; }
.hero + .wrap .crumbs, .hero .crumbs { padding-top: 0; }
.crumbs a { color: var(--tb-ink-muted); }
.crumbs span { margin: 0 .4rem; opacity: .6; }
h1 { font-size: var(--tb-text-3xl); line-height: var(--tb-leading-tight); letter-spacing: var(--tb-tracking-tight); margin: 0 0 1rem; text-wrap: balance; }
h2 { font-size: var(--tb-text-xl); letter-spacing: var(--tb-tracking-tight); margin: 2.5rem 0 .75rem; scroll-margin-top: 5rem; }
h3 { font-size: var(--tb-text-md); margin: 0 0 .25rem; }
p { margin: 0 0 1rem; }
.prose { max-width: 46rem; }
.prose p, .prose li { color: var(--tb-ink); }
.prose .lede, .lede { font-size: var(--tb-text-lg); color: var(--tb-ink-muted); max-width: 46rem; }
ul, ol { margin: 0 0 1rem; padding-left: 1.2rem; color: var(--tb-ink-muted); }
li { margin: .3rem 0; }
li strong { color: var(--tb-ink); }
.toc {
  border: 1px solid var(--tb-line); border-radius: var(--tb-radius-lg);
  background: var(--tb-surface); padding: 1rem 1.25rem; margin: 1.5rem 0 0; max-width: 46rem;
}
.toc p { font-size: var(--tb-text-2xs); font-weight: 600; letter-spacing: var(--tb-tracking-caps); text-transform: uppercase; color: var(--tb-ink-faint); margin: 0 0 .5rem; }
.toc ol { margin: 0; padding-left: 1.1rem; }
.toc li { margin: .2rem 0; font-size: var(--tb-text-sm); }
.cta-band {
  margin: 2.5rem 0 0; padding: 1.75rem;
  border: 1px solid var(--tb-line);
  border-radius: var(--tb-radius-lg);
  background: var(--tb-surface);
}
.cta-band h2 { margin-top: 0; }
.cta { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1.25rem 0 0; }
/* The app's default button, to the pixel: 32px from the control scale (--tb-control-md),
   a 9px radius, an 11px inline pad and a 13px label. A static page and an app
   page must be interchangeable, so this may not invent its own size. */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: var(--tb-control-md); padding: 0 11px;
  border: 1px solid transparent; border-radius: var(--tb-radius-lg);
  background: var(--tb-brand); color: var(--tb-on-brand);
  font-weight: 500; font-size: var(--tb-text-sm);
  transition: background-color var(--tb-duration-instant) var(--tb-ease-out), border-color var(--tb-duration-instant) var(--tb-ease-out);
}
.btn:hover { text-decoration: none; background: var(--tb-brand-hover); }
/* The app's outline button: canvas fill, one hairline. */
.btn.ghost { background: var(--tb-canvas); color: var(--tb-ink); border-color: var(--tb-line); }
.btn.ghost:hover { background: var(--tb-state-hover); border-color: var(--tb-line-strong); }
.note { font-size: var(--tb-text-xs); color: var(--tb-ink-faint); }
.chips { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; margin: 0 0 1rem; list-style: none; }
.chips li { margin: 0; }
/* A chip, not a pill: the app's popular-tool chips are 6px radius, 12px text. */
.chips a {
  display: inline-block; padding: .25rem .625rem; border: 1px solid var(--tb-line);
  border-radius: var(--tb-radius-md); font-size: var(--tb-text-xs);
  color: var(--tb-ink-muted); background: var(--tb-canvas);
  transition: border-color var(--tb-duration-instant) var(--tb-ease-out), color var(--tb-duration-instant) var(--tb-ease-out);
}
.chips a:hover { border-color: var(--tb-line-strong); color: var(--tb-ink); text-decoration: none; }
.cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); padding: 0; margin: 0 0 1rem; list-style: none; }
.cards li { margin: 0; }
.cards a {
  display: block; height: 100%; padding: 1rem 1.1rem; border: 1px solid var(--tb-line);
  border-radius: var(--tb-radius-lg); background: var(--tb-surface); color: var(--tb-ink);
  transition:
    border-color var(--tb-duration-fast) var(--tb-ease-out),
    background-color var(--tb-duration-fast) var(--tb-ease-out);
}
.cards a:hover { border-color: var(--tb-line-strong); background: var(--tb-state-hover); text-decoration: none; }
.cards .name { font-weight: 600; display: block; margin-bottom: .15rem; letter-spacing: var(--tb-tracking-tight); }
.cards .desc { font-size: var(--tb-text-sm); color: var(--tb-ink-muted); display: block; line-height: var(--tb-leading-snug); }
dl.faq { margin: 0; max-width: 46rem; }
dl.faq dt { font-weight: 600; margin-top: 1.1rem; }
dl.faq dd { margin: .2rem 0 0; color: var(--tb-ink-muted); }
footer.site { border-top: 1px solid var(--tb-line); margin-top: 3.5rem; padding: 2.5rem 0 2rem; font-size: var(--tb-text-sm); color: var(--tb-ink-muted); background: var(--tb-surface); }
.foot-grid { display: grid; gap: 2rem; grid-template-columns: 1.4fr 1fr 1fr 1fr; margin-bottom: 2rem; }
@media (max-width: 46rem) { .foot-grid { grid-template-columns: 1fr 1fr; } }
.foot-grid h2 { font-size: var(--tb-text-2xs); font-weight: 600; letter-spacing: var(--tb-tracking-caps); text-transform: uppercase; color: var(--tb-ink-faint); margin: 0 0 .75rem; }
.foot-grid ul { list-style: none; margin: 0; padding: 0; }
.foot-grid li { margin: .4rem 0; }
.foot-grid a { color: var(--tb-ink-muted); }
.foot-grid a:hover { color: var(--tb-ink); }
.foot-brand p { max-width: 20rem; }
.foot-base { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; align-items: center; border-top: 1px solid var(--tb-line); padding-top: 1.25rem; }
.foot-base a { color: var(--tb-ink-muted); }
`.trim();

const NAV_LINKS = [
  ['/tools', 'All tools'],
  ['/developer-toolbox', 'Developer toolbox'],
  ['/offline-developer-tools', 'Offline tools'],
  ['/compare', 'Comparisons'],
  ['/blog', 'Blog'],
  ['/about', 'About'],
];

const FOOTER_GROUPS = [
  {
    heading: 'Tools',
    links: [
      ['/tools', 'All tools'],
      ['/developer-toolbox', 'Developer toolbox'],
      ['/offline-developer-tools', 'Offline tools'],
      ['/local-first-developer-tools', 'Local-first tools'],
    ],
  },
  {
    heading: 'Comparisons',
    links: [
      ['/compare', 'All comparisons'],
      ['/compare/toolbit-vs-devtoys', 'vs DevToys'],
      ['/compare/toolbit-vs-cyberchef', 'vs CyberChef'],
      ['/compare/toolbit-vs-postman', 'vs Postman'],
    ],
  },
  {
    heading: 'Resources',
    links: [
      ['/', 'Toolbit workspace'],
      ['/blog', 'Blog'],
      ['/about', 'About'],
      ['/privacy', 'Privacy'],
      ['/terms', 'Terms'],
    ],
  },
];

const FOOTER_LINKS = FOOTER_GROUPS.flatMap((group) => group.links);

/** Social card for a page: a generated per-page card, or the site card. */
function ogImageFor(pathname) {
  const slug = pathname.replace(/^\//, '').replace(/\//g, '-');
  return existsSync(path.join(root, 'public/og', `${slug}.png`)) ? `/og/${slug}.png` : SITE.ogImage;
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function breadcrumbHtml(trail) {
  const parts = trail.map((crumb, index) =>
    index === trail.length - 1
      ? `<span aria-current="page">${escapeHtml(crumb.name)}</span>`
      : `<a href="${crumb.url}">${escapeHtml(crumb.name)}</a>`,
  );
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts.join('<span>/</span>')}</nav>`;
}

function faqSchema(faq) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  };
}

/**
 * Site-wide identity graph. Every page references `#website` and
 * `#organization` in its own nodes, so these definitions must ship on
 * every page or the references dangle and parsers drop them.
 */
function siteGraph() {
  return [
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      inLanguage: 'en',
    },
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: { '@type': 'ImageObject', url: absoluteUrl(SITE.logo) },
      sameAs: [SITE.github],
    },
  ];
}

function webPageSchema(canonical, title, description) {
  return {
    '@type': 'WebPage',
    '@id': `${canonical}#page`,
    name: title,
    url: canonical,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE.url}/#website` },
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
  };
}

function breadcrumbSchema(trail, canonical) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url),
    })),
  };
}

function faqHtml(faq) {
  return `<dl class="faq">${faq
    .map((entry) => `<dt>${escapeHtml(entry.q)}</dt><dd>${escapeHtml(entry.a)}</dd>`)
    .join('')}</dl>`;
}

/** Trims to a word boundary — splitting on '.' mangles ".proto" and "X.509". */
function cardSummary(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 118) return clean;
  const cut = clean.slice(0, 118);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Section list rendered with anchor ids, plus the matching table of contents. */
function sectionedHtml(sections) {
  const toc = sections.map((section) => ({ id: slugify(section.h2), text: section.h2 }));
  const html = sections
    .map(
      (section) =>
        `      <h2 id="${slugify(section.h2)}">${escapeHtml(section.h2)}</h2>\n      <p>${escapeHtml(section.body)}</p>`,
    )
    .join('\n\n');
  return { html, toc };
}

function tocHtml(toc) {
  if (!toc.length) return '';
  return `<nav class="toc" aria-label="On this page"><p>On this page</p><ol>${toc
    .map((entry) => `<li><a href="#${entry.id}">${escapeHtml(entry.text)}</a></li>`)
    .join('')}</ol></nav>`;
}

function heroHtml(eyebrow, title, lede, stats) {
  return `      <div class="hero">
        <div class="wrap">
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="lede">${escapeHtml(lede)}</p>
          ${
            stats?.length
              ? `<ul class="stats">${stats
                  .map(
                    ([value, label]) =>
                      `<li><strong>${escapeHtml(value)}</strong>${escapeHtml(label)}</li>`,
                  )
                  .join('')}</ul>`
              : ''
          }
        </div>
      </div>`;
}

function ctaBandHtml(title, text) {
  return `      <div class="cta-band">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        <div class="cta">
          <a class="btn" href="/">Open Toolbit</a>
          <a class="btn ghost" href="/tools">Browse all ${TOOL_PAGES.length} tools</a>
        </div>
      </div>`;
}

function footerHtml() {
  const year = buildDate.slice(0, 4);
  const columns = FOOTER_GROUPS.map(
    (group) => `<div>
          <h2>${escapeHtml(group.heading)}</h2>
          <ul>${group.links
            .map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`)
            .join('')}</ul>
        </div>`,
  ).join('\n        ');
  return `      <div class="wrap">
        <div class="foot-grid">
          <div class="foot-brand">
            <a class="brand" href="/"><img src="/icon.svg" alt="" width="24" height="24" />Toolbit</a>
            <p>Local-first developer tools that run entirely in your browser. No uploads, no tracking, no sign-up.</p>
          </div>
          ${columns}
        </div>
        <div class="foot-base">
          <span>© ${year} Toolbit · Open source under the MIT licence</span>
          <a href="${SITE.github}">Source on GitHub</a>
        </div>
      </div>`;
}
function toolCardsHtml(slugs) {
  const items = slugs
    .map((slug) => getToolPage(slug))
    .filter(Boolean)
    .map(
      (tool) => `<li><a href="/${tool.slug}">
        <span class="name">${escapeHtml(tool.name)}</span>
        <span class="desc">${escapeHtml(cardSummary(tool.description))}</span>
      </a></li>`,
    )
    .join('\n      ');
  return `<ul class="cards">\n      ${items}\n    </ul>`;
}

/**
 * @param {object} page
 * @param {string} page.pathname
 * @param {string} page.title
 * @param {string} page.description
 * @param {string} page.body
 * @param {object[]} [page.schema]
 * @param {string} [page.keywords]
 * @param {{ eyebrow: string, stats?: Array<[string, string]> }} [page.hero]
 *   Hero banner; the h1 and lede stay in `body` for article pages and move
 *   into the hero for hub pages via `page.heroTitle`/`page.heroLede`.
 * @param {string} [page.heroTitle]
 * @param {string} [page.heroLede]
 * @param {Array<{ id: string, text: string }>} [page.toc]
 * @param {'website' | 'article'} [page.ogType]
 * @param {string} [page.publishedTime]
 * @param {string} [page.modifiedTime]
 */
function renderPage(page) {
  const canonical = absoluteUrl(page.pathname);
  // Site identity ships on every page so publisher/isPartOf references resolve.
  const graph = [
    ...siteGraph(),
    webPageSchema(canonical, page.title, page.description),
    ...(page.schema ?? []),
  ];
  const ogImage = absoluteUrl(ogImageFor(page.pathname));
  const ogType = page.ogType ?? 'website';
  return `<!doctype html>
<html lang="en" class="dark" data-density="comfortable">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  ${page.keywords ? `<meta name="keywords" content="${escapeHtml(page.keywords)}" />` : ''}
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="${SITE.name}" />
  <meta property="og:locale" content="${SITE.locale}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.description)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  ${page.publishedTime ? `<meta property="article:published_time" content="${page.publishedTime}" />` : ''}
  ${page.modifiedTime ? `<meta property="article:modified_time" content="${page.modifiedTime}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="icon" type="image/svg+xml" href="/icon.svg?v=2" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
  <link rel="shortcut icon" href="/favicon.ico?v=2" />
  <link rel="mask-icon" href="/mask-icon.svg" color="#6241dd" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#6241dd" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#6241dd" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#06070a" />
  <script src="/theme-init.js"></script>
  <style>${PAGE_CSS}
${fontFaceCss()}</style>
  ${jsonLd({ '@context': 'https://schema.org', '@graph': graph })}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="topbar">
    <div class="wrap">
      <a class="brand" href="/"><img src="/icon.svg" alt="" width="24" height="24" />Toolbit</a>
      <nav aria-label="Primary">${NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
    </div>
  </header>
  <main id="main">
    ${page.hero ? heroHtml(page.hero.eyebrow, page.heroTitle ?? page.title, page.heroLede ?? page.description, page.hero.stats) : ''}
    <div class="wrap">
${page.body}
    </div>
  </main>
  <footer class="site">
${footerHtml()}
  </footer>
</body>
</html>
`;
}

/* ------------------------------------------------------------ tool pages */

/**
 * Tool pages are the application, served from a real file at /<slug>.
 *
 * The built index.html is reused verbatim as the shell — same bundle, same
 * stylesheet — with the head metadata swapped for this tool's and the empty
 * #root filled with a description of the tool. A crawler that does not run
 * JavaScript reads that description; a browser boots the workspace over it,
 * exactly as it does on the homepage.
 */
function findElement(node, tag, attribute, value) {
  if (
    node.tagName === tag &&
    (!attribute || node.attrs?.some((attr) => attr.name === attribute && attr.value === value))
  )
    return node;
  for (const child of node.childNodes || []) {
    const found = findElement(child, tag, attribute, value);
    if (found) return found;
  }
  return null;
}
function requiredElement(document, tag, attribute, value) {
  const element = findElement(document, tag, attribute, value);
  if (!element)
    throw new Error(
      `SEO: required ${tag}[${attribute || ''}=${value || ''}] is missing from the shell.`,
    );
  return element;
}
function setAttribute(element, name, value) {
  const attribute = element.attrs.find((attr) => attr.name === name);
  if (attribute) attribute.value = value;
  else element.attrs.push({ name, value });
}
function appendMarkup(parent, markup) {
  const nodes = parseFragment(markup).childNodes;
  for (const node of nodes) {
    node.parentNode = parent;
    parent.childNodes.push(node);
  }
}

function toolFallbackMarkup(tool) {
  const related = tool.related
    .map((slug) => getToolPage(slug))
    .filter(Boolean)
    .map((item) => `<li><a href="/${item.slug}">${escapeHtml(item.name)}</a></li>`)
    .join('');

  return `<div class="tb-boot">
    <div class="tb-boot-brand"><img src="/icon.svg" alt="" width="28" height="28" />Toolbit</div>
    <h1>${escapeHtml(tool.h1)}</h1>
    <p class="tb-boot-lede">${escapeHtml(tool.lede)}</p>

    <section>
      <h2>What the ${escapeHtml(tool.name)} does</h2>
      <ul>${tool.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>

    <section>
      <h2>How to use it</h2>
      <ol>${tool.howTo.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    </section>

    <section>
      <h2>Why it runs locally</h2>
      <p>Toolbit has no backend. The ${escapeHtml(tool.name)} is implemented with standard browser APIs, so your input is processed in the tab and never uploaded, logged, or retained. That is what makes it safe to paste real data into — and it is also why the tool keeps working with the network disconnected, once you have installed Toolbit as an app.</p>
    </section>

    <section>
      <h2>Frequently asked questions</h2>
      <dl class="tb-boot-faq">${tool.faq
        .map((entry) => `<dt>${escapeHtml(entry.q)}</dt><dd>${escapeHtml(entry.a)}</dd>`)
        .join('')}</dl>
    </section>

    <section>
      <h2>Related tools</h2>
      <ul class="tb-boot-links">${related}</ul>
    </section>

    <div class="tb-boot-footer">
      <nav><a href="/tools">All ${TOOL_PAGES.length} tools</a>${FOOTER_LINKS.map(
        ([href, label]) => `<a href="${href}">${label}</a>`,
      ).join('')}</nav>
    </div>
  </div>`;
}

function renderToolShell(tool, shell) {
  const pathname = `/${tool.slug}`;
  const canonical = absoluteUrl(pathname);
  const ogImage = absoluteUrl(ogImageFor(pathname));
  const document = parse(shell);
  const title = requiredElement(document, 'title');
  title.childNodes = [{ nodeName: '#text', value: tool.title, parentNode: title }];
  for (const [attribute, key, value] of [
    ['name', 'title', tool.title],
    ['name', 'description', tool.description],
    ['name', 'keywords', tool.keywords.join(', ')],
    ['property', 'og:url', canonical],
    ['property', 'og:title', tool.title],
    ['property', 'og:description', tool.description],
    ['property', 'og:image', ogImage],
    ['property', 'og:image:alt', `${tool.name} — Toolbit`],
    ['name', 'twitter:url', canonical],
    ['name', 'twitter:title', tool.title],
    ['name', 'twitter:description', tool.description],
    ['name', 'twitter:image', ogImage],
    ['name', 'twitter:image:alt', `${tool.name} — Toolbit`],
  ])
    setAttribute(requiredElement(document, 'meta', attribute, key), 'content', value);
  setAttribute(requiredElement(document, 'link', 'rel', 'canonical'), 'href', canonical);

  const trail = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: tool.name, url: pathname },
  ];

  // The shell already ships the site-wide WebSite/Organization graph, so this
  // block only adds the page node — @ids resolve document-wide across blocks.
  const schema = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      webPageSchema(canonical, tool.title, tool.description),
      {
        '@type': 'WebApplication',
        '@id': `${canonical}#app`,
        name: `${tool.name} — Toolbit`,
        url: canonical,
        description: tool.description,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any operating system with a supported browser',
        browserRequirements: 'Requires JavaScript. Modern browser recommended.',
        isAccessibleForFree: true,
        image: ogImage,
        featureList: tool.bullets,
        isPartOf: { '@id': `${SITE.url}/#website` },
        publisher: { '@id': `${SITE.url}/#organization` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      breadcrumbSchema(trail, canonical),
      faqSchema(tool.faq),
    ],
  });

  appendMarkup(requiredElement(document, 'head'), schema);
  const root = requiredElement(document, 'div', 'id', 'root');
  root.childNodes = [];
  appendMarkup(root, toolFallbackMarkup(tool));
  return serialize(document);
}

/* -------------------------------------------------------- tool directory */

function renderToolDirectory() {
  const trail = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
  ];

  const groups = CATEGORY_GROUPS.map((group) => {
    const tools = getToolPagesByCategory(group.id);
    if (!tools.length) return '';
    return `      <h2 id="${group.id}">${escapeHtml(group.heading)}</h2>
      <p>${escapeHtml(group.blurb)}</p>
      ${toolCardsHtml(tools.map((tool) => tool.slug))}`;
  })
    .filter(Boolean)
    .join('\n\n');

  const body = `      ${breadcrumbHtml(trail)}
      <ul class="chips">${POPULAR_TOOL_SLUGS.map((slug) => {
        const tool = getToolPage(slug);
        return tool ? `<li><a href="/${tool.slug}">${escapeHtml(tool.name)}</a></li>` : '';
      }).join('')}</ul>

${groups}
`;

  return renderPage({
    pathname: '/tools',
    title: `All Developer Tools — ${TOOL_PAGES.length} Offline Utilities | Toolbit`,
    description: `Browse all ${TOOL_PAGES.length} Toolbit developer tools: JSON, YAML and XML formatters, JWT and Base64 decoders, regex tester, hash and UUID generators, API client and more. All offline, all local.`,
    keywords:
      'developer tools, online developer tools, offline developer tools, json formatter, jwt decoder, regex tester, hash generator',
    hero: {
      eyebrow: 'Tool directory',
      stats: [
        [`${TOOL_PAGES.length}`, 'developer tools'],
        [`${CATEGORY_GROUPS.length}`, 'categories'],
        ['100%', 'local processing'],
      ],
    },
    heroTitle: `All ${TOOL_PAGES.length} Toolbit developer tools`,
    heroLede:
      'Every Toolbit utility, grouped by what it does. Each one runs entirely in your browser: nothing is uploaded, nothing is tracked, and everything keeps working offline once the app is installed.',
    body,
    schema: [
      breadcrumbSchema(trail, absoluteUrl('/tools')),
      {
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/tools')}#collection`,
        name: 'Toolbit developer tools',
        url: absoluteUrl('/tools'),
        isPartOf: { '@id': `${SITE.url}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: TOOL_PAGES.length,
          itemListElement: TOOL_PAGES.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: tool.name,
            url: absoluteUrl(`/${tool.slug}`),
          })),
        },
      },
    ],
  });
}

/* --------------------------------------------------- comparison + guides */

function renderComparisonPage(page) {
  const canonical = absoluteUrl(`/compare/${page.slug}`);
  const trail = [
    { name: 'Home', url: '/' },
    { name: 'Comparisons', url: '/compare' },
    { name: `Toolbit vs ${page.competitor}`, url: `/compare/${page.slug}` },
  ];
  const { html: sectionsHtml, toc } = sectionedHtml(page.sections);

  const body = `      ${breadcrumbHtml(trail)}
      <div class="prose">
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      ${tocHtml(toc)}

${sectionsHtml}

      <h2>Frequently asked questions</h2>
      ${faqHtml(page.faq)}

      <h2>Popular Toolbit tools</h2>
      ${toolCardsHtml(POPULAR_TOOL_SLUGS.slice(0, 6))}
      </div>
      ${ctaBandHtml('Try the local-first alternative', 'Open Toolbit in your browser — no install, no sign-up — and run any of the 42 tools on your own data.')}
`;

  return renderPage({
    pathname: `/compare/${page.slug}`,
    title: page.title,
    description: page.description,
    keywords: `toolbit vs ${page.competitor.toLowerCase()}, ${page.competitor.toLowerCase()} alternative, offline developer tools, local-first developer tools`,
    body,
    schema: [breadcrumbSchema(trail, canonical), faqSchema(page.faq)],
  });
}

function renderCompareHub() {
  const canonical = absoluteUrl('/compare');
  const trail = [
    { name: 'Home', url: '/' },
    { name: 'Comparisons', url: '/compare' },
  ];
  const cards = COMPARISON_PAGES.map(
    (page) => `<li><a href="/compare/${page.slug}">
        <span class="name">${escapeHtml(page.h1)}</span>
        <span class="desc">${escapeHtml(cardSummary(page.lede))}</span>
      </a></li>`,
  ).join('\n      ');

  const body = `      ${breadcrumbHtml(trail)}
      <ul class="cards">
      ${cards}
      </ul>
      ${ctaBandHtml('See the difference on your own data', 'Every comparison above ends the same way: paste real input into Toolbit and watch it stay in the tab.')}
`;

  return renderPage({
    pathname: '/compare',
    title: 'Toolbit vs Alternatives — DevToys, CyberChef, Postman | Toolbit',
    description:
      'How Toolbit compares with DevToys, CyberChef, and Postman: offline coverage, tool breadth, privacy, and platform support. Local-first developer tools in the browser.',
    keywords:
      'toolbit vs devtoys, toolbit vs cyberchef, toolbit vs postman, offline developer tools comparison',
    hero: {
      eyebrow: 'Comparisons',
      stats: [[`${COMPARISON_PAGES.length}`, 'in-depth comparisons']],
    },
    heroTitle: 'Toolbit compared with the tools it replaces',
    heroLede:
      'Honest, specific comparisons against the desktop toolboxes, web utilities, and API clients developers already use — what overlaps, what differs, and which to reach for.',
    body,
    schema: [
      breadcrumbSchema(trail, canonical),
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#collection`,
        name: 'Toolbit comparisons',
        url: canonical,
        isPartOf: { '@id': `${SITE.url}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: COMPARISON_PAGES.length,
          itemListElement: COMPARISON_PAGES.map((page, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: page.h1,
            url: absoluteUrl(`/compare/${page.slug}`),
          })),
        },
      },
    ],
  });
}

function renderGuidePage(page) {
  const canonical = absoluteUrl(`/${page.slug}`);
  const trail = [
    { name: 'Home', url: '/' },
    { name: page.h1, url: `/${page.slug}` },
  ];
  const { html: sectionsHtml, toc } = sectionedHtml(page.sections);

  const body = `      ${breadcrumbHtml(trail)}
      <div class="prose">
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      ${tocHtml(toc)}

${sectionsHtml}

      <h2>Start with these tools</h2>
      ${toolCardsHtml(page.toolHighlights)}

      <h2>Frequently asked questions</h2>
      ${faqHtml(page.faq)}
      </div>
      ${ctaBandHtml('Put the guide into practice', 'Open the workspace and run any of the tools below on your own input — nothing leaves the tab.')}
`;

  return renderPage({
    pathname: `/${page.slug}`,
    title: page.title,
    description: page.description,
    keywords: `${page.slug.replace(/-/g, ' ')}, offline developer tools, local-first developer tools, browser developer tools`,
    ogType: 'article',
    body,
    schema: [
      breadcrumbSchema(trail, canonical),
      faqSchema(page.faq),
      {
        '@type': 'Article',
        headline: page.h1,
        description: page.description,
        url: canonical,
        image: absoluteUrl(SITE.ogImage),
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE.url}/#website` },
        publisher: { '@id': `${SITE.url}/#organization` },
        author: { '@id': `${SITE.url}/#organization` },
        mainEntityOfPage: canonical,
      },
    ],
  });
}

/* -------------------------------------------------------------- legal */

function legalInlineHtml(text) {
  return escapeHtml(text).replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, href) => `<a href="${href}">${label}</a>`,
  );
}

function renderLegalPage(page) {
  const canonical = absoluteUrl(`/${page.slug}`);
  const trail = [
    { name: 'Home', url: '/' },
    { name: page.h1, url: `/${page.slug}` },
  ];
  const toc = page.sections.map((section) => ({ id: slugify(section.h2), text: section.h2 }));

  const sectionsHtml = page.sections
    .map(
      (section) => `      <h2 id="${slugify(section.h2)}">${escapeHtml(section.h2)}</h2>
${section.paragraphs.map((p) => `      <p>${legalInlineHtml(p)}</p>`).join('\n')}
${
  section.bullets
    ? `      <ul>${section.bullets.map((b) => `<li>${legalInlineHtml(b)}</li>`).join('')}</ul>`
    : ''
}${
        section.h2 === 'Contact Us' && page.contactEmail
          ? `      <p><a href="mailto:${page.contactEmail}">${page.contactEmail}</a></p>`
          : ''
      }`,
    )
    .join('\n\n');

  const body = `      ${breadcrumbHtml(trail)}
      <div class="prose">
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="note">Last updated: ${formatDate(page.updated)}</p>
      <p class="lede">${escapeHtml(page.lede)}</p>
      ${tocHtml(toc)}

${sectionsHtml}
      </div>
`;

  return renderPage({
    pathname: `/${page.slug}`,
    title: page.title,
    description: page.description,
    ogType: 'article',
    modifiedTime: page.updated,
    body,
    schema: [
      breadcrumbSchema(trail, canonical),
      {
        '@type': 'Article',
        headline: page.h1,
        description: page.description,
        url: canonical,
        dateModified: page.updated,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE.url}/#website` },
        publisher: { '@id': `${SITE.url}/#organization` },
        author: { '@id': `${SITE.url}/#organization` },
        mainEntityOfPage: canonical,
      },
    ],
  });
}

/* -------------------------------------------------------------- blog */

function renderBlogIndex() {
  const trail = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
  ];

  const posts = BLOG_POSTS.map(
    (post) => `<li><a href="/blog/${post.slug}">
        <span class="name">${escapeHtml(post.h1)}</span>
        <span class="desc">${escapeHtml(post.description)}</span>
        <span class="desc" style="margin-top:.4rem"><time datetime="${post.date}">${formatDate(post.date)}</time> · ${escapeHtml(post.readingTime)}</span>
      </a></li>`,
  ).join('\n      ');

  const body = `      ${breadcrumbHtml(trail)}
      <h2>Latest posts</h2>
      <ul class="cards">
      ${posts}
      </ul>
`;

  return renderPage({
    pathname: '/blog',
    title: 'Blog — Local-First Development Notes | Toolbit',
    description:
      'Practical notes on developer tooling, secret handling, and data formats — from the team behind the local-first Toolbit workspace.',
    keywords:
      'developer blog, local-first development, jwt security, cron expressions, base64 encoding',
    hero: { eyebrow: 'Blog', stats: [[`${BLOG_POSTS.length}`, 'published notes']] },
    heroTitle: 'The Toolbit blog',
    heroLede:
      'Notes on the things that surround everyday development work: handling secrets safely, the formats we all half-remember, and why running tools locally changes what you can safely paste into them.',
    body,
    schema: [
      breadcrumbSchema(trail, absoluteUrl('/blog')),
      {
        '@type': 'Blog',
        '@id': `${absoluteUrl('/blog')}#blog`,
        name: 'The Toolbit blog',
        url: absoluteUrl('/blog'),
        isPartOf: { '@id': `${SITE.url}/#website` },
        publisher: { '@id': `${SITE.url}/#organization` },
        blogPost: BLOG_POSTS.map((post) => ({
          '@type': 'BlogPosting',
          headline: post.h1,
          url: absoluteUrl(`/blog/${post.slug}`),
          datePublished: post.date,
          description: post.description,
        })),
      },
    ],
  });
}

function renderBlogPost(post) {
  const canonical = absoluteUrl(`/blog/${post.slug}`);
  const trail = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.h1, url: `/blog/${post.slug}` },
  ];
  const toc = [
    ...post.sections.map((section) => ({ id: slugify(section.h2), text: section.h2 })),
    { id: 'frequently-asked-questions', text: 'Frequently asked questions' },
    { id: 'tools-mentioned-in-this-post', text: 'Tools mentioned in this post' },
  ];

  const body = `      ${breadcrumbHtml(trail)}
      <div class="prose">
      <h1>${escapeHtml(post.h1)}</h1>
      <p class="note"><time datetime="${post.date}">${formatDate(post.date)}</time> · ${escapeHtml(post.readingTime)}</p>
      <p class="lede">${escapeHtml(post.lede)}</p>
      ${tocHtml(toc)}

${post.sections
  .map(
    (section) =>
      `      <h2 id="${slugify(section.h2)}">${escapeHtml(section.h2)}</h2>\n${section.paragraphs
        .map((paragraph) => `      <p>${escapeHtml(paragraph)}</p>`)
        .join('\n')}`,
  )
  .join('\n\n')}

      <h2 id="frequently-asked-questions">Frequently asked questions</h2>
      ${faqHtml(post.faq)}

      <h2 id="tools-mentioned-in-this-post">Tools mentioned in this post</h2>
      ${toolCardsHtml(post.tools)}
      </div>
      ${ctaBandHtml('Try it on your own data', 'Open Toolbit and run the tools from this post locally — nothing leaves your browser.')}
`;

  return renderPage({
    pathname: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
    ogType: 'article',
    publishedTime: post.date,
    modifiedTime: post.date,
    body,
    schema: [
      breadcrumbSchema(trail, canonical),
      faqSchema(post.faq),
      {
        '@type': 'BlogPosting',
        headline: post.h1,
        description: post.description,
        url: canonical,
        datePublished: post.date,
        dateModified: post.date,
        image: absoluteUrl(ogImageFor(`/blog/${post.slug}`)),
        inLanguage: 'en',
        isPartOf: { '@id': `${absoluteUrl('/blog')}#blog` },
        publisher: { '@id': `${SITE.url}/#organization` },
        author: { '@id': `${SITE.url}/#organization` },
        mainEntityOfPage: canonical,
      },
    ],
  });
}

/* ----------------------------------------------- homepage prerender inject */

function homeFallbackMarkup() {
  const categorySections = CATEGORY_GROUPS.map((group) => {
    const tools = getToolPagesByCategory(group.id);
    if (!tools.length) return '';
    return `<section>
      <h2>${escapeHtml(group.heading)}</h2>
      <p>${escapeHtml(group.blurb)}</p>
      <ul class="tb-boot-links">${tools
        .map((tool) => `<li><a href="/${tool.slug}">${escapeHtml(tool.name)}</a></li>`)
        .join('')}</ul>
    </section>`;
  })
    .filter(Boolean)
    .join('\n    ');

  return `<div class="tb-boot">
    <div class="tb-boot-brand"><img src="/icon.svg" alt="" width="28" height="28" />Toolbit</div>
    <h1>Developer Workspace for JSON, JWT, API and Data Tools</h1>
    <p class="tb-boot-lede">Toolbit is a local-first developer workspace with ${TOOL_PAGES.length} offline tools — JSON formatter, JWT decoder, Base64 encoder, regex tester, SQL formatter, YAML formatter, UUID generator, hash generator, cron parser, CSV to JSON converter and more. Everything runs in your browser: no uploads, no tracking, no sign-up.</p>

    <section>
      <h2>Popular tools</h2>
      <ul class="tb-boot-links">${POPULAR_TOOL_SLUGS.map((slug) => {
        const tool = getToolPage(slug);
        return tool ? `<li><a href="/${tool.slug}">${escapeHtml(tool.name)}</a></li>` : '';
      }).join('')}</ul>
    </section>

    ${categorySections}

    <section>
      <h2>Why Toolbit?</h2>
      <div class="tb-boot-grid">${WHY_TOOLBIT.map(
        (item) => `<div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></div>`,
      ).join('')}</div>
    </section>

    <section>
      <h2>Frequently asked questions</h2>
      <dl class="tb-boot-faq">${SITE_FAQ.map(
        (entry) => `<dt>${escapeHtml(entry.q)}</dt><dd>${escapeHtml(entry.a)}</dd>`,
      ).join('')}</dl>
    </section>

    <section>
      <h2>From the blog</h2>
      <ul class="tb-boot-links">${BLOG_POSTS.map(
        (post) => `<li><a href="/blog/${post.slug}">${escapeHtml(post.h1)}</a></li>`,
      ).join('')}</ul>
    </section>

    <div class="tb-boot-footer">
      <nav>${FOOTER_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
      <p>Toolbit is free and open source under the MIT licence. <a href="${SITE.github}">Source on GitHub</a>.</p>
    </div>
  </div>`;
}

/**
 * Preloads the UI font in the built entry points.
 *
 * Geist is referenced from the stylesheet, so the browser only discovers it
 * after the CSS parses — a second round trip before any text renders in the
 * right face. The filename is content-hashed, so this has to happen after the
 * bundle exists rather than in the source HTML.
 */
function injectFontPreload() {
  const fontsDir = path.join(outDir, 'assets');
  if (!existsSync(fontsDir)) return 0;

  const geist = readdirSync(fontsDir).find((file) => /^Geist.*\.woff2$/.test(file));
  if (!geist) return 0;

  const tag = `<link rel="preload" href="/assets/${geist}" as="font" type="font/woff2" crossorigin />`;
  let patched = 0;

  for (const entry of ['index.html', 'about.html']) {
    const target = path.join(outDir, entry);
    if (!existsSync(target)) continue;

    let html = readFileSync(target, 'utf8');
    if (html.includes(tag)) continue;

    html = html.replace('</head>', `  ${tag}\n</head>`);
    writeFileSync(target, html);
    patched += 1;
  }

  return patched;
}

function injectHomeFallback() {
  const target = path.join(outDir, 'index.html');
  if (!existsSync(target)) {
    console.warn(`  ! ${path.relative(root, target)} not found — skipping homepage prerender`);
    return false;
  }

  let html = readFileSync(target, 'utf8');

  if (!/<div id="root">\s*<\/div>/.test(html)) {
    console.warn('  ! #root is not empty in the built index.html — skipping homepage prerender');
    return false;
  }

  html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${homeFallbackMarkup()}</div>`);

  const homeFaq = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE.url}/#page`,
        name: SITE.title,
        url: SITE.url,
        description: SITE.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE.url}/#website` },
      },
      faqSchema(SITE_FAQ),
    ],
  });
  html = html.replace('</head>', `${homeFaq}\n</head>`);

  writeFileSync(target, html);
  return true;
}

/* ------------------------------------------------------- sitemap + robots */

function writeSitemap() {
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/tools', priority: '0.9', changefreq: 'weekly' },
    ...GUIDE_PAGES.map((page) => ({
      loc: `/${page.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
    })),
    ...COMPARISON_PAGES.map((page) => ({
      loc: `/compare/${page.slug}`,
      priority: '0.7',
      changefreq: 'monthly',
    })),
    { loc: '/compare', priority: '0.8', changefreq: 'monthly' },
    ...TOOL_PAGES.map((tool) => ({ loc: `/${tool.slug}`, priority: '0.9', changefreq: 'monthly' })),
    { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
    ...BLOG_POSTS.map((post) => ({
      loc: `/blog/${post.slug}`,
      priority: '0.6',
      changefreq: 'yearly',
      lastmod: post.date,
    })),
    { loc: '/about', priority: '0.6', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url><loc>${absoluteUrl(url.loc)}</loc><lastmod>${url.lastmod ?? buildDate}</lastmod><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;

  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
  return urls.length;
}

function writeRobots() {
  const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`;
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'robots.txt'), robots);
}

/* -------------------------------------------------------------- generate */

mkdirSync(outDir, { recursive: true });

// Captured before the homepage prerender is injected, so every tool page
// starts from the same untouched shell.
const shellPath = path.join(outDir, 'index.html');
const shell = existsSync(shellPath) ? readFileSync(shellPath, 'utf8') : null;

let count = 0;
writePage('/tools', renderToolDirectory());
count += 1;

let toolShells = 0;
if (shell) {
  for (const tool of TOOL_PAGES) {
    writePage(`/${tool.slug}`, renderToolShell(tool, shell));
    toolShells += 1;
    count += 1;
  }
} else {
  console.warn('  ! dist/index.html not found — skipping per-tool app shells');
}

for (const page of COMPARISON_PAGES) {
  writePage(`/compare/${page.slug}`, renderComparisonPage(page));
  count += 1;
}

writePage('/compare', renderCompareHub());
count += 1;

for (const page of GUIDE_PAGES) {
  writePage(`/${page.slug}`, renderGuidePage(page));
  count += 1;
}

writePage('/blog', renderBlogIndex());
count += 1;

for (const page of LEGAL_PAGES) {
  writePage(`/${page.slug}`, renderLegalPage(page));
  count += 1;
}

for (const post of BLOG_POSTS) {
  writePage(`/blog/${post.slug}`, renderBlogPost(post));
  count += 1;
}

const urlCount = writeSitemap();
writeRobots();
const prerendered = injectHomeFallback();
const preloaded = injectFontPreload();

console.log(
  `SEO: wrote ${count} pages to ${path.relative(root, outDir) || '.'}/ (${toolShells} of them prerendered app shells)`,
);
console.log(
  `SEO: sitemap.xml lists ${urlCount} URLs, robots.txt points at ${absoluteUrl('/sitemap.xml')}`,
);
console.log(`SEO: homepage prerender ${prerendered ? 'injected into index.html' : 'skipped'}`);
console.log(`SEO: font preload added to ${preloaded} entry point(s)`);
