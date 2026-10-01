> Scope revision (1 October 2026): support the web app and installed PWA on computers and mobile devices. Earlier desktop-only viewport constraints are superseded by the responsive acceptance criteria in `docs/IMPLEMENTATION_PLAN_2026-10-01.md`.

# Toolbit v2 — Product Requirements Document

## Vision

Transform Toolbit from a "website of tool pages" into an **IDE-like workspace** for developer utilities. The tool logic is already complete — v2 is a full UI/UX restyle onto a new design system, delivering the workspace shell defined in `/design`.

**Brand in one line:** Local-first developer tools. Privacy by default. Fast, keyboard-first, dark by default.

---

## Guiding Principle

**Personal utility first.** This is built for the author's own daily workflow. Scope decisions favour the features you'd reach for every day over completeness. Quality over breadth.

---

## What v2 Is NOT

- Not a tool logic rewrite — all existing functionality in `/src/components/tools/` stays as-is
- Not a mobile product — desktop only, no responsive breakpoints required
- Not an Electron app — the desktop build is removed entirely
- Not a CDN-dependent app — all fonts, editor libraries, and assets are self-hosted
- Not a Tailwind app — dropped entirely in favour of the design system's CSS tokens
- Not a shadcn/ui app — replaced entirely with the new design system primitives

---

## Phase 1 Scope

### 1. Design System Migration

Replace the entire styling layer:

- **Remove**: Tailwind CSS, shadcn/ui (`/src/components/ui/`)
- **Remove**: Electron hook (`use-electron.ts`) and any build config referencing it
- **Add**: All CSS tokens from `design/tokens/` (colors, typography, spacing, radius, elevation, motion, base)
- **Add**: All component primitives from `design/components/` (Button, IconButton, Badge, Tag, Kbd, Input, Textarea, Select, Switch, Checkbox, Alert, Toast, Tooltip, Skeleton, Card, CodeBlock, StatusPill, Tabs, SidebarItem)
- **Font stack**: Geist (UI), JetBrains Mono (code/data) — self-hosted variable fonts from `design/assets/fonts/`, no CDN
- **Themes**: Both dark (default) and light, switchable via topbar toggle. Dark = `class="dark"` on `<html>`.

### 2. Workspace Shell

The core IDE-like chrome, matching the design in `design/ui_kits/app/`:

#### Sidebar (240px fixed)
- Brand mark + wordmark (`tool`**`bit`** with indigo "bit")
- ⌘K command trigger button
- **FAVORITES** section: JSON Formatter (⌘1), JWT Decoder (⌘2), Base64 Encoder (⌘3) — hardcoded defaults, not user-configurable in Phase 1. Two-letter monogram chips (JS, JT, 64).
- **WORKSPACES** section: 3 hardcoded concept workspaces (API Debug, Data Cleanup, Crypto) with coloured dot indicators — visual only, no CRUD in Phase 1
- **TOOL LIBRARY** section: All 7 categories with Lucide icons and tool count badges, clickable to open catalog
- Bottom: History item (functional), Snippets item (visible, Phase 2 behind it)
- Footer: `Your data never leaves this device` privacy signal with shield icon

#### Topbar (48px)
- Breadcrumb: `Category / Tool Name`
- Density toggle: Compact (28px) / Comfortable (32px) segment control
- Inspector toggle button
- Theme toggle button (sun/moon)
- "Run pipeline" button (visible, disabled in Phase 1 — piping is Phase 2)

#### Tab Strip
- Browser-like tab strip below topbar
- Multiple tools open simultaneously
- Active tab indicated by indigo top border
- Close (×) per tab, + to open new tab (opens catalog)
- **Tab state persists across page reloads** via localStorage/IndexedDB
- URL reflects the active tool: `toolbit.app/json-formatter`
- Full tab set restores from localStorage on load

#### Editor Area (split panels)
- **Left panel — Input**: CodeMirror editor, self-hosted (no CDN), syntax highlighting, "Load sample" action, detected-type badge
- **Right panel — Output**: Syntax-tinted rendered output with line numbers, valid/invalid badge, copy action
- Panel header with title + badge + action
- Pipeline strip at bottom: visible but disabled in Phase 1 (Phase 2 feature)

#### Inspector Panel (300px, collapsible)
- Toggle via topbar button
- Per-tool options for the 6 priority tools (see below)
- Privacy note card: "Local only — everything runs on this device"
- Pipe output targets: visible but non-functional in Phase 1
- Non-priority tools: inspector shows privacy card only

#### Status Bar (28px)
- Left: `Local · no network` with green shield icon (permanent)
- Divider + validity indicator (valid/invalid with colour dot)
- File size in bytes/KB
- Encoding (UTF-8)
- Right: pipeline step count (static in Phase 1), cursor position (Ln/Col)

#### Command Palette (⌘K)
- Full-screen scrim with blur
- Fuzzy search across all tools by name and description
- Shows category icon, tool name, description, category label
- Keyboard navigation (↑↓ to navigate, ↵ to open, Esc to close)
- Opens selected tool in a new tab (or focuses existing tab if already open)

### 3. Smart Paste

