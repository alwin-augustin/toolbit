# Plan: the "Notes" tool

Status: **proposed — not started.** This is a plan only; no application code has
been changed.

Outcome: add a **Notes** tool to Toolbit — a single plain-text/markdown pane you
can paste into, with an optional live Markdown preview. Session-only, and private
by default (excluded from history, share and analytics).

---

## 1. Locked decisions

| #   | Decision         | Choice                                                                   |
| --- | ---------------- | ------------------------------------------------------------------------ |
| 1   | Name             | **Notes** (`id: 'notes'`, route `/notes`)                                |
| 2   | Markdown preview | **Yes** — a toggle between editing and rendered preview                  |
| 3   | Persistence      | **Session-only** — content lives for the tab's lifetime, gone on refresh |
| 4   | Privacy          | **Excluded from everything** — no history, no share/export, no analytics |
| 5   | Shape            | **Option B — a custom screen**, not a workbench spec                     |
| 6   | Scope            | Minimum: paste/type plain text. Markdown preview is the one extra.       |

---

## 2. Why a custom screen (and not a workbench tool)

Toolbit has two tool shapes (`core/tool-registry.ts`):

- **Workbench tool** — declared in `features/tools/specs.ts`, rendered by the
  generic input→output chrome. Its reason to exist is a **transform**
  (`parse` → `transform` → `Result`, `core/tool-contract.ts`).
- **Custom screen** — a bespoke layout in `features/tools/<tool>/`, registered in
  `features/tools/custom-screens.tsx`. Word Counter and Markdown Previewer are
  the closest existing examples.

A note taker has **no transform and no output** — pasting text and keeping it is
not input→output. So it must be a custom screen. The glossary is explicit that a
tool renders as one or the other, never both.

---

## 3. Key finding: custom screens are ephemeral today

This is the one architectural wrinkle the plan has to resolve.

Tabs in Toolbit are **documents** (`WorkspaceTab = ToolDocumentV1`). Documents
are only ever created for **workbench** tools:

- `features/tools/specs.ts` → `isWorkbenchToolId(id)` is the gate.
- `shared/workbench-actions.ts` `openTool()` creates a document only when
  `isWorkbenchToolId(toolId)`; otherwise it just navigates (line ~37).
- `app/router.tsx` creates a document on direct navigation only for workbench
  tools (`if (!isWorkbench) return;`, line ~70).
- `app/shell/Sidebar.tsx`, `SearchDialog.tsx`, `StartScreen.tsx` likewise only
  call `openTool` for workbench tools.

A custom screen with no document reads `DocumentContext` as `null` and its
`useDocumentField` state falls back to **component-local state**
(`shared/document-state.tsx`). Because the screen unmounts when you navigate to
another tool, **its content is lost the moment you leave it.**

`tests/custom-screens-matrix.test.tsx` already opens a backing document for
every custom screen (`openDocument(id)`) and renders it under a
`DocumentContext` — so a custom screen _renders fine_ when a document exists. The
gap is purely that production code never creates one.

### Consequence

"Session-only" should mean _"survives tool switches until you refresh"_, not
_"vanishes when you click another tool"_. To honour that, Notes must be
**document-backed**.

### Sub-decision inside Option B

- **B1 — pure custom screen (least code).** Local component state. Notes survive
  only while the screen stays mounted; switching tools discards them. ~0 extra
  architecture.
- **B2 — document-backed custom screen (recommended).** Notes owns a document/tab
  like a workbench tool, but still renders the bespoke screen. Content survives
  tool switches within the session (and is stripped on refresh by the existing
  `partialize`, so it stays session-only), it appears in the tab strip, and you
  can open several notes at once.

Recommendation: **B2**. The cost is a small, honest generalisation (section 5).

---

## 4. Tool identity

Add one entry to the `TOOL_CATALOG` array in `src/content/tools.config.ts`:

```ts
{
  id: 'notes',
  name: 'Notes',
  description: 'A private scratchpad for pasting and previewing text',
  category: 'text',            // ToolCategory — 'text' already exists
  researchCategory: 'text',    // appears under "Text" in the navigator
  path: '/notes',
  keywords: ['notes', 'notepad', 'scratchpad', 'markdown', 'paste', 'text'],
}
```

