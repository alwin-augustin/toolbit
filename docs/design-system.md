# Toolbit Design System

> The single reference for how Toolbit looks and behaves. If something in the
> interface is not described here, it is not part of the system yet.

Toolbit is a local-first workbench of 42 developer utilities. The interface has
one job: get a developer from "I have data" to "I have the answer" without
making them think about the interface at all. Everything below serves that.

- **Source of truth for values:** [`src/app/styles/tokens.css`](../src/app/styles/tokens.css)
- **Source of truth for components:** [`src/app/styles/system.css`](../src/app/styles/system.css)
- **Tailwind bridge:** [`src/app/styles/tailwind.css`](../src/app/styles/tailwind.css)
- **Base layer and fonts:** [`src/app/styles/globals.css`](../src/app/styles/globals.css)

---

## 1. Principles

**1. The interface is an instrument, not an ornament.**
Chrome recedes; input and result are the subject. No decorative gradients, no
illustration, no marketing voice inside the workbench. If a pixel does not help
someone read, compare or run something, it is removed.

**2. Hairlines before shadows.**
Regions are separated by 1px lines and background steps. Shadow means "this
floats above the page" — menus, popovers, dialogs, toasts. Nothing else.

**3. Data is monospaced, prose is not.**
Anything a developer might copy, count, or compare — payloads, results,
durations, byte sizes, line numbers, identifiers — is set in JetBrains Mono with
tabular numerals. Labels and sentences are Geist.

**4. Dark is designed, not inverted.**
Light and dark are separate values chosen for their own contrast and halation
behaviour. Ink in dark mode is never pure `#fff`.

**5. State is always visible.**
Every screen can answer: what am I looking at, is the result current, where did
my data go, and what happens if I press this. Errors keep the previous result
and say so.

**6. Keyboard first, never keyboard only.**
Every primary action has a shortcut, and every shortcut has a pointer path.

---

## 2. Colour

### 2.1 Layers

```
primitives  →  semantic  →  aliases
(raw ramps)     (roles)      (shadcn/ui compatibility)
```

Components may only reference **semantic** tokens. Primitives exist so a theme
change is one edit in one file.

### 2.2 Semantic tokens

| Token                                                                                      | Role                                                       |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `--tb-canvas`                                                                              | Page background behind panels                              |
| `--tb-surface`                                                                             | Panel and row background                                   |
| `--tb-sunken`                                                                              | Recessed chrome: rail, tab strip, pane headers, status bar |
| `--tb-raised`                                                                              | Floating layers: menus, popovers, dialogs                  |
| `--tb-overlay`                                                                             | Scrim behind drawers and modals                            |
| `--tb-state-hover`                                                                         | Interactive hover background                               |
| `--tb-state-selected` / `--tb-state-selected-ink`                                          | Selected row/segment                                       |
| `--tb-line` / `--tb-line-strong`                                                           | Default and emphasised hairlines                           |
| `--tb-ink`                                                                                 | Primary text                                               |
| `--tb-ink-muted`                                                                           | Secondary text                                             |
| `--tb-ink-faint`                                                                           | Tertiary text, meta, icons at rest                         |
| `--tb-ink-inverse`                                                                         | Ink on inverted surfaces                                   |
| `--tb-brand` / `--tb-brand-hover` / `--tb-brand-ink` / `--tb-brand-soft` / `--tb-on-brand` | Action, selection, focus                                   |
| `--tb-success` / `--tb-success-soft`                                                       | Valid result, completed                                    |
| `--tb-warning` / `--tb-warning-soft`                                                       | Caution, heuristic output                                  |
| `--tb-danger` / `--tb-danger-soft`                                                         | Failure, destructive                                       |
| `--tb-info` / `--tb-info-soft`                                                             | Neutral information                                        |

Tailwind exposes each as a utility: `bg-canvas`, `text-ink-muted`,
`border-line`, `bg-state-selected`, `text-brand-ink`, `bg-danger-soft`, and so
on. Prefer these over `slate-*`, raw hex, or arbitrary values.

### 2.3 Brand

Indigo/violet, kept distinct from status colour so "primary action" can never be
confused with "success" or "error". Light theme uses a darker step for contrast
on white; dark theme lightens it to hold contrast on a near-black canvas.

### 2.4 Status colour is soft + ink

Status never fills a large area. The pattern is a tinted background with a
saturated ink:

```html
<div class="rounded-lg border border-danger/35 bg-danger-soft text-danger px-3.5 py-3"></div>
```

### 2.5 Code syntax

