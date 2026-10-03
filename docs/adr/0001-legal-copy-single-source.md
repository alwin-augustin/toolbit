# Legal copy lives in seo-content.js, not in the page components

The privacy policy and terms of service exist in two forms: client-rendered React routes (`/privacy`, `/terms`) and prerendered static files for crawlers. Both render from `LEGAL_PAGES` in `src/content/seo/seo-content.js`, so the copy can never drift between the app and the indexed page.

## Considered Options

- **Duplicate the copy** in the generator script: simplest, but the two versions would silently diverge on the next legal edit.
- **Server-render the React pages at build time**: no SSR pipeline exists and adding one for two pages was disproportionate.
- **Drop the static files and rely on the SPA routes**: `/privacy` and `/terms` have no static file, so Pages would 404 them while the sitemap and every footer link to them.

## Consequences

Legal edits happen in exactly one place. The trade-off is that legal prose now lives in a file named `seo-content.js` — intentional, because the static pages are what search engines index — and the React pages import from it via `getLegalPage`, which reverses the usual content-flow direction.
