# Toolbit Workbench

The local-first developer workspace: 42 tools that process input in the browser, with tabs, saved work, and opt-in history.

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

**Document**:
The versioned per-tool state (`ToolDocumentV1`): tool id, payload, options, timestamps.
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
An opt-in record of one transform execution. Recording is off by default and secret tools never record.

**Secret tool**:
A tool handling credentials or tokens (password, TOTP, JWT, certificate, API builder, WebSocket). Excluded from history and telemetry by default.

**Smart paste**:
Pasting raw data to get a tool suggestion and carrying the pasted text into the opened tool.

### Processing guarantees

**Local-first**:
Input is processed in the browser tab. No backend exists for transforms.

**Offline-capable**:
Keeps working without a connection once installed. True for local tools; network tools still require their endpoints.
_Avoid_: offline (alone — it overpromises for API and WebSocket tools)

**Session-only**:
Held in memory and discarded on refresh. Payloads, toasts, and un-saved runs are session-only by design.
