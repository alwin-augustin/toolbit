# Toolbit — Complete Architectural, UI/UX, Design, Functionality & Security Audit

> **Scope:** Web (`Web/web`) & Desktop (`Desktop/desktop-tauri`)
> **Branch:** `feat/ide-precision-refinement`
> **Design Target:** IDE-scale engineering precision. Zero ornamental marketing fluff inside the workbench; hairline geometry, high-density tabular typography, deterministic keyboard-driven workflows, and strict local-first security boundaries.
> **Evidence rule:** every claim below is checkable in the named file. Section 8 lists what was executed in this pass and what was not.

---

## 1. Architecture Analysis

### 1.1 System Topology
Toolbit shares a single local-first React 19 + TypeScript + Vite 8 workspace across two delivery targets:
1. **Web / PWA (`Web/web`)**: Offline-capable service worker (`workbox-build`), static SEO pre-rendering (`scripts/generate-seo-pages.mjs`), and opt-in zero-payload telemetry (`src/core/telemetry/index.ts`).
2. **Desktop (`Desktop/desktop-tauri`)**: A lightweight Rust/Tauri v2 shell (`src-tauri/src/main.rs`) wrapping the exact same frontend bundle (`--mode desktop`), providing native OS menus, native file open/save dialogs, single-instance arbitration, window state persistence, and OS file associations/drag-and-drop.

### 1.2 Tool Execution & Registry Architecture
The catalog in `src/content/tools.config.ts` holds exactly **42 tools**, which resolve with zero overlap into two architectural tiers (`src/core/tool-registry.ts` classifies each entry as `workbench` | `custom` | `catalog`):
1. **Declarative Workbench Specs (12 tools — `ALL_SPECS` in `src/features/tools/specs.ts`)**:
   - Driven by `WorkspaceScreen.tsx` and backed by `DEFINITIONS` in `src/core/tool-contract.ts`.
   - Automatically receive multi-instance document tabs (`useWorkspace`, `MAX_OPEN_TABS = 20`), session saving, run history, options popovers, and status bars.
2. **Bespoke Custom Screens (30 routes — `CUSTOM_SCREENS` in `src/features/tools/custom-screens.tsx`)**:
   - Built with shared `.wb-*` CSS primitives, `CodeEditor`, and `useDocumentField` / `useSessionDocumentState`.
   - Heavy dependencies (`image-converter`, `pdf-tools`, `protobuf-decoder`, `markdown-previewer`) are code-split via `React.lazy` (`LAZY_CUSTOM_SCREENS`).
   - `12 + 30 = 42`: every catalog tool is reachable, and `validateToolRegistry()` reports no tool without a component.

### 1.3 Architectural Gaps Identified & Resolved
- **Split-Brain Document & File Handling**: `DesktopHost.tsx` (`openContents` and `saveActiveResult`) previously interacted only with the 12 `isWorkbenchToolId` tools. Dropping a `.xml`, `.diff`, `.pem`, or `.md` file while viewing XML Formatter, Git Diff Viewer, Certificate Decoder, or Markdown Previewer failed to populate the tool on screen, and `⌘S` ("Save Result…") refused to save outputs from bespoke tools. Resolved in section 5.
- **Lost Contract Warnings**: `formatJson` in `tool-contract.ts` computes an IEEE-754 safe-integer precision warning, but the `WorkbenchToolSpec.run` return signature stripped `warning`. `WorkbenchDocState.warning` and the run contract now carry it into `.wb-warning-banner` (`WorkspaceScreen.tsx`).
- **XML Prettifier Depth Drift (found and fixed in this pass)**: `prettifyXml` decremented its indent counter for inline text *and* for the end tag that followed it, so each text-only element lost a level. After four of them the counter went negative and the default mode threw `RangeError: Invalid count value: -1` on the tool's own bundled sample — "Load sample" produced an error instead of output. Depth now advances only on start and end tags, an element whose body is a single text node is emitted as one line (`<b>x</b>`, keeping the end tag beside its start tag), and a stray end tag clamps at zero. Covered by three cases in `tests/workbench-xml-markdown-cert.test.ts`, including the bundled sample and a stray-tag input.
- **Crontab Generator Route Alias**: `/cron-parser` and `/crontab-generator` both mounted `CronScreen` in `'explain'` mode. `CrontabScreen` now mounts it with `defaultMode="build"`.
- **Per-Mode Editor Language**: `yaml-formatter` declared one language for both panes, so `from-json` highlighted JSON input as YAML. `Spec.language` now accepts a per-mode map and `specLanguages()` resolves it against `doc.mode` then `defaultMode`.
- **Dual History Stores (open)**: `workbench-memory.ts` keeps an in-memory `runs` list (`WorkspaceScreen` records a run via `addRun` only when "remember" is on); `history-db.ts` implements a bounded IndexedDB store (200 total / 20 per tool, retention pruning) gated by `canPersistTool` and `usePreferences.history`. Nothing in `src/` calls `addHistoryEntry` — only `tests/persistence.test.ts` and `tests/contracts.test.ts` do, and `SettingsScreen` calls the clear/prune functions. The persistent store is therefore implemented and tested but never populated at runtime. Not bridged in this branch; see section 9.

