# 15: Test matrix, CI gates, and repo hygiene

**What to build:** The suite pins every Tool contract, boundary, and budget, CI blocks broken privacy, accessibility, or performance regressions, and the repo no longer ships stale artifacts or misleading docs.

**Blocked by:** 01 (privacy truth and consent), 07 (compute Tools responsive), 08 (network and binary bounds), 10 (unified Tool registry), 12 (bundle splitting and offline freshness).

**Status:** ready-for-agent

- [ ] Telemetry boundary tests isolate one event per test and prove no Tool input or output leaves the device
- [ ] Contract matrices cover every Tool for parse, cancel, oversize, and malformed inputs including Unicode, whitespace-only, and very large payloads
- [ ] Performance budgets cover representative Tools at small and limit sizes across main-thread and worker paths including timeout and clone failures
- [ ] CI runs formatting, lint, typecheck, unit, coverage, accessibility, and end-to-end suites including the paste sweep, enforces bundle size, and promotes the tested artifact to deploy
- [ ] Dependency auditing is wired or removed, build-time dependencies install correctly, and lint uses type-aware and accessibility rules without obsolete flags
- [ ] Tracked build output is removed, example config is available to fresh clones, preview commands behave as named, and SEO and manifest copy derive counts rather than hardcoding them
- [ ] SQL heuristic limitations remain disclosed with guidance to verify literals before running statements
