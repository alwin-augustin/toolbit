# Toolbit

43 developer utilities in one browser workbench. [Open Toolbit](https://toolbit.app) or install it as a PWA.

JSON, YAML, SQL, JWT, regex, diffs, hashes, certificates, QR codes and more —
all transforming locally in the tab. The only tools that touch the network are
the API Request Builder and the WebSocket Tester, and they contact only the
endpoint you explicitly run. Preferences and workspace structure stay on this
device; payloads are never stored, never put in a URL, and never sent to
analytics.

## Using it

- **Paste first.** `/` takes any payload — JSON, a JWT, a diff, SQL, a
  certificate — recognises it, and opens the tool that handles it with your text
  already loaded.
- **`⌘K` anywhere** opens the command palette. `↑ ↓` to choose, `⏎` to open.
- **`⌘B`** collapses the navigator when you want the full width for a document.
- **`⌘1…9`** jumps between open documents, `⌥W` closes the current one.
- **Pin the tools you live in.** Pinned tools sit at the top of the navigator and
  on the Start screen.

Every shortcut is listed in Settings.

## Development

Use Node 24 LTS from `.nvmrc`, then:

```sh
npm ci
npm run dev
```

```sh
npm run check        # tsc
npm run lint         # eslint, zero warnings tolerated
npm run format:check # prettier
npm run test:run     # vitest, 33 files
npm run build        # vite build + prerendered SEO pages + service worker
npx playwright install chromium firefox webkit
npm run test:e2e     # Playwright (not run in CI)
```

Cloudflare Pages serves `dist/`. There is no backend for transforms — the
built site is static.

## Architecture

- `src/app/` — router, workbench shell, screens, dialogs, legal pages.
- `src/app/styles/` — the design system: `tokens.css`, `tailwind.css`, `globals.css`, `system.css`.
- `src/app/shell/` — rail, navigator, topbar, document tabs, command palette, navigation model.
- `src/features/tools/` — one folder per tool: chrome, behaviour, tests. `specs.ts` declares the generic workbench chrome.
- `src/shared/` — document state, code editor, stores, clipboard, workbench actions.
- `src/core/` — canonical tool contracts, policy, workers, persistence, telemetry, content detection.
- `src/content/` — the tool catalogue and SEO copy.
- `src/platform/` — PWA, analytics, storage helpers.

Rules: transforms go through the canonical contract (`core/tool-contract`) so the
UI, workers and recipes share semantics; saved work is sessions or snippets;
secrets are excluded from history and telemetry by default; no payload in a URL,
a log or an analytics event.

## Documentation

- [docs/design-system.md](docs/design-system.md) — tokens, type, colour, components, accessibility, contributor rules.
- [docs/ux.md](docs/ux.md) — journeys, information architecture, screens, keyboard map.
- [GLOSSARY.md](GLOSSARY.md) — the domain vocabulary (tool, document, tab, session, snippet).
- [docs/README.md](docs/README.md) — the documentation index.

MIT. See [LICENSE](LICENSE). Report security concerns to alwinaugustin@gmail.com.
