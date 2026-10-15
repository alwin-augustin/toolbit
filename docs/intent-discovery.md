# Intent discovery

How Toolbit stops assuming you know its catalogue. This document is the
implementation plan for intent-first discovery: it defines the capability
model, the resolver pipeline, the surfaces it powers, and the measurement that
tells us whether it works. The code is the authority on detail; this document
is the authority on intent.

## 1. The problem

The sidebar is a navigation system: categories, counts, nested tools, recents.
It works when a user already knows what they need and where it lives. It fails
the user who has a **problem** — "why is my token failing?", "make this JSON
readable", "compare these two configs" — and does not know which of 43 tools
answers it, or that an answer exists at all.

The fix is not a bigger menu. It is three changes of direction:

1. **Search by intent, not by name.** A query describes the task; the result is
   the tool for it.
2. **Meet input where it lands.** Pasted data already gets a suggestion
   (`smart-detect.ts`); it should offer the _set of useful operations_ for that
   data, not one tool.
3. **Reveal tools after success.** When a run succeeds, offer one or two
   meaningful next steps — the moment the user has the most context and the
   least idea what else Toolbit can do.

## 2. Non-goals

- **No backend.** Transforms and intent matching run in the browser tab. That
  is the product promise (`GLOSSARY.md`, "Local-first").
- **No generative model.** The catalogue is finite; discovery is a ranking
  problem, not a generation problem. Nothing may invent capabilities that do
  not exist in `tools.config.ts`.
- **No remote intent API.** A hosted decision API (Jev) was evaluated and
  deliberately left out: it would send user queries off-device and require a
  key-holding proxy. The resolver interface below keeps that door open without
  committing to it.
- **No new catalogue.** The rail, the library screen, and the paste-first Start
  screen stay. The sidebar becomes the complete catalogue (level 3), not the
  only entrance.

## 3. The capability model

`src/content/tool-capabilities.ts` gives every tool a small record:

```ts
interface ToolCapability {
  intents: string[]; // natural phrasings: "make json readable"
  inputTypes: ToolDataType[]; // data families it consumes: json, jwt, sql…
  operations: ToolOperation[]; // verbs it performs: format, validate, convert…
  related: string[]; // ordered handoff edges: json-formatter → json-validator
}
```

- **One record per tool, validated 1:1.** A tool without a capability record
  fails the build-time check in `validateToolRegistry()`; a record without a
  tool fails too. Both vocabularies (`ToolDataType`, `ToolOperation`) are closed
  unions; typos fail `tsc`.
- **`related` is the handoff edge**, ordered by usefulness. It powers Next
  Useful Action and the "related" grouping in the palette. It stays sparse —
  empty is honest where no sensible handoff exists.
- **`intents` is the embedding corpus.** `capabilityCorpusLines(id)` builds the
  deterministic lines embedded into vectors for each tool — name, description,
  intents, keywords — and `capabilityCorpusHash()` fingerprints them so stale
  embedding assets fail a test instead of silently mis-ranking.

`src/core/capability-graph.ts` derives everything read at runtime:
`toolIdsByInputType`, `toolsForOperation`, `nextActionsFor`, task clusters for
the Start screen, and `pasteSuggestionsFor` for paste. No consumer reads the
raw record directly; the graph is the single accessor.

## 4. The resolver pipeline

One seam, four stages, degrade-don't-fail:

```
query text / pasted data
   │
   ├─ 0. detect     typed input → data type → graph suggestions   [always, sync, local]
   ├─ 1. lexical    token scoring across name/aliases/intents/…   [always, sync, local]
   ├─ 2. semantic   local embedding rerank (opt-in model)         [when ready]
   └─ 3. (reserved) remote decision                               [not built]
        ▼
   ranked suggestions — every id from the registry, never generated
```

- `src/core/intent/resolver.ts` defines `IntentResolver` and the suggestion
  shape: `{ toolId, score, reasons, source }`. `reasons` explains _why_ a
  result is shown ("detected a JWT", "matches ‘format json’") — the panel
  renders them; they are not debugging output.
- `lexical.ts` scores fields with weights (name > keyword > intent > type/op),
  tokenizes on non-alphanumerics, and tolerates one-edit typos on tokens of
  four characters or more. Deterministic, synchronous, zero dependencies.
- `detect.ts` wraps `smart-detect.ts`: detectors stay as they are (precision
  first), but their output feeds the graph instead of returning a fixed tool.
- `semantic.ts` (P2) is lazily imported — the bundle never pays for it until
  the user opts in. It reads precomputed per-line vectors from
  `public/embeddings/tool-capabilities.v1.json` (int8, ~450 KB, fetched on
  demand), embeds the query with `mixedbread-ai/mxbai-embed-xsmall-v1` via
  `@huggingface/transformers` (WASM, WebGPU where available), and blends
  cosine similarity into the lexical ranking; a semantic hit can name the
  corpus line it matched, in lexical's own reason vocabulary. Model state is
  exposed (`off | loading | ready | failed`); search never waits for it.
- **Confidence policy:** a confident single result needs a clear top score and
  a margin over the runner-up. Otherwise, show the top 3–5 with their reasons,
  and keep "browse all tools" attached. Detection is a suggestion, never a
  certainty — same rule `smart-detect.ts` already follows.