---

## 2. UI, Design System & Visual Precision Analysis

### 2.1 Strengths of the Current Layout
- **Three-Column Spine**: The `52px` fixed icon rail (`--tb-rail-w`, `.wb-rail`) + `264px` collapsible tool navigator (`--tb-panel-w`, `Sidebar`) + fluid main column (`Topbar` + `TabBar` + `Workspace`) is an established, high-efficiency IDE pattern (grid template in `system.css` §1, collapsing to rail-only below the panel breakpoint).
- **Semantic Token Hierarchy**: `tokens.css` separates primitives from semantic surface/ink/line/syntax tokens (`--tb-canvas`, `--tb-surface`, `--tb-sunken`, `--tb-line`, `--tb-head-h`, `--tb-control-sm/md/lg`, `--tb-code-*`).
- **Self-Hosted Typography**: Variable `Geist` (UI) and `JetBrains Mono` (code/data) load locally with zero network requests.

### 2.2 Visual & Layout Refinements for IDE-Scale Precision
1. **Control Height & Density Discipline**:
   - `WorkspaceScreen.tsx` used `28px` (`size="sm"`, `--tb-control-sm`) toolbar controls while custom screens mixed `32px` (default `Input` / `NativeSelect`, `.wb-button`) with `28px` `ToggleGroup` segments.
   - *Fix*: `.wb-toolbar` pins every child control — buttons, selects, `input[data-slot='input']` — to `height: var(--tb-control-sm)` (`28px`) with `padding: 5px 8px`, `gap: 6px`, and `--tb-radius-md`, so every tool's action bar reads at one height.
2. **Custom Screen Geometry**:
   - Custom screens are wrapped in `<div className="grid gap-3 p-4">` inside a scrolling `<main>` — `grid`, deliberately, not `flex`: `.wb-editors` children set `flex: 1` for the definite-height workbench layout, and a flex parent would resolve that to zero and clip a content-sized result pane.
   - `.wb-editors` is a 1px-seam two-column grid (`flex: 1; min-height: 0`) that collapses to a single column below the breakpoint; `.wb-editor-pane` carries `min-height: 260px`, so a two-pane bespoke tool (JWT, Hash, XML, Diff, Regex, Nginx, Markdown, Protobuf, Cert) stays anchored instead of collapsing.
3. **Unstyled / Raw HTML Elements in Custom Screens**:
   - `MarkdownScreen.tsx` rendered sanitized HTML directly inside `.wb-editor-pane` with no padding, no overflow scroll, and no `.wb-prose` typography, so rendered Markdown sat flush against the pane border without list/heading/code styles.
   - `NginxScreen.tsx` and `DockerScreen.tsx` rendered raw `<p>` elements between `.wb-toolbar` and `.wb-editors` with unstyled browser defaults.
   - `ApiScreen.tsx` and `DockerScreen.tsx` used `className="wb-section-title"`, which was never defined in `system.css` (only `.wb-section-title-row`).
   - `RegexScreen.tsx`, `HashScreen.tsx`, `CaseScreen.tsx`, `WordScreen.tsx`, and `CertScreen.tsx` rendered multi-row lists inside `.wb-editor-pane` without a scrolling body, letting `.wb-pane-footer` float mid-pane.
4. **CodeMirror 6 IDE Polish (`CodeEditor.tsx`)**:
   - Active line and gutter highlight (`highlightActiveLine`, `highlightActiveLineGutter`, skipped when `readOnly`), a matching-bracket highlight derived from the primary color, and explicit caret/selection colors.
   - `reportStatus` (wired at `WorkspaceScreen.tsx`) publishes live `Ln X, Col Y` from the primary input editor into the status bar, alongside byte/line counts and the syntax grammar label.

---

## 3. UX & User Journeys Analysis

