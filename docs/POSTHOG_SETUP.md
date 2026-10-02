# PostHog setup and verification

Verified 1 October 2026 through the owner's authorized PostHog integration.

Project: [635948, Default project](https://us.posthog.com/project/635948/home), Alchamentry Studios, US region, UTC timezone. The owner has one project. The [Toolbit web product health dashboard](https://us.posthog.com/project/635948/dashboard/2159323) contains seven tiles covering five views: activation, successful devices, recipe reuse, failure/latency and telemetry health.

## Configuration

Cloudflare Pages project `toolbit` builds GitHub `alwin-augustin/toolbit`, production branch `main`, with `npm run build`, output `dist`. Both preview and production now have `NODE_VERSION`, `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`. The host is `https://us.i.posthog.com`. Keys are not recorded here. Cloudflare's automatic analytics injection was disabled to keep collection under the app preference.

The only event sender is `src/lib/telemetry/index.ts`. It uses the documented capture API directly, with no analytics SDK, automatic enrichment, configuration requests or retry queue. Missing configuration is nonfatal. The app maintains a pseudonymous device UUID. Analytics defaults on, has a prominent off switch, and opt-out removes the saved identity. Denied storage uses a random session identity. Each event explicitly disables person-profile processing using $process_person_profile:false. No Toolbit accounts are created. Only explicitly allowed events can be sent. Fetch omits credentials and referrers, times out after five seconds, and pending requests are aborted on opt-out.

## Event contract

| Event | Trigger | Allowed context |
|---|---|---|
| page_viewed | Known route change | Route enum |
| tool_opened | Tool route opens | Tool/route IDs |
| transform_succeeded / transform_failed | Canonical transform result | Tool, bounded duration/byte buckets, error enum |
| output_copied | Clipboard/fallback confirms success | Tool/route IDs |
| pipeline_step_added | Compatible next tool selected | Tool ID, bounded count |
| recipe_saved | Validated storage write succeeds | Step count/schema version |
| recipe_rerun | Previously saved recipe runs | Step count/schema version |
| workspace_saved / workspace_restored | Workspace action completes | Schema/count/source enums |
| snippet_saved | Explicit snippet write succeeds | No content |
| tool_shared | Share copy succeeds | Tool ID |
| smart_detection_used | Deterministic detection chosen | Tool ID |
| app_error | Sanitized caught render failure | app/tool component and error enum |
| operational_log | Operational signal | Allowlisted IDs/enums only |

Properties are rebuilt from known catalogue tool IDs, known route names, operation enums, error codes, `fast/medium/slow` duration buckets, `small/medium/large` byte buckets, counts 0–1000 and the fixed release ID. No names, raw input/output, headers, exception messages, clipboard contents, raw URL, hash/query or referrer is permitted. No SDK automatic properties are collected. Error objects are deduplicated using a WeakSet. Logs discard free text. History writes no longer emit outcomes. Legacy call sites use a fail-closed facade during incremental migration; unsupported old events are dropped.

## Verification evidence and limits

Ten synthetic events tagged `release_id=verification-2026-10-01` were accepted and read back from this project. The activation funnel returned 1 → 1 → 1; recipe save/rerun returned 1 → 1; failure ratio was 0.5 for one success and one failure; latency had one fast event. The fixture-only health query returned ten rows, each with zero prohibited property signals and zero repeated UUID signals. The saved dashboard defaults filter production `release_id=1.0.0`, excluding these fixtures. Native queries were also executed through a non-persisted dashboard fixture override; the SQL health tile was checked separately because dashboard property overrides do not rewrite SQL literals.

These fixtures verify query behavior, not adoption. Seven-day retention is pending elapsed observation. Success is measured by pseudonymous devices, rather than sessions, because the boundary deliberately excludes SDK session properties. Blockers, cleared profiles and multiple browsers affect interpretation. Repeated UUID counts cover delivery duplication only; semantic duplication needs additional investigation. Data Catalog scopes are unavailable, so measures are explicitly noncanonical operational definitions rather than governed metrics.

The test suite inspects all allowed events with a synthetic canary in arbitrary input/output/header/message/URL fields, verifies automatic events are dropped, and tests opt-out/identity rotation. Local production browser checks with missing analytics variables pass. The configured production-build browser test passed: request bodies exclude a canary placed in tool input and URL query/hash; opt-out removes the identity and prevents subsequent requests. Verification builds use the fixed release verification-2026-10-01, excluded from dashboard production defaults. Deployed preview verification and production monitoring remain release acceptance tasks.

## Access and deletion

The repository owner controls the connected organization/project. Use project settings to manage authorized access and retention. Device IDs are not users; Toolbit cannot correlate a cleared device ID with a human. Turning analytics off removes the local ID and stops collection, but does not retroactively erase events already sent. Deletion of existing project data must be performed with authorized PostHog project controls. Do not commit credentials or raw event payload dumps. Client ingestion is documented in [PostHog's capture API](https://posthog.com/docs/api/capture).

## AI

AI instrumentation is not applicable. Smart Paste is deterministic. Any future AI feature needs its own privacy/design ADR and explicit consent before content transmission; there are no placeholder AI events.
