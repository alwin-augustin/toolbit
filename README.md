# Toolbit

Local developer utilities in a browser workbench. [Open Toolbit](https://toolbit.app) or install it as a PWA.

JSON, Base64, JWT, YAML, SQL, hashes, text and other transforms run locally. HTTP and WebSocket tools contact the endpoints you explicitly choose. Preferences, normal history and saved workspaces stay in browser storage. Sensitive tools do not save history.

## Development

Use Node 24 LTS from `.nvmrc`, then:

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run lint
npm run format:check
npm run test:run
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Production builds generate static search pages before creating the final offline cache. Cloudflare Pages hosts `dist/`; no backend is needed for local transforms.

## Architecture

- `src/app/` — router, workbench shell, screens, dialogs.
- `src/features/tools/` — one folder per tool: spec, chrome wiring, tests.
- `src/shared/` — design primitives, code editor, document state, stores.
- `src/core/` — canonical tool contracts, policy, workers, persistence, telemetry, detection.
- `src/content/` — tool catalog config, SEO content.
- `src/platform/` — PWA, analytics, clipboard, storage helpers.

Rules: local-first transforms through the canonical contract (`core/tool-contract`) so UI, workers and recipes share semantics; settings-only recipes; explicit include-data saves; no payload in URLs, telemetry, or analytics.

MIT. See [LICENSE](LICENSE). Report security concerns to alwinaugustin@gmail.com.
