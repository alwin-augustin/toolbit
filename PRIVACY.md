# PRIVACY.md — the privacy charter (web workspace)

> **Read me before changing:** network/egress, storage, the service worker, CSP
> (`public/_headers` or `src-tauri/tauri.conf.json`), tool sensitivity
> (`src/core/tool-policy.ts`), dependencies, or user-facing copy.
>
> I am the engineering rulebook — **not** the legal policy. The legal policy renders
> at `/privacy` (content in `src/content/seo/seo-content.js`), and I exist to make
> it true and keep it true.

**Status:** adopted 16 October 2026 · analytics removal + "Delete all local data" implemented 16 October 2026 (§6) · **Scope:** every change in `Web/web` (the app the desktop shell bundles; companion charter: `Desktop/desktop-tauri/PRIVACY.md`).
**How to use this file:** the read-trigger table (§3) is the entry point. Read the surface rules it names (§4), run the tests (§5), and fill in the checklist (§8) before reporting a task complete. MUST / NEVER are normative. Every rule names its enforcing test — a rule without one is either a new test to write, or a debt-register entry (§7). There is no third state.

## 1. The promises

These are the product. They are never weakened silently; changing one requires the maintainer's explicit, written decision, recorded in the decision log (§6).

- **P1 — On-device by default.** Tool input and output are processed on the user's device. There is no server that can receive them.
- **P2 — Content never crosses the wire.** No input, output, file, token, snippet, header, path, or error message may appear in any outbound request, log, or report. Canary-tested.
- **P3 — Secrets get no second copy.** Tools classified `secret` in `src/core/tool-policy.ts` are never persisted: no history, no workspace payload, no share, no telemetry. That set may grow without review; it may never shrink without a written decision.
- **P4 — No silent network — and no telemetry.** With default settings and no user action, the app sends **zero** requests beyond its own origin. There is no analytics, no crash reporting, and no remote configuration. (The opt-in PostHog channel was removed on 2026-10-16 — §6 — and must never return without a new decision.) Egress exists only when the user runs a network tool against a host they chose.
- **P5 — No third parties at runtime.** No third-party scripts, fonts, frames, pixels, CDNs, or SDKs. Every runtime origin is allowlisted and on the CSP. Adding an origin is a privacy decision, not a coding detail.
- **P6 — Local data is bounded, inspectable, deletable.** Every store has a cap, a retention, and a deletion path; one action — "Delete all local data" — deletes them all (implemented 2026-10-16, §6). "Delete" means gone: no tombstones, no leftover ids, no cached copies. New stores join the inventory (Appendix B) and the deletion test in the same change.
- **P7 — Claims equal behavior.** Every privacy statement in UI copy, `/privacy`, and marketing pages is backed by code and an asserting test. New claim → new test in the same PR. Removing enforcement → remove the claim.
- **P8 — Privacy controls fail closed and never break the tool.** Storage denial, network failure, service-worker failure: silent and non-blocking. Browser privacy signals (GPC/DNT) are treated as refusals wherever the app would transmit; unknown state defaults to "off".

## 2. Definitions

- **Content** — anything a user enters, pastes, drops, or opens in a tool.
- **Secret** — any value the user would not post publicly; the tools with sensitivity `secret` (§4.5).
- **Egress** — any request whose origin is not the app's own origin.
- **Telemetry** — any remote collection of usage or error data. There is none (P4); the word now appears only in removal notes.
- **Debt** — a known, consciously accepted weakening of a promise, recorded with a revisit trigger (§7).
- **Children** — Toolbit is a general-purpose developer tool, not directed to children. Don't add child-directed features without re-opening P1–P8 and the legal assessment.

## 3. Read-trigger table — if you are about to touch X, do Y

