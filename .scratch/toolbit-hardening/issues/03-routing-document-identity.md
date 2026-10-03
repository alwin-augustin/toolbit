# 03: Stable routing and single Document identity

**What to build:** Opening, reloading, switching, and closing Tool Tabs always lands on the intended Document, with no duplicate Tabs from remounts and no edits landing in the wrong Tab.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Tool routes create at most one Document per navigation, including under double-invoke and remount, using stable identity rather than object identity
- [ ] All Document hooks resolve the same Document from one shared identity source across Workbench tools and Custom screens
- [ ] Closing the last Tab navigates home without resurrecting a stray Tab, and reopen restores the expected neighbor
- [ ] Router and store agree on what counts as the existing Tab for a Tool, whether entered via search, tile, handoff, or direct URL
- [ ] Router-level tests prove idempotent open, correct active Tab sync, and close-last behavior
