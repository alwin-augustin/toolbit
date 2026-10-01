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
 * Run automatically as part of `npm run web:build`, or on its own:
 *
 *     node scripts/generate-seo-pages.mjs [--out dist]
 */

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
    POPULAR_TOOL_SLUGS,
    getToolPage,
    getToolPagesByCategory,
    absoluteUrl,
} from '../src/seo/seo-content.js';

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

const PAGE_CSS = `
:root {
  color-scheme: light;
  --bg: #ffffff;
  --surface: #f7f8fa;
  --fg: #14161a;
  --muted: #5b6070;
  --line: #e3e5ea;
  --accent: #2f52c8;
  --accent-fg: #ffffff;
}
html.dark {
  color-scheme: dark;
  --bg: #17181c;
  --surface: #1e1f24;
  --fg: #eceef3;
  --muted: #a1a6b4;
  --line: #2b2d34;
  --accent: #93a9ff;
  --accent-fg: #14161a;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.wrap { max-width: 64rem; margin: 0 auto; padding: 0 1.5rem; }
.topbar { border-bottom: 1px solid var(--line); background: var(--bg); }
.topbar .wrap { display: flex; align-items: center; gap: 1.25rem; height: 4rem; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: .55rem; font-weight: 650; color: var(--fg); font-size: 1.05rem; }
.brand img { width: 26px; height: 26px; }
.topbar nav { display: flex; gap: 1.1rem; font-size: .93rem; margin-left: auto; flex-wrap: wrap; }
.topbar nav a { color: var(--muted); }
.topbar nav a:hover { color: var(--fg); }
main { padding: 2.5rem 0 3rem; }
.crumbs { font-size: .85rem; color: var(--muted); margin-bottom: 1.25rem; }
.crumbs a { color: var(--muted); }
.crumbs span { margin: 0 .4rem; opacity: .6; }
h1 { font-size: clamp(1.9rem, 4.2vw, 2.7rem); line-height: 1.15; letter-spacing: -.022em; margin: 0 0 1rem; }
h2 { font-size: 1.3rem; letter-spacing: -.012em; margin: 2.5rem 0 .75rem; }
h3 { font-size: 1rem; margin: 0 0 .25rem; }
p { margin: 0 0 1rem; }
.lede { font-size: 1.1rem; color: var(--muted); max-width: 46rem; }
ul, ol { margin: 0 0 1rem; padding-left: 1.2rem; color: var(--muted); }
li { margin: .3rem 0; }
li strong { color: var(--fg); }
.cta { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1.5rem 0 .5rem; }
.btn {
  display: inline-block; padding: .6rem 1.15rem; border-radius: .5rem;
  background: var(--accent); color: var(--accent-fg); font-weight: 600; font-size: .95rem;
}
.btn:hover { text-decoration: none; opacity: .92; }
.btn.ghost { background: transparent; color: var(--fg); border: 1px solid var(--line); }
.note { font-size: .88rem; color: var(--muted); }
.chips { display: flex; flex-wrap: wrap; gap: .5rem; padding: 0; margin: 0 0 1rem; list-style: none; }
.chips li { margin: 0; }
.chips a {
  display: inline-block; padding: .3rem .75rem; border: 1px solid var(--line);
  border-radius: 999px; font-size: .9rem; color: var(--fg); background: var(--surface);
}
.cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); padding: 0; margin: 0 0 1rem; list-style: none; }
.cards li { margin: 0; }
.cards a {
  display: block; height: 100%; padding: .9rem 1rem; border: 1px solid var(--line);
  border-radius: .65rem; background: var(--surface); color: var(--fg);
}
.cards a:hover { border-color: var(--accent); text-decoration: none; }
.cards .name { font-weight: 600; display: block; margin-bottom: .15rem; }
.cards .desc { font-size: .88rem; color: var(--muted); display: block; line-height: 1.5; }
dl.faq { margin: 0; }
dl.faq dt { font-weight: 600; margin-top: 1.1rem; }
dl.faq dd { margin: .2rem 0 0; color: var(--muted); }
footer { border-top: 1px solid var(--line); margin-top: 3rem; padding: 1.75rem 0 2.5rem; font-size: .9rem; color: var(--muted); }
footer nav { display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; margin-bottom: .75rem; }
`.trim();