| About to touch…                                                                                                                                                        | Read                         | Run before reporting done                                                                       | Never                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Storage: `preferences.ts`, `history-db.ts`, `workspace-db.ts`, `workspace-schema.ts`, `favorites-store.ts`, `recent-tools.ts`, `workspace-store.ts`, or any new key/DB | §4.2 + Appendix B            | `npm run test:run` (storage + policy + persistence suites) + `tests/privacy/delete-all.test.ts` | Persist anything for a `secret` tool; add a store the inventory doesn't name; keep user data past its retention |
| Any new `fetch` / `XMLHttpRequest` / `sendBeacon` / `WebSocket` / `EventSource` / `new Image()`                                                                        | §4.3                         | the egress specs (§5, T2.1+)                                                                    | Ship an origin outside the allowlist; auto-fire on load; retry queues                                           |
| `public/_headers` or `tauri.conf.json` CSP                                                                                                                             | §4.4                         | `tests/privacy/csp-headers.test.ts` (T1) + the CSP-drift test (§5, T1.8)                        | Widen `script-src` beyond `'self'`; drop the `frame-src` / `object-src` / `base-uri` closures or the `/*` path  |
| Tool catalogue or specs (adding/editing a tool)                                                                                                                        | §4.5                         | the policy tests (§5)                                                                           | Default a secret-bearing tool to `normal`; give a tool network access it doesn't need                           |
| `package.json` / Cargo dependencies                                                                                                                                    | §4.6                         | the dependency gate (§5, T1.9) + `npm run knip` + `npm run check`                               | Add a dependency that phones home, loads remote code, or bundles analytics                                      |
| Copy: legal pages, SEO content, settings, README                                                                                                                       | §4.7                         | `npm run test:run` (legal-pages, seo-content) + claims checks (§5, T2.8)                        | Write a claim no test can back                                                                                  |
| Desktop bridge: `src/platform/desktop.ts`, `src/platform/external-links.ts`                                                                                            | §4.8 + the desktop companion | `tests/desktop-host.test.tsx`, `tests/external-links.test.ts`                                   | Bypass the guarded link path; leak paths or contents across the bridge                                          |
| Service worker / caching: `scripts/generate-service-worker.mjs`, `src/platform/service-worker.ts`                                                                      | §4.9                         | the PWA + cache assertions (§5, T2.6)                                                           | Runtime-cache anything but build assets; cache user content                                                     |
| `.env*` files or CI secrets                                                                                                                                            | §4.10                        | —                                                                                               | Commit, echo, or copy env contents; ship build keys the product no longer needs                                 |

## 4. Surface rules

### 4.1 Telemetry — none

- There is no telemetry (P4). Egress is exactly `{ self }`, and T2.1 (`tests/e2e/privacy-egress.spec.ts`) asserts it in absolute terms: boot, a full tool journey, and navigation make zero requests off-origin.
- The legacy opt-in PostHog channel was removed on 2026-10-16 (§6): module, transport, `track()` call sites, consent controls, env vars, the CSP origin, and every copy mention are gone. There is nothing to switch off and nothing to extend.
- Reintroducing any collection requires all four, in order: a written maintainer decision (§6) → an allowlist entry → egress + consent tests → honest copy. Any one alone is a broken promise.

### 4.2 Storage

- Appendix B is authoritative. Adding a store, key, or field without a row there is a bug, not a detail.
- Secret gates live in `src/core/tool-policy.ts` (`canPersistTool`, `canShareTool`); never write a parallel check in feature code. Workspace imports refuse secret payloads (`workspace-schema.ts`) — keep it that way.
- Retention: history is 1–365 days (default 30), pruned on the defined triggers; pruning must stay bounded and user-triggerable.
- Deletion: every surface has a delete; one action deletes everything (P6, `src/core/privacy.ts`). The deletion tests assert zero residue — localStorage, sessionStorage, and the databases — and that a reload leaves nothing but empty containers (`tests/privacy/delete-all.test.ts`, `tests/e2e/privacy-deletion.spec.ts`).
- Storage failures stay silent (`safeStorage`); a denied quota or a private-mode browser must never break a tool.

### 4.3 Network

- `privacy-allowlist.json` will be the single machine-readable truth (origins + initiator + opt-in state, storage keys/DBs, dependency justifications, CSP expectations). Until it exists (§7 debt), the CSP and this document are the allowlist — the rule still binds.
- "User-initiated" means: the user pressed something, against a host they typed. No auto-prefetch, no retries, no telemetry-style metadata about the request.
- `https:` and `wss:` in `connect-src` — one per user-driven network tool (API Request Builder, WebSocket tester), against hosts the user types — and remote images in markdown previews (`img-src https:`) are the documented exceptions (§7). Do not add new ones.
- Failures (timeout, DNS, CORS) must not surface content into logs or error reports.

### 4.4 Transport policy

- CSP lives in `public/_headers` (web) and mirrors into `src-tauri/tauri.conf.json` (desktop, adapted for `ipc:`). The web block stays attached to `/*` — a bare `/` matches only the root URL. Changing the CSP is a two-file change plus `tests/privacy/csp-headers.test.ts`.
- Keep closed: `script-src 'self'`; `frame-src 'none'`; `object-src 'none'`; `base-uri 'none'`; `frame-ancestors 'none'`; `form-action 'self'`; the `Permissions-Policy` device closures; COOP/CORP; `Referrer-Policy`.
- `connect-src` is exactly the allowlist: `'self'`, `https:`, `wss:` (see §7).

