# 10: Unified Tool registry migration (contract)

**What to build:** Adding a Tool means adding one registry entry plus its own feature module, with one typed contract covering parsing, limits, options, and execution for both Workbench tools and Custom screens. This is the contract step after the chrome expand.

**Blocked by:** 06 (shared Tool chrome primitives).

**Status:** ready-for-agent

- [ ] One typed Tool definition backs catalog metadata, routing, options, limits, cancellation, and telemetry for every Tool
- [ ] Legacy transform helpers and workbench runners converge on one option schema with explicit rejection of unknown modes rather than silent fallback
- [ ] Worker execution, timeout, cancellation, and error codes apply uniformly instead of only to a subset of Tools
- [ ] Duplicate Tool behaviors converge so registry tests and UI agree on what each Tool computes
- [ ] Exhaustiveness tests fail when a catalog Tool lacks a registry entry, and a generator or checklist documents the add-a-Tool path