- `category` and `researchCategory` are distinct taxonomies; both have a `text`
  bucket, so no new categories are needed.
- `path: '/notes'` does not collide with the reserved top-level slugs enforced by
  `tests/seo-content.test.ts` (`about`, `privacy`, `terms`, `blog`, `tools`,
  `compare`, `design-system`, `assets`, `og`, `screenshots`, `app`, guides).
- Icon: optional. If a per-tool icon is wanted, use a Tabler glyph
  (`IconNotes` / `IconNotebook`). The navigator groups tools by category icon, and
  the tab strip only shows an icon for workbench tools, so this is cosmetic.

---

## 5. The document-backing change (B2)

Introduce one small concept: _"custom screens that own a document."_ Nothing
else about their rendering changes.

Add to `src/features/tools/custom-screens.tsx` (or a tiny shared module if
preferred):

```ts
/** Custom screens that own a workspace document/tab (so their content is
 *  session-scoped rather than lost on navigation). */
export const DOCUMENT_BACKED_SCREENS = new Set<string>(['notes']);

/** True when a tool owns a document — workbench tools and these screens. */
export function ownsDocument(id: string): boolean {
  return isWorkbenchToolId(id) || DOCUMENT_BACKED_SCREENS.has(id);
}
```

Then switch the **document-lifecycle** call sites from `isWorkbenchToolId` to
`ownsDocument`. The **rendering** branch in `router.tsx` stays on
`isWorkbenchToolId` (Notes must keep rendering its custom screen).

| File                             | Current use                                      | Change                                                                      |
| -------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `shared/workbench-actions.ts`    | `openTool` creates doc only for workbench (~L37) | use `ownsDocument`; seed `{ text: input }` via the smart-paste field map    |
| `shared/workbench-actions.ts`    | `activeSaveableResult` (~L128)                   | unchanged; Notes publishes a result (section 7)                             |
| `app/router.tsx`                 | doc creation effect (~L69–83)                    | use `ownsDocument`; render branch stays `isWorkbench`                       |
| `app/shell/Sidebar.tsx`          | `activate()` (~L77)                              | `ownsDocument` → `openTool`                                                 |
| `app/shell/SearchDialog.tsx`     | open handler (~L46)                              | `ownsDocument` → `openTool`                                                 |
| `app/screens/StartScreen.tsx`    | recents/label (~L32, L71, L192, L215)            | use `ownsDocument` for open + "Document/Tool" label                         |
| `app/shell/TabBar.tsx`           | title/icon/dirty (~L20, L25, L100)               | optional: pass a Notes icon; title already falls back to the catalogue name |
| `app/components/DesktopHost.tsx` | deep-link/open-with (~L62, L83)                  | optional desktop parity: let a dropped `.md`/`.txt` open as a note          |
| `core/tool-registry.ts`          | `kind` (~L19)                                    | optional: add a `'screen-document'` kind, or leave as `'custom'`            |

If B2 is rejected, none of this section applies and Notes is a plain screen whose
state is lost on navigation.

---

## 6. The Notes screen

New file: `src/features/tools/notes/NotesScreen.tsx`.

### Layout

Reuse existing `wb-*` primitives (no new CSS expected):

- `.wb-workspace-heading` — `<h1>Notes</h1>` + a one-line description, and the
  "Runs on this device / Session only" processing badges Markdown Previewer uses.
- `.wb-toolbar` — **Load sample**, **Clear**, **Copy**, **Download `.md`**, and the
  **Preview** toggle.
- One `.wb-editor-pane`:
  - **Edit mode** → `CodeEditor` (CodeMirror 6), `language="markdown"`,
    `wrap` from `useWorkbenchMemory`, `showLineNumbers={false}`,
    placeholder like "Paste or type anything…".
  - **Preview mode** → `.wb-markdown-preview` with sanitised HTML, or `.wb-empty`
    when there is nothing to render.
  - `.wb-pane-footer` — live character/word count.