### 4.5 Tools & sensitivity

- New-tool checklist: (1) classify sensitivity in the PR with a rationale; (2) set the network policy (default `none`); (3) add ceilings for anything unbounded; (4) update the inventory if anything persists.
- In doubt, a tool that handles secrets is `secret` — the set defaults to safety.

### 4.6 Dependencies

- New runtime dependency: read its docs for network/telemetry behavior, record the justification (planned: in the allowlist), keep `npm audit --omit=dev` and `knip` clean. Cargo crates are reviewed the same way.
- Never add a dependency that loads remote code at runtime, bundles analytics, or phones home to check for updates.

### 4.7 Copy & claims

- Every claim maps to a promise and a test; the egress test arbitrates "nothing leaves".
- The policy's `updated:` date moves only with a real review.
- Consent/control copy stays symmetric and honest — no nagging, no dark patterns.

### 4.8 Desktop (this repo's half)

- `isDesktopBuild` behavior stays: the desktop bundle ships with no network env vars and no telemetry path — and the web build carries no consent controls any more either (removed 2026-10-16, §6).
- The shell's own rules live in `Desktop/desktop-tauri/PRIVACY.md`; touching `src/platform/desktop.ts` changes that contract.

### 4.9 Caching & offline

- The service worker precaches build assets only. No runtime routes, no user content, no response caching of anything user-related; `cleanupOutdatedCaches` stays on.

### 4.10 Secrets hygiene (repo)

- `.env*` files never enter git and are never echoed, copied, or pasted. If a secret ever left the machine: rotate it.

## 5. The privacy test programme — what to run, when

### 5.1 Tiers

| Tier                                      | Trigger                                       | Budget          | What runs                                                                                                                 |
| ----------------------------------------- | --------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **T0 — per edit**                         | while iterating                               | seconds         | targeted unit tests of the touched module + `npm run check`                                                               |
| **T1 — every PR (CI)**                    | the `validate` job                            | minutes         | `format:check`, `lint`, `check`, the full vitest suite with coverage — plus, as they land, the allowlist and drift suites |
| **T2 — privacy-surface PRs + nightly**    | any change to a §3 surface; nightly on `main` | minutes         | Playwright: zero-egress sweep, storage inventory, deletion, consent, offline, artifact scan                               |
| **T3 — pre-release**                      | before a tag / deploy / store decision        | tens of minutes | desktop no-telemetry bundle scan, capability assertions, `npm audit --omit=dev`, OSV scan, full e2e, manual checklist     |
| **T4 — quarterly / on regulation change** | calendar + legal updates                      | hours           | full review: policy vs behavior, debt register, distribution, standards mapping                                           |

A change is done only when its tier and every lower tier pass.

### 5.2 Existing tests (run today)

| Test                                                                                                               | Asserts                                                                                                               | Tier |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---- |
| `tests/contracts.test.ts`                                                                                          | secret tools never record; JSON precision/Unicode edge cases; workspace payload exclusion, migration, import refusals | T1   |
| `tests/privacy/delete-all.test.ts`                                                                                 | one-action deletion sweeps `toolbit*` + `theme` keys, deletes both databases, leaves foreign keys, is idempotent      | T1   |
| `tests/privacy/csp-headers.test.ts`                                                                                | the shipped CSP stays on `/*`, keeps both user-driven allowances, and hard-codes no origin                            | T1   |
| `tests/workspace-store.test.ts` (+ schema tests)                                                                   | workspace validation; secret payloads refused on import                                                               | T1   |
| `tests/legal-pages.test.tsx`, `tests/seo-content.test.ts`                                                          | legal + SEO content renders, navigates, stays consistent                                                              | T1   |
| `tests/hardening.test.ts`                                                                                          | input ceilings; ReDoS / stack-overflow regressions                                                                    | T1   |
| `tests/persistence.test.ts`                                                                                        | persistence behavior across sessions                                                                                  | T1   |
| `tests/external-links.test.ts`, `tests/desktop-host.test.tsx`                                                      | guarded external links; desktop bridge refusal paths                                                                  | T1   |
| `tests/e2e/privacy-egress.spec.ts`                                                                                 | built site (T2.1): boot + tool journey + navigation make zero requests off-origin; canary never in localStorage       | T2   |
| `tests/e2e/privacy-deletion.spec.ts`                                                                               | built site (T2.4): Settings wipe → reload → no keys, no records; the app still works                                  | T2   |
| `tests/e2e/tools-sweep.spec.ts`, `workspace.spec.ts`, `theme.spec.ts`, `install.spec.ts`, `tools-journeys.spec.ts` | core journeys incl. offline service worker                                                                            | T2   |

