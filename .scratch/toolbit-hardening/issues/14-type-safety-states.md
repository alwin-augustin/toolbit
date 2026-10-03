# 14: Type safety that outlaws invalid states

**What to build:** Invalid Tool identities, options, and stored shapes are unrepresentable or explicitly rejected, with no unsafe casts on adversarial input.

**Blocked by:** 09 (persistence single story), 10 (unified Tool registry).

**Status:** ready-for-agent

- [ ] Strictness flags catch unsafe indexing and unused symbols so unknown Tool identities fail closed with versioned error codes
- [ ] External input, parsed JSON, certificate fields, and file-reader results narrow through guards instead of assertions
- [ ] Tool options validate against explicit schemas with rejection of unknown modes rather than silent fallback or NaN propagation
- [ ] Build scripts typecheck or document why any generated source stays plain script
- [ ] Tests prove malformed, exotic, and tampered shapes are rejected without crashes
