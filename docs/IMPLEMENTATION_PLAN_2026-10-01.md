# Toolbit implementation plan

Plan date: 1 October 2026
Source audit: [`PRODUCT_AUDIT_2026-10-01.md`](PRODUCT_AUDIT_2026-10-01.md)
Planning baseline: commit `f2d4072`

## Outcome

Ship Toolbit as a trustworthy, local-first workspace for repeatable developer transformations. The implementation order is intentional:

1. Stop data corruption and misleading privacy behavior.
2. Restore a dependable release gate.
3. Define one shared contract for tools, storage and analytics.
4. Make tabs and workspaces preserve real work.
5. Turn pipelines into reproducible recipes.
6. Polish accessibility, responsiveness, performance and distribution.
7. Validate which new capabilities deserve investment.

This plan covers the web/PWA recommendations in the product audit. Desktop findings are superseded by the decision to retire native distribution. It does not assume that every discovery candidate will be built.

## Scope revision and implementation status — 1 October 2026

The browser app and installable PWA are the only supported products. Desktop distribution is retired, rather than hardened. Cloudflare remains the web host.

Analysis: the correctness/privacy → release gate → shared contract → durable documents → executable recipes sequence remains appropriate. M0 and M2 need an explicit green baseline before broad migration. M8 artifact ordering remains a real offline risk: SEO pages generated after service-worker creation are not automatically precached. Retiring desktop does not resolve that issue.

Current implementation checkpoint (not a declaration that all exit gates passed):

- [x] Retire native runtime, dependencies, packaging, installer resources, release workflow, published releases/tags and retained desktop artifacts; preserve Cloudflare web hosting.
- [x] Pin Node24; record runtime/browser targets, storage inventory and four accepted ADRs (`RUNTIME_AND_STORAGE.md`, `decisions/`).
- [x] Preserve canonical JSON, warn for unsafe numeric precision, retain previous valid output, and cover large arrays/string tokens.
- [x] Add sensitivity policy, guarded history/share/workspace persistence, analytics/history preferences, legacy credential recovery/removal and a sanitized telemetry boundary.
- [x] Repair routed tests and enforce lint/type/unit/browser checks in web CI.
- [x] Introduce pure transformation contracts, independent document IDs/state, versioned workspace validation and ordered executable recipes with three templates.
- [x] Connect PostHog project635948; configure preview/production variables and disable separate Cloudflare analytics injection.
- [x] Create the five-view PostHog dashboard and verify labeled synthetic queries, with fixtures excluded from production defaults.
- [x] Add clipboard denial handling, responsive/focus improvements, measured CPU baselines, worker execution/cancellation and regex interruption limits.
- [x] Generate final SEO pages before service-worker precaching; verify offline direct tool navigation.
- [x] Revise M9 to an owner pilot with candidate dispositions, as requested by the sole developer.
- [x] Verify configured preview telemetry and browser journeys; PR36 merged and production deployment d8b787e0-ab5f-4191-8784-58e376ece46f passed ten production browser checks on2 October2026.
- [ ] Merge the explicit PostHog person-profile processing opt-out and strengthened transport tests prepared after PR36.
- [ ] Complete deployed service-worker update/cache testing across two revisions and a production rollback rehearsal.
- [ ] Complete platform-specific PWA installation/uninstallation and representative screen-reader acceptance.
- [ ] Record owner observations and seven-day recipe reuse after actual use; do not invent elapsed evidence.

Checkpoint evidence: 20 unit/component files and 125 tests pass. Lint and type checks pass. Eleven configured production-build browser tests pass, including live canary/opt-out, independent documents, refresh/restore, worker failure and full output copy, accessibility at enlarged layouts, denied storage/clipboard, narrow focus return and offline navigation. Desktop and 390 px mobile screenshots were visually inspected. Deployment and real platform/owner acceptance remain separate gates. See `POSTHOG_SETUP.md` and `PERFORMANCE_AND_RELEASE_CHECKS.md`.

## Delivery rules