T2.1 and T2.4 landed with the 2026-10-16 decisions; the remaining planned specs (§5.3) are the open gaps.

### 5.3 Planned additions (the gaps)

| ID    | Test (proposed path)                                | Asserts                                                                                                                                | Tier  |
| ----- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| T1.7  | `tests/privacy/allowlist.test.ts`                   | allowlist ↔ code constants ↔ `_headers` ↔ `tauri.conf.json` ↔ capabilities are equal; the secret set is a superset of the previous set | T1    |
| T1.8  | `tests/privacy/csp-drift.test.ts`                   | the exact CSP directive set in both files equals the allowlist's                                                                       | T1    |
| T1.9  | `scripts/privacy-deps.mjs`                          | runtime deps ⊆ allowlist with justification; `npm audit --omit=dev` clean; `knip` clean                                                | T1    |
| T1.10 | ESLint `no-restricted-syntax`                       | no raw `fetch` / `XHR` / `sendBeacon` / `WebSocket` / `EventSource` outside allowlisted modules                                        | T0/T1 |
| T1.11 | `.dependency-cruiser.cjs` (optional)                | import-graph policy — telemetry/storage only from allowlisted paths                                                                    | T1    |
| T1.12 | `tests/privacy/persist-gates.test.ts`               | `canPersistTool` false ⇒ nothing persisted, for every secret tool id                                                                   | T1    |
| T1.13 | `tests/privacy/retention.test.ts`                   | pruning honors `retentionDays` (boundaries 1/365, clock skew) with a mocked clock                                                      | T1    |
| T1.14 | `tests/privacy/share-gates.test.ts`                 | no outbound payload can be built when `canShareTool` is false                                                                          | T1    |
| T2.2  | `tests/e2e/privacy-offline.spec.ts`                 | with every route aborted, all tools still work                                                                                         | T2    |
| T2.3  | `tests/e2e/privacy-storage.spec.ts`                 | localStorage keys ⊆ inventory; IDB databases ⊆ inventory; caches = precache; no canary content anywhere in storage                     | T2    |
| T2.5  | `tests/e2e/privacy-consent.spec.ts`                 | consent/signal state machine produces the documented behavior (GPC/DNT paths)                                                          | T2    |
| T2.6  | `tests/e2e/privacy-sw.spec.ts`                      | SW precaches only the manifest; old generations purged                                                                                 | T2    |
| T2.7  | `scripts/privacy-scan.mjs`                          | `dist/**` has no origins outside the allowlist, no remote scripts, headers shipped                                                     | T2    |
| T2.8  | `tests/e2e/privacy-claims.spec.ts`                  | testable policy sentences have assertions                                                                                              | T2    |
| T2.9  | `tests/e2e/privacy-partitioning.spec.ts` (optional) | first-party storage assumptions hold                                                                                                   | T2    |
| T3.1  | desktop `tests/privacy-capabilities.test.ts`        | capability file + CSP unchanged                                                                                                        | T3    |
| T3.2  | desktop `scripts/privacy-desktop.mjs`               | `build:desktop` output contains no capture host/key; no telemetry path ships                                                           | T3    |
| T3.3  | `tests/e2e/privacy-headers.spec.ts`                 | deployed headers match the recorded baseline                                                                                           | T3    |
| T3.4  | manual checklist (pre-release)                      | policy vs behavior re-walk; debt register review                                                                                       | T3    |
| T4.1  | audit refresh                                       | full review; every debt row revisited; standards mapping re-checked                                                                    | T4    |