### 3.1 Journey J1: Paste-to-Result (Smart Detect)
- **Current**: Pasting into `StartScreen` runs `detectContentType` (`src/core/smart-detect.ts`, capped at 200 000 characters) and offers one-click routing with payload seeding through `smartPastePayload()`.
- **Refinement**: the Start-screen paste bar shows a `⌘Enter` / `Ctrl+Enter` hint when a suggestion is detected, so zero-mouse paste-to-tool execution is discoverable; hex/base64 Protobuf and Base32 TOTP secret detection were tightened.

### 3.2 Journey J2: Keyboard-First Tool Execution
- **Gap**: inside a tool document there was no keyboard shortcut to execute the primary transform or save.
- **Refinement (all verified in `WorkspaceScreen.tsx` / `WorkspaceShell.tsx`)**:
  - `⌘Enter` / `Ctrl+Enter` runs the active mode transform from anywhere in the document, including inside CodeMirror.
  - `⌘S` / `Ctrl+S` opens Save Session in browser builds (`!isDesktopHost()`); in the desktop shell the native menu emits `save-result` instead.
  - `⌘K` quick open, `⌘B` panel toggle, `⌘1-9` jump to the nth document, `⌥W` close the active document.
  - `SettingsScreen.tsx` documents `⌘S` as "Save session or result".

### 3.3 Journey J3: Multi-Language Syntax Highlighting
- **Previous Issue**: only JSON had syntax highlighting; other tools rendered plain text.
- **Current State**: `src/shared/editor-language.ts` defines 14 `EditorLanguage` ids — 13 grammars (`json`, `yaml`, `xml`, `html`, `css`, `javascript`, `typescript`, `sql`, `graphql`, `markdown`, `shell`, `nginx`, `diff`) plus a deliberate `text` default — each loading lazily with a status-bar label.
  - Converter modes switch highlighting with the data on screen: `yaml-formatter` `to-json` → JSON result, `from-json` → JSON input / YAML result; `csv-to-json` → JSON result; `xml-formatter` `json` mode → JSON result; `fake-data-generator` → `json` / `sql` / `text`.

### 3.4 Journey J4: Status Bar & State Visibility
- Every tool keeps the same chrome contract:
  - `.wb-pane-header` (`min-height: var(--tb-head-h)`, 36px) with copy/clear actions and monospaced badges.
  - `.wb-pane-footer` (`margin-top: auto`) stays pinned to the pane's bottom edge; `.wb-pane-body` owns the scroll.
  - `.wb-warning-banner` surfaces non-fatal precision notices — the IEEE-754 big-integer rounding warning in JSON formatting — without discarding the output.

---

## 4. Security & Privacy Analysis

### 4.1 Web Security & Local-First Guarantees
- **XSS Prevention**: `MarkdownScreen.tsx` runs every rendered fragment and error string through `DOMPurify` with `FORBID_TAGS: ['style','form','input','button']` and a restrictive `ALLOWED_URI_REGEXP` (`https`, `mailto`, `tel` or relative only).
- **ReDoS & Work Bounds**: `RegexScreen.tsx` caps test text at 200 000 characters, patterns at 5 000, and matches at 1 000, rejecting oversized input before execution; `DiffScreen.tsx` refuses inputs whose combined length exceeds 1 000 000; `HashScreen.tsx` caps input at 2 000 000 characters; `CodeEditor.tsx` latches into a read-only 100 KB preview above 100 KB and only releases below 90 KB (hysteresis), while copy/transform still act on the full buffer.
- **Other Caps**: `ApiScreen` truncates responses at 1 MB, `WsScreen` keeps the last 500 messages of at most 100 000 characters each, `PdfScreen` caps 50 MB per file / 100 MB total, `ImageScreen` caps 25 MB per file and 16 M output pixels (4096 px per side), `QrScreen` caps content at 2 000 characters, and `workspace-schema.ts` rejects imports above 2 MB.
- **Secret Tool Isolation (`tool-policy.ts`)**: `password-generator`, `totp-generator`, `jwt-decoder`, `certificate-decoder`, `api-request-builder`, `websocket-tester`, `qr-code-generator`, `docker-command-builder` are `sensitivity: 'secret'` with `historyDefault: 'disabled'`; `pdf-tools` and `image-converter` are `'personal'`; only `api-request-builder` and `websocket-tester` may open a network connection, and only user-initiated.
- **Zero-Payload Telemetry (`src/core/telemetry/index.ts`)**: `sanitizeProperties()` admits whitelisted shapes only, Do-Not-Track and `globalPrivacyControl` suppress collection, `isDesktopBuild` compiles collection out entirely, and the transport is only constructed when a PostHog key exists at build time.

