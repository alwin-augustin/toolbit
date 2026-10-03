# 05: Workspace rendering stays fast while typing

**What to build:** Typing in one Tool Document does not rerender unrelated screens, the Tab strip stays usable with many Tabs open, and storage-quota denial degrades to session-only with a visible notice.

**Blocked by:** 03 (routing/document identity).

**Status:** ready-for-agent

- [ ] Navigation actions no longer subscribe every consumer to the full Tab list; only components needing Tabs rerender on input
- [ ] Tab strip resolves Tool metadata without per-Tab linear scans on every keystroke
- [ ] Opening Tools is bounded with dedupe or a cap so persisted Workspace shells cannot grow without limit
- [ ] Editor status reporting avoids per-keystroke full-document allocation, and the large-preview threshold no longer destroys editor state mid-typing
- [ ] Quota denial surfaces a toast rather than silently switching to session-only
- [ ] Tests prove keystroke isolation, Tab cap behavior, and editor stability across the preview threshold
