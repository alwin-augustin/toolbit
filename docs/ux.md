# Toolbit UX

> How the workbench is organised, why, and what each journey is expected to
> cost. Values and visual rules live in [design-system.md](./design-system.md).

---

## 1. Who this is for, and what they are doing

One persona, two modes.

**The developer with data in hand.** They copied a payload, a token, a stack
trace or a diff from somewhere else and need it to make sense — now. They are
mid-task, often with a terminal and an editor already open. They will not read a
landing page, and they will not accept "paste your secrets into our server".

**The developer browsing.** They half-remember that a tool exists
("something that explains cron") and want to find it. Lower urgency, so the cost
of a slower path is acceptable.

Both modes end the same way: a result on screen that they copy and leave with.

### Jobs to be done

| #   | Job                             | Success looks like                                                   |
| --- | ------------------------------- | -------------------------------------------------------------------- |
| J1  | "Make this payload readable."   | Paste → formatted output, in seconds, without choosing a tool first. |
| J2  | "Get back to what I was doing." | The previous documents are still there and one click away.           |
| J3  | "Find the tool that does X."    | Search or browse to it without reading descriptions.                 |
| J4  | "Keep this for later."          | Save the session, or reuse the result in a new task.                 |
| J5  | "Convince myself this is safe." | See, in one screen, where data goes and what is stored.              |

---

## 2. Information architecture

```
/                       Start — paste-first entry point
/library                All Tools — the full catalogue, grouped
/saved                  Saved — sessions, examples, snippets
/history                History — record of runs, switchable, and cleared on request
/settings               Settings — appearance, session, privacy, keyboard
/{toolId}               A tool document (42 of them)

/about  /privacy  /terms    Marketing and legal, outside the shell
```

Two layers of navigation, deliberately:

- **The rail** (52px, always visible) answers _"which part of the product am I
  in?"_ — four destinations plus theme and settings. It never moves, and below
  1024px it is the only persistent navigation.
- **The navigator panel** (264px, desktop, collapsible) answers _"which tool?"_.
  It holds pinned tools, the recent trail and the full categorised tree, with a
  local filter. Collapsing it gives the document the full width — which is why
  it is collapsible at all.

The panel is a _tool_ navigator in every section, not a contextual second brain.
Duplicating the Saved list inside it would give the same information two homes.

**Three routes to any tool**, ranked by speed:

1. Paste it into Start and accept the detected suggestion.
2. `⌘K` and type.
3. Open the navigator, or browse `/library`.

---

## 3. The shell

```
┌──────┬──────────────┬───────────────────────────────────────────────┐
│ rail │ navigator    │ topbar   Tools › JSON & Data › JSON Formatter │ 44px
│ 52px │ 264px        ├───────────────────────────────────────────────┤
│      │  ┌─────────┐ │ tabs   [ JSON ×] [ Base64 ×] [+]              │ 34px
│  ⌂   │  │ filter  │ ├───────────────────────────────────────────────┤
│  ▦   │  └─────────┘ │                                               │
│  ⚑   │  PINNED      │   the document                                │
│  ↻   │  RECENT      │                                               │
│      │  JSON & DATA │                                               │
│      │  YAML & CONFIG│                                              │
│      │  …           ├───────────────────────────────────────────────┤
│  ☾   │  Settings    │ up to date · wrapped · JSON · local only      │ 26px
│  ⚙   │  Runs locally│                                               │
└──────┴──────────────┴───────────────────────────────────────────────┘
```

- **Rail** — always present. Activating the current destination re-opens the
  panel, so the rail doubles as the panel toggle on touch.
- **Navigator** — pinned, recent, then category branches with counts. The branch
  holding the active tool auto-expands. Collapse with `⌘B` or the panel header's
  button; the choice persists. While the panel is hidden, that same control
  appears at the topbar's left edge — beside the panel it controls, never on the
  far right, where it would read as a control over the workspace.
- **Topbar** — breadcrumb plus global actions only: search, and the local-only
  badge. Tool actions live in the document, so this bar never competes with the
  work.
- **Tab strip** — the document shelf. Tabs are real links: middle-click closes,
  hover reveals a close button, a dot marks a document whose input changed since
  the last run.
- **Status bar** — facts a developer acts on: result currency, wrap mode,
  language, and the local-only reminder.

Below 1024px the navigator becomes a drawer over the workspace and the rail
stays put, with the topbar's left hamburger as its only control — one button,
never two doing the same job. Nothing is ever hidden behind a menu that replaces
navigation.

---

## 4. Journeys

### J1 — Paste to result (the primary path)

```
Start
 └─ paste into "Paste data to find a tool"
     └─ detection runs and names what it saw
         "Detected valid JSON"
         [ Open JSON Formatter ]  [ Open JSON Schema Validator ]
             └─ document opens with the payload already in the input
                 └─ press the primary action → result
                     └─ Copy result
```

Design commitments:

- Detection **names its reasoning**. "Detected valid JSON" and "Looks like JSON
  (may have errors)" are different messages because they lead to different
  decisions.
- The payload is carried into the tool. Pasting and then having to paste again is
  a failure of the journey.
- Detection is capped and sampled for very large inputs, and falls back to
  "open the formatter" rather than trying to be clever.
- If the recognised tool is a bespoke screen (JWT, certificate, diff),
  `⌘`/Ctrl-click-free navigation hands the text across and the screen opens with
  it in its primary field.

