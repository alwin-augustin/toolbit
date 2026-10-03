# Toolbit Test Plan — Toward 100% Coverage (42 Tools)

- **Status:** Implemented (Phases 0–4 landed 2026-10-03; Phase 5 ratchet in progress)
- **Date:** 2026-10-03
- **Scope:** All 42 catalog tools + shell, router, persistence, telemetry, theme, PWA
- **Stack:** Vitest 5 (v8 coverage) + React Testing Library 16 / user-event 14 (jsdom) + Playwright 1.63 (chromium/firefox/webkit) + axe-core + Lightpanda CDP sweep
- **Measured after implementation:** 29 unit files / 362 passed · coverage 62.4% stmts / 57.1% branch / 49.8% funcs (from 45.5/41.1/34.3) · 42/42 e2e smoke + 12 deep journeys green on chromium+webkit + 4 Lightpanda journeys green, zero serious axe violations · `lint` + `tsc` clean

## 1. Objective and definition of "100%"

"100%" here means four gates, all green — not just a line-coverage number:

1. **Code coverage:** 100% lines/functions/statements + 100% branches on `src/core/**` and tool pure-logic modules; ≥95% aggregate elsewhere with `perFile` floors so no file hides behind an average. Enforced by Vitest thresholds (build fails otherwise).
2. **Functional completeness:** every tool × every mode/action × {happy, invalid, empty, boundary/large, unicode} has at least one automated assertion at the cheapest layer that can verify it.
3. **UI completeness:** every tool route renders without `pageerror`, exposes its heading/inputs/actions by accessible role, and its primary journey (sample → run → output → copy/clear/error) is exercised through the real UI at least once.
4. **Cross-cutting completeness:** router, catalog/SEO consistency, workspace tabs, history/recipes, persistence, telemetry privacy, theme, offline/PWA, responsive, keyboard, clipboard-denial — all covered, on chromium + webkit at minimum.

## 2. System under test (verified against repo)

42 tools in `src/content/tools.config.ts`. Two rendering architectures — the plan treats them differently:

| Arch                                                                                                 | Count                                                                              | IDs                                                                                                                                                                                                                                       | Shared UI                                                                                                               | Test leverage                                                                      |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Generic workbench spec (`ALL_SPECS` in `src/features/tools/specs.ts`, rendered by `WorkspaceScreen`) | 12                                                                                 | json-formatter, base64-encoder, timestamp-converter, url-encoder, yaml-formatter, csv-to-json, sql-formatter, css-formatter, graphql-formatter, js-json-minifier, html-escape, strip-whitespace                                           | Common chrome: Input/Result CodeEditors, mode buttons, options, Copy/Clear/Use-result, error banner, preview-cap notice | One parametrized suite covers chrome once; per-tool tables cover `run()` semantics |
| Custom screens (`CUSTOM_SCREENS`, `DocumentContext` + bespoke layout)                                | 30 keys / 29 components (CronScreen serves both cron-parser and crontab-generator) | hash, case, word, jwt, uuid, cron, crontab-generator, diff, regex, json-validator, xml, markdown, git-diff, protobuf, password, totp, cert, qr, api, ws, http-status, nginx, docker, date-calc, fake-data, lorem, color, unit, image, pdf | Each owns layout, still uses `wb-*` styles + `CodeEditor` + document hooks                                              | Bespoke suite per screen, but all follow the same template (§7)                    |

Pure-logic entry points already exported for testing (keep this pattern — it is why current unit tests are fast): `src/core/tool-contract.ts` transforms + `DEFINITIONS`, per-screen helpers (e.g. `computeDigests`, `decodeJwt`, `validateJsonAgainstSchema`, `buildDockerRunCommand`). DOM/canvas/network-only paths are explicitly called out in `workbench-custom-g.test.ts` as skipped — the plan closes those at component/e2e level instead.

## 3. Current state and gaps (evidence, Oct 2026)

- **Unit (Vitest):** 17 files, 226 passed / 2 skipped (`npm run test:run`). Strong on pure helpers, contracts, recipes, persistence, theme, telemetry sanitization, SEO consistency.
- **Component (RTL):** only 4 suites touch rendered UI (`workbench-shell`, `workbench-router`, `sidebar`, `accessibility`+SearchDialog). 29 custom screens have **zero render tests** — only their exported helpers are tested.
- **E2E (Playwright):** 5 spec files, journeys concentrated on json-formatter/base64/timestamp + shell concerns. Chromium + webkit pass; **all 17 firefox failures are environment** (`firefox Nightly Could not find profile folder`), not product bugs. Only ~4 of 42 tools get a real browser journey.
- **Config gaps:** `vitest.config.ts` has no `coverage.include`, no thresholds — coverage is informational, not a gate. `tests/tools/` exists but is empty. No visual-baseline policy, no MSW layer, no sharding/retry policy in `playwright.config.ts` (`fullyParallel: false`, no retries).

