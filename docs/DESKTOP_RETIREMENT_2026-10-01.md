# Desktop retirement and first implementation slice

Date: 1 October 2026

## Decision

Toolbit supports the browser app and installed PWA only. Native desktop applications and installer distribution are retired. Cloudflare remains the intended web deployment target. The original product audit remains a historical record; the revised implementation plan governs current scope.

## Repository changes

- Deleted the native main/preload process, IPC declarations, detection hook, native window controls and drag-region styles.
- Deleted packaging configuration, build scripts, signing hook, installer icons/entitlements/background, desktop release workflow/template and three desktop setup/status documents.
- Removed direct dependencies on electron, electron-builder, concurrently, cross-env and wait-on. Refreshed the npm lockfile and installed dependency tree; 241 packages were removed.
- Simplified Vite to browser routing, base paths and code splitting. PWA generation remains enabled for production; the preview disable switch remains available.
- Removed desktop download links and native distribution claims from app, SEO, metadata, README and intro materials.
- Pinned Node 24 in `.nvmrc`, package engines and web CI. Validation used the already available Node 24.19.0 runtime.

`electron-to-chromium` remains as browser compatibility metadata required by Browserslist/Autoprefixer. It is not a native application runtime or installer dependency. Removing it would damage the web CSS/build toolchain.

## Remote cleanup

Repository: `alwin-augustin/toolbit`.

- Disabled the remote `Release Desktop App` workflow (ID 194805133). The workflow file is removed locally; remote source removal will take effect when these changes are pushed.
- Deleted all 12 releases named `Toolbit Desktop …`, including attached installers and their generated version tags. The remaining release list and remote tag list are empty.
- Deleted the retained `linux-build` and `windows-build` artifacts; no retained macOS build artifact existed. Preserved `web-build` and CodeQL artifacts.
- Deleted the Windows npm cache used by the desktop workflow. Preserved shared Linux and CodeQL caches.
- Deleted the 23 completed desktop workflow runs. No active desktop run remained.
- GitHub returned no deployment records or environments, and no repository Actions secrets or variables. There was no desktop deployment environment or signing secret to remove.
- The Cloudflare web deployment was not modified. No new production deployment has been performed.

## JSON integrity fix

Removed the large-array collapse option rather than ship a display control that rewrites canonical output. Previously saved `collapseArrays: true` preferences are ignored. Full nested array content reaches the output editor, copy action, pipe action and history.

Nine regression cases cover 20, 21 and 1,000 items at 2/4/8-space indentation, key sorting, nested arrays and legacy preferences. Running them against the original implementation fails; running them against the fixed component passes. True visual folding, integer precision warnings and invalid-input recovery remain explicit M1.1 follow-up work.

## Verification and release blockers

- Type-check: passed.
- Lint: passed.
- Production web/PWA build with SEO generation: passed.
- New JSON regressions: 9 passed.
- Full test suite on Node 24.19.0: 9 files failed, 9 passed; 51 tests failed, 66 passed. Legacy selectors and expectations need repair under M2; the suite is not a release gate yet.
- The initial baseline on Node 26 had 13 failing files and 4 passing files. Switching to the supported runtime allows more suites to execute and changes the count; do not interpret this as all those tests being repaired.
- M8 offline acceptance remains pending: SEO artifacts are still generated after service-worker precaching, so a successful build does not establish safe offline direct navigation.

Changes are local and reviewable. They have not been committed or pushed. Remote retirement actions above have already been applied.