- Work in small commits; each commit must pass the checks relevant to its scope.
- Do not mix correctness/privacy fixes with workspace model migrations.
- Add a failing regression test before each bug fix where practical.
- Do not log or commit real tokens, passwords, headers, customer payloads or PostHog keys.
- Use synthetic canary values for privacy tests.
- Support only the browser app and installed PWA. Native desktop packaging, signing, installers and release automation are retired.
- Cloudflare remains the only intended web deployment target. Do not recreate a Vercel project.
- A milestone is complete only when its exit gate passes; merged code alone is not completion.

## Dependency map

| Milestone | Depends on | Unlocks |
|---|---|---|
| M0 Baseline and decisions | — | All implementation |
| M1 Correctness and privacy containment | M0 | Safe production behavior |
| M2 Test and release gate | M0; incorporates M1 regressions | Confident refactoring |
| M3 Shared tool contract | M1, M2 | Consistent storage, telemetry and recipes |
| M4 Documents and workspaces | M3 | Durable user work |
| M5 Executable recipes | M4 | Product differentiation |
| M6 Analytics and dashboard | M1, M3, M5 event semantics | Reliable product learning |
| M7 UX, accessibility and performance | M2–M5 stable flows | Release-quality experience |
| M8 PWA and Cloudflare release | M1–M7 | Production launch |
| M9 Discovery and selective expansion | Stable release and M6 baseline | Evidence-based roadmap |

## M0 — Baseline and implementation decisions

Target: 0.5–1 day.

### M0.1 Record supported environments

- Add the supported Node version to `.nvmrc` or `.node-version` and `package.json#engines`; use the same version in CI.
- Record supported browser versions and PWA installation capabilities on computers and mobile devices.
- Capture baseline results for type-check, lint, unit tests and production build.
- Inventory existing IndexedDB/localStorage keys and schema versions before changing persistence.

### M0.2 Resolve four bounded product decisions

These should be short written decisions, not open-ended redesign work:

1. **Analytics default:** recommended default is enabled with a prominent preference and strict minimization; if product policy requires opt-in, change the copy and initialization flow accordingly.
2. **History default:** recommended default is normal history for non-sensitive tools, disabled for tools classified `secret` or `credential`.
3. **Workspace payload persistence:** recommended default is explicit per-workspace “include data” consent; exported recipes exclude payloads by default.
4. **Terminology:** use `document` for a working tool instance, `workspace` for a set of documents/layout, and `recipe` for an ordered executable transformation.

Create compact ADRs in `docs/decisions/`. No implementation should invent alternate meanings later.

### M0 exit gate

- One runtime matrix and four accepted ADRs exist.
- Baseline command output is attached to the implementation issue or release notes.
- Existing user storage formats are documented sufficiently to write migrations.

## M1 — Correctness and privacy containment

Target: 3–6 days. This milestone can be split into separate release patches, but all items are required.

### M1.1 Preserve JSON output integrity

Primary files: `src/v2/tools/JsonFormatterV2.tsx`, `src/v2/CodeEditor.tsx`.

- Separate canonical output from preview/editor presentation.
- Replace `collapseLarge()` data mutation with visual code folding, or temporarily remove the option until true folding is available.
- Ensure copy, pipe, share and history use the complete canonical JSON.
- Define the large-number policy. At minimum, warn when parsing can lose integer precision; do not claim lossless handling unless it is implemented.
- Move expensive parsing/formatting behind a measured threshold only after M7 benchmarks establish one.

Tests:

- Arrays of 20, 21 and 1,000 items.
- Nested large arrays.
- Collapse option plus key sorting and each indentation setting.
- Copied, piped and restored output matches canonical output.
- Invalid input never replaces the previous valid output silently.

### M1.2 Introduce tool data-sensitivity policy

Primary files: new `src/lib/tool-policy.ts`, `src/config/tools.config.ts`, `src/hooks/use-tool-history.ts`, sensitive tools.