**Cost target:** under three seconds from focus to a formatted result.

### J2 — Return to open work

Open documents survive in the tab strip and as cards on Start. `⌘1…9` jumps to
the nth document, `⌥W` closes the current one, arrow keys step through the strip.
Closing the last document returns to Start rather than leaving an empty shell.

Structure persists across a refresh; **content does not**. Payloads are
session-only by design, and the interface says so where it matters instead of
silently restoring empty editors.

### J3 — Find a tool

Search ranks name-prefix first, then name, then description and keywords, so an
exact name always wins. The palette also returns destinations ("Go to") and
categories, and every result is reachable with `↑ ↓ ⏎` — a palette that needs the
mouse is a menu.

`/library` is the reference view for browsing: one row per tool, grouped by
category, with a filter that matches names, descriptions and keywords.

### J4 — Keep work

Two shapes, both session-scoped and both explicitly labelled:

- **Session** — input, result and options together. Reopening restores the whole
  working state, not just the output.
- **Snippet** — just the result, for reuse in a new task.
- **Example** — a runnable walkthrough (decode → format) rather than a saved
  fragment.

### J5 — Verify safety

The claim "nothing leaves your browser" is stated in the same words in three
places: the Start screen, the topbar badge, and Settings. Settings then gives the
detail — session runs are remembered only on request, secret tools never record,
retention is a number the user controls with an explicit Apply, and one action
deletes everything this device has stored.

---

## 5. Screens

### Start (`/`)

The product's front door is a workbench, not a pitch.

`h1 Start` · one paste field ("Paste data to find a tool") · detected suggestions
· `Continue` (open documents, with close buttons) · `Pinned` · `Recent` ·
`Browse` (nine category cards with counts and sample tools).

Everything is top-aligned and dense. There is no centred hero, because the user
arrived with something to do.

### All Tools (`/library`)

`h1 All Tools` · search input · category filter chips with counts · a live result
count · grouped rows with pin toggles · an empty state that offers to reset the
filters. A pinned filter appears only once something is pinned.

### Tool document (`/{toolId}`)

```
JSON                                     ☆   Save session
Format and inspect structured data
┌──────────────────────────────────────────────────────────────┐
│ [Format] [Minify]  Indent: [2 spaces ▾]            [Options] │
└──────────────────────────────────────────────────────────────┘
┌── Input ──────────────────┐┬── Result ───────────────────────┐
│ editor                    ││ editor                          │
├───────────────────────────┤├─────────────────────────────────┤
│ 1 line · 126 B            ││ ✓ Valid JSON      Copy result   │
└───────────────────────────┘└─────────────────────────────────┘
 up to date · wrapped · JSON · local only
```

- The header carries identity; the action bar carries the verbs.
- Input and result share a single hairline seam so they read as one surface.
- Failure keeps the previous result on screen, explains the cause _with a
  location_ ("line 1, column 8"), and disables Copy until the result is current
  again.
- Above 100KB the editor switches to a bounded preview and says exactly what that
  means: preview truncated, processing and copy still use everything.
- The status bar reports currency (`up to date` / `needs run` / `error`) — not
  input validity, which the result header already states.
- It also names the language being highlighted, so a pane never leaves you
  guessing which grammar you are reading. Each tool highlights what it handles:
  a converter shows one language on the left and another on the right.

### Saved, History, Settings

Same shape, deliberately: `h1`, a short description, then one or more cards of
rows. Switching between the three should feel like moving within one screen.

---

## 6. Keyboard map

| Keys                | Action                                              |
| ------------------- | --------------------------------------------------- |
| `⌘K` / `Ctrl K`     | Open the command palette from anywhere              |
| `/`                 | Open the palette (when not typing in a field)       |
| `↑` `↓`             | Move through palette results                        |
| `⏎`                 | Open the highlighted result                         |
| `Esc`               | Close the palette or the mobile drawer              |
| `⌘B`                | Show or hide the navigator                          |
| `⌘1…9`              | Jump to the nth open document                       |
| `⌥W`                | Close the current document                          |
| `Tab` / `Shift Tab` | Move focus; `Esc` in the navigator filter clears it |
| Middle-click a tab  | Close that document                                 |

Settings lists this map, so the shortcuts are discoverable without documentation.

---

## 7. States

**Empty** — icon, one-line heading, one sentence of guidance, and an action when
one exists. Never a blank panel.

**Loading** — a single fallback for lazy screens and for the moment a document is
being created on direct URL navigation.

**Error** — cause first, then consequence, then what to do. Input problems show a
location where the parser can provide one. The previous successful result is kept
and visible.

**Denied** — when storage or the clipboard is unavailable, the transform still
works and the message says exactly what failed ("Clipboard unavailable. Select
the result and copy it.") instead of failing silently.

**Offline** — local tools keep working from the service worker cache; the
offline indicator appears; network tools still require their endpoint.

---

## 8. Anti-goals

Deliberately not built, so they do not creep in:

- **No tool-first navigation on Start.** The user's data chooses the tool.
- **No accounts, sync, or cloud history.** Local-first is the product, not a mode.
- **No payloads in URLs, logs, or storage beyond the documented list.** Ever.
- **No wizard/multi-step flows.** Each tool is one screen and one run.
- **No auto-save of payloads.** Session-only content is stated, not hidden.
- **No gamification, streaks, or usage nudges** inside the workbench.