Syntax colours are a **separate token set** (`--tb-code-*`, exposed to CSS as
`--code-*`) so changing the brand can never change how source code reads. Used by
the CodeMirror theme and the diff viewer.

| Token                                  | Meaning                     |
| -------------------------------------- | --------------------------- |
| `--code-key`                           | Object keys, property names |
| `--code-string`                        | Strings                     |
| `--code-number`                        | Numbers                     |
| `--code-keyword`                       | Keywords, booleans, null    |
| `--code-punc`                          | Punctuation and brackets    |
| `--code-comment`                       | Comments and meta           |
| `--code-added` / `--code-added-bg`     | Added diff lines            |
| `--code-removed` / `--code-removed-bg` | Removed diff lines          |

---

## 3. Typography

**Geist** for interface text, **JetBrains Mono** for data. Both self-hosted as
variable WOFF2 from `src/shared/ds/assets/fonts/` — a local-first product must
not make a third-party request on first paint.

| Token            | Size | Use                                           |
| ---------------- | ---- | --------------------------------------------- |
| `--tb-text-2xs`  | 11px | Meta, counts, badges, keyboard hints          |
| `--tb-text-xs`   | 12px | Field labels, status bar, secondary captions  |
| `--tb-text-sm`   | 13px | **Default UI text** — rows, buttons, controls |
| `--tb-text-base` | 14px | Body copy, prose, inputs                      |
| `--tb-text-md`   | 15px | Emphasised body, palette input                |
| `--tb-text-lg`   | 17px | Tool title (h1 inside a document)             |     | `--tb-text-xl` | 20px | Section lead, error titles |
| `--tb-text-2xl`  | 24px | Screen title (h1 of a workspace screen)       |
| `--tb-text-3xl`  | 30px | Landing page only                             |

Rules:

- **Uppercase micro-labels** use `text-2xs` + `tracking-caps` (0.08em) + `font-semibold`. This is the system's section label, both in the navigator and in cards.
- **Never go below 11px.** Nothing in the product is smaller.
- Numbers that update in place (counts, byte sizes, line numbers, timers) get the `tb-tnum` utility for tabular figures.

---

## 4. Space, shape and elevation

### 4.1 Control heights

Interactive controls pick one of four heights. Mixing them inside one row is a
defect.

| Token             | Value | Use                                                           |
| ----------------- | ----- | ------------------------------------------------------------- |
| `--tb-control-xs` | 22px  | Inline chips inside a pane header                             |
| `--tb-control-sm` | 28px  | Icon buttons, toolbar actions, segment items                  |
| `--tb-control-md` | 32px  | Default buttons, inputs, selects (`.wb-button`, `.wb-select`) |
| `--tb-control-lg` | 40px  | Page-level search and primary call to action                  |

Touch devices get a 44px minimum target from the base layer, independent of
these values.

### 4.2 Layout furniture

| Token              | Value | Member                        |
| ------------------ | ----- | ----------------------------- |
| `--tb-rail-w`      | 52px  | Icon rail (always visible)    |
| `--tb-panel-w`     | 264px | Navigator panel, desktop only |
| `--tb-topbar-h`    | 44px  | Context strip / panel header  |
| `--tb-head-h`      | 40px  | Card and pane headers         |
| `--tb-statusbar-h` | 26px  | Document status bar           |

### 4.3 Radius`xs` 3px (badges) · `sm` 4px (icon buttons) · `md` 6px (rows, inline chips,

small toolbar controls) · `lg` 9px (inputs, buttons, cards, panes) ·
`xl` 13px (dialogs, the paste field).

### 4.4 Elevation

Four levels, and only floating layers use the top two.

| Token            | Use                                                       |
| ---------------- | --------------------------------------------------------- |
| `--tb-shadow-xs` | The paste field, a resting card that needs a hint of lift |
| `--tb-shadow-sm` | Hover on a floating trigger                               |
| `--tb-shadow-md` | Popovers, dropdown menus, rail tooltips                   |
| `--tb-shadow-lg` | Dialogs, the command palette, toasts, the mobile drawer   |

Stacking order is part of the system too, and is bridged to utilities so it is
never guessed: `z-sticky` (10), `z-rail` (20), `z-drawer` (40), `z-overlay` (50),
`z-popover` (60), `z-toast` (70), `z-skip` (80). Prefer these over `z-50`.

---

## 5. Motion

| Token                   | Value | Use                       |
| ----------------------- | ----- | ------------------------- |
| `--tb-duration-instant` | 80ms  | Hover and colour changes  |
| `--tb-duration-fast`    | 130ms | Opacity, small offsets    |
| `--tb-duration-base`    | 190ms | Drawer slide, toast entry |
| `--tb-duration-slow`    | 320ms | Large surface transitions |