const NAV_LINKS = [
    ['/tools', 'All tools'],
    ['/developer-toolbox', 'Developer toolbox'],
    ['/offline-developer-tools', 'Offline tools'],
    ['/compare/toolbit-vs-devtoys', 'Comparisons'],
    ['/blog', 'Blog'],
    ['/about', 'About'],
];

const FOOTER_LINKS = [
    ['/', 'Toolbit workspace'],
    ['/tools', 'All tools'],
    ['/blog', 'Blog'],
    ['/local-first-developer-tools', 'Local-first tools'],
    ['/offline-developer-tools', 'Offline tools'],
    ['/developer-toolbox', 'Developer toolbox'],
    ['/compare/toolbit-vs-devtoys', 'vs DevToys'],
    ['/compare/toolbit-vs-cyberchef', 'vs CyberChef'],
    ['/compare/toolbit-vs-postman', 'vs Postman'],
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms'],
];

/** Social card for a page: a generated per-page card, or the site card. */
function ogImageFor(pathname) {
    const slug = pathname.replace(/^\//, '').replace(/\//g, '-');
    return existsSync(path.join(root, 'public/og', `${slug}.png`))
        ? `/og/${slug}.png`
        : SITE.ogImage;
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

function breadcrumbSchema(trail) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: absoluteUrl(crumb.url),
        })),
    };
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
 */
function renderPage(page) {
    const canonical = absoluteUrl(page.pathname);
    const graph = page.schema ?? [];
    const ogImage = absoluteUrl(ogImageFor(page.pathname));
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
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE.name}" />
  <meta property="og:locale" content="${SITE.locale}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.description)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="icon" type="image/svg+xml" href="/icon.svg?v=2" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
  <link rel="shortcut icon" href="/favicon.ico?v=2" />
  <link rel="mask-icon" href="/mask-icon.svg" color="#3D63DD" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1e40af" />
  <script src="/theme-init.js"></script>
  <style>${PAGE_CSS}</style>
  ${graph.length ? jsonLd({ '@context': 'https://schema.org', '@graph': graph }) : ''}
