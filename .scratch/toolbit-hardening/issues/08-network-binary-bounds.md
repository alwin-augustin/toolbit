# 08: Network and binary Tools enforce resource bounds

**What to build:** API, WebSocket, image, PDF, and QR-share Tools bound memory, network, and canvas resources with clear errors, and generated share payloads cannot inject unintended fields.

**Blocked by:** 06 (shared Tool chrome primitives).

**Status:** ready-for-agent

- [ ] API responses stream with a byte cap and truncation notice instead of unbounded text buffering, preserving timeout, cancel, and copy-as-cURL behavior
- [ ] WebSocket message logs use a ring buffer with virtualized rendering and stay session-only rather than bloating the Workspace Document
- [ ] Image conversion enforces an area cap before allocating canvas memory with an explicit oversize error
- [ ] PDF handling enforces per-file and total caps, avoids double parsing, and reports encrypted or corrupt files distinctly
- [ ] Generated WiFi and contact payloads escape delimiters and newlines per spec, and shell export quoting warns or strips control characters
- [ ] Binary download paths pass views rather than whole backing stores
- [ ] Tests prove caps, truncation, ring behavior, and escaping
