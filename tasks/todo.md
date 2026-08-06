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

## Not done

- **`/blog`** — deliberately skipped. An empty blog index is thin content and
  costs more in crawl quality than it earns. Worth adding with the first two or
  three real posts.
- **Per-tool Open Graph cards** — every page currently shares the site card.
  `scripts/generate-og-image.mjs` is already parameterised enough to extend if
  social previews per tool become worth the build time.
