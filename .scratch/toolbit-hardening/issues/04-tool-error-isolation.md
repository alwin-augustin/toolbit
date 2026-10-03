# 04: Per-Tool error isolation

**What to build:** A crashing Tool shows a scoped fallback with recovery actions while the Workspace shell, navigation, and other Tabs keep working.

**Blocked by:** 03 (routing/document identity).

**Status:** ready-for-agent

- [ ] Workbench tools and Custom screens are each wrapped in a Tool-scoped boundary keyed by Tool and Document so failures do not trap the whole app
- [ ] App-level fallback can reset on navigation instead of requiring a full reload, and Tool recovery uses client navigation preserving session state
- [ ] Error reporting distinguishes validation failures from recoverable runtime errors without leaking sensitive detail in production
- [ ] Tests prove a throwing Tool does not break shell navigation or sibling Tabs