The toggle swaps a single pane (note-like) rather than the side-by-side split used
by Markdown Previewer. A `Edit | Split | Preview` variant is possible later but is
out of scope for the first cut.

### State & data model

- Body: `const [text, setText] = useDocumentField<string>('text', '')`.
  Field name **`text`** matches `SMART_PASTE_FIELDS`/`smartPastePayload` output, so
  paste seeding and smart-paste share one path.
- View: `const [preview, setPreview] = useDocumentField<boolean>('preview', false)`
  (per-note, stored in the document payload).
- Both live in the tab payload and are stripped on refresh by
  `partialize` in `shared/workspace-store.ts` → session-only for free.

### Reused code (no new dependencies)

- `CodeEditor` from `@/shared/CodeEditor`.
- `marked` + `DOMPurify` via `renderMarkdownToHtml` / `sanitizeMarkdownError`,
  already **exported** from
  `features/tools/markdown-previewer/MarkdownScreen.tsx`. Reuse them rather than
  duplicating the sanitiser config.
- `usePublishedResult` from `@/shared/result-store` — publish the note text (and
  rendered HTML as a typed result) so **Save Result…** and **Copy** already work;
  this is also what makes `activeSaveableResult()` return the note for a
  document-backed screen.
- `useWorkbenchMemory` for `wrap` and `notify`.

### Behaviour details

- Rendering is debounced/effect-driven exactly like Markdown Previewer, with a
  `cancelled` guard on the async `marked` call.
- Preview HTML is always `DOMPurify.sanitize`d with the existing config
  (`FORBID_TAGS: ['style','form','input','button']`, safe URI regexp). A unit test
  must pin that a `<script>`/`onerror` payload is neutralised.
- Empty input shows `.wb-empty`, never a blank pane.

---

## 7. Privacy: exclude Notes from everything

### 7.1 Persistence & sharing

`core/tool-policy.ts` is the single gate:

```ts
const secret = new Set([...]);        // historyDefault 'disabled', canShareTool false
const personal = new Set(['pdf-tools','image-converter']); // historyDefault 'enabled'
```

Effects that already key off this:

- `core/history-db.ts` (~L87): `if (!canPersistTool(toolId) …) return;` → no run
  is recorded.
- `core/workspace-schema.ts` (~L94, ~L151): payloads of non-persistable tools are
  **stripped on export and rejected on import**.
- `canShareTool(id)` → `sensitivity !== 'secret'`.

To get the requested "excluded from everything", add `'notes'` to the set that
maps to `sensitivity: 'secret'` + `historyDefault: 'disabled'`:

```ts
const secret = new Set([
  'password-generator',
  'totp-generator',
  'jwt-decoder',
  'certificate-decoder',
  'api-request-builder',
  'websocket-tester',
  'qr-code-generator',
  'docker-command-builder',
  'notes', // user-authored content: never recorded, never shared
]);
```

**Naming note.** The existing bucket is called `secret` and its doc comment scopes
it to "credentials or tokens". Notes is _private user content_, which wants the
same treatment but is not a credential. Two options:

- **Minimal (recommended for this cut):** add `'notes'` with the clarifying
  comment above and treat `sensitivity === 'secret'` as "private, never persisted
  or shared". Small, zero-risk.
- **Cleaner (optional follow-up):** introduce a `'private'` sensitivity (or rename
  the concept) so the taxonomy reads honestly. Touches `tool-policy.ts` plus the
  policy matrix tests. Not required for Notes to behave correctly.

### 7.2 Analytics

Even as a `secret` tool, opening `/notes` today would still emit a
`page_viewed` event with `route: 'notes'` (`app/components/PostHogPageView.tsx` →
`core/telemetry/index.ts`). Payload content is _never_ sent — `sanitizeProperties`
only permits enum/bounded props — but the presence event is. The glossary already
claims secret tools are "excluded from … telemetry by default"; the code does not
yet enforce that.

Close the gap in `core/telemetry/index.ts` `track()`:

- Before sending, resolve the event's `tool_id` and/or `route`; if it names a
  non-shareable tool (`!canShareTool(id)`), drop the event.
