# 06: Shared Tool chrome primitives (expand)

**What to build:** All Tools share one copy action, one download action, and one toolbar and empty-state chrome, so wording, clipboard fallback, file-download lifecycle, and hidden file inputs behave identically everywhere. This is the expand step of the wide chrome refactor; old inline copies remain until migration completes.

**Blocked by:** 03 (routing/document identity).

**Status:** ready-for-agent

- [ ] New shared copy primitive handles success, denial fallback, and live-region announcement in one place
- [ ] New shared download primitive appends its anchor, triggers safely, and revokes asynchronously across browsers
- [ ] New shared Tool layout covers heading, toolbar with load-sample and clear, panes, footers, error banners, and empty states
- [ ] Pure Tool logic moves toward per-Tool library modules separable from JSX, and Saved Examples no longer hardcode a single decode-then-format walkthrough
- [ ] Two to three representative Tools adopt the primitives without behavior change, proving the migration path
