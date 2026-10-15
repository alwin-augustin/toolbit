# AGENTS.md

Toolbit (`Web/web`) is a local-first developer workspace. The product promise is that user content stays on the device, and that promise is enforced by `PRIVACY.md`. Repo conventions live in `README.md` and `docs/`.

## Privacy — non-negotiable, applies to ALL tasks

- Content never leaves the device. There is no analytics, no crash reporting, no remote anything. The opt-in PostHog channel was removed on 2026-10-16 (`PRIVACY.md` §6) — keep it that way; there is nothing to extend.
- No silent network. With defaults and no user action the app makes zero requests beyond its own origin. The only network features are user-initiated: the API request builder and the WebSocket tester.
- Secrets (tools classified `secret` in `src/core/tool-policy.ts`) are never persisted, shared, or logged.
- The desktop build of this app ships with a minimal capability set and no telemetry of any kind — never extend it silently.
- Privacy claims in UI, legal, and SEO copy must stay backed by code and tests.

## Before touching any of these — read PRIVACY.md first

network/egress · storage (localStorage, IndexedDB, Cache Storage) · service worker · CSP (`public/_headers`, `tauri.conf.json`) · tool sensitivity (`src/core/tool-policy.ts`) · dependencies · legal/SEO copy (`src/content/seo/`) · the desktop bridge (`src/platform/desktop.ts`, `external-links.ts`).

Read `PRIVACY.md`'s read-trigger table (§3) and run the tests it names before reporting a task complete. Load `PRIVACY.md` only when a task touches those areas — never preload it.

## Never

- Delete, skip, or weaken a privacy test to make a task pass.
- Add an egress path or CSP origin outside the allowlisted, user-initiated ones — or a dependency that phones home, loads remote code, or bundles analytics.
- Commit `.env*` files or echo their contents.
- Add storage, collection, or copy claims without updating `PRIVACY.md` (P6, P7).
- If a task cannot be done without weakening P1–P8: stop and ask the maintainer.
