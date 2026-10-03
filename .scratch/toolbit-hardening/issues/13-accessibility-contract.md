# 13: Keyboard and screen-reader contract

**What to build:** Every Tool is fully usable without a mouse, with correct roles, labels, focus management, and announcements for controls, dialogs, logs, and status.

**Blocked by:** 04 (tool error isolation), 06 (shared Tool chrome primitives).

**Status:** ready-for-agent

- [ ] Checkboxes, tabs, dialogs, popovers, tooltips, and tab strips expose correct native semantics with keyboard operation, focus containment, dismissal, and focus return
- [ ] Status, errors, copy confirmations, offline and update notices, and message logs announce via appropriate live regions rather than color or motion alone
- [ ] Form controls associate labels, invalid states, and descriptions; hidden file inputs remain reachable; readonly results do not masquerade as editable fields
- [ ] Navigation uses real links where appropriate so open-in-new-tab, status URLs, and heading structure work
- [ ] Focus indicators follow one visible policy honoring reduced motion, and the design token layers converge rather than competing
- [ ] Lint and automated tests guard labels, keyboard traps, and live regions for representative Workbench tools and Custom screens