- Add metadata: `sensitivity: normal | personal | secret`, `network: none | user_initiated`, and `historyDefault: enabled | disabled`.
- Initially classify password, TOTP, JWT, certificate/private-key fields and authorization headers as sensitive; review every tool before merging.
- Make history writes consult policy centrally rather than relying on each component.
- Keep normal tools working if IndexedDB is unavailable.
- Add settings for history retention and clear-history actions. Avoid silently deleting existing history during migration; explain and offer removal.
- Review URL sharing for sensitive tools. Disable payload-bearing share URLs where the default would expose secret material.

Tests:

- Passwords, TOTP seeds, JWTs and authorization headers are not written by default.
- Non-sensitive history continues to work.
- Session-only and storage-denied paths work.
- Existing history can be inspected and explicitly cleared.

### M1.3 Put telemetry behind a privacy boundary

Primary files: `src/lib/posthog.ts`, `src/lib/posthog-logger.ts`, `src/components/PostHogPageView.tsx`, new `src/lib/telemetry/`.

- Create one typed analytics adapter. Components must not import `posthog-js` directly after migration.
- Define an allowlist of event names and property schemas.
- Strip URL query, hash and referrer payloads globally; send route names instead of raw URLs.
- Convert raw errors to bounded error codes and sanitized component/tool identifiers.
- Rebuild every transport payload from the global allowlist as defense in depth; use explicit capture requests without SDK enrichment.
- Make analytics initialization and storage failures non-fatal.
- Keep autocapture and session recording disabled.
- Add an analytics preference matching M0's decision; honor it before initialization and identification.
- Treat the stable device identifier as pseudonymous; describe it accurately.

Adversarial tests:

- Place a unique canary secret in input, output, URL hash/query, workspace name, exception message and request headers.
- Capture every supported event, error and log path.
- Assert the canary is absent from serialized telemetry and logs.
- Verify opt-out prevents network requests and removes/rotates local analytics identity according to the ADR.

### M1.4 Make product claims accurate

Primary files: `src/pages/privacy-policy.tsx`, `src/v2/StatusBar.tsx`, `src/v2/HomeDashboard.tsx`, `src/seo/seo-content.js`, `README.md`, `docs/POSTHOG_SETUP.md`.

- Replace unconditional “no network” wording with state-aware wording such as “Processing is local” and identify intentionally networked tools.
- Explain local history, analytics, retention, deletion and the absence of accounts in plain language.
- Use a fixed policy revision date, not the current render date.
- Remove stale Vercel instructions; document the verified Cloudflare project, variables, preview flow and rollback procedure.
- State that Smart Paste is deterministic detection, not AI.

### M1 exit gate

- JSON regression tests prove no data is removed by display options.
- Synthetic-secret tests pass for history, URL state, analytics and logs.
- Privacy UI, policy, README and SEO copy agree.
- The app starts and remains usable with missing analytics variables, denied storage and blocked telemetry.

## M2 — Restore the release gate

Target: 2–4 days.

### M2.1 Repair the test environment

Primary files: `tests/setup.ts`, Vitest configuration, failing test files.

- Run locally with the supported Node version from M0.
- Provide stable mocks for localStorage, IndexedDB, crypto, clipboard and analytics.
- Make missing PostHog variables a supported test/development state rather than an import-time failure.
- Update Word Counter and legacy tool tests to exercise the components actually routed in production.
- Separate genuine behavior tests from brittle implementation selectors.

### M2.2 Establish layered coverage

- Unit-test pure transformations and serializers.
- Component-test option behavior, storage policy and error/copy states.
- Add routed browser smoke tests for home → Smart Paste → JSON → Base64, history settings, workspace restore and malformed import.
- Add an accessibility smoke test with automated checks, while keeping manual keyboard/screen-reader checks in M7.

### M2.3 Enforce CI

Primary file: `.github/workflows/validate-web.yml`.

- Run unit/component tests in CI after lint and type-check.
- Run browser smoke tests against a production build.
- Cache dependencies without caching generated application state.
- Upload useful failure artifacts and screenshots.
- Rename CI steps/jobs so names match behavior.
- Add dependency and secret scanning only if it can be maintained without drowning real failures in noise.

### M2 exit gate

- Clean checkout: install, lint, type-check, tests and production build all pass on the supported Node version.
- CI fails on a deliberately broken test in a temporary verification branch or local workflow simulation.
- The prior 13 failing test files are resolved, replaced with equivalent current coverage, or removed with a written reason.