### 4.2 Desktop Tauri Hardening (`Desktop/desktop-tauri`)
- **Capability Least Privilege**: `capabilities/default.json` grants the page `core:event:allow-listen` and `core:event:allow-unlisten` only — no window, webview, path, menu, dialog or fs API is reachable from the webview. The app commands (`open_text_file`, `save_text_file`, `read_text_file`, `take_pending_open_path`) are app-defined, not ACL-gated, so the file panels stay reachable.
- **Arbitrary File Read Prevention**: `read_text_file` in `main.rs` refuses any path the OS did not surface through CLI args, file associations, or drag-and-drop, via the shell's `KnownPaths` allowlist.
- **External Link Guard**: `installExternalLinkGuard` intercepts clicks on external `http(s)` links inside the Tauri webview (e.g. from Markdown previews) and copies the URL instead of navigating the app window away from the workspace.

---

## 5. Result & File Handling Contract (new in this branch)

Before this branch, saving and file handling existed twice: workbench tools kept their result in a document anyone could read, while a bespoke screen owned its result in component state where nothing outside the screen could reach it.

- **One result slot (`src/shared/result-store.ts`)**: `useActiveResult` is a single-valued, ephemeral zustand slot. `usePublishedResult(text, label, ext)` publishes on change, withdraws the slot when the text is blank, and clears it on unmount — so "Save Result…" can never write the previous tool's output after the user moves on.
- **One answer to "what would save write" (`activeSaveableResult()` in `src/shared/workbench-actions.ts`)**: for a workbench document it returns the document output and the spec's `fileExt`; otherwise it returns the published slot. Skipping the workbench branch when the visible tab is a bespoke screen is what makes the two architectures indistinguishable to the native save path.
- **Native save (`DesktopHost.tsx`)**: the `save-result` handler now calls `activeSaveableResult()` and writes `toolbit-result.<ext>` through `save_text_file`, or reports "Run the tool before saving a result." when there is nothing to write.
- **Native open / drag-and-drop (`DesktopHost.tsx`)**: a file arriving from the OS fills the tool that is on screen instead of navigating away — a workbench document is patched (`input`, cleared `output`/`error`, dirty), and a bespoke screen receives `smartPastePayload(toolId, contents)` merged into the document payload so the visible field fills. Only when neither applies does the file fall through to `detectContentType`.
- **Coverage**: 26 of the 30 bespoke routes publish a result. The four that do not are `qr-code-generator` (image output), `http-status-codes` (reference table), `image-converter` and `pdf-tools` (binary output) — saving text does not describe what they produce.

---

## 6. Performance & Bundle Discipline

Code-level guarantees only; no runtime performance measurement was captured in this pass (section 8).
- **Code splitting**: `image-converter`, `pdf-tools`, `protobuf-decoder`, and `markdown-previewer` are `React.lazy` routes with a shared Suspense fallback, keeping their heavy dependencies out of the initial bundle.
- **Editor hysteresis**: above 100 KB the editor becomes a read-only 100 KB preview and refuses to re-enter edit mode until the buffer drops below 90 KB, which keeps the DOM honest while copy/transform still act on the full buffer.
- **Bounded work everywhere**: regex, diff, hash, API response, WebSocket log, PDF, image, QR, smart-detect, workspace import, and open-tab count are all capped at the constants listed in section 4.1 — every expensive path has a ceiling rather than a timeout.
- **Offline**: the service worker is generated at build time (`scripts/generate-service-worker.mjs`, `workbox-build`); fonts are self-hosted, so a first load needs no third-party origin.

---

## 7. Accessibility

Code-level evidence only; no automated axe run or screen-reader pass was performed in this session (section 8).
- **Landmarks**: screens render into `<main id="wb-main" tabIndex={-1}>`, giving one programmatic focus target and one main landmark per route; the rail and panel are separate navigation regions.
- **Headings**: each tool screen opens with exactly one `<h1>` (asserted by `tests/custom-screens-matrix.test.tsx` and `tests/accessibility.test.tsx`).
- **Live regions**: error and warning surfaces use `role="alert"` / `role="status"` (for example `.wb-warning-banner` and the editor preview note), so state changes are announced rather than silently repainted.
- **Keyboard**: the full shortcut set in section 3.2 is global, ignores typing targets where appropriate, and every rail/sidebar affordance is a real button with an accessible name.
- **Labels**: toolbar controls and panes are addressed by name in tests (`getByRole('textbox', { name: 'Input code' })`, `{ name: 'JWT token' }`), which only works when the visible label is programmatically associated.

