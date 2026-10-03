# 07: Compute Tools stay responsive on large input

**What to build:** Regex, diff, hash, certificate, and QR Tools remain interactive on large or adversarial input, with explicit limits, debounced evaluation, and background processing where needed.

**Blocked by:** 06 (shared Tool chrome primitives).

**Status:** ready-for-agent

- [ ] Regex evaluation enforces input and match budgets, debounces typing, validates flags, and never blocks the tab on catastrophic patterns
- [ ] Diff evaluation enforces size caps and debounces so multi-megabyte pastes show a truncated notice instead of freezing
- [ ] Hash and certificate evaluation debounces and caps bytes before native digest and parsing work
- [ ] QR generation caps content length with a clear error before encoding and avoids duplicate PNG and SVG work per keystroke
- [ ] Adversarial Unicode, whitespace-only, malformed, and oversized inputs show validation messages rather than crashes, with narrowed unknown-shape handling
- [ ] Tests prove budgets, debounce, invalid-pattern paths, and large-input notices