- Keep the existing enum allow-list and payload sanitisation untouched.

A test should assert that `track('page_viewed', { route: 'notes' })` and
`track('tool_opened', { tool_id: 'notes' })` send nothing while analytics is on,
and that a normal tool still sends.

---

## 8. Smart paste / detection

`features/tools/specs.ts`:

- Add `'notes': 'text'` to `SMART_PASTE_FIELDS`. This makes `/` (Smart paste) and
  `smart-detect` able to seed a new note: `smartPastePayload('notes', text)`
  returns `{ text }`, which matches the screen's field.

No change needed to `smart-detect.ts` for the first cut; text that matches no
known shape can be offered to Notes as a catch-all later (out of scope).

---

## 9. SEO landing page (required, not optional)

`tests/seo-content.test.ts` asserts, hard:

> `expect([...slugs].sort()).toEqual(toolIds)` and
> `expect(TOOL_PAGES).toHaveLength(TOOLS.length)` — "covers every registered tool
> exactly once".

So adding Notes to the catalogue **requires** a matching entry in
`src/content/seo/seo-content.js` `TOOL_PAGES`, or the suite fails. The generator
(`scripts/generate-seo-pages.mjs`) then prerenders `/notes` and lists it in the
directory, sitemap and JSON-LD automatically.

Fields required (follow the `word-counter` entry as a template): `slug`, `name`,
`category` (must be one of `CATEGORY_GROUPS` ids — use `'text'`), `title`
(≤ 70 chars), `description` (70–200 chars), `h1`, `lede`, `bullets[]`,
`howTo[]`, `faq[]`, `keywords[]`, `related[]` (existing slugs only).

Copy angle: a **private, local scratchpad** — text stays in the tab, isn't saved,
isn't analysed, and disappears on refresh. Add the `privacyAnswer` FAQ entry.

Also update the human-readable counts that name the tool total:

- `README.md` ("42 developer utilities").
- `GLOSSARY.md` ("42 tools").
- `SITE.description` / `shortDescription` in `seo-content.js` use "40+" — no change
  needed, but worth a glance.

---

## 10. Tests

New:

- `tests/notes.test.tsx` — renders heading + toolbar; typing updates the field;
  the Preview toggle renders sanitised HTML; a `<script>`/`onerror` payload is
  neutralised; Clear empties; character count updates.
- Telemetry boundary: add a case asserting private tools emit nothing (section
  7.2).

Updated (these enumerate tools/screens and will otherwise drift):

- `tests/custom-screens-matrix.test.tsx` — iterates `CUSTOM_SCREENS`; Notes is
  swept automatically. Optionally refresh the stale "(29 components)" title.
- `tests/sample-sweep.test.tsx` — if Notes ships a "Load sample", it must produce a
  visible change and no `alert`; coverage threshold is `≥ 20`, so adding one is
  fine.
- `tests/seo-content.test.ts` — passes once the `TOOL_PAGES` entry exists.
- `tests/accessibility.test.tsx` — ensure the new screen is covered by the axe
  sweep.
- `tests/workbench-router-matrix.test.tsx` / `workbench-router.test.tsx` — add
  `/notes` to routing coverage, including that a document/tab is created (B2).
- `tests/persistence.test.ts` / `workspace-store.test.ts` — assert a `notes`
  document's payload is **not** persisted (stripped by `partialize`) and is
  rejected by `parseWorkspace` (matches the `secret` policy).

Verification gate (repo standard, `docs/README.md`):

```sh
npm run check && npm run lint && npm run test:run
npm run build        # also runs seo:generate + pwa:generate
```

---

## 11. File-by-file change list