### Progressive enhancement

| Situation                     | Discovery behaviour                              |
| ----------------------------- | ------------------------------------------------ |
| First visit                   | Instant lexical search + detection               |
| Semantic enabled, model ready | Lexical ranking reranked by embedding similarity |
| WebGPU unavailable            | Lexical + semantic on WASM (slower, still local) |
| Model download failed/offline | Lexical stays; palette says so quietly           |
| Ambiguous request             | Show several plausible tools with reasons        |

## 5. Surfaces

- **Command palette** (`SearchDialog.tsx`, ⌘K — exists). Ranking upgraded to
  intent matching with reason hints and typo tolerance. Name-exact matches must
  still win; the palette is not allowed to get worse for people who know what
  they want.
- **Start screen** (`StartScreen.tsx` — paste-first, exists). Gains
  task-shaped entry clusters derived from the graph (the capability model, not
  a hand-rotated carousel), and paste suggestions expand through the graph
  (`core/intent/detect.ts`): the detector's own answer stays first, its curated
  handoff edges add the useful operations for the data with reasons — JSON →
  format / validate / compare / convert — and every suggestion carries the
  pasted text into the tool it opens.
- **Next Useful Action.** After a successful run, the result chrome offers at
  most **two** follow-ups taken from `related` (`NextActions`), never a wall of
  recommendations. One component serves both architectures: the generic
  workbench renders it under the result panes with the document output as the
  payload; custom screens render it under the screen with the published result
  as the payload. Each action is labelled in the tool's own intent phrasing
  ("validate json against a schema"), hands the payload over through the same
  `openWithPayload` path Smart paste uses, and reports `discovery_handoff`.
  This is the discovery loop: the next tool appears when the user has a reason
  to care.
- **Library and rail.** Unchanged role: the complete catalogue.

Semantic search ships **off by default** behind a Settings toggle ("smarter
search, ~30 MB model, runs on your device"). When off or loading, the palette
shows an optional one-line affordance once — never a blocking download.

## 6. Measurement

Two layers, because telemetry is enum-sanitized and cannot carry query text:

1. **Offline evaluation** — `tests/intent-eval.test.ts` runs a golden set of
   real phrasings (task language, typos, synonyms) through the resolver and
   asserts hit@3 and no-result rate against thresholds. Lexical runs in CI;
   the semantic pass runs via `npm run eval:intent` (needs the model, not CI).
2. **Product telemetry** — new enum-only events, extend `EVENT_NAMES`:
   - `discovery_query` (`discovery_source`, `resolved_by`, `result_count_bucket`)
   - `discovery_suggestion_accepted` (`tool_id`, `discovery_source`, `resolved_by`)
   - `discovery_handoff` (`from_tool_id`, `to_tool_id`) for Next Useful Action

   Never the query text. Privacy rules are unchanged: opt-in analytics, DNT/GPC
   respected, desktop build sends nothing, secret tools excluded.

Success = discovery succeeds for users who don't know tool names: time-to-tool
falls, zero-result queries are rare and specific, and tools outside the top-10
get used.

## 7. Phases

**P0 — Capability model.** `tool-capabilities.ts` (43 records), graph accessors,
corpus hash, validation in `validateToolRegistry()`, unit tests. No UI change.

**P1 — Lexical intent search.** Resolver + reasons + typo tolerance; palette
and Start screen integration; telemetry events; eval harness v1; component
tests and e2e for ⌘K → intent → open.

**P2 — Semantic layer.** Embedding precompute script
(`scripts/generate-tool-embeddings.ts`, run with `npm run embeddings:generate`;
tsx, same model and dtype as runtime), vector asset
(`public/embeddings/tool-capabilities.v1.json`, int8, one vector per corpus
line) + staleness test against `capabilityCorpusHash()`, lazy runtime reranker
(`semantic.ts` + the `useSemanticHits` binding), Settings toggle with model
status, palette affordance, eval v2 (`npm run eval:intent`) — the current
asset lifts both lexical top-spot misses while off-catalogue asks stay
unconfident.

**P3 — Next Useful Action.** Result-chrome strip (`NextActions`, ≤2 actions
from `nextActionsFor`) under the workbench result panes and under custom
screens; multi-suggestion paste flow (`core/intent/detect.ts`) whose graph
expansion and handoffs share one payload path (`openWithPayload`); handoff
telemetry (`discovery_handoff`); component tests, router integration, and e2e
for paste → operation set → handoff and result → next action → handoff.
GLOSSARY gains the user-visible terms (intent search, smarter search, next
useful action, handoff).

Each phase lands green: `npm run check && npm run lint && npm run test:run`,
plus the Playwright suite for P1–P3 surfaces.

## 8. Decisions and risks

- **Search never blocks on AI.** Lexical is the product; embeddings are
  garnish. This keeps the promise that the app works offline from first paint.
- **30 MB is a real cost on mobile.** Hence opt-in, lazy, WASM fallback, and
  the always-on lexical path. The eval harness tells us whether semantic is
  earning its keep before we tune anything.
- **Embedding staleness.** Vectors are build artifacts, not source. The hash
  test fails loudly when metadata changes without regeneration.
- **Reasons are load-bearing.** A suggestion without a reason reads as noise;
  every surfaced suggestion must be able to say why it is there.