## M3 — Shared tool contract

Target: 4–7 days. This is an incremental adapter migration, not a full rewrite.

### M3.1 Define the contract

Create a contract resembling:

```ts
interface ToolDefinition<Input, Output, Options> {
  id: ToolId;
  version: number;
  inputType: DataType;
  outputType: DataType;
  sensitivity: Sensitivity;
  network: NetworkPolicy;
  defaultOptions: Options;
  parse(raw: string): Result<Input, ToolError>;
  transform(input: Input, options: Options, signal?: AbortSignal): Promise<Result<Output, ToolError>>;
  serializeOptions(options: Options): JsonValue;
}
```

- Keep view components separate from pure transformations.
- Use stable error codes with user-facing messages outside the core transform.
- Define compatible input/output types for pipeline suggestions.
- Include schema version and migration hooks for serialized options.
- Centralize tool metadata currently split across the catalogue and V2 registry.

### M3.2 Prove it with a vertical slice

Migrate JSON Formatter, Base64 and Strip Whitespace first. They exercise structured data, binary/text encoding and a simple transform.

- Adapt both legacy and V2 shells to the same contract.
- Route copy, history, piping and analytics through shared success/failure results.
- Do not migrate all 42 tools until the three-tool slice survives M4/M5 requirements.

### M3.3 Standardize reliability behavior

- Await clipboard writes; show success only after completion and provide a fallback on denial.
- Explicitly capture sanitized caught-tool errors in `ToolErrorBoundary` once.
- Ensure analytics and persistence failures never change transformation success.
- Add input-size metadata and cancellation support even before worker migration.

### M3 exit gate

- Three migrated tools behave identically through direct use, piping, history and restore.
- Pure transformation tests do not mount React.
- No migrated component imports PostHog or writes IndexedDB directly.
- Clipboard denial, storage denial and caught render errors have verified user states.

## M4 — Documents and versioned workspaces

Target: 4–8 days.

### M4.1 Define persistence models

Recommended initial schema:

```ts
interface ToolDocumentV1 {
  id: string;
  toolId: ToolId;
  toolVersion: number;
  options: JsonValue;
  payload?: EncryptedOrPlainLocalPayload;
  updatedAt: number;
}

interface WorkspaceV1 {
  schemaVersion: 1;
  id: string;
  name: string;
  documents: ToolDocumentV1[];
  activeDocumentId?: string;
  layout: WorkspaceLayout;
}
```

- Allow multiple documents using the same tool.
- Preserve in-session state immediately; persist payloads only according to M0 policy.
- Store tool/options versions so migrations are possible.
- Make unknown/deleted tools recoverable rather than fatal.

### M4.2 Migrate the shell

Primary files: `src/v2/workspace-store.ts`, `src/v2/WorkspaceShell.tsx`, V2 tools.

- Key tabs by document ID, not tool ID.
- Preserve input and options when switching tabs.
- Define close/reopen behavior and unsaved indicators.
- Collapse the inspector on the home screen and remember the preference appropriately.
- Remove implementation labels such as “Phase 2.”

### M4.3 Version and validate import/export

Primary files: `src/lib/workspace-db.ts`, `src/v2/PhaseTwoPanels.tsx`.

- Validate schema, size, tool IDs, versions and option shapes before persistence.
- Parse into a temporary object; never partially save invalid imports.
- Show specific, actionable errors.
- Export atomically with a schema version and product version.
- Provide migrations for the current workspace format and tests for future/unknown versions.

### M4 exit gate

- Two JSON documents can remain open with independent content and settings.
- Refresh/restore behavior matches the persistence choice communicated to the user.
- Valid workspace export/import round-trips; malformed, oversized and future-version files fail safely.
- Existing workspaces migrate or remain recoverable without silent loss.

## M5 — Executable recipes

Target: 6–10 days after the contract and workspace model stabilize.

### M5.1 Define recipes separately from workspaces

