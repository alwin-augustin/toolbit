# Release verification

## Automated gates

Run formatting, lint, type checks, unit tests, dependency audit, production build and the Chromium/Firefox/WebKit browser suite. CI enforces these gates. Tests cover independent documents, recipes, validated workspace restore, denied storage/clipboard, bounded full-output copying, worker startup errors, mobile layout, dialog focus, accessibility and cached offline deep links.

For configured analytics preview verification, set `TOOLBIT_PREVIEW_URL` to the deployed preview, `TOOLBIT_VERIFY_ANALYTICS=true` and run the telemetry browser tests. Verification deployments must set `VITE_TELEMETRY_VERIFICATION=true`; never send synthetic acceptance traffic into the production adoption baseline. For production smoke checks, set `TOOLBIT_BLOCK_ANALYTICS=true`.

## PWA update and recovery

Before deploying a new revision, keep a controlled tab on the previous deployment open with explicitly saved workspace data. Deploy the next revision to the same origin. Check that a waiting service worker offers an update, input is retained until the explicit update action, the new worker activates after that action, saved workspaces restore and cached tool deep links operate offline.

Cloudflare Pages project: `toolbit`, production branch: `main`. Record the deployment ID and Git revision before promotion. Roll back using the previous successful production deployment in Cloudflare’s deployment controls or its documented Pages rollback endpoint. Verify the restored revision, a tool transform and saved-workspace restoration, then restore the intended deployment. Rollback must never delete browser data. A documented procedure alone is not rehearsal evidence.

## Real-platform owner acceptance

These checks remain pending until directly observed:

- Safari/macOS and supported mobile devices: installation, launch, offline use, update and uninstall.
- Representative screen reader: editor labels, announcements, dialogs, focus return and keyboard navigation.
- Actual owner task observations and seven elapsed days of recipe reuse.

Headless WebKit is engine coverage, not a claim that Safari’s Add to Dock or iOS installation has been tested. Automated accessibility checks are not screen-reader observations. Keep dated measurements, screenshots and deployment recovery evidence outside the repository.
