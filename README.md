# Toolbit

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Local‑First](https://img.shields.io/badge/local--first-yes-0ea5e9.svg)](https://toolbit.app)
[![Privacy](https://img.shields.io/badge/privacy-local--first-22c55e.svg)](https://toolbit.app/privacy)
[![PWA](https://img.shields.io/badge/pwa-ready-6366f1.svg)](https://toolbit.app)

Local‑first developer tools for JSON, Base64, JWT, YAML, XML, SQL, and more. Toolbit runs entirely in your browser or installed PWA: processed content stays on your device and no server-side processing is required.

**Why Toolbit**
- 100% local processing and offline‑friendly
- Web app with installable PWA support
- Fast, keyboard‑first UX for daily dev workflows
- Privacy-focused: local processing and optional minimized product analytics

## Highlights
- Smart paste: deterministic detection of input type and jump to the right tool
- Tool chaining: send output to the next tool and save workflows
- History, snippets, and workspaces stored locally
- PWA installable on desktop and mobile

## Tool Categories
- Format & Validate: JSON, YAML, XML, SQL, GraphQL, JSON Schema
- Encode & Decode: Base64, URL, HTML, JWT, Certificates, Protobuf
- Generate: UUID, Passwords, Hashes, Fake Data, QR Codes
- Transform: CSV↔JSON, Case Converter, Timestamp, Color, Unit
- Analyze: Regex, Diff, Git Diff, Cron, HTTP Status Codes
- Build: API Request Builder, WebSocket Tester, Docker Builder
- Text & Docs: Markdown, PDF tools, Whitespace, Word Counter

## Demo
- Web app: [toolbit.app](https://toolbit.app)

## Screenshots
![Toolbit App Home](https://toolbit.app/screenshots/app-home.png)
![Toolbit Tool View](https://toolbit.app/screenshots/tool-view.png)

## Getting Started

### Prerequisites
- Node.js 24 LTS (see `.nvmrc`)
- npm

### Install
```bash
git clone https://github.com/alwin-augustin/toolbit.git
cd toolbit
npm install
```

### Web (local dev)
```bash
npm run web:dev
```

### Web (production build)
```bash
npm run web:build
npm run preview
```

## Quality Checks
```bash
npm run check
npm run lint
npm run test
```

## Privacy
Toolbit is privacy‑first by design.
- Local transforms do not upload payloads; HTTP and WebSocket tools contact endpoints when requested
- No cookies
- Optional minimized product analytics uses a pseudonymous device ID; tool inputs and outputs are excluded
- LocalStorage and IndexedDB hold preferences, normal tool history and explicitly saved workspaces/snippets; secret tool history is disabled. Recipes contain settings only.

See `/privacy` for the full policy.

## Architecture
- React 19 + TypeScript + Vite
- Zustand for client state
- PWA via `vite-plugin-pwa`

## SEO and prerendering
The app is client‑rendered, so `npm run web:build` runs `vite build` and then
`scripts/generate-seo-pages.mjs`, which prerenders the crawlable surface into
`dist/`:

- the app shell for every tool at `/<slug>`, with that tool described in `#root`
- `/tools`, the tool directory
- comparison pages under `/compare/` and long‑form guides
- `sitemap.xml` and `robots.txt`
- real HTML injected into `dist/index.html`'s `#root`, replaced by React on mount

All of that copy lives in `src/seo/seo-content.js`, which the app imports too —
`src/seo/use-seo.ts` uses it to set per‑route title, description, and canonical.
Editing a tool's marketing copy means editing that one file.

Tools are served from the root — `/json-formatter`, not `/app/json-formatter`.
Each one is a real HTML file containing the full app shell, so the URL both
reads as a page to a crawler and boots straight into the tool in a browser.
`public/_redirects` keeps the old `/app/*` URLs alive with a 301.

```bash
npm run seo:generate     # regenerate static pages into dist/
npm run seo:og-image     # re-render the Open Graph cards (needs Chromium)
npm run seo:screenshots  # recapture app screenshots (needs a build first)
```

`seo:og-image` renders one 1200x630 card per page into `public/og/`, and
`seo:screenshots` captures the images used by the PWA install prompt and this
README. Both are committed, so a normal build never runs them — re-run when the
branding changes or the UI moves. Both shell out to Chromium and use Pillow
(`pip install pillow`) to palette-quantise the output if it is available.

## Contributing
Pull requests are welcome.
- Run `npm run check` and `npm run lint`
- Add or update tests where appropriate
- Keep changes scoped and documented

## Security
Please report security issues via GitHub issues or email: alwinaugustin@gmail.com

## License
MIT — see `LICENSE`.