```ts
interface RecipeV1 {
  schemaVersion: 1;
  id: string;
  name: string;
  steps: Array<{
    id: string;
    toolId: ToolId;
    toolVersion: number;
    options: JsonValue;
  }>;
}
```

- Preserve order and repeated tools; never deduplicate with `Set`.
- Exclude input/output payloads by default.
- Validate type compatibility between steps.
- Provide a clear stopped/error state and identify the failing step.
- Allow a user to inspect intermediate output without persisting it automatically.

### M5.2 Build three end-to-end recipes

1. Base64 decode → JSON format/validate → Base64 encode.
2. CSV cleanup → JSON conversion → JSON validation.
3. Text normalization → hash generation.

Where a required transformation is incomplete, improve the existing tool contract rather than introducing a duplicate tool.

### M5.3 Recipe experience

- Rename the current “Save pipeline” action to match actual behavior until executable saving ships.
- Add create, reorder, configure, run, stop, save, duplicate, import/export and delete.
- Make destructive deletion recoverable where practical.
- Explain whether data remains local and whether a step intentionally uses the network.
- Suggest the next compatible tool using contract types, not a hard-coded ad hoc list.

### M5 exit gate

- Base64 decode → JSON → Base64 encode survives save, app reload and export/import with repeated Base64 steps intact.
- All three recipes reproduce deterministic fixture outputs.
- Invalid type connections are blocked before execution.
- Recipe exports contain no fixture payload or synthetic secret unless explicitly included.

## M6 — Reliable analytics, logs and product dashboard

Target: 3–5 days plus enough production time to establish a baseline.

### M6.1 Instrument outcomes, not storage side effects

Use the M1 adapter and M3 contract to emit:

- `tool_opened`
- `transform_succeeded`
- `transform_failed`
- `output_copied`
- `pipeline_step_added`
- `recipe_saved`
- `recipe_rerun`
- `workspace_restored`

Allowed properties: known tool/operation IDs, entry route enum, sanitized error code, duration bucket, byte-count bucket, step count, schema version and release ID. Prohibit raw input, output, workspace/recipe names, headers, tokens, URLs and exception messages.

- Remove `tool_action_completed` from history persistence.
- Cover legacy and V2 paths through the adapter during migration.
- Deduplicate error reporting between global and per-tool boundaries.
- Make logs operational: environment, release, component/tool ID and sanitized code only.

### M6.2 Verify the PostHog project

- Confirm environment variables on the actual Cloudflare production project without copying secrets into documentation.
- Send synthetic events in local/preview and verify arrival, schema and sanitization.
- Verify opt-out and blocked-network behavior.
- Document data ownership, access and deletion procedures.

### M6.3 Create the dashboard

Build five views:

1. Tool open → successful transform → copy/pipe funnel.
2. Successful devices by tool and entry route (accepted privacy decision: SDK session properties are excluded; do not label device counts as sessions).
3. Recipe save → recipe rerun, including seven-day reuse.
4. Failure rate and latency buckets by tool and release.
5. Telemetry health: event volume, schema violations and duplicate signals.

Annotate limitations: device IDs are not users; blockers, profile clearing and multiple devices affect retention.

### M6.4 AI usage

- Record AI instrumentation as not applicable today.
- Do not add placeholder AI events.
- If a future AI feature passes discovery, require a separate privacy/design ADR covering provider, content transmission and explicit consent. Only then add model, provider, token, latency, cost and outcome fields—without prompt or response bodies by default.

### M6 exit gate

- Canary telemetry inspection is clean.
- Every event is documented, typed and covered by a schema test.
- Dashboard queries return verified synthetic results before production data is trusted.
- Analytics failure cannot block any tool or recipe.

## M7 — UX, accessibility and performance hardening

Target: 5–8 days, informed by measurement rather than assumptions.

### M7.1 Responsive and accessibility acceptance

- Test home, command navigation, Smart Paste, editors, workspace dialogs, history and recipe builder at narrow viewport, 200% zoom and desktop widths.
- Ensure editor inputs/outputs have programmatic names and validation is announced without stealing focus.
- Verify visible focus, logical tab order, escape/close behavior and focus return for every dialog/panel.
- Increase undersized targets and fix measured contrast failures.
- Ensure compact density remains operable, not merely visually dense.
- Test one representative journey with VoiceOver or another screen reader; automated tooling is supplementary.