</head>
<body>
  <header class="topbar">
    <div class="wrap">
      <a class="brand" href="/"><img src="/icon.svg" alt="" width="26" height="26" />Toolbit</a>
      <nav>${NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
    </div>
  </header>
  <main>
    <div class="wrap">
${page.body}
    </div>
  </main>
  <footer>
    <div class="wrap">
      <nav>${FOOTER_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
      <p class="note">Toolbit runs entirely in your browser. Your data is never uploaded, and nothing is tracked. Open source under the MIT licence — <a href="${SITE.github}">source on GitHub</a>.</p>
    </div>
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
function replaceOnce(html, pattern, replacement, label) {
    if (!pattern.test(html)) {
        throw new Error(
            `SEO: could not find ${label} in the built index.html — the shell template and this script have drifted.`,
        );
    }
    return html.replace(pattern, replacement);
}

const metaPattern = (attr, key) =>
    new RegExp(`(<meta ${attr}="${key.replace(/[:]/g, '[:]')}" content=")[^"]*(")`);

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
    let html = shell;

    html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(tool.title)}</title>`, '<title>');
    html = replaceOnce(html, metaPattern('name', 'title'), `$1${escapeHtml(tool.title)}$2`, 'meta[name=title]');
    html = replaceOnce(
        html,
        metaPattern('name', 'description'),
        `$1${escapeHtml(tool.description)}$2`,
        'meta[name=description]',
    );
    html = replaceOnce(
        html,
        metaPattern('name', 'keywords'),
        `$1${escapeHtml(tool.keywords.join(', '))}$2`,
        'meta[name=keywords]',
    );
    html = replaceOnce(
        html,
        /(<link rel="canonical" href=")[^"]*(")/,
        `$1${canonical}$2`,
        'link[rel=canonical]',
    );

    for (const [attr, key, value] of [
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
    ]) {
        html = replaceOnce(html, metaPattern(attr, key), `$1${escapeHtml(value)}$2`, `meta[${attr}=${key}]`);
    }

    const trail = [
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
        { name: tool.name, url: pathname },
    ];

    const schema = jsonLd({
        '@context': 'https://schema.org',
        '@graph': [
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
            breadcrumbSchema(trail),
            faqSchema(tool.faq),
        ],
    });

    html = replaceOnce(html, /<\/head>/, `${schema}\n</head>`, '</head>');
    html = replaceOnce(
        html,
        /<div id="root">\s*<\/div>/,
        `<div id="root">${toolFallbackMarkup(tool)}</div>`,
        'empty #root',
    );

    return html;
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
      <h1>All ${TOOL_PAGES.length} Toolbit developer tools</h1>
      <p class="lede">Every Toolbit utility, grouped by what it does. Each one runs entirely in your browser: nothing is uploaded, nothing is tracked, and everything keeps working offline once the app is installed.</p>
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
        keywords: 'developer tools, online developer tools, offline developer tools, json formatter, jwt decoder, regex tester, hash generator',
        body,
        schema: [
            breadcrumbSchema(trail),
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
    const trail = [
        { name: 'Home', url: '/' },
        { name: 'Comparisons', url: '/tools' },
        { name: `Toolbit vs ${page.competitor}`, url: `/compare/${page.slug}` },
    ];

    const body = `      ${breadcrumbHtml(trail)}
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      <div class="cta">
        <a class="btn" href="/">Open Toolbit</a>
        <a class="btn ghost" href="/tools">See all ${TOOL_PAGES.length} tools</a>
      </div>

${page.sections
    .map((section) => `      <h2>${escapeHtml(section.h2)}</h2>\n      <p>${escapeHtml(section.body)}</p>`)
    .join('\n\n')}

      <h2>Frequently asked questions</h2>
      ${faqHtml(page.faq)}

      <h2>Popular Toolbit tools</h2>
      ${toolCardsHtml(POPULAR_TOOL_SLUGS.slice(0, 6))}
`;

    return renderPage({
        pathname: `/compare/${page.slug}`,
        title: page.title,
        description: page.description,
        keywords: `toolbit vs ${page.competitor.toLowerCase()}, ${page.competitor.toLowerCase()} alternative, offline developer tools, local-first developer tools`,
        body,
        schema: [breadcrumbSchema(trail), faqSchema(page.faq)],
    });
}

function renderGuidePage(page) {
    const trail = [
        { name: 'Home', url: '/' },
        { name: page.h1, url: `/${page.slug}` },
    ];

    const body = `      ${breadcrumbHtml(trail)}
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      <div class="cta">
        <a class="btn" href="/">Open Toolbit</a>
        <a class="btn ghost" href="/tools">Browse all ${TOOL_PAGES.length} tools</a>
      </div>

${page.sections
    .map((section) => `      <h2>${escapeHtml(section.h2)}</h2>\n      <p>${escapeHtml(section.body)}</p>`)
    .join('\n\n')}

      <h2>Start with these tools</h2>
      ${toolCardsHtml(page.toolHighlights)}

      <h2>Frequently asked questions</h2>
      ${faqHtml(page.faq)}
`;

    return renderPage({
        pathname: `/${page.slug}`,
        title: page.title,
        description: page.description,
        keywords: `${page.slug.replace(/-/g, ' ')}, offline developer tools, local-first developer tools, browser developer tools`,
        body,
        schema: [
            breadcrumbSchema(trail),
            faqSchema(page.faq),
            {
                '@type': 'Article',
                headline: page.h1,
                description: page.description,
                url: absoluteUrl(`/${page.slug}`),
                image: absoluteUrl(SITE.ogImage),
                inLanguage: 'en',
                isPartOf: { '@id': `${SITE.url}/#website` },
                publisher: { '@id': `${SITE.url}/#organization` },
                author: { '@id': `${SITE.url}/#organization` },
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
      <h1>The Toolbit blog</h1>
      <p class="lede">Notes on the things that surround everyday development work: handling secrets safely, the formats we all half-remember, and why running tools locally changes what you can safely paste into them.</p>

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
        keywords: 'developer blog, local-first development, jwt security, cron expressions, base64 encoding',
        body,
        schema: [
            breadcrumbSchema(trail),
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
    const trail = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.h1, url: `/blog/${post.slug}` },
    ];

    const body = `      ${breadcrumbHtml(trail)}
      <h1>${escapeHtml(post.h1)}</h1>
      <p class="note"><time datetime="${post.date}">${formatDate(post.date)}</time> · ${escapeHtml(post.readingTime)}</p>
      <p class="lede">${escapeHtml(post.lede)}</p>

${post.sections
    .map(
        (section) =>
            `      <h2>${escapeHtml(section.h2)}</h2>\n${section.paragraphs
                .map((paragraph) => `      <p>${escapeHtml(paragraph)}</p>`)
                .join('\n')}`,
    )
    .join('\n\n')}

      <h2>Frequently asked questions</h2>
      ${faqHtml(post.faq)}

      <h2>Tools mentioned in this post</h2>
      ${toolCardsHtml(post.tools)}
`;

    return renderPage({
        pathname: `/blog/${post.slug}`,
        title: post.title,
        description: post.description,
        body,
        schema: [
            breadcrumbSchema(trail),
            faqSchema(post.faq),
            {
                '@type': 'BlogPosting',
                headline: post.h1,
                description: post.description,
                url: absoluteUrl(`/blog/${post.slug}`),
                datePublished: post.date,
                dateModified: post.date,
                image: absoluteUrl(ogImageFor(`/blog/${post.slug}`)),
                inLanguage: 'en',
                isPartOf: { '@id': `${absoluteUrl('/blog')}#blog` },
                publisher: { '@id': `${SITE.url}/#organization` },
                author: { '@id': `${SITE.url}/#organization` },
                mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
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
    const fontsDir = path.join(outDir, 'assets/fonts');
    if (!existsSync(fontsDir)) return 0;

    const geist = readdirSync(fontsDir).find((file) => /^Geist.*\.woff2$/.test(file));
    if (!geist) return 0;

    const tag = `<link rel="preload" href="/assets/fonts/${geist}" as="font" type="font/woff2" crossorigin />`;
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

    const homeFaq = jsonLd({ '@context': 'https://schema.org', ...faqSchema(SITE_FAQ) });
    html = html.replace('</head>', `${homeFaq}\n</head>`);

    writeFileSync(target, html);
    return true;
}

/* ------------------------------------------------------- sitemap + robots */

function writeSitemap() {
    const urls = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/tools', priority: '0.9', changefreq: 'weekly' },
        ...GUIDE_PAGES.map((page) => ({ loc: `/${page.slug}`, priority: '0.8', changefreq: 'monthly' })),
        ...COMPARISON_PAGES.map((page) => ({ loc: `/compare/${page.slug}`, priority: '0.7', changefreq: 'monthly' })),
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

for (const page of GUIDE_PAGES) {
    writePage(`/${page.slug}`, renderGuidePage(page));
    count += 1;
}

writePage('/blog', renderBlogIndex());
count += 1;

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
console.log(`SEO: sitemap.xml lists ${urlCount} URLs, robots.txt points at ${absoluteUrl('/sitemap.xml')}`);
console.log(`SEO: homepage prerender ${prerendered ? 'injected into index.html' : 'skipped'}`);
console.log(`SEO: font preload added to ${preloaded} entry point(s)`);
