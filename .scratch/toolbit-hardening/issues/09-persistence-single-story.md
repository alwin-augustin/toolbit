# 09: Single persistence story with validated preferences

**What to build:** Workspace structure survives refresh, content stays session-only, retention actually runs, and corrupted or tampered stored state can never crash the app.

**Blocked by:** 01 (privacy truth and consent).

**Status:** ready-for-agent

- [ ] Live persistence owns Tabs without payloads, ephemeral memory owns Saved items and History runs, and the chosen IndexedDB story is either removed or wired with no dead code paths
- [ ] Retention expiry runs on boot and via explicit user action, with bounded Saved items and History runs
- [ ] Stored preferences validate types and ranges on rehydrate and fall back safely
- [ ] Stored Workspace imports validate size, shape, known Tool identity, option types, and Secret Tool payload exclusion
- [ ] Storage open failure, blocked upgrades, and quota denial degrade gracefully without poisoning future access
- [ ] Tests prove corrupt-data recovery, version migration, retention enforcement, and Secret Tool exclusion
