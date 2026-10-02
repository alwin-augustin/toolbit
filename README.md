# Toolbit

Local developer utilities in a browser workspace. [Open Toolbit](https://toolbit.app) or install it as a PWA. Native desktop packages and releases have been retired.

JSON, Base64, JWT, YAML, SQL, hashes, text and other transforms run locally. HTTP and WebSocket tools contact the endpoints you explicitly choose. Preferences, normal history and saved workspaces stay in browser storage. Sensitive tools do not save history. Optional, minimized product analytics excludes tool content; turn it off in **Privacy and storage**.

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

## Stack

React 19, TypeScript 7 native compiler, Vite 8, Tailwind CSS 4, Zustand, CodeMirror 6 and Workbox. TypeScript 6 provides the API required by lint and dependency tooling alongside the native compiler. Versions are recorded in the lockfile. Keeping this browser architecture avoids adding server infrastructure to local computation.

## Maintainer guides

- [Development and architecture](docs/DEVELOPMENT.md)
- [Runtime, browser and storage contracts](docs/RUNTIME_AND_STORAGE.md)
- [Recipes](docs/RECIPE_GUIDE.md)
- [Analytics configuration and privacy boundary](docs/POSTHOG_SETUP.md)
- [Release verification and remaining acceptance](docs/RELEASE.md)
- [Current roadmap](docs/ROADMAP.md)
- [Architecture decisions](docs/decisions/)

Historical plans, audits, prototypes and unused code were archived outside the repository by the maintainer. They are not required to build or operate Toolbit.

MIT. See [LICENSE](LICENSE). Report security concerns to alwinaugustin@gmail.com.
