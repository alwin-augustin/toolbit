# Development and architecture

## Runtime and dependencies

Use `.nvmrc` and `npm ci`. The supported runtime is Node 24 LTS; Cloudflare and CI use the same version. React remains a client-side application: local computation, local persistence and offline use do not require SSR, accounts or a new backend. Vite 8 provides the native Rolldown/Oxc build; Tailwind 4 uses its official Vite plugin and CSS-first theme in `src/styles/tailwind.css`.

The native TypeScript 7 executable runs `npm run check`. The separately aliased TypeScript 6 package provides the compiler API consumed by typescript-eslint and Knip. Do not force incompatible peer dependencies or remove the compatibility package while those tools require it. See [Microsoft’s migration guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

## Source boundaries

- `src/config/tools.config.ts`: public catalogue and routing identifiers.
- `src/lib/tool-contract.ts`: typed deterministic transforms and limits.
- `src/lib/execute-tool.ts`, `src/workers/tool-worker.ts`: asynchronous execution, cancellation, exact byte-limit validation in the worker for large inputs.
- `src/v2/`: document workspace, routed core tools, editors and library panels.
- `src/components/tools/`: other routed utilities; migrate them to the canonical contract when behavior changes.
- `src/ds/`: typed design primitives and self-hosted fonts; `src/components/ui/` supports remaining utility views.
- `src/lib/tool-policy.ts`: sensitivity and network policies.
- `src/lib/telemetry/`: the only analytics sender; fail-closed event/property allowlists.
- `src/seo/`: shared marketing metadata and client SEO; the build generator parses HTML rather than depending on source formatting.

The UI preserves canonical full output independently of the bounded editor preview. JSON fold controls affect display only. Workspace data is included only through an explicit save; recipes store settings rather than payloads. Large operations use disposable workers with bounded execution and abort support.

## Quality checks

`npm run check`, `npm run lint`, `npm run format:check`, `npm run test:run`, `npm audit --audit-level=high`, `npm run build` and `npm run test:e2e` gate changes. Browser projects cover Chromium, Firefox and WebKit. The real clipboard integration runs on Chromium; other engines use an explicit clipboard fixture. Storage-denial and copy-denial tests run across engines.

`npm run benchmark` prints service measurements. To keep local evidence, use `npm run benchmark -- --output /absolute/path/outside/repo/results.json`. Performance measurements include the runtime and should not be compared across machines as if they were identical.

`npx knip` finds unused files and declarations. Confirm reachability before removing a file; public runtime files, CSS package imports and intentional exported types can need human interpretation. `npm run format` formats maintained source. Build and test outputs are ignored.

## Build and hosting

`npm run build` creates the Vite bundles, static SEO pages and a single Workbox service worker, in that order. Keep the service worker generation last so deep links and generated pages are available offline. `npm run web:preview` deliberately disables PWA caching during UI iteration. `npm run preview` serves the real production artifact.

Cloudflare Pages serves `dist/` from the `main` branch. Preview builds use verification analytics; production uses the normal release filter. No Vercel deployment, native desktop release or Electron runtime remains. The GitHub workflow uses current maintained Actions and the runtime in `.nvmrc`.