Easings: `--tb-ease-out` (entrances, the default), `--tb-ease-in-out` (movement),
`--tb-ease-spring` (a small overshoot for the toast).

Only `background-color`, `color`, `opacity` and `translate`/`transform` are
animated — never layout properties.

**Reduced motion is honoured globally.** `globals.css` collapses every duration
to 0.01ms and disables smooth scrolling when the OS asks for it. No component
needs to handle this itself.

---

## 6. Components

### 6.1 Shell

| Class                                                  | What it is                                                                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `.wb-shell`                                            | The application grid: rail + panel + workspace. Panel state and drawer state are `data-panel` / `data-drawer` attributes on this element. |
| `.wb-rail` / `.wb-rail-item`                           | 52px icon spine. Active item gets a brand tint and a 2px edge marker. `data-tip` renders a hover/focus label.                             |
| `.wb-panel`                                            | The navigator. A grid column ≥1024px, a drawer below.                                                                                     |
| `.wb-panel-head` / `.wb-panel-body` / `.wb-panel-foot` | Panel regions.                                                                                                                            |
| `.wb-nav-item`                                         | A navigable row. Active state is `aria-current="page"`.                                                                                   |
| `.wb-nav-heading` / `.wb-nav-count`                    | Section label and its count.                                                                                                              |
| `.wb-nav-branch`                                       | Indented children of a category.                                                                                                          |
| `.wb-topbar` / `.wb-crumbs`                            | Context strip and breadcrumb.                                                                                                             |
| `.wb-tabs` / `.wb-tab` / `.wb-tab-close`               | Document strip. Tabs are links; the active one is marked by a brand underline.                                                            |
| `.wb-statusbar` / `.wb-statusbar-item`                 | Dense factual footer of a document.                                                                                                       |
| `.wb-skip-link`                                        | Keyboard escape hatch to `#wb-main`.                                                                                                      |
| `.wb-backdrop`                                         | Scrim for the mobile drawer.                                                                                                              |
| `.wb-toast`                                            | Transient confirmation, bottom centre.                                                                                                    |

### 6.2 Content primitives

