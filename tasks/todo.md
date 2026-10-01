# SEO overhaul — toolbit.app

Audit-driven pass over discoverability. The site moved to `toolbit.app` but every
canonical signal still pointed at `toolbit.pages.dev`, and the SPA shipped an
empty `<div id="root">` to crawlers, so only the homepage could ever rank.

## Plan

- [x] Point every canonical signal at `https://toolbit.app` (canonical, og:url,
      twitter:url, structured data, sitemap, robots).
- [x] Rewrite the homepage title and description around the terms people
      actually search for.
- [x] Expand structured data from a lone `WebApplication` into a connected
      graph: `WebSite`, `Organization`, `SoftwareApplication`, `WebApplication`,
      plus `FAQPage` and `BreadcrumbList` per page.
- [x] Give every tool its own indexable URL with unique title, description, H1,
      and structured data.
- [x] Prerender real HTML so a crawler without JavaScript sees content, with a
      single H1 and an H2 hierarchy.
- [x] Generate `sitemap.xml` and `robots.txt` from the same source of truth as
      the pages, so they cannot drift.
- [x] Add comparison and guide pages targeting alternative-seeking searches.
- [x] Ship a 1200x630 Open Graph card and a Safari `mask-icon`.
- [x] Stop the homepage paying the parse cost for CodeMirror, Prism, and the
      tool bundles.

## What was built

**`src/seo/seo-content.js`** — one source of truth for the marketing surface:
site config, per-tool copy for all 42 tools, category groupings, comparison
pages, guide pages, and the site FAQ. Plain ESM with a `.d.ts` companion so the
Vite app and the Node build script share it without a TypeScript loader.

**`scripts/generate-seo-pages.mjs`** — runs after `vite build` and emits 49
static pages (`/tools`, `/tools/<slug>` x42, `/compare/<slug>` x3, three guide
pages), `sitemap.xml`, `robots.txt`, and injects crawlable content plus
`FAQPage` schema into `dist/index.html`. The static pages are plain HTML with
inlined CSS — no bundle — and link into the app for the interactive part.

**`src/seo/use-seo.ts`** — keeps title, description, canonical, and social tags
in step with the active route. `/app/<slug>` canonicalises to `/tools/<slug>` so
the app route and its landing page never compete for the same query.

**`scripts/generate-og-image.mjs`** — renders the 1200x630 card from brand
tokens with headless Chromium. The PNG is committed; the script only reruns when
the branding changes.

**`vite.config.ts`** — vendor chunking rebuilt around one rule: a dependency
used by exactly one lazily-loaded tool should not be in the entry graph.

## Review

- Initial page load went from six JS files (~2.67 MB) to four (~825 kB).
  CodeMirror, Prism, and the tool chunks now load only when a tool opens.
- `tests/seo-content.test.ts` locks the invariants that would silently rot:
  every registered tool has a page, cross-links resolve, titles and
  descriptions are unique and within SERP limits, and nothing references
  `pages.dev`.
- Verified with `npm run lint`, `npm run check`, `npm run web:build`, and by
  rendering the built output in headless Chromium.

---

# Follow-up pass — audit findings

A second look at the deployed site and the build output, after the SEO work.

## Shipped bugs found

- [x] **CSP was blocking two tools in production.** `connect-src 'self'` on the
      live site meant `ApiRequestBuilder`'s `fetch()` and `WebSocketTester`'s
      `new WebSocket()` could not reach any external endpoint. Widened to
      `'self' https: wss:`. The privacy story is unchanged — those two tools are
      the only ones that make requests, by design, and `script-src 'self'` stays.
- [x] **`maximum-scale=1` blocked pinch-zoom on mobile** (WCAG 1.4.4). Removed;
      `about.html` never had it.

## Performance

- [x] **Fonts converted to WOFF2**: 551 kB of TTF became 220 kB, and the UI font
      is now preloaded (the hashed filename means the tag is injected
      post-build). The TTFs stay in the repo unreferenced so a design-system
      resync cannot 404.
- [x] **Deleted `public/logo.png`** — 1.4 MB, referenced nowhere, precached by
      the service worker on every first visit.
- [x] **Service worker precache 4.76 MB → 3.45 MB.** Social cards, install
      screenshots, and the orphaned `structured-data.json` are now excluded.
      Tool chunks stay precached deliberately: offline is the product, and the
      precache runs after load, so it costs bandwidth rather than time-to-interactive.
- [x] **`Cache-Control` added to `_headers`.** Cloudflare was serving
      content-hashed assets as `max-age=14400, must-revalidate`; they are now
      `immutable` for a year, with HTML entry points explicitly kept fresh.
- [x] **Removed the duplicate manifest.** The page carried two
      `<link rel="manifest">` tags — one for `public/manifest.json`, one for the
      plugin's generated copy. The plugin's is disabled; there is one file now.

## Content and polish

- [x] **`/blog` with three real posts**, each 700+ words with FAQ blocks and
      `BlogPosting` schema. A test enforces a word-count floor so a thin post
      cannot be merged.
- [x] **Per-page Open Graph cards** — 52 of them, palette-quantised to about
      50 kB each (2.6 MB total rather than 7.7 MB).
- [x] **Real app screenshots** via `scripts/generate-screenshots.mjs`, feeding
      both the PWA manifest's rich install prompt and the README images, which
      pointed at files that were not in the repo.
- [x] **Manifest `id` and `shortcuts`** so JSON Formatter, JWT Decoder, Base64
      and Regex appear in the installed app's jump list.

---

# Third pass — tools moved to the root

`/app/json-formatter` became `/json-formatter`. The `/app` segment carried no
meaning and cost a level of URL depth on every page that matters for search.

- [x] `TOOLS[].path` is now `/<id>`, and every internal link, the router, the
      workspace shell's path matching, and the SPA route table follow it.
- [x] `App.tsx` matches tool routes against the known tool ids rather than a
      bare `/:slug`, so the root namespace stays safely shared with `/about`,
      `/privacy`, `/blog`, `/tools` and the guides. An unknown slug gets the 404
      instead of an empty workspace.
- [x] **The separate `/tools/<slug>` landing pages are gone.** Each tool is now
      a real HTML file at `/<slug>` containing the built app shell — same
      bundle, same stylesheet — with the head metadata swapped and the tool
      described inside `#root`. A crawler reads ~300 words of real text; a
      browser boots straight into the tool. One URL per tool, and the "landing
      page, then click through to the app" detour is gone.
- [x] `public/_redirects` 301s `/app/*` and the short-lived `/tools/<slug>` to
      the new URLs, and `App.tsx` keeps a client-side redirect for browser navigation
      build's hash router.
- [x] The shell patcher throws if it cannot find a tag it expects to rewrite,
      so a change to `index.html` fails the build rather than silently shipping
      42 pages with the homepage's metadata.
- [x] Two tests guard the new shape: every tool path is `/<id>`, and no tool
      slug collides with a reserved top-level page.

## Still open — needs someone with dashboard access

- **`toolbit.pages.dev` returns 200 and serves the old build.** Canonical tags
  are a hint, not a redirect; until the Pages domain 301s to `toolbit.app` the
  two keep competing. This is a Cloudflare setting, not a code change.
- **Post-deploy:** confirm Cloudflare's trailing-slash behaviour matches the
  canonical form emitted here (`/tools/json-formatter`, no slash), and submit
  the sitemap in Search Console.
- **Not attempted:** the 103 kB render-blocking stylesheet, and the ~385 kB
  `vendor` chunk that is mostly `tailwind-merge`'s class table. Both are real
  but need more care than a mechanical fix.