Conclusion: logic coverage is good; **UI + per-tool functional coverage is ~10%**. The plan below fills exactly that.

## 4. Strategy — modern layered pyramid (2026 practices)

Follow the 2026 consensus (Vitest v8-coverage docs; Playwright 1.62+ stable story-gallery component model replacing `@playwright/experimental-ct-*`; RTL `userEvent.setup()` per-test pattern):

```
L0 Static ── tsc + eslint + prettier + knip (already in CI)
L1 Unit (Vitest, jsdom, fast) ── pure transforms/helpers, contracts, stores, schemas
L2 Component (RTL + user-event, jsdom) ── every screen rendered, user-behavior assertions
L3 Integration (Vitest + fake-indexeddb + MSW) ── persistence, recipes, api/ws mocked
L4 E2E journeys (Playwright, real browsers) ── parametrized per-tool smoke + deep shell journeys
L5 Non-functional ── axe (WCAG A/AA), visual baselines (curated), perf budgets, PWA/offline, security
```

Layering rule: assert at the **cheapest layer that can see the bug**. Pure string→string logic stays in L1. Focus/clipboard-mock/disabled-state/validation-message behavior goes to L2. Real layout, real CodeMirror, real service worker, real downloads go to L4. Do not duplicate full matrices upward — L4 per tool is a smoke journey, not the full edge matrix.

Tooling decisions (locked for this plan):

- **Coverage provider: v8** (default, fastest, AST-remapped since Vitest 3.2 so branch accuracy ≈ istanbul). Keep `@vitest/coverage-v8`. Only switch to istanbul if an audit mandates exact branch counting.
- **Queries:** `getByRole` first, then `getByLabelText`, never `data-testid` for elements users can see (RTL priority). This doubles as an a11y smoke test.
- **Interactions:** always `const user = userEvent.setup()` per test + `await`; `fireEvent` only for events user-event cannot express (e.g. synthetic paste with `clipboardData`, already used in workspace.spec).
- **Axe:** `@axe-core/playwright` with `withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])` via a shared fixture; assert only `serious`+`critical` break the build (current repo behavior), track the rest.
- **Visual:** Playwright `toHaveScreenshot` on a **curated** set only (start + 1 generic tool + 2–3 custom screens, light+dark), with `mask` for dynamic bits and tuned `maxDiffPixels`. Not every component — that is a maintenance tax; full design review belongs in Chromatic/Storybook if adopted later.
- **Network mocks:** `page.route()` in e2e for api-request-builder/websocket-tester; MSW only if L3 integration tests need it. No live external calls in tests.
- **Fast feedback:** Lightpanda (`lp`) project keeps the 4-journey functional sweep; full browsers run the matrix.

## 5. Coverage enforcement (config changes required)

`vitest.config.ts` — add explicit include + thresholds so CI fails on regression:

```ts
coverage: {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['node_modules/','dist/','tests/','**/*.d.ts','**/*.config.*','**/mockData','src/main.tsx'],
  reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
  thresholds: {
    lines: 100, functions: 100, statements: 100, branches: 100,
    // Soften only for app shell glue that e2e exercises; core + tool logic stay at 100:
    'src/core/**': { lines: 100, functions: 100, branches: 100, statements: 100 },
    'src/features/tools/**': { lines: 100, functions: 100, branches: 90, statements: 100 },
    perFile: false,
  },
}
```

Process: start thresholds at current measured values with `autoUpdate: true` locally to ratchet upward, land the config at 100 for the two globs above when Phase 1 completes. `json-summary` feeds the PR coverage comment action; the non-zero Vitest exit is the hard gate (wire into `validate-web.yml` as `npm run test:coverage`).

`playwright.config.ts` — add `retries: 1` on CI, keep `chromium`+`webkit` as required, quarantine `firefox` until the Nightly profile issue is fixed (fix = pin browser install in CI, do not delete the project), keep `lp` for the fast sweep only.

## 6. Per-tool test specification

### 6.1 Generic-spec tools (12) — parametrized, one harness

