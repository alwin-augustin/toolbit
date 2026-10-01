# Owner pilot and candidate decisions

Scope revised by the owner on 1 October 2026: Toolbit has one developer and no recruited participants. The owner will provide product suggestions. External recruitment is deferred; this pilot does not establish broad user demand.

## Pilot protocol

Use synthetic fixtures from the three recipe templates. For each session record entry method, task success, time to useful output, friction and whether a recipe was reused. Keep observation separate from preference. Do not record private payloads. Observe again after seven days; the baseline cannot be manufactured on launch day.

| Session/date | Observed task | Success/time | Observed friction | Owner suggestion | Reuse |
|---|---|---|---|---|---|
| Pending owner session | Base64 → JSON → Base64 | Not observed | Not observed | Awaiting suggestions | Pending |
| Pending owner session | CSV cleanup → JSON validation | Not observed | Not observed | Awaiting suggestions | Pending |
| Pending owner session | Normalize text → hash | Not observed | Not observed | Awaiting suggestions | Pending |

## Candidate disposition

| Candidate | Decision/reason | Reconsideration trigger |
|---|---|---|
| JSONPath | Defer; no observed demand and legacy functionality needs scope review | Owner repeated querying task |
| JSON ↔ YAML | Defer; loss/typing rules require bounded specification | Repeated conversion need with fixtures |
| JSON → CSV | Defer; nested data flattening policy unresolved | Owner supplies representative schema |
| Redacted comparison | Defer; redaction correctness carries privacy risk | Repeated safe comparison task and explicit redaction specification |
| PWA launch integrations | Defer; first establish installation/reuse | Owner launch friction observed |
| Self-hosting | Defer; ongoing hosting/security documentation cost | Confirmed deployment need |

No expansion capability is selected, so no speculative PRD is created. Accounts, cloud sync, general chat and AI remain outside scope. A selected candidate needs a small PRD with fixtures, contract types, privacy class and measurable success before implementation. External multi-user validation and seven-day retention remain future evidence, not completed engineering tasks.
