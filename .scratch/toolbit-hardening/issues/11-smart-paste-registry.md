# 11: Smart paste detection as a scored registry

**What to build:** Pasting raw data suggests the right Tool with accurate reasons, without noise, dropped suggestions, or freezes on large clipboard content.

**Blocked by:** 10 (unified Tool registry).

**Status:** ready-for-agent

- [ ] Detectors form an extensible registry reusing catalog Tool names and paths with per-detector reasons and confidence instead of a hardcoded chain
- [ ] Overlapping detectors use consistent guards so valid JSON does not also suggest URL decoding and embedded fragments do not trigger standalone Tools
- [ ] Large clipboard content returns quickly with bounded work rather than synchronous full parsing
- [ ] Path-like text, prose with colons, naive CSV shapes, and out-of-range cron-like text no longer produce false Tool suggestions, and validators reuse real parsers
- [ ] Suggestion truncation preserves high-value detectors such as certificates and diffs
- [ ] Table-driven tests prove ordering, false-positive and false-negative cases, extensibility, and large-input behavior