New file `tests/workbench-generic-matrix.test.tsx`: iterate `ALL_SPECS`; for each tool assert (a) pure `run()` happy + invalid + empty (via spec table), (b) rendered `WorkspaceScreen` journey: heading visible → fill Input → click primary action → Result non-empty → Copy enabled → Clear resets → invalid input shows `role=alert` + Copy disabled. Reuses the existing `Harness` pattern from `workbench-shell.test.tsx` and the mocked `CodeEditor` (textarea) from `tests/setup.ts`.

Per-tool golden vectors (add where missing):

| Tool             | Happy vector                                               | Invalid/edge                                                                                                |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| json-formatter   | invoice sample → 2-space format; minify; sortKeys          | `{"a":1,` → alert w/ location; `__proto__` preserved; 1MB string no stack overflow; >10MB → INPUT_TOO_LARGE |
| base64           | `café ☕` round-trip; urlSafe alphabet                     | bad padding; invalid UTF-8 bytes on decode                                                                  |
| timestamp        | `1790942400` auto→UTC lines; 13-digit ms; ISO + local zone | `12.5`, `1,000`, `0x10`, `1e3`, `123abc` rejected                                                           |
| url              | decode `hello%20world%2F…`; round-trip                     | `%E0%A4%A` malformed                                                                                        |
| yaml             | format / to-json / from-json                               | `{bad`                                                                                                      |
| csv-to-json      | `name,age\nann,30` → JSON                                  | unterminated quote                                                                                          |
| sql              | format/minify/uppercase                                    | empty                                                                                                       |
| css              | format contains `margin: 0`; minify                        | empty/invalid                                                                                               |
| graphql          | format/minify; `{ bad` invalid                             | —                                                                                                           |
| js-minifier      | `function add…` → minified; broken paren invalid           | empty                                                                                                       |
| html-escape      | escape+unescape round-trip                                 | —                                                                                                           |
| strip-whitespace | all 6 actions incl. remove-empty                           | —                                                                                                           |

Cancellation + size contract (`CANCELLED`, `INPUT_TOO_LARGE`) already in `contracts.test.ts` — extend to every `DEFINITIONS` entry via loop, not just json-formatter.

### 6.2 Custom screens (29 components) — same template, bespoke vectors

New files `tests/tools/<tool-id>.test.tsx` (fills the empty `tests/tools/` dir) + helper-edge tests alongside existing `workbench-custom-*.test.ts`. Every screen gets the same 8 assertions:

1. Renders `h1`/heading + input control by role with no `pageerror`.
2. `Load sample` (where present) populates input.
3. Happy-path run produces expected output (golden vector below).
4. Invalid input shows `role=alert`, preserves prior output, disables copy.
5. `Clear` resets to empty state.
6. Copy path: success → notify; denial (mock reject) → honest "Clipboard unavailable" status.
7. Keyboard-only run (Tab → type → Enter) works.
8. Axe scan of the rendered screen has zero serious/critical violations (jsdom smoke; full axe stays in e2e).

Golden vectors per tool (authoritative; expand existing helper tests to these):