### M7.2 Clarify the home and workspace experience

- Default the empty home inspector closed.
- Keep Smart Paste primary and recent work secondary.
- Explain ambiguous detections and retain manual tool selection.
- Use consistent success, invalid, busy, empty and permission-denied states.
- Update task-oriented guides for the three recipes rather than adding thin catalogue pages.

### M7.3 Performance and resilience

- Establish real baselines for bundle/load, 100 KB/1 MB/10 MB transformations and interaction latency.
- Move expensive transformations to workers when measured thresholds are crossed; support cancellation and stale-result suppression.
- Add safe limits and interruption strategy for regex evaluation.
- Preserve CodeMirror/code-splitting benefits and avoid loading all tools on entry.
- Test storage quota, clipboard denial and worker failure paths.

### M7 exit gate

- Critical journey passes keyboard, narrow-layout and 200% zoom checks.
- No critical automated accessibility violations remain in covered views.
- Measured performance budgets and supported payload limits are documented.
- Large-input work does not freeze the UI beyond the agreed interaction budget.

## M8 — PWA and Cloudflare release

Target: 3–5 days plus platform testing.

### M8.1 PWA and SEO artifact ordering

- Generate SEO/static pages before the final service-worker precache manifest, or otherwise explicitly include final output.
- Test first online visit, offline revisit, direct tool deep link, recipe/workspace route, update activation and cache invalidation.
- Verify generated metadata, canonical URLs, sitemap and privacy copy.
- Do not describe the app as fully offline until this matrix passes.

### M8.2 Web/PWA distribution verification

- Verify no native runtime, packaging dependency, IPC bridge, installer asset, desktop download link or desktop CI remains.
- Disable the remote desktop release workflow immediately; remove published desktop releases, their generated tags and retained desktop build artifacts.
- Inventory deployment records and remove only desktop-specific environments; preserve the Cloudflare web/PWA deployment.
- Use the same privacy/history policy in browser and installed PWA contexts.
- Test install, launch, update and uninstall behavior in supported PWA browsers. Keep native desktop distribution out of scope.

### M8.3 Cloudflare production release

- Verify the real production project, branch, build command, output directory, environment variables and custom domain.
- Run a preview deployment and execute the browser smoke suite against it.
- Define rollback to the last known-good Cloudflare deployment.
- Deploy in stages if available, watch sanitized errors and core outcome events, then promote.
- Confirm no Vercel project/configuration has been reintroduced.

### M8 exit gate

- Web preview and production pass the same smoke checklist.
- Offline/direct-navigation matrix passes on the built artifact.
- PWA installation and launch meet the browser support matrix; desktop distribution is absent.
- Rollback is documented and rehearsed without deleting user data.

## M9 — Product validation and selective expansion

Target: 1–2 discovery weeks, then separately estimated implementation.

### M9.1 Validate positioning

Scope revised by the owner: run a sole-developer pilot using owner suggestions and sanitized tasks; external recruitment of 5–8 developers is deferred. Do not represent owner opinion as observed user demand. See `DISCOVERY_PILOT.md`. Test the positioning: “Paste, inspect and transform developer data in a workspace you can reuse.”

Research questions:

- Do users begin with a tool name, raw payload or remembered recipe?
- Which transformations naturally form repeatable chains?
- What data do users refuse to place in a browser tool?
- Is reuse one session later valuable, or is Toolbit mainly disposable?
- Would PWA launch integrations or self-hosting materially change adoption?

Use behavioral evidence: task success, time to first useful output and seven-day recipe reuse. Do not set conversion targets before the M6 baseline exists.

### M9.2 Candidate capabilities

Score each candidate on observed demand, fit with existing contracts, correctness risk and maintenance cost:

- JSONPath querying.
- Explicit JSON ↔ YAML conversion.
- Reverse JSON → CSV.
- Structured/redacted payload comparison.
- PWA launch integrations.
- Self-hosting documentation.

