---
name: toolbit-design
description: Use this skill to generate well-branded interfaces and assets for Toolbit, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## What's here
- `styles.css` — single import that pulls in every token + the Geist / JetBrains Mono webfonts. Link this one file.
- `tokens/` — colors (dark-first graphite, indigo accent, syntax palette), typography, spacing (+density), radius, elevation, motion (+recipes), base reset.
- `components/` — React UI primitives (Button, IconButton, Badge, Tag, Kbd, Input, Textarea, Select, Switch, Checkbox, Alert, Toast, Tooltip, Skeleton, Card, CodeBlock, StatusPill, Tabs, SidebarItem). Each has a `.d.ts` (props) and `.prompt.md` (usage).
- `ui_kits/app/` — the Toolbit **Workspace** (IDE shell: sidebar, tabs, split editor, inspector, statusbar, ⌘K palette, piping).
- `ui_kits/marketing/` — the toolbit.app landing page.
- `guidelines/` — foundation specimen cards (colors, type, spacing, radius, elevation, motion, brand).
- `assets/` — cursor-bit logo (`logo-mark.svg` tile, `logo-glyph.svg` for dark chrome), favicons. Wordmark: lowercase tool+bit, "bit" in indigo.

## Brand in one line
Local-first developer tools. Privacy by default. Fast, keyboard-first, **dark by default**. An IDE-like workspace: sidebar (favorites/workspaces/library), tabs, split editors, inspector, statusbar, ⌘K palette, piping between tools. Lineage: JetBrains × Linear × Primer's token rigor — deliberately NOT a GitHub look.

## Non-negotiables
- **Dark theme is the default** (add `class="dark"` to `<html>`). Light is a supported secondary.
- **One accent: indigo** (`--primary`, #3D63DD family). Neutrals are a near-hueless graphite ramp — never GitHub's blue-black.
- **Geist** for UI, **JetBrains Mono** for all code/data/inputs/outputs.
- **Lucide** icons only (outline, rounded caps). No emoji in product UI.
- Sharp radii (6px controls, 8px panels), 32px controls (28px compact density), 1px hairline borders, depth from surface steps not shadows, fast motion (100–140ms, no bounce).
- Privacy chrome is permanent: statusbar "Local · no network", "Your data never leaves this device".
- Voice: plain, technical, verbs-first, sentence case; UPPERCASE mono eyebrows; address the user as "you".

## Using components in an HTML artifact
Link `styles.css`, load React + Babel + `_ds_bundle.js`, then:
```js
const { Button, Card, Tag } = window.ToolbitDesignSystem_4ae95c;
```
(See any `*.card.html` or `ui_kits/app/index.html` for the exact boilerplate.)