| Class                                      | What it is                                                                                                                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.wb-card` / `.wb-card-head`               | The one container: a hairline panel with an optional uppercase header.                                                                                                                                                                             |
| `.wb-list-row`                             | A full-width interactive row. Dividers line up with the card edge.                                                                                                                                                                                 |
| `.wb-setting-row`                          | Label + help text on the left, control on the right.                                                                                                                                                                                               |
| `.wb-page-heading`                         | Screen title + description (`h1` + `p`): 24px/600 title, 13px muted line. Carries no outer margin — the container owns spacing.                                                                                                                    |
| `.wb-caps`                                 | The system's one section label: 11px, 600, caps tracking, `--tb-ink-faint`. `.wb-nav-heading` and `.wb-section-title-row h2` compose it.                                                                                                           |
| `.wb-workspace-heading`                    | Document title + description, with actions on the right.                                                                                                                                                                                           |
| `.wb-editors` / `.wb-editor-pane`          | The two-pane workspace: panes share one hairline seam rather than sitting in separate cards.                                                                                                                                                       |
| `.wb-pane-header` / `.wb-pane-footer`      | Pane title bar and its monospaced fact strip.                                                                                                                                                                                                      |
| `.wb-toolbar`                              | A row of actions and inline options on the tool's own surface. Controls in one row share one height — a 28px action next to a 32px select is a defect.                                                                                             |
| `.wb-toolbar-label`                        | Label beside a toolbar control (13px, `--tb-ink-muted`).                                                                                                                                                                                           |
| `.wb-processing`                           | Read-only facts about how a tool is running (mode, unit, session scope).                                                                                                                                                                           |
| `.wb-empty`                                | Empty state: icon, `h2`, one sentence, optional action.                                                                                                                                                                                            |
| `.wb-preview-note`                         | The note above a truncated (large-input) editor preview.                                                                                                                                                                                           |
| `.wb-prose`                                | Binds the typography plugin's palette to semantic tokens. Wrap long-form legal prose in it.                                                                                                                                                        |
| `.wb-error-banner`                         | Error with cause and consequence.                                                                                                                                                                                                                  |
| `.wb-file-type`                            | Small monospaced badge for a format or kind.                                                                                                                                                                                                       |
| `.wb-button` / `.wb-button.primary`        | Structural sizing for a `Button`, layered over the shadcn variant.                                                                                                                                                                                 |
| `.wb-select`                               | Structural sizing for a field or dropdown — height from the control scale, canvas fill, `--tb-line` hairline, `--tb-radius-lg`. `data-size="sm"` (28px) inside a toolbar. A select and the outline button beside it are the same shape and weight. |
| `.wb-popup`                                | The floating list a select or menu opens onto: raised surface, hairline, `--tb-shadow-md`, `z-popover`.                                                                                                                                            |
| `.wb-option` / `.wb-option-with-indicator` | One row inside a popup. Hover and keyboard highlight share one background; a selected row uses the selected pair. `data-variant="destructive"` tints with the danger pair.                                                                         |
| `.wb-icon-button`                          | 26px square icon control.                                                                                                                                                                                                                          |

Utility classes: `.tb-scroll` (themed thin scrollbar), `.tb-scroll-none`,
`.tb-tnum` (tabular numerals), `.wb-sr-only`.

### 6.3 Composing

Prefer the primitives over one-off markup. A new list is
`.wb-card` + `.wb-card-head` + `.wb-list-row`. A new settings surface is
`.wb-card` + `.wb-setting-row`. A new tool document is
`.wb-workspace-heading` + `.wb-toolbar` + `.wb-editors` + `.wb-statusbar`.

**Spacing belongs to the container.** The typography primitives (`.wb-page-heading`,
`.wb-caps`) carry no outer margin, because every screen lays itself out with a
flex `gap`. Adding a margin to a primitive would double the space wherever the
two meet.

**Pages outside the shell** (marketing, legal, 404) render inside `SitePage` from
`src/app/pages/site-chrome.tsx`, which supplies the header and footer. They are
the only chrome the app does not own, so there is exactly one definition of it —
never a per-page header.

---

## 7. Accessibility contract

The system guarantees, and the test suite checks:

- **Focus**: one treatment everywhere — a 2px brand ring offset from the canvas (`--tb-shadow-focus`), visible only for keyboard users (`:focus-visible`).
- **Landmarks**: `nav[aria-label="Primary"]`, `aside[aria-label="Tool navigator"]`, `nav[aria-label="Breadcrumb"]`, `main#wb-main` with `tabindex="-1"`.
- **Skip link**: first focusable element, jumps to the workspace.
- **Selection state** is `aria-current="page"` on navigation, `aria-pressed` on toggles, `aria-selected` never used to mean "chosen".
- **Async results**: `role="status"` with `aria-live="polite"` for outcomes and toast messages; `role="alert"` for failures.
- **Editors** expose `role="textbox"` with a stable accessible name (`Input code`, `Result code`).
- **Touch**: 44px minimum target on coarse pointers; inputs are 16px to prevent iOS zoom.
- **Motion**: fully reduced on request.
- **Contrast**: body ink meets 4.5:1 in both themes; secondary ink is only used at ≥12px.
- **Automated checks**: axe runs over Start, a tool document and the dialogs at 200% zoom in both themes; serious or critical violations fail.

---

## 8. Theming

Theme is `light | dark | system`, stored under `localStorage['theme']` and
resolved pre-paint by `public/theme-init.js` so there is no flash. `unset` means
`system`.

The resolved value is applied as a class on `<html>` (`.light` / `.dark`) plus
`color-scheme`. All token overrides live under `.dark` in `tokens.css`; the
Tailwind dark variant is `@custom-variant dark (&:where(.dark, .dark *))`.

`system` follows the OS live — changing the OS scheme while following the system
re-applies immediately.

---

## 9. Rules for contributors

**Do**

- Use semantic tokens (`bg-surface`, `text-ink-muted`, `border-line`).
- Use `text-sm` for UI text and `font-mono` for anything copyable.
- Pick a control height from the scale and stay consistent within a row.
- Add a shortcut when you add a primary action, and list it in Settings.
- Reach for an existing `wb-*` primitive before writing new CSS.
- Style a control with its primitive: `.wb-button` for a button, `.wb-select` for a field or dropdown, `.wb-popup` + `.wb-option` for a floating list.
- Check the screen in both themes and at 1024px and 390px wide.

**Don't**

- Introduce raw hex, `oklch()` literals, or Tailwind palette colours in components.
- Use a shadow to separate in-page regions.
- Invent a font size, radius or duration outside the scales above.
- Reuse a brand colour for syntax highlighting.
- Write a `dark:` variant on a component. The tokens already flip per theme, so an override is the inversion §2 forbids — and it wins over the light value.
- Ship a large filled status area or a coloured button that is not a primary action.