Wire the existing `smart-detect.ts` and `input-detector.ts` logic to the new workspace:

- ⌘V anywhere in the app detects content type (JSON, JWT, Base64, cron, URL, UUID)
- Auto-routes to the correct tool, opens in a new tab if not already open
- Detected type shown as badge in the Input panel header

### 4. Priority Tools — Full Restyle + Inspector Config

These 6 tools get full treatment: restyled UI matching the new design, CodeMirror input, and inspector config panel:

| Tool | Inspector Options |
|------|------------------|
| JSON Formatter | Indent (2/4/8 spaces), Sort keys, Validate while typing, Collapse large arrays |
| JWT Decoder | Expand all claims, Show raw header/payload |
| Base64 Encoder | Encode / Decode mode toggle, URL-safe variant |
| URL Encoder/Decoder | Encode / Decode mode, Component vs full URL mode |
| UUID Generator | Version (v4/v7), Batch count, Uppercase toggle |
| Cron Parser & Generator | Human-readable explanation, Next 5 run times, Visual builder toggle |

### 5. All Other Tools — Restyle Only

All remaining tools in `/src/components/tools/` are restyled with the new design system tokens (no Tailwind, no shadcn). Tool logic is untouched. Inspector shows privacy card only. No new inspector configs.

### 6. Landing Page

Full redesign matching `design/ui_kits/marketing/`:

- Sticky header with nav: Tools / Why local-first / Design + GitHub icon + theme toggle + "Launch app" CTA
- Hero: headline, subheadline, dual CTA (Launch app / Install as PWA), MiniWorkspace preview
- Privacy band: StatusPill row (No network calls, Works offline, No accounts, No analytics, No cookies)
- Why section: 6 feature cards (Pipe tools, Keyboard-first, Smart paste, IDE not website, Offline, Open source)
- Tools catalog: 7 category cards with tool lists
- Design craft: 3 cards (graphite palette demo, JetBrains Mono demo, density demo)
- CTA section
- Footer: 4-column (brand, Popular tools, Product, Trust)
- Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`, `h1→h3`) for SEO

### 7. PWA

Minimal installability:

- Web manifest: name, icons, theme colour, display mode standalone
- Install prompt wired to the "Install as app" CTA on landing page
- No complex service worker caching strategy — the app is already local-first

---

## Phase 2 Scope (deferred, not forgotten)

| Feature | Notes |
|---------|-------|
| Tool piping | Pipeline strip becomes interactive; pipe output between tools; save as named workflow |
| Workspace CRUD | Create, rename, delete, reorder workspaces; pin tools to a workspace |
| Customisable favorites | Drag-to-pin, reorder, custom ⌘ shortcuts |
| Snippets | Save/name outputs, browse in sidebar, paste into tools |
| Inspector for all tools | Full options panel for all 40+ tools |
| Mobile layout | Separate responsive layout mode |

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + TypeScript + Vite | Keep existing — only the UI layer changes |
| Styling | Design system CSS tokens only | Drop Tailwind; no split-brain between utility classes and tokens |
| Component library | New design system primitives | Drop shadcn/ui; full fidelity to design |
| Code editor | CodeMirror (self-hosted) | Lightweight, no CDN, proper IDE feel for structured data tools |
| Routing | React Router, tool slug in URL | `toolbit.app/json-formatter`; tab set in localStorage |
| Persistence | localStorage + IndexedDB | Tab state, history, theme preference |
| Deployment | Cloudflare Pages | Zero-config Vite SPA, no deadline |
| Mobile | Not supported | Desktop only by design |
| Electron | Removed | PWA is the install story |
| CDN | None | All assets self-hosted (fonts, editor, icons) |

---

## Definition of Done — Phase 1

Phase 1 ships when all of the following are true:

- [ ] ⌘K opens the command palette and fuzzy-searches all tools
- [ ] ⌘1/⌘2/⌘3 open JSON Formatter, JWT Decoder, Base64 Encoder respectively
- [ ] Smart paste detects content type and opens the correct tool in a new tab
- [ ] Tabs restore their open tools and inputs after a page reload
- [ ] All 6 priority tools are functional inside the new shell with their inspector configs
- [ ] All other existing tools are restyled and functional (no regressions)
- [ ] Dark and light themes both look correct, toggle works
- [ ] Status bar shows "Local · no network" permanently
- [ ] Landing page is live with both CTAs working
- [ ] App is installable as a PWA
- [ ] Zero external CDN dependencies
- [ ] Tailwind and shadcn/ui are fully removed

---

## Non-Negotiables (from design system)

- Dark theme is default (`class="dark"` on `<html>`)
- One accent: indigo (`--primary`, `#3D63DD` family) — never GitHub blue
- Geist for UI, JetBrains Mono for all code/data/inputs/outputs
- Lucide icons only — no emoji in product UI
- Privacy chrome is permanent: status bar "Local · no network", sidebar footer "Your data never leaves this device"
- Sharp radii: 6px controls, 8px panels, 12px dialogs
- Fast motion: 100–150ms, no bounce
- No shadows for depth — surface steps and 1px hairline borders only