- hash: `abc` + `Hello, World!` 4-digest vectors (exist — add render test).
- case: `hello world` → 8 cases (exists — add render test).
- word: two-paragraph counts + reading-time bands (exists).
- jwt: unsigned sample decode; 3-part + JSON errors; exp annotation (exists).
- uuid: v4 bulk uniqueness + v7 shape; inspect/format (exists).
- cron/crontab: `0 9 * * 1-5` explanation + next-runs from fixed date; builder round-trip (exists for cron — add crontab-builder UI path).
- diff: line types/numbers, ignore-whitespace, unified + side-by-side text (exists).
- regex: capture + named groups, invalid pattern/flags, `$2@$1` replace (exists).
- json-validator: valid/missing-required/wrong-type/malformed-schema (exists).
- xml: prettify/minify/xmlToJson/XPath/validate + empty-input contract (exists).
- markdown: headings/emphasis + `<script>` sanitized (exists — add DOMPurify bypass attempts: `onerror`, `javascript:` URLs).
- git-diff: 2-file parse, prefix stripping, per-file counts, ANSI/CRLF normalization (exists).
- protobuf: hex/varint/sample-fields/field_N JSON/base64/flatten (exists).
- password: 92-char set, seeded `createPassword`, strength bands (exists — add clipboard + option-toggle render test).
- totp: RFC 6238 vectors (6 listed) + counter/countdown (exists — add time-left render test with fake timers).
- cert: fixture PEM subject/issuer/SAN/validity/fingerprints + expired/not-yet-valid (exists).
- qr: wifi/vcard builders, per-mode content, PNG data-URL + SVG output (exists — add download-link render test).
- api: curl builder (GET/POST/disabled-header/quote-escape), URL validation, pretty-print, error titles (exists — add MSW-backed send test: 200 JSON, 404, timeout, abort).
- ws: ws/wss accept, http reject, JSON pretty log, status labels (exists — add mock-socket connect/message/close render test).
- http-status: 17-entry list, code/phrase search, `200 OK` label (exists — add filter render test).
- nginx: semicolon/unknown-directive/brace errors, server summary, formatter indent (exists).
- docker: nginx sample command, ports/volumes/env/network/restart, udp+ro, quoting, blank-image fallback (exists).
- date-calc: difference breakdown, order-independence, leap day, DST-safe add, bad-input null (exists).
- fake-data: seed replay/divergence, JSON/CSV/SQL formats + quote escape (exists).
- lorem: words/sentences/paragraphs counts + lorem-opener + HTML wrap (exists).
- color: `#3b82f6`→rgb/hsl, primary round-trips, red anchor, css strings (exists).
- unit: km→m, mi→km, F→C, identity (exists — extend: mass/volume/time categories + incompatible-units error).
- image: size format, JPEG white-base, quality mapping, output names, aspect math (exists — add canvas render test with stub `toDataURL`/object URLs; keep pdf-lib merge/split/rotate at e2e with real bytes).
- pdf: page-range parse/clamp, split/rotate names, upload validation, `moveEntry` (exists — add merge/split/rotate with real sample PDF in e2e only).

### 6.3 E2E per-tool sweep (Playwright, parametrized)

New `tests/e2e/tools-sweep.spec.ts`: loop over all 42 `TOOLS` — `goto(path)` → expect `h1` visible → expect zero `pageerror` → axe serious/critical = 0 → screenshot only for the curated visual set. Then one **deep journey per interaction class** (not per tool, to bound runtime):

- generic workbench: json format + base64 round-trip + timestamp convert (extend existing workspace.spec).
- hash/password/uuid/qr: generate → output non-empty → copy enabled.
- jwt/cert/protobuf: load sample → decoded fields visible.
- diff/regex/validator/xml/markdown: invalid input → alert + copy disabled.
- api/ws: mocked route/socket, never live network.
- image/pdf: real file upload via `setInputFiles`, download event asserted, canvas/pdf-lib paths exercised for real.
- docker/nginx/cron/crontab: generated text snapshot (`toMatchSnapshot`, not pixel).

Tag network-dependent specs; CI runs them with routes blocked (`TOOLBIT_BLOCK_ANALYTICS=1` pattern already exists) to prove offline-safe transforms.

## 7. Cross-cutting suites (ship in Phase 0–1)

- Router: all 42 paths + `/`, `/library`, `/saved`, `/history`, `/settings` render expected heading (extends `workbench-router.test.tsx` with a TOOLS loop + reserved-slug collision test already in seo-content).
- Catalog/SEO: keep `seo-content.test.ts` as the gate (tool↔page 1:1, related-links exist, unique metadata lengths, canonical domain).
- Workspace: multi-doc independence, tab restore without payload leak, recipe run/stop-on-failure, history opt-in/out (exists — add recipe-template × tool-compat matrix via `compatible()`).
- Persistence: round-trip + clear + ordering (exists — add quota-denied path, already covered once in e2e storage-denial; mirror at unit level).
- Telemetry privacy: canary sweep over every `EVENT_NAMES` + unknown-event rejection + opt-out identity rotation (exists in both layers — keep, add route-name strip test for new tools).
- Theme: stored/system/invalid → resolved class + `color-scheme`, OS-change re-apply, persistence across reload (exists — add per-tool smoke in dark mode to the sweep).
- PWA/offline: service-worker cached direct navigation + blocked-analytics transform (exists — add manifest + install-prompt paths already in install.spec).
- Responsive/keyboard: 390px drawer + no-horizontal-overflow + 200% zoom axe (exists — extend to one custom screen per category).
- Failure honesty: clipboard-denied, storage-denied, oversized-input preview caps (100KB notice), worker-timeout — each must leave transform working + status honest.

## 8. Non-functional requirements and budgets