Do not prioritize general chat, accounts, cloud sync, plugin marketplace or broad tool-count expansion without new evidence and a separate architecture/privacy decision.

### M9 exit gate

- Owner pilot protocol and candidate dispositions are documented; actual observations remain pending owner use.
- Research notes distinguish observation from opinion; seven-day reuse remains pending elapsed observation time.
- Each selected capability has a small PRD, contract implications, privacy classification and success measure.
- Rejected/deferred candidates have a reason and reconsideration trigger.

## Recommended commit sequence

Each line is intended to be independently reviewable; combine only when the diff remains small.

0. `chore: retire desktop runtime packaging releases and automation`
1. `docs: record runtime, privacy, history and persistence decisions`
2. `test: reproduce JSON collapse data loss`
3. `fix: preserve canonical JSON when arrays are folded`
4. `feat: add centralized tool sensitivity policy`
5. `fix: disable persistent history for sensitive tools`
6. `feat: add explicit history and analytics preferences`
7. `refactor: add typed sanitized telemetry adapter`
8. `test: reject secrets from telemetry and logs`
9. `docs: align privacy product and hosting claims`
10. `test: stabilize browser storage clipboard and telemetry mocks`
11. `test: update routed tool coverage and restore green suite`
12. `ci: enforce tests and production browser smoke checks`
13. `feat: introduce versioned tool transformation contract`
14. `refactor: migrate JSON Base64 and whitespace transforms`
15. `fix: report clipboard and tool-boundary failures accurately`
16. `feat: add versioned document and workspace schemas`
17. `feat: preserve independent tool documents in tabs`
18. `feat: validate and migrate workspace import export`
19. `feat: introduce ordered versioned recipe model`
20. `feat: execute and inspect compatible recipe steps`
21. `feat: save import export and rerun recipes without payloads`
22. `refactor: emit analytics from transformation outcomes`
23. `docs: publish verified PostHog event and log schemas`
24. `feat: improve responsive keyboard and screen-reader flows`
25. `perf: add measured limits cancellation and worker execution`
26. `fix: precache final generated site artifacts`
27. `chore: verify PWA and Cloudflare release controls`

## Definition of done for the program

- All P0/P1 findings in the audit have an implemented fix or an explicit accepted decision.
- Formatting and display controls cannot mutate exported/copied/piped data without being named as transformations.
- Sensitive data is neither persisted nor transmitted by default.
- Privacy claims describe actual analytics, storage and network behavior.
- The supported test suite and production smoke journey gate releases.
- Documents, workspaces and recipes are distinct, versioned concepts.
- At least three deterministic recipes round-trip through save and import/export.
- PostHog events and logs are typed, minimized, sanitized and verified; the product dashboard is usable.
- Critical flows pass the documented responsive, keyboard, accessibility, offline and performance checks.
- Cloudflare is the documented web host; production rollback is tested.
- AI instrumentation remains absent until an AI feature and its privacy model actually exist.

## Suggested staffing and schedule

For one experienced engineer, allow roughly 7–10 focused weeks including verification, with discovery following the stable release. Two engineers can shorten calendar time, but M3–M5 should keep one owner for the domain model to avoid incompatible workspace and recipe abstractions.

Suggested parallel work once M1/M2 are stable:

- Track A: tool contract, documents and recipes (M3–M5).
- Track B: analytics adapter/dashboard and privacy verification (M6).
- Track C: accessibility, performance and release-surface validation (M7–M8).

Do not parallelize schema design independently across tracks. Shared types, privacy rules and migration ownership remain centralized.

## Status check — 2 October 2026

PR36 merged as67e12f07ba829fda8f3e311093e902ebc7847ee3. Main-branch lint/type/unit/browser and CodeQL workflows passed. Cloudflare production deployed that revision successfully, and ten direct toolbit.app browser journeys passed today with telemetry blocked to exclude test traffic from adoption metrics. The PostHog profile-processing flag and strengthened request-host/status tests were local follow-ups and were not included in PR36. See STATUS_2026-10-02.md for the outstanding acceptance gates. Do not treat the original merge as completion of all milestones.
