# Toolbit Design System (v2 — Workspace)

A modern, developer-centric design system for **Toolbit** — a local-first collection of
developer utilities (JSON, Base64, JWT, YAML, XML, SQL, and ~40 more) that runs entirely
in the browser, installable as a PWA (a desktop build is planned, not shipped), with zero
tracking and no server-side processing.

v2 reframes Toolbit from "a website of tool pages" into an **IDE-like workspace**: sidebar
(favorites / workspaces / tool library), tabs, split editors, an inspector, a status bar,
piping between tools, and a ⌘K command palette.

---

## Sources & lineage

- **Toolbit repo:** https://github.com/alwin-augustin/toolbit (original app: tokens in
  `src/styles/globals.css`, screens in `src/components/`) — product copy and IA come from here.
- **GitHub Primer** (https://primer.style/product/) — we adopt its *semantic-role token
  rigor* (surface/component/border/accent roles) but deliberately **not** its look.
- **JetBrains Ring UI / IntelliJ Platform UI Kit**
  (https://github.com/jetbrains/ring-ui, https://www.figma.com/community/file/938505862996154830)
  — lineage for the graphite neutrals, density, statusbar/inspector patterns, and JetBrains Mono.
- The user's Primer-based redesign mock (`primer.html`) defined the workspace IA this system
  formalizes (favorites/workspaces/library, tabs, inspector, piping, statusbar).

**Deliberately NOT GitHub:** graphite near-hueless neutrals (`#1E1F22`/`#2B2D30`, ≈225°/6%)
instead of GitHub's blue-black `#0d1117`; **indigo** accent (`#3D63DD` family) instead of
GitHub blue; a JetBrains-inspired syntax palette instead of GitHub's; sharper compact controls.

---

## Typography (evaluated, then chosen)

- **UI: Geist** (400/500/600/700). Purpose-built for dev-tool UI; excellent at 12–14px;
  tabular figures. Beat Inter (ubiquitous, zero identity), Mona Sans (reads as GitHub),
  IBM Plex Sans (Carbon association), system stack (no identity, inconsistent metrics).
- **Code/data: JetBrains Mono** (400/500/600). The only mono *designed for IDE reading*:
  increased letter height, unambiguous `0O 1lI {}[]`, free OFL. Replaces Geist Mono.
- **Self-hosted** variable fonts in `assets/fonts/` (OFL licenses alongside), declared in
  `tokens/fonts.css` — no CDN, matching the zero-network promise.

Scale is dense/IDE-grade: default UI text **14px**, secondary 13, meta 12, statusbar 11.
Headings semibold with tight tracking. Monospace everywhere a developer expects data.

---

## Brand in one line

> Local-first developer tools. Privacy by default. Fast, keyboard-first, dark by default.

Precision-instrument vibe: quiet, dense, technical, trustworthy. Lineage: JetBrains × Linear ×
Primer's engineering rigor — never a GitHub clone.

## Content Fundamentals

- **Voice:** plain, technical, verbs-first. Sentence case in UI; UPPERCASE mono eyebrows for
  group headers ("FAVORITES", "TOOL LIBRARY"). Tool names are Title Case proper nouns.
- **Person:** address the user as **you**. Product is **Toolbit**.
- **Privacy is a recurring beat** — it lives in permanent chrome, not marketing:
  statusbar "Local · no network", sidebar footer "Your data never leaves this device",
  inspector "Local only" card. Reuse these exact phrases.
- **Keyboard-first:** shortcuts surfaced as `<Kbd>` chips (⌘K command, ⌘1–3 favorites).
- **No emoji** in product UI. Lucide icons only.

## Visual Foundations

- **Dark is default** (`class="dark"` on `<html>`); light fully supported. Both are semantic
  aliases over raw scales in `tokens/colors.css` (HSL channels — compose with
  `hsl(var(--x) / alpha)`).
- **Neutrals:** graphite ramp `--gray-0…950`, near-hueless. Dark: bg `#1E1F22` → panel →
  card `#2B2D30`; depth from surface steps + 1px hairlines, not shadows.
- **One accent: indigo** (`--primary`). Solid `#3D63DD` (light) / brighter `226 82% 65%` (dark).
  Used for primary actions, active states, focus rings, soft washes. Semantic green/amber/red
  for valid/warn/error with `*-soft` washes.
- **Syntax tokens** (`--code-key/string/number/keyword/punc`) — JetBrains-inspired, both themes.
- **Radii:** sharp — 6px controls, 8px panels, 12px dialogs, pills for chips only.
- **Density:** controls 32px (28 compact via `[data-density="compact"]`), rows 30px,
  header 48, statusbar 28, sidebar 240, inspector 300.
- **Motion:** "productive motion" (Carbon lineage) — instant 50 / fast 100 / base 150 / slow 250 / slower 350ms; enter decelerates (`--ease-enter`), exit accelerates ~30% shorter (`--ease-exit`); shipped recipes `.tb-enter-fade/scale/slide-up/slide-down`; the only sanctioned loop is `.tb-cursor-blink` (terminal-caret idiom, used by the logo's loading state). Everything zeroes under reduced-motion.
- **Focus:** 2px indigo ring, 1px offset, always visible.
- **Blur/transparency:** command-palette scrim only. Content surfaces stay opaque.
- **Imagery:** none — the mark + iconography is the identity.

## Iconography

- **Lucide** outline icons (~2px stroke, rounded caps) — matches the product (`lucide-react`).
  The UI kits ship a curated inline subset in `ui_kits/app/icons.jsx` (`window.TBIcon`).
- Sizes: 13–14 inline, 15–16 rows, 22 tool headers. Color via `currentColor`.
- Two-letter **monogram chips** (JS, JT, 64) are used *only* for pinned favorites; anywhere
  the full catalog appears, use category icons.
- Brand marks in `assets/`: `logo-mark.svg` (indigo tile — lowercase t + spectrum cursor bit),
  `logo-glyph.svg` (transparent glyph for dark chrome), favicons (32px collapses the bars
  to a solid bit). Wordmark: lowercase **tool​bit** in Geist Bold, "bit" in indigo.
  Loading state: the cursor bit blinks (`.tb-cursor-blink`).

---

## Index / Manifest

**Foundations** — `styles.css` (single entry; @import manifest) → `tokens/` (`fonts`, `colors`,
`typography`, `spacing`, `radius`, `elevation`, `motion`, `base`).

**Components** (`components/`, on `window.<Namespace>` — see any card for boilerplate):
- `core/` — Button, IconButton, Badge, Tag, Kbd
- `forms/` — Input, Textarea, Select, Switch, Checkbox
- `feedback/` — Alert, Toast, Tooltip, Skeleton
- `surfaces/` — Card, CodeBlock, StatusPill
- `nav/` — Tabs, SidebarItem

**UI Kits** (`ui_kits/`):
- `app/` — the **Workspace**: `index.html` shell + `Sidebar` / `Topbar` / `EditorView`
  (tabs, split editor, piping) / `Catalog` / `Inspector` / `Statusbar` / `CommandPalette`.
- `marketing/` — toolbit.app landing page.

**Specimen cards** (`guidelines/`) — Colors (accent, neutral, semantic, syntax, surfaces,
charts), Type (display, body, mono, scale), Spacing/Radius/Elevation/Motion, Brand.

**`SKILL.md`** — makes this folder usable as a downloadable Agent Skill.
