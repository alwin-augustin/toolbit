# PostHog setup and verification

Configured through the owner’s authorized PostHog integration.

Project: [635948, Default project](https://us.posthog.com/project/635948/home), Alchamentry Studios, US region, UTC timezone. The owner has one project. The [Toolbit web product health dashboard](https://us.posthog.com/project/635948/dashboard/2159323) contains seven tiles covering five views: activation, successful devices, recipe reuse, failure/latency and telemetry health.

## Configuration

Cloudflare Pages project `toolbit` builds GitHub `alwin-augustin/toolbit`, production branch `main`, with `npm run build`, output `dist`. Both preview and production now have `NODE_VERSION`, `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`. The host is `https://us.i.posthog.com`. Keys are not recorded here. Cloudflare's automatic analytics injection was disabled to keep collection under the app preference.

The only event sender is `src/lib/telemetry/index.ts`. It uses the documented capture API directly, with no analytics SDK, automatic enrichment, configuration requests or retry queue. Missing configuration is nonfatal. The app maintains a pseudonymous device UUID. Analytics defaults on, has a prominent off switch, and opt-out removes the saved identity. Denied storage uses a random session identity. Each event explicitly disables person-profile processing using $process_person_profile:false. No Toolbit accounts are created. Only explicitly allowed events can be sent. Fetch omits credentials and referrers, times out after five seconds, and pending requests are aborted on opt-out.

## Event contract

| Event                                  | Trigger                             | Allowed context                                 |
| -------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| page_viewed                            | Known route change                  | Route enum                                      |
| tool_opened                            | Tool route opens                    | Tool/route IDs                                  |
| transform_succeeded / transform_failed | Canonical transform result          | Tool, bounded duration/byte buckets, error enum |
| output_copied                          | Clipboard/fallback confirms success | Tool/route IDs                                  |
| pipeline_step_added                    | Compatible next tool selected       | Tool ID, bounded count                          |
| recipe_saved                           | Validated storage write succeeds    | Step count/schema version                       |
| recipe_rerun                           | Previously saved recipe runs        | Step count/schema version                       |
| workspace_saved / workspace_restored   | Workspace action completes          | Schema/count/source enums                       |
| snippet_saved                          | Explicit snippet write succeeds     | No content                                      |
| tool_shared                            | Share copy succeeds                 | Tool ID                                         |
| smart_detection_used                   | Deterministic detection chosen      | Tool ID                                         |
| app_error                              | Sanitized caught render failure     | app/tool component and error enum               |
| operational_log                        | Operational signal                  | Allowlisted IDs/enums only                      |

Properties are rebuilt from known catalogue tool IDs, known route names, operation enums, error codes, `fast/medium/slow` duration buckets, `small/medium/large` byte buckets, counts 0–1000 and the fixed release ID. No names, raw input/output, headers, exception messages, clipboard contents, raw URL, hash/query or referrer is permitted. No SDK automatic properties are collected. Error objects are deduplicated using a WeakSet. Logs discard free text. History writes no longer emit outcomes. Legacy call sites use a fail-closed facade during incremental migration; unsupported old events are dropped.

## Verification evidence and limits

Synthetic events use `release_id=verification-2026-10-01`; the saved dashboard defaults filter production `release_id=1.0.0`. These fixtures verify query behavior rather than adoption. Seven-day retention requires elapsed real use. Success is measured by pseudonymous devices, not SDK sessions. Blockers, cleared identities and multiple browsers affect interpretation. Data Catalog scopes are unavailable, so the dashboard measures are operational definitions rather than governed metrics.

The browser canary checks configured request bodies, input/URL exclusion, accepted capture responses and opt-out. Run it against a verification preview using the instructions in [RELEASE.md](RELEASE.md). Tests also cover missing configuration and blocked analytics without interrupting local transforms. Keep raw evidence and historic fixture counts outside the repository. Analytics ingestion credentials are deployment configuration; never commit them.

## Access and deletion

The repository owner controls the connected organization/project. Use project settings to manage authorized access and retention. Device IDs are not users; Toolbit cannot correlate a cleared device ID with a human. Turning analytics off removes the local ID and stops collection, but does not retroactively erase events already sent. Deletion of existing project data must be performed with authorized PostHog project controls. Do not commit credentials or raw event payload dumps. Client ingestion is documented in [PostHog's capture API](https://posthog.com/docs/api/capture).

## AI

AI instrumentation is not applicable. Smart Paste is deterministic. Any future AI feature needs its own privacy/design ADR and explicit consent before content transmission; there are no placeholder AI events.
