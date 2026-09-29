# PostHog setup report

## Status

- SDK: `posthog-js` is installed and initialized from `src/lib/posthog.ts`.
- Production configuration: `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` are set in the Vercel Production environment.
- Identity: each installation gets a stable, random `toolbit_<uuid>` identifier in local storage. Toolbit has no sign-in, so no personal identity is collected.
- Privacy: automatic click capture and session recording are disabled. Event properties intentionally exclude all tool input, output, clipboard text, snippets, URLs with query parameters, and file contents.
- Errors: PostHog captures unhandled errors and unhandled promise rejections. The React error boundary also records the component stack.
- Logs: structured application logs are sent with the `toolbit-web` service name. Only allowlisted operational attributes are logged.

## Events

| Event | When it is sent | Safe properties |
| --- | --- | --- |
| `$pageview` | SPA route changes | origin and path only |
| `tool_action_completed` | a tool adds a history item | tool ID and display name |
| `tool_shared` | a share link is copied | tool ID |
| `pipeline_tool_selected` | a pipeline destination is selected | source and target tool IDs |
| `workflow_saved` | a workflow is saved | tool count |
| `workspace_saved` / `workspace_loaded` | workspace action completes | source and tool count |
| `snippet_saved` | a snippet is saved | no content |
| `smart_detection_used` | Smart Paste routes to a tool | destination tool ID and suggestion count |

## AI usage

Toolbit does not currently call an AI model or AI API. Consequently, no `ai_*` event is emitted: emitting one would misrepresent usage. If an AI feature is added, emit `ai_request_started`, `ai_request_completed`, and `ai_request_failed` with the model/provider, latency, and token counts only—never prompts, inputs, outputs, or secrets.

## Product dashboard specification

Create a “Toolbit product health” dashboard in PostHog with these tiles:

1. Daily unique users: unique persons on `$pageview`.
2. Tool activation: unique persons on `tool_action_completed`, grouped by `tool_id`.
3. Smart Paste conversion: `smart_detection_used` followed by `tool_action_completed`.
4. Workflow adoption: weekly `workflow_saved` and `workspace_saved` totals.
5. Reliability: exception count and error-rate trend, grouped by route.
6. Operational logs: recent `toolbit-web` logs at `warn` or higher.

Dashboard creation requires a PostHog personal API key or an authenticated PostHog browser session; the browser ingestion key used by this app cannot create or modify dashboards.

## Verification

1. Open Toolbit with browser developer tools network filtering for `posthog`.
2. Navigate to a tool and complete an action. Confirm `$pageview` and `tool_action_completed` in PostHog Live Events.
3. Confirm the event properties contain a tool ID but no processed content.
4. In a disposable local session, trigger an unhandled rejected promise and confirm it appears in Error Tracking.
