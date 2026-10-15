# Toolbit Workbench

The local-first developer workspace: 43 tools that process input in the browser, with tabs, saved work, and history you can switch off.

## Language

### Workbench

**Tool**:
One of the 42 utilities. Addressed by its `toolId` and routed at `/<toolId>`.
_Avoid_: utility, app, module

**Workbench tool**:
A tool rendered in the generic input→output chrome (mode actions, options, copy/clear, result handoff).
_Avoid_: migrated tool — that name describes project history, not the concept

**Custom screen**:
A bespoke layout for a tool that does not fit the generic chrome. One tool renders as either a workbench tool or a custom screen, never both.
_Avoid_: custom tool, legacy screen

**Published result**:
The result a custom screen hands to the rest of the app (`usePublishedResult`), because a custom screen keeps its output in component state, where nothing outside it can reach it. One ephemeral slot per visible screen, withdrawn when the screen unmounts or has computed nothing yet.

**Saveable result**:
What "Save Result…" would write for the visible tool (`activeSaveableResult`): a workbench tool's document output, or a custom screen's published result.

**Document**:
The versioned per-tool state (`ToolDocumentV1`): tool id, payload, options, timestamps. A custom screen may hold none, in which case its fields fall back to session-only state until a saved item restores a document for it.
_Avoid_: tab state, session data

**Tab**:
The visible chrome entry for an open document. Several tabs may hold documents for the same tool, each independent.

**Workspace**:
The set of open tabs plus the active tab and layout. Persisted without payloads, so structure survives refresh while content stays session-only.

### Saved work and history

**Saved item**:
A named piece of kept work. Its kind is Session, Snippet, or Recipe.
_Avoid_: favorite, bookmark

**Session (saved)**:
A saved item holding a full document: input, result, and options together.

**Snippet**:
A saved item holding only a reusable result.

**Example (saved)**:
A saved item holding a runnable, single-purpose demonstration — currently the decode-then-format webhook walkthrough. Examples run; they are not multi-step pipelines.
_Avoid_: recipe

**History run**:
A record of one transform execution, kept while the History switch is on and expiring on the retention setting. Secret tools never record.

**Secret tool**:
A tool handling credentials or tokens (password, TOTP, JWT, certificate, API builder, WebSocket). Excluded from history and telemetry by default.

**Smart paste**:
Pasting raw data to get tool suggestions and carrying the pasted text into the opened tool. The detector's own answer comes first; the capability graph adds the useful operations for that data (format / validate / compare / convert).

### Discovery

**Intent search**:
The ⌘K palette matching a task phrasing ("make json readable") to tools by meaning, not just by name. Always on, in the browser tab.

**Smarter search**:
The opt-in on-device semantic layer under intent search. Downloads a model once, then reranks locally; when off, loading, or failed, keyword matching carries the palette unchanged.

**Next Useful Action**:
After a successful run, at most two follow-ups from the capability graph (`related`) shown in the result chrome, each carrying the current result into the next tool.
_Avoid_: recommendation, "you might also like"

**Handoff**:
Carrying a payload — a result or a paste — into the next tool's input. Workbench tools open a fresh document seeded with it; custom screens take it through the pending Smart paste channel. Nothing is sent anywhere.

### Processing guarantees

**Local-first**:
Input is processed in the browser tab. No backend exists for transforms.

**Offline-capable**:
Keeps working without a connection once installed. True for local tools; network tools still require their endpoints.
_Avoid_: offline (alone — it overpromises for API and WebSocket tools)

**Session-only**:
Held in memory and discarded on refresh. Payloads, toasts, and un-saved runs are session-only by design.