---

## 8. Verification Evidence

Executed on this branch, in `Web/web`:

| Command | Result |
| --- | --- |
| `npm run check` (`tsc`) | exit 0 |
| `npm run lint` (`eslint . --report-unused-disable-directives --max-warnings 0`) | exit 0 |
| `npm run test:run` (vitest) | 38 files, 447 passed, 2 skipped, exit 0 |
| `npx vitest run tests/result-store.test.tsx tests/desktop-host.test.tsx` | 19 passed |

The lint result is load-bearing, not incidental: `eslint.config.js` sets `react-hooks/rules-of-hooks` to `error`, so every bespoke screen's new `usePublishedResult` call is provably at the top level of its component — no conditional hook, no hook after an early return.

Also executed through the running app (Vite dev server on `127.0.0.1:5173`, the interface a user actually holds), which is what surfaced the prettifier defect:

| Check | Observed |
| --- | --- |
| `/xml-formatter` renders a bespoke screen | `<h1>XML</h1>`, `main#wb-main` with `tabindex="-1"`, named regions "Input panel" / "Result panel", editors named "Input XML" / "XML result" |
| Toolbar height discipline | every control in `.wb-toolbar` measures 28px; `.wb-toolbar` padding `5px 8px`, matching section 2.2 |
| Pane geometry | `.wb-editor-pane` computed `min-height: 260px`; `.wb-editors` collapses to one column at panel width; a `.wb-pane-footer` sits within 24px of its pane's bottom edge |
| XML modes on the bundled sample | Prettify `Valid XML` with correct indentation and a closed root, Minify 509 characters, XML to JSON parseable with a `bookstore` root, Validate `XML is valid` — no error banner in any mode |
| Before the fix | Prettify reported `Couldn't process this input. Invalid count value: -1` on that same sample |

The XPath mode was not exercised in the browser (it needs a query typed into its second field), and no instrumentation or trace capture was used to confirm the published-result slot outside the unit tests.

**Not verified in this pass** (no claim is made that these pass):
- The Playwright specs under `tests/e2e/` (including the tool-journey and workspace sweeps) were not run.
- The Tauri desktop build, the packaging/prune scripts, and `Desktop/desktop-tauri/scripts/editor-check.mjs` were not run, so the Rust-side claims in section 4.2 are read, not re-verified here.
- No Lighthouse, Core Web Vitals, or bundle-size measurement, and no axe scan.
- No Windows or Linux desktop matrix; no screen-reader session.

---

## 9. Remaining Gaps and Recommended Next Steps

1. **A dropped file only fills a bespoke screen that holds a document.** `DesktopHost` fills the tool on screen when that tool is the active document — reachable for a bespoke screen through a restored snippet or session. A bespoke screen reached by URL alone is session-local (`DocumentContext` is `null`), so nothing is on screen to patch and the file is routed by content detection instead. The honest fix is to let the workspace record which tool is on screen (`WorkspaceView` currently carries no tool id) or to give every tool a document uniformly; either change is larger than this pass and touches routing, the shell, and the existing "custom screens hold no document" tests.
2. **The IndexedDB history store is unreachable at runtime.** `addHistoryEntry` has no caller in `src/`, so persistent history, retention pruning, and per-tool history are exercised only by tests while the UI reads the in-memory `runs` list. Either wire `WorkspaceScreen`'s recording path through `canPersistTool` + `addHistoryEntry`, or delete the store; leaving both is the worst of the three.
3. **Four bespoke screens publish no result** (section 5). QR and the two binary tools plausibly want their own save verbs (`.png`/`.svg`, converted bytes) rather than the text slot; today `⌘S` reports "Run the tool…" for them even when an image is on screen.
4. **No accessibility automation.** The claims in section 7 are structural. Add an axe assertion to the existing per-screen matrix so a missing label or landmark fails a test instead of waiting for review.
5. **Bounded but untimed.** Every expensive path has an input ceiling; none has a measured wall-clock budget or a worker boundary, so a pathological-but-legal input can still block the main thread. A perf budget test that asserts a ceiling on the largest representative inputs would turn section 6's guarantees into measurements.
6. **e2e and desktop packaging remain unrun here**, which is also where a regression in native open/save would show up first.
