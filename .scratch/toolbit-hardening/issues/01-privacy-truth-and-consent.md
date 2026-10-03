# 01: Privacy truth and consent controls

**What to build:** A user can see truthful privacy copy and enable or disable product analytics, history recording, and retention from the app, with no collection before consent choice is respected. Legal promises about analytics and storage live in the single legal-copy source so app and indexed pages never drift.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Settings exposes analytics, history, and retention controls that persist on the device and immediately stop or resume collection, including in-flight requests
- [ ] Privacy and terms copy no longer claims zero analytics or zero external requests; it distinguishes local-first processing, optional product analytics, and user-initiated network Tools with accurate storage lifetimes
- [ ] First page view and transform events honor the stored preference and fail closed when keys, host, or consent are absent, without sending Tool input or output
- [ ] History runs respect opt-in and Secret Tool exclusion, retention expiry is enforced on boot and via an explicit clear action, and tampered preferences fall back to safe defaults
- [ ] Unit and boundary tests prove allow-listed telemetry properties, Secret Tool exclusion, and consent gating per event