Design notes: keep canaries random per run (`CANARY_${crypto.randomUUID()}`); use fake-indexeddb + mocked clocks, not sleeps; T2.3/T2.4 need small helpers to enumerate localStorage / `indexedDB.databases()` / Cache Storage via `page.evaluate` (Playwright's `storageState` misses sessionStorage — check it explicitly).

### 5.4 Commands and CI

```
npm run test:run        # unit + component tests (vitest)
npm run test:e2e        # Playwright (build/preview per playwright.config.ts)
npm run lint && npm run check
npm run knip            # dependency hygiene
npm run build           # vite + SEO pages + service worker
```

CI: the `validate` job already runs format, lint, typecheck, and coverage on every PR. Planned: `node scripts/privacy-deps.mjs` in `validate`; `node scripts/privacy-scan.mjs` after `npm run build`; a nightly `privacy-e2e` workflow running the T2 specs so drift is caught within a day, not at release.

## 6. Decision log

| Date       | Decision                                                                                                                                                                                                                                                                                                                                   | Status                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-16 | **No analytics — remove PostHog entirely** (Option A). The pseudonymous id was personal data (EDPB 01/2025; CJEU C-413/23 P); the channel was the product's only personal-data processing; the UK's consent-free analytics exception does not cover stock PostHog; and "nothing leaves the device" becomes a single absolute test.         | **Implemented 2026-10-16.** Removed: `src/core/telemetry/**`, `src/platform/posthog.ts`, `PostHogPageView`, all `track()` call sites, the preference + Settings/Topbar controls, the `_headers` origin, the env vars (`ci.yml`, `.env.example`), and every copy mention (README, docs, SEO/legal/FAQ, meta tags). Transitional tests retired for the absolute egress spec (`tests/e2e/privacy-egress.spec.ts`, T2.1). |
| 2026-10-16 | **Implement "Delete all local data"** (supersedes wording the policy down). One Settings action clears history, workspaces/documents, favorites, recents, session handoffs, saved preferences, and caches — with a confirm step.                                                                                                           | **Implemented 2026-10-16.** `src/core/privacy.ts` sweeps `toolbit*` + `theme` keys from localStorage/sessionStorage and deletes `toolbit-history`/`toolbit-workspaces` (connections closed first). Settings carries the confirm step; the reload rehydrates from empty storage. Coverage: `tests/privacy/delete-all.test.ts` (T1), `tests/e2e/privacy-deletion.spec.ts` (T2.4).                                       |
| 2026-10-16 | **Restore the CSP allowances and the site-wide attachment** (validation pass over the 2026-08-06 "Fix CSP-blocked tools" commit). The PostHog narrowing (2026-09-29) had silently dropped `https:`, re-blocking the API Request Builder in production; the `/` header path (2026-10-03) had limited every security header to the root URL. | **Implemented 2026-10-16.** `connect-src 'self' https: wss:`; the site-wide block is back on `/*`; `tests/privacy/csp-headers.test.ts` locks both.                                                                                                                                                                                                                                                                    |
| 2026-10-16 | **No Homebrew/signing work now** (F4 deferred). Unsigned DMG distribution continues; the cask/quarantine workaround remains registered debt (§7).                                                                                                                                                                                          | Standing until revisited.                                                                                                                                                                                                                                                                                                                                                                                             |

Decisions on the remaining research questions stand as recommended: keep the `PRIVACY.md` name (disclaimer blockquote above); accept + document the `https:`/`wss:` allowances; keep remote-image previews for the web (documented); adopt the free dependency-gate baseline (`npm audit`, `knip`; OSV optional); keep the T4 quarterly cadence.

## 7. Debt register

| Debt                                                                                                 | Accepted because                                                                                                                                             | Revisit when                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `https:` and `wss:` allowed app-wide in `connect-src` (F2)                                           | static headers cannot scope per-route; the two user-driven network tools send to hosts the user types; the zero-egress and T1 header tests are the tripwires | a per-route CSP or service-worker assertion lands |
| Remote images in markdown previews (`img-src https:`, F3)                                            | user-content feature; Preview is an explicit user action; `Referrer-Policy` limits leakage                                                                   | a per-document toggle lands (desktop first)       |
| `style-src 'unsafe-inline'`                                                                          | CodeMirror injects runtime styles                                                                                                                            | the editor's styling approach changes             |
| Allowlist + CI drift gates not yet implemented                                                       | the §5 programme is written, not built; CSP + review are the interim controls                                                                                | T1.7–T1.9 land — then delete this row             |
| Unsigned/unnotarized desktop builds; Homebrew cask quarantine workaround; placeholder checksums (F4) | no Developer ID certificate; deferred by the 2026-10-16 decision                                                                                             | signing is planned or the channel requires it     |

## 8. Change checklist (paste into the PR)

```
[ ] Which promises (§1) does this touch? Default: none — prove it.
[ ] New egress? (origin, initiator, opt-in state, body fields) → allowlist + CSP updated, tests added
[ ] New storage? (key, database, fields, retention, delete path) → inventory updated, deletion test still passes
[ ] New dependency? → justification recorded; audit + knip clean
[ ] New claim/copy? → test added, or the claim is not made
[ ] Tests from §3/§5 run (list which)
[ ] Debt register (§7) updated if anything got weaker
[ ] New feature (not just a change)? → W3C PING self-review answers included
```

## 9. Escalation, waivers, definition of done

- If a task cannot be completed without weakening P1–P8: **stop and ask the maintainer.** Do not implement, do not add debt yourself, do not disable a test.
- If a privacy test fails: fix the code. If the test itself is wrong: fix it in the same PR and say why. **Never delete or skip a privacy test to make a task pass.**
- A waiver is a recorded decision (§6/§7) with an owner and a revisit trigger. New collection of any kind is reviewed before merge — even when nothing is retained.
- **Definition of done:** the §3 trigger row's tests pass; every inventory/allowlist/catalogue entry the change touches is updated; the debt register is current; claims match behavior. Below this bar, the task is not done.

## Appendix A — privacy surface map

| Surface                | Files                                                                                                                                        | Promises |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Deletion               | `src/core/privacy.ts`, `closeHistoryDb`/`closeWorkspaceDb` in the DB modules, Settings confirm step                                          | P6       |
| Preferences / controls | `src/core/preferences.ts`, `src/app/screens/SettingsScreen.tsx`, `src/app/shell/Topbar.tsx`                                                  | P4, P6   |
| Storage                | `src/core/history-db.ts`, `workspace-db.ts`, `workspace-schema.ts`, `favorites-store.ts`, `recent-tools.ts`, `src/shared/workspace-store.ts` | P3, P6   |
| Sensitivity policy     | `src/core/tool-policy.ts` (+ consumers)                                                                                                      | P3       |
| Transport              | `public/_headers`; desktop: `src-tauri/tauri.conf.json`                                                                                      | P5       |
| Network tools          | API request builder, WebSocket tester (`network: 'user_initiated'`)                                                                          | P4       |
| Desktop bridge         | `src/platform/desktop.ts`, `src/platform/external-links.ts`                                                                                  | P4, P5   |
| Service worker         | `scripts/generate-service-worker.mjs`, `src/platform/service-worker.ts`                                                                      | P6       |
| Claims                 | `src/content/seo/seo-content.js` (`LEGAL_PAGES`, FAQ `privacyAnswer`), legal pages                                                           | P7       |
| Repo secrets           | `.env*` (never committed)                                                                                                                    | §4.10    |

## Appendix B — data inventory (authoritative)

| Data                                                           | Store (verified in code)                                             | Written when                                           | Bounds / lifecycle                                                    | Leaves the device?                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------- |
| UI preferences (history, retention; `theme` as a separate key) | localStorage `toolbit-preferences`, `theme`                          | user interaction                                       | small; enum/number-validated on merge                                 | no                                        |
| Favorites, recents, panel state                                | localStorage `toolbit:favorites`, `toolbit:recents`, `toolbit:panel` | user interaction                                       | small lists                                                           | no                                        |
| Workspace shell state (open tabs, layout)                      | localStorage `toolbit-workspace`                                     | user interaction                                       | versioned + migrated; payloads excluded from persistence              | no                                        |
| Tool history (input/output)                                    | IndexedDB `toolbit-history`                                          | after successful runs, non-secret tools only           | ≤ 200 entries, ≤ 20/tool, retention 1–365 d (default 30)              | no                                        |
| Workspaces, saved documents/snippets                           | IndexedDB `toolbit-workspaces`                                       | explicit save; payload inclusion is an explicit choice | schema-validated; secret payloads refused on import                   | no (unless the user exports deliberately) |
| Session handoffs (smart paste, desktop open)                   | sessionStorage `toolbit:smart-paste`                                 | during a session                                       | dies with the session                                                 | no                                        |
| Retired analytics id (legacy)                                  | was localStorage `toolbit:analytics-anonymous-id`; `POST /capture/`  | never — removed 2026-10-16                             | **gone**; the delete-all sweep clears any residue by `toolbit` prefix | no                                        |
| Service worker caches                                          | Cache Storage                                                        | first visit                                            | build assets only; outdated caches cleaned                            | no                                        |
| Endpoint data (API builder, WebSocket tester)                  | the host the user types                                              | only when the user runs the request                    | nothing app-initiated                                                 | yes — by explicit user action             |