- Accessibility: zero serious/critical axe violations on every route (both themes for start + editor; single theme for the sweep). Manual pass with Accessibility Insights for the workbench chrome once per release.
- Visual: baseline set = start, json-formatter, hash, cron (light+dark). Review diffs in PRs; accept via `playwright show-trace`/snapshot update only with reviewer sign-off.
- Performance: LCP < 2.5s, CLS < 0.1 on preview build for `/` and `/json-formatter`; tool transform of 100KB input < 1s (extend `scripts/benchmark-tools.ts` into a CI budget check, warn-only first quarter).
- Security: DOMPurify-markdown bypass suite, no tool payload in telemetry (canary tests), `crypto.subtle` only over secure contexts with graceful error, file-type/size validation on image/pdf (already unit-tested — keep as gate).

## 9. Implementation roadmap

| Phase                           | Scope                                                                                                                 | New/changed files                                                                                                     | Exit criteria                                                                                                                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Foundations (0.5 wk)         | Vitest `include`+thresholds (ratchet mode), Playwright retries + axe fixture + sweep skeleton, fix firefox CI install | `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/fixtures/axe.ts`, `tests/e2e/tools-sweep.spec.ts` (smoke only) | DONE 2026-10-03: gate at 58/46/52/58, retries=1, `test:coverage` in CI; bonus: jest-dom/vitest import cleared 42 tsc errors                                                                                                               |
| 1. Unit completion (1 wk)       | DEFINITIONS loop (cancel/size), missing vectors (unit categories, recipe compat), seeded-PRNG determinism             | `tests/workbench-*.test.ts` extensions                                                                                | DONE 2026-10-03: `contracts-matrix` (14 defs x cancel/size/serialize) + `workbench-extra` (unit cats, XSS, seeded) green                                                                                                                  |
| 2. Component matrix (2 wks)     | Generic parametrized suite + 29 `tests/tools/*.test.tsx` per §6 template                                              | `tests/workbench-generic-matrix.test.tsx`, `tests/tools/*`                                                            | DONE 2026-10-03: generic matrix (25) + custom matrix (32) + ds primitives + 42-route router matrix green                                                                                                                                  |
| 3. E2E sweep + hardening (1 wk) | Full 42-route sweep, deep journeys per class, file-upload/download, firefox quarantine lift                           | `tests/e2e/tools-sweep.spec.ts`, `workspace.spec.ts` extensions                                                       | DONE 2026-10-03: sweep 42/42 smoke + axe clean (chromium+webkit) + tools-journeys 12 deep journeys green both browsers (mocked-api, refused-ws, image-upload, pdf-merge); 8 visual baselines; firefox quarantined (local Nightly profile) |
| 4. NFR gates (1 wk)             | Visual baselines (curated), perf budgets, security bypass suite, 200%-zoom axe                                        | `test-results/` baselines, `scripts/benchmark-tools.ts` gate                                                          | DONE warn-only: `perf-budget` 100KB<1s x3, XSS 5-vector suite, 4 baselines committed                                                                                                                                                      |
| 5. Ratchet to 100 (0.5 wk)      | Thresholds to §5 final, `autoUpdate` off, mutation spot-check (Stryker on `tool-contract.ts` only)                    | `vitest.config.ts` final, CI `test:coverage` required                                                                 | IN PROGRESS: ratcheted 45->58 lines; 58%->100% needs e2e-owned lines excluded/covered per release                                                                                                                                         |

Total: ~6 weeks single-threaded; Phases 1–2 parallelizable by tool category.

## 10. Risks and mitigations

- Canvas/pdf-lib in jsdom → keep pure helpers in unit, push pixels/bytes to e2e with real files; never mock what you are trying to verify.
- CodeEditor is mocked in unit (textarea) → real CodeMirror behavior (paste-cap, large-input preview) stays e2e-only; note the seam in each generic test.
- Screenshot flake (fonts/subpixels) → `document.fonts.ready`, curated set, `maxDiffPixels` tuned from real diffs, mask dynamic regions.
- Network flake (api/ws/httpbin) → forbid live calls; MSW/`page.route` fixtures with timeout/abort cases.
- Firefox CI env → pin `npx playwright install --with-deps` version in workflow, cache browsers; if Nightly profile bug persists, switch firefox project to `channel: 'firefox'` stable and record ADR.

## 11. Definition of done (per tool)

- [ ] Golden happy + invalid + empty + boundary vectors automated at L1/L2
- [ ] Render journey (sample→run→output→copy/clear/error) green
- [ ] E2E smoke in sweep (route renders, no pageerror, axe clean)
- [ ] Privacy: no input/output bytes in telemetry or recipe export (where applicable)
- [ ] Docs: sample + error copy reviewed; SEO entry consistent (`seo-content.test.ts` green)