| File                                       | New / Edit | Purpose                                                         | Required    |
| ------------------------------------------ | ---------- | --------------------------------------------------------------- | ----------- |
| `src/content/tools.config.ts`              | edit       | catalogue entry for `notes`                                     | ✅          |
| `src/features/tools/notes/NotesScreen.tsx` | new        | the screen                                                      | ✅          |
| `src/features/tools/custom-screens.tsx`    | edit       | register screen; add `DOCUMENT_BACKED_SCREENS` + `ownsDocument` | ✅ (B2)     |
| `src/features/tools/specs.ts`              | edit       | `SMART_PASTE_FIELDS['notes'] = 'text'`                          | ✅          |
| `src/core/tool-policy.ts`                  | edit       | classify `notes` as private (no history/share)                  | ✅          |
| `src/core/telemetry/index.ts`              | edit       | drop events for non-shareable tools                             | ✅          |
| `src/content/seo/seo-content.js`           | edit       | add the required `TOOL_PAGES` entry                             | ✅          |
| `src/shared/workbench-actions.ts`          | edit       | create a document for document-backed screens (B2)              | ✅ (B2)     |
| `src/app/router.tsx`                       | edit       | create a document for `notes` on direct nav (B2)                | ✅ (B2)     |
| `src/app/shell/Sidebar.tsx`                | edit       | open via `ownsDocument` (B2)                                    | ✅ (B2)     |
| `src/app/shell/SearchDialog.tsx`           | edit       | open via `ownsDocument` (B2)                                    | ✅ (B2)     |
| `src/app/screens/StartScreen.tsx`          | edit       | open/label via `ownsDocument` (B2)                              | ✅ (B2)     |
| `src/app/shell/TabBar.tsx`                 | edit       | optional icon for a Notes tab                                   | ⬜ optional |
| `src/app/components/DesktopHost.tsx`       | edit       | open dropped `.md`/`.txt` as a note                             | ⬜ optional |
| `src/core/tool-registry.ts`                | edit       | optional `kind` refinement                                      | ⬜ optional |
| `README.md`, `GLOSSARY.md`                 | edit       | new tool count (42 → 43)                                        | ✅ docs     |
| `tests/*`                                  | new/edit   | see section 10                                                  | ✅          |

---

## 12. Milestones

- **M0 — Notes is usable (MVP).** Catalogue entry, `NotesScreen` (edit pane,
  Clear, Load sample, Copy, character count, preview toggle), smart-paste field,
  privacy classification, SEO page. Ship as B1 or B2 per section 3.
- **M1 — Document-backed (B2), if chosen.** `ownsDocument` and the lifecycle call
  sites; `/notes` appears as a tab; multiple notes; Save Result works.
- **M2 — Telemetry exclusion.** Guard private tools out of analytics (section 7.2).
- **M3 — Polish (optional).** Notes icon in the tab strip; desktop "open with";
  Edit/Split/Preview; catch-all smart-detect.

M1 and M2 are independent and can land in either order.

---

## 13. Risks & open questions

1. **B1 vs B2.** If B1 is chosen, "session-only" is weaker than it sounds (content
   lost on navigation). This is the one call worth making explicitly before M1.
2. **`secret` naming.** Behaviourally correct; semantically the bucket is named for
   credentials. Ship with a comment, or schedule the optional `private` rename.
3. **`ownsDocument` spread.** Missing a call site that still uses
   `isWorkbenchToolId` would mean Notes doesn't get a tab in that entry point;
   covered by the router-matrix test.
4. **SEO copy vs privacy framing.** The marketing page must exist (test-enforced)
   but should emphasise local-only/session-only rather than "save your notes".
5. **Existing stale counts.** `custom-screens-matrix` title says "29 components"
   while there are 30; harmless, but a good moment to tidy.

---

## 14. Out of scope

Rich-text/WYSIWYG, checklists, attachments/images, folders/tags, search across
notes, pinning, encryption, cloud sync, and any form of persistence beyond the
session. Aligned with the brief: "not full scale — just paste plain text".

---

## 15. Acceptance criteria

- `/notes` opens a Notes screen; you can type or paste text and it renders.
- The Preview toggle renders sanitised Markdown; dangerous HTML is neutralised.
- Loading `/notes`, typing, switching to another tool and back keeps the content
  **within the session** (B2), and a full refresh clears it.
- The note never appears in History, never leaves the device, and is not included
  in a workspace export; opening `/notes` emits no analytics event.
- `npm run check && npm run lint && npm run test:run && npm run build` pass, and
  `/notes` is prerendered.
