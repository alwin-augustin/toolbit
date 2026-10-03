# 02: Safe Markdown rendering including failures

**What to build:** A user previewing Markdown always sees sanitized output, including when rendering fails, with no executable markup reaching the preview pane.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Successful Markdown renders remain sanitized with a hardened configuration that blocks style and form tags, data-URI abuse, and reverse-tabnabbing
- [ ] Rendering failures display as plain text rather than unsanitized markup in the preview pane
- [ ] Preview pane exposes an appropriate live-region role without breaking page heading structure
- [ ] Tests prove malicious input and failure messages cannot execute in the preview
