# Current implementation roadmap

The web/PWA program replaces the archived implementation plan dated 1 October 2026. Historical plans and audits were moved to the maintainer’s local archive; this file records current scope without duplicating dated status reports.

## Implemented

- Native desktop runtime, dependencies, packaging, installers, release automation and remote native release artifacts retired.
- Local processing, centralized sensitivity rules, guarded history, explicit workspace saves and minimized optional analytics.
- Canonical JSON/Base64/text contracts, display-only folding, independent documents and versioned workspace import/export.
- Ordered, settings-only recipes with validation, cancellation, deterministic execution and reuse events.
- Privacy/storage preferences, truthful copy states, keyboard focus handling, responsive views and automated accessibility checks.
- Large-input worker execution, cancellation, bounded previews and final-site offline precaching.
- PostHog project configuration and product health dashboard, with verification traffic excluded from adoption measures.
- Supported LTS runtime, modern build/test/style/lint tooling, typed design primitives, dependency cleanup and local archival of obsolete material.

## Release acceptance

The maintained checklist is in [RELEASE.md](RELEASE.md). A passing build or merged PR does not establish real-device installation, screen-reader usability or a seven-day observation window.

## Owner pilot

The owner is the sole developer; external recruitment of 5–8 developers is deferred by explicit owner decision. Record actual tasks, first useful output, failures, repeated recipe use and suggestions during normal use. Use sanitized examples. Label suggestions as opinion until observed behavior supports them. Seven-day recipe reuse must use seven elapsed days of real activity; synthetic events prove instrumentation only.

## Candidates deferred pending evidence

| Candidate                      | Reconsideration trigger                             |
| ------------------------------ | --------------------------------------------------- |
| JSONPath                       | Repeated manual extraction from formatted JSON      |
| JSON ↔ YAML                    | Repeated copy/paste between separate tools          |
| JSON → CSV                     | Owner regularly needs tabular export                |
| Redacted structured comparison | Existing diff fails a recurring sensitive-data task |
| PWA launch integrations        | Measured friction opening the installed workspace   |
| Self-hosting guide             | A concrete deployment request beyond static hosting |

Selected capabilities need a small specification, correctness cases, contract compatibility and privacy classification before implementation. Accounts, cloud sync, AI chat and a plugin marketplace are outside the current scope. AI would require its own consent and privacy decision before any payload transmission.
