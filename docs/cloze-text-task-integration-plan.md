# Cloze text task integration — implementation plan

**Status:** Agreed baseline (2026-06-03) — product defaults locked in planning chat; **implementation not started** until explicitly requested.  
**Scope:** `screen_type: "cloze"` (`task_type: "ClozeText"`) — strict content contract, **two QA fixture scenes** on **chapter-01 / quest-01**, web UI with **inline gap fields in flowing lines**, play-page attempt flow, catalog validation, answer stripping on snapshots.  
**Out of scope (this pass):** Optional cloze blocks inside `SpecialScreen*` composite UIs, word bank / chips instead of free typing, per-gap LLM feedback, `subtitle` field, segment images.

**Related:** `docs/multiple-choice-task-integration-plan.md`, `docs/matching-task-integration-plan.md`, `docs/quest-scene-content-format.md`, `docs/web-game-ui-architecture.md`, `AGENTS.md`, `.cursor/skills/web-task-type-ui/SKILL.md`.

---

## 1. Goals

| Goal | Notes |
| ---- | ----- |
| Replace `TaskPlaceholder` for `cloze` | Inline inputs inside passage lines below shell `instruction` (`TaskChrome`). |
| Authoring-friendly JSON | Strict Zod + catalog fail-at-load; **two cloze fixture scenes** at the end of **quest-01** (minimal + rich). |
| Readable gap-fill UX | One row per `lines[]` entry; literals + inline gap fields; scroll when copy is long. |
| Clean task-type architecture | Mirror MC / matching / drag-drop: `TaskPanel` dispatch, `lib/game/tasks/cloze/*`, draft sync on `/play`. |
| Server remains authoritative | Scoring via `evaluateCloze`; client **never** reads `correctAnswers` for UX or pre-submit correctness. |

---

## 2. Locked product / tech decisions

| Topic | Decision |
| ----- | -------- |
| **Fixture placement** | **chapter-01 → quest-01** (`Arrivo`), **after** `error_spotting` (scene 13). New files **`scenes/14.json`**, **`15.json`**. Target flow: … → `free_text` (12) → `error_spotting` (13) → **`cloze` ×2** (14–15). |
| **Fixture count & variance** | **Two** scenes (minimal + rich) — same pattern as early MC (04 / 05): few gaps vs many gaps / long copy / `referenceDocument` on rich scene. |
| **Literal segment `kind`** | Authoring uses **`text`**. Zod + normalizer also accept **`literal`** as alias (existing tests). |
| **Gap segment `kind`** | **`gap`** only. Each gap must have **`correctAnswers`** with ≥1 non-empty string at catalog load (authoring integrity; stripped before client). |
| **v1 interaction** | **Free-text inline `<input>`** per gap (shadcn `Input`), embedded in the line flow. No dropdown word bank in v1. |
| **`placeholder` / `maxLength`** | If set on a gap segment, apply to the input (`placeholder` attribute, `maxLength`; clamp max to **256**). |
| **Case matching** | **`caseSensitive: false`** (default) → case-insensitive unless a gap sets `ignoreCase` to `"false"` / `false`. Multiple accepted strings per gap (e.g. `Marco`, `MARCO`). Server `gapInsensitive()` must accept **`ignoreCase` as boolean or string** (fix during implementation — scoring today only parses string reliably). |
| **Copy hierarchy (web)** | `content.title` → play header. `content.instruction` → **`TaskChrome`** (`TASK_PLAY_INSTRUCTION_TEXT`). `content.task.prompt` → **`TaskBodyLayout`** (`TASK_PLAY_PROMPT_TEXT`). Do not merge instruction + prompt. |
| **Multi-step** | **None.** All gaps on one screen. Shell footer: **Indietro** / **Controlla** only. |
| **Pre-submit validation** | On **Controlla**, every gap must have a **non-empty** trimmed value. Inline error under prompt: *Completa tutte le lacune.* **No** client-side answer correctness — server ratio + `SuccessOverlay` / `taskOutcome` on retry. |
| **Scoring feedback** | Partial credit per gap (`ratio = correct / total`). Below `scoring.pizza.minRatioToComplete` → **409** + retry overlay (same as other scored tasks). |
| **Catalog validation** | `parseClozeTextContent` when `screen_type === "cloze"` — **fail catalog load** on invalid payloads. |
| **Snapshot sanitization** | Strip **`correctAnswers`** from every gap segment in `sanitize-task-payload-for-client.ts`. Client normalizer uses **`parseClozeClientContent`** only — never the full server schema in UI. |
| **Legacy catalog scenes** | **Fill with minimal valid `task` payloads** in the same implementation pass: `chapter-02`, `chapter-04`, `chapter-05`, `chapter-06` → `quests/quest-01/scenes/02.json` (each currently `"task": {}`). **Primary QA** remains quest-01 **14–15**. |
| **`content.optional`** | Supported in schema for **SpecialScreen** optional blocks on server (`evaluateOptionalClozeBlock`). **Not** used on standalone cloze scenes in v1. |
| **Fixture copy (14–15)** | **Agent-authored** Italian smoke sentences (short / dialogue-style). No curriculum copy required for v1 — replace when product supplies final text. |
| **Scene 14 scoring** | **`minRatioToComplete: 0.67`** — keeps partial-credit retry path testable (not 100%). |
| **Legacy stub scenes (02–06)** | **Must load catalog:** fill each empty `task: {}` with a **minimal valid** cloze payload in the same pass as Phase 1 (Zod + loader). Stubs are not primary QA; quest-01 **14–15** remain the smoke path. |
| **Input mode (v1)** | **Typing in gaps only** — inline free text per gap. **No** word bank, chips, or dropdown alternatives in v1 or as deferred layout in this pass. |
| **Delivery mode** | Single end-to-end implementation pass (phases 1→3 internally), same as matching / drag-drop rollouts. |

---

## 3. Interaction & layout (web v1)

### 3.1 Segment model

| `segment.kind` | Web v1 |
| -------------- | ------ |
| `text` | Inline `<span>` (wrap-friendly) |
| `literal` | Same as `text` (alias) |
| `gap` | shadcn `<Input>`; **never** read `correctAnswers` in React |
| Other kinds | Ignored |

**Gap order for `answers[]`:** Iterate `lines` in array order; within each line, iterate `segments` left to right; append one answer string per `gap` (matches existing placeholder sketch in `play/page.tsx`).

### 3.2 Validation on Controlla

| Concern | Web v1 |
| ------- | ------ |
| Empty gap | Block submit; *Completa tutte le lacune.* |
| Wrong answer | Server only → retry overlay |
| Optional block (`optional: true`) | **Out of scope** for standalone cloze scenes (server path exists for SpecialScreen) |
| Partial credit | `evaluateCloze` → `ratio`, pizza from `minRatioToComplete` |

### 3.3 Layout sketch

```text
TaskBodyLayout
├── prompt (fixed, TASK_PLAY_PROMPT_TEXT)
├── beforeScroll (validation error only, if any)
└── scroll area [data-task-body-scroll]
    └── ClozeTextTask
        └── for each line in lines[]
            └── div.cloze-line-row (flex flex-wrap items-baseline gap-x-1.5 gap-y-2)
                ├── span.cloze-literal (TASK_PLAY_BODY_TEXT, whitespace-normal)
                └── Input.cloze-gap-inline (inline width ~8–16ch, min tap target 44px height)
```

| Concern | Approach |
| ------- | -------- |
| Long dialogue | Multiple `lines[]` rows; `\n` inside `text` segments allowed |
| Scroll | Only `TaskBodyLayout` children scroll; prompt + instruction fixed |
| Input width | Derived from `maxLength` or sensible default (~12–16ch) |
| Newlines in literals | `white-space: pre-wrap` on literal spans when `text` contains `\n` |

### 3.4 Example authoring payloads

**Minimal (single line, two gaps):**

```jsonc
{
  "prompt": "Completa il testo.",
  "lines": [{
    "segments": [
      { "kind": "text", "text": "Il gatto " },
      { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["mangia"] },
      { "kind": "text", "text": " il topo." }
    ]
  }]
}
```

**Rich (multi-line, many gaps, case-insensitive):**

```jsonc
{
  "prompt": "Completa il dialogo.",
  "caseSensitive": false,
  "lines": [
    {
      "segments": [
        { "kind": "text", "text": "Tu: Ciao, mi chiamo " },
        { "kind": "gap", "placeholder": "…", "maxLength": 24, "correctAnswers": ["Marco", "MARCO"] },
        { "kind": "text", "text": "." }
      ]
    },
    {
      "segments": [
        { "kind": "text", "text": "Compagno: Piacere di conoscerti!" }
      ]
    }
  ]
}
```

---

## 4. Current repository state (audit)

### Already implemented (server / lib)

| Area | Location | State |
| ---- | -------- | ----- |
| Screen type enum | `contentCatalogSchema.ts` | `"cloze"` allowed |
| Zod (permissive) | `lib/game/schemas/clozeTextContentSchema.ts` | Exists; **tighten** in Phase 1 (strict segments, gap refinements) |
| Step validation | `stepContentValidation.ts` | `ClozeText` → `parseClozeTextContent` |
| Scoring | `evaluateTaskAttempt.ts` | `evaluateCloze`, `evaluateOptionalClozeBlock` (SpecialScreen), partial credit |
| Attempt schema | `clozeAttemptSchema` | `{ taskType: "ClozeText", clozeText: { answers: string[] } }` |
| Service mapping | `game-progress-service.ts` | `cloze` → `ClozeText` |
| Tests | `taskScoring.test.ts`, `stepContentValidation.test.ts` | Cloze scoring + minimal payload |

### Not implemented (web UI / catalog / security)

| Area | State |
| ---- | ----- |
| Catalog validation for cloze | **Missing** in `catalog-loader.ts` (unlike MC / matching / drag_drop / free_text) |
| Answer stripping | **Missing** — `sanitize-task-payload-for-client.ts` passes cloze through unchanged → **`correctAnswers` would leak** to the browser |
| Client schema / normalizer | **Missing** (`parseClozeClientContent`, `normalize-cloze-content.ts`) |
| `quest-01/scenes/14–15.json` | **To add** |
| Task renderer | `TaskPanel` → `TaskPlaceholder` |
| Play draft / real attempt | `buildPlaceholderAttempt` duplicates one string into all gaps |
| Format doc §5.2 | No `cloze` subsection in `docs/quest-scene-content-format.md` yet |

### Legacy stub scenes (empty `task` today)

| File | Notes |
| ---- | ----- |
| `chapter-02/quests/quest-01/scenes/02.json` | `screen_type: "cloze"`, `"task": {}` — **Phase 1 must replace** with minimal valid cloze so `loadContentCatalog()` succeeds |
| `chapter-04/quests/quest-01/scenes/02.json` | same |
| `chapter-05/quests/quest-01/scenes/02.json` | same |
| `chapter-06/quests/quest-01/scenes/02.json` | same |

Stub payloads: one line, one gap, minimal `correctAnswers` — enough for Zod/catalog only; not tuned for learner QA.

---

## 5. UI placement (web shell)

```
QuestShell
├── GameShellHeader          ← content.title
├── TaskChrome
│   ├── instruction strip    ← content.instruction
│   ├── TaskPanel            ← ClozeTextTask when screen_type === "cloze"
│   └── Indietro | Controlla
└── overlays (Documento if referenceDocument, Pausa, SuccessOverlay, …)
```

| Layer | Fields | Shown in |
| ----- | ------ | -------- |
| Scene shell | `content.title`, `content.instruction` | Header + `TaskChrome` |
| Exercise body | `content.task.prompt`, `content.task.lines` | `TaskBodyLayout` + `ClozeTextTask` |
| Documento | `content.referenceDocument` (scene level) | Rich fixture scene **15** |

---

## 6. Data contract — `content.task` for `screen_type: "cloze"`

### 6.1 Scene envelope (catalog file)

```jsonc
{
  "id": "chapter-01-quest-01-scene-14",
  "scene_type": "task",
  "screen_type": "cloze",
  "background": "chapters/01/quests/01/bg-task-01",
  "content": {
    "title": "…",
    "instruction": "…",
    "referenceDocument": null,
    "task": { /* §6.2 */ }
  },
  "scoring": {
    "backpack": { "pieces": 1 },
    "pizza": {
      "mode": "scored",
      "maxSlices": 3,
      "minRatioToComplete": 1,
      "mapping": { "kind": "linear" }
    }
  }
}
```

### 6.2 `content.task` body

| Field | Required | Client snapshot | Notes |
| ----- | -------- | --------------- | ----- |
| `prompt` | yes | yes | Shown in `TaskBodyLayout` |
| `lines` | yes (≥1) | yes | Each line renders as one row |
| `lines[].segments` | yes (≥1 per line) | yes | Ordered left → right |
| `caseSensitive` | no | yes | Default: insensitive (`caseSensitive !== true`) |
| `optional` | no | optional strip | SpecialScreen only in v1 |
| `referenceDocument` | no | yes (scene or task) | Prefer **scene-level** like other types |
| `sceneBackgroundAsset` | no | yes | Legacy flat field via `taskContentCommonFields` |
| segment `correctAnswers` | yes per gap (catalog) | **no** | Stripped in sanitizer |
| segment `placeholder` | no | yes | Input placeholder |
| segment `maxLength` | no | yes | Input `maxLength` |
| segment `ignoreCase` | no | yes | Per-gap override (boolean or `"true"` / `"false"`) |

### 6.3 Segment shapes

```jsonc
// Literal (prefer "text")
{ "kind": "text", "text": "Ciao " }

// Gap
{
  "kind": "gap",
  "placeholder": "…",
  "maxLength": 24,
  "ignoreCase": true,
  "correctAnswers": ["mondo", "Mondo"]
}
```

### 6.4 Attempt payload

```json
{
  "taskType": "ClozeText",
  "clozeText": {
    "answers": ["mangia", "mondo"]
  }
}
```

- `answers.length` must equal gap count or server returns **400** `attempt_mismatch`.
- Empty strings are allowed by API but web client blocks submit until all gaps filled.

### 6.5 Client validation (pre-Controlla)

| Condition | Copy (Italian) |
| --------- | -------------- |
| Invalid / unloadable content | *Contenuto dell'attività non valido. Ricarica la pagina o riprova più tardi.* |
| Any gap empty (trimmed) | *Completa tutte le lacune.* |

---

## 7. Example content — quest-01 fixtures (after `free_text`)

### 7.1 Quest flow (target)

| # | File | Scene id | `screen_type` | Role |
| - | ---- | -------- | ------------- | ---- |
| 1–3 | `01–03.json` | … | `info` | Story (unchanged) |
| 4–5 | `04–05.json` | … | `multiple_choice` | MC fixtures (unchanged) |
| 6–8 | `06–08.json` | … | `matching` | Matching fixtures (unchanged) |
| 9–11 | `09–11.json` | … | `drag_drop` | Drag-drop fixtures (unchanged) |
| 12 | `12.json` | … | `free_text` | Freitext fixture (unchanged) |
| 14 | `14.json` | `chapter-01-quest-01-scene-14` | `cloze` | **Minimal cloze** |
| 15 | `15.json` | `chapter-01-quest-01-scene-15` | `cloze` | **Rich cloze** |

### 7.2 Scene profiles (planned)

| File | Gaps | Lines | Copy | Scoring |
| ---- | ---- | ----- | ---- | ------- |
| **13 — minimal** | **2** in **1** line | Short Italian smoke copy (implementation-authored); one short sentence. | `minRatioToComplete: 1` (all gaps required) |
| **14 — rich** | **6+** across **3–4** lines | Longer dialogue-style Italian smoke copy; `referenceDocument`. | `minRatioToComplete: 0.67` (**confirmed**) |

**Manual QA path:** Login → chapter 01 → quest **Arrivo** → advance through 01–13 → **14** (two gaps, single line) → **15** (scroll, many gaps, Documento) → Controlla / retry overlay / pizza.

**Cloze QA checklist:**

- [ ] Literals and gaps align on one row; wrap on narrow viewport.
- [ ] `placeholder` and `maxLength` respected on inputs.
- [ ] Controlla blocked with inline error when any gap empty.
- [ ] Wrong answers → retry overlay (no toast); correct ratio → success overlay.
- [ ] Snapshot / DevTools: gap segments **without** `correctAnswers`.
- [ ] Scene retreat (**Indietro**) preserves draft until scene change; draft resets on scene id change.

---

## 8. Client architecture

### 8.1 Directory layout

```text
components/game/tasks/types/cloze-text/
├── ClozeTextTask.tsx           # TaskBodyLayout + line list
├── ClozeLineRow.tsx            # flex row: literals + inputs
└── ClozeGapInput.tsx           # single gap input (optional split)

lib/game/tasks/cloze/
├── cloze-types.ts              # NormalizedClozeContent, ClozeAnswersDraft
├── normalize-cloze-content.ts
├── cloze-gap-order.ts          # pure: gap count + index map
├── validate-cloze-draft.ts
├── build-cloze-attempt.ts
└── cloze-helpers.test.ts

lib/game/schemas/
├── clozeTextContentSchema.ts   # server / catalog (strict, with correctAnswers)
└── clozeTextClientContentSchema.ts  # snapshot-safe segments
```

### 8.2 Draft state (`/play`)

| State | Type | Notes |
| ----- | ---- | ----- |
| `clozeAnswers` | `string[]` length = gap count | Index `i` ↔ i-th gap in traversal order |
| `clozeValidationError` | `string \| null` | Cleared on edit; set on failed pre-submit |

`syncClozeDraftForScene(scene)` — on snapshot / advance / retreat / attempt response: re-init array to `""` per gap when scene id or gap count changes.

### 8.3 Presentation

| Topic | Choice |
| ----- | ------ |
| Typography | Literals: `TASK_PLAY_BODY_TEXT`; gap inputs: `TASK_PLAY_INLINE_FIELD_TEXT`; instruction stays in `TaskChrome` |
| Gap input | shadcn `Input`, `aria-label` per gap index (*Lacuna 1 di N*) |
| Spacing | Small gap between literal and input (`gap-x-1.5` in row flex) |
| Scroll | `TaskBodyLayout` children only; `fillScroll` if needed for very short prompts |

---

## 9. Play page integration

Same pattern as matching / freetext:

1. Add `clozeAnswers` + `clozeValidationError` state.
2. Extend `syncTaskDraftsForScene` with `syncClozeDraftForScene`.
3. On submit for `screen_type === "cloze"`: normalize → `validateClozeDraft` → `buildClozeAttempt`.
4. Remove cloze branch from `buildPlaceholderAttempt`.
5. Wire `TaskPanel` props: `clozeAnswers`, `onClozeAnswersChange`, `clozeValidationError`.

No `SceneRouter` / **Avanti** changes (single screen).

---

## 10. Schema & catalog (Phase 1)

| Step | Action |
| ---- | ------ |
| 1 | Split **server** vs **client** Zod (`clozeTextClientContentSchema` — no `correctAnswers`). |
| 2 | Refine server schema: every `gap` has ≥1 `correctAnswers`; reject unknown segment kinds if strict mode desired. |
| 3 | `stripClozeAnswers` in `sanitize-task-payload-for-client.ts` + tests. |
| 4 | `catalog-loader.ts`: `parseClozeTextContent(scene.content.task)` when `screen_type === "cloze"`. |
| 5 | Add **`quest-01/scenes/14.json`**, **`15.json`**. |
| 6 | Fill legacy **`chapter-02/04/05/06` … `scenes/02.json`** with minimal valid cloze `task`. |
| 7 | Update `chapter-01-smoke-content.test.ts` (14-scene quest-01 flow; assert cloze on 14–15). |
| 8 | Document `cloze` in `docs/quest-scene-content-format.md` (§5.2). |
| 9 | Fix `gapInsensitive()` to honor **boolean** `ignoreCase` on segments. |

---

## 11. Phased checklist

### Phase 0 — Plan ✅

- [x] Fixtures at **end of quest-01** (14 minimal, 15 rich).
- [x] Inline gap fields, flowing lines, scroll for long copy.
- [x] Pre-Controlla: all gaps required; server partial credit.
- [x] Strip `correctAnswers` on snapshots.

### Phase 1 — Data & fixtures

- [ ] Server + client Zod, sanitizer, catalog validation.
- [ ] Add `scenes/14.json`, `15.json`; fix legacy stub scenes.
- [ ] Smoke tests + quest-scene format doc.

### Phase 2 — UI

- [ ] `normalize-cloze-content.ts` + `ClozeTextTask` / row / gap components.
- [ ] `TaskPanel` dispatch.
- [ ] Manual pass on `/play` fixtures (layout + scroll).

### Phase 3 — Play

- [ ] Draft sync + `buildClozeAttempt` + `validateClozeDraft`.
- [ ] Wire `/play`; remove cloze placeholder attempt.
- [ ] `npm test` + `npm run lint`.

### Phase 4 — Polish (optional)

- [ ] Focus management: Enter moves to next gap.
- [ ] CSS tokens `--cloze-gap-min-width` in `app/globals.css` if contrast/spacing QA needs it.
- [ ] Optional SpecialScreen embedded cloze host (reuse `ClozeTextTask` with `optional` flag) — **only if product schedules composite screens**.

### Later

- [ ] Word bank / chips / dropdown gaps (explicitly **out of v1** — only if product requests a new pass).
- [ ] Per-gap hints after retry (product).

---

## 12. Testing

| Layer | Focus |
| ----- | ----- |
| Catalog / Zod | Quest-01 scenes 14–15 load; invalid cloze fails; legacy stubs load. |
| Sanitizer | `correctAnswers` removed; client parser still succeeds. |
| `cloze-gap-order` | Stable gap index from multi-line payloads. |
| `validate-cloze-draft` / `build-cloze-attempt` | Length match, trim, empty detection. |
| Scoring | Existing `evaluateCloze` tests unchanged. |
| Manual | Full path to 14–15; retry overlay; Documento on 15; no answer keys in network snapshot. |

---

## 13. Code references

| Topic | Path |
| ----- | ---- |
| Server schema | `lib/game/schemas/clozeTextContentSchema.ts` |
| Scoring | `lib/game/scoring/evaluateTaskAttempt.ts` (`evaluateCloze`) |
| Placeholder attempt (remove) | `app/(game)/play/page.tsx` (`buildPlaceholderAttempt`) |
| Smoke tests | `lib/game/content/chapter-01-smoke-content.test.ts` |
| MC / matching pattern | `docs/multiple-choice-task-integration-plan.md`, `docs/matching-task-integration-plan.md` |

---

## 14. Detailed implementation plan

### 14.1 Work order

1. Data: strict schema, sanitizer, catalog-loader, fixtures 14–15 + legacy stubs  
2. Pure helpers + unit tests (`cloze-gap-order`, validate, build attempt)  
3. UI: `ClozeTextTask` + `TaskPanel`  
4. Play-page draft + submit  
5. Docs + smoke tests  
6. Manual QA 01→14  

**Execution mode:** one end-to-end implementation step (single pass), with internal subphases above for sequencing.

### 14.2 Minimal file touch list

- `lib/game/schemas/clozeTextContentSchema.ts`
- `lib/game/schemas/clozeTextClientContentSchema.ts` (new)
- `lib/game/content/sanitize-task-payload-for-client.ts` (+ test)
- `lib/game/content/catalog-loader.ts`
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/14.json` (new)
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/15.json` (new)
- `lib/content/chapters/chapter-02/quests/quest-01/scenes/02.json` (stub fill)
- `lib/content/chapters/chapter-04/quests/quest-01/scenes/02.json` (stub fill)
- `lib/content/chapters/chapter-05/quests/quest-01/scenes/02.json` (stub fill)
- `lib/content/chapters/chapter-06/quests/quest-01/scenes/02.json` (stub fill)
- `lib/game/content/chapter-01-smoke-content.test.ts`
- `lib/game/tasks/cloze/*` (new)
- `components/game/tasks/types/cloze-text/*` (new)
- `components/game/tasks/TaskPanel.tsx`
- `app/(game)/play/page.tsx`
- `lib/game/scoring/evaluateTaskAttempt.ts` (`gapInsensitive` boolean fix)
- `docs/quest-scene-content-format.md`

### 14.3 Security note

Until `stripClozeAnswers` ships, **do not** ship real `correctAnswers` in catalog JSON that players can load in dev — anyone on `/play` could read them from the snapshot. Phase 1 must land sanitizer + client schema **before** or **together with** fixture content.

---

## Changelog

| Date | Change |
| ---- | ------ |
| 2026-06-03 | Initial plan: web gap analysis, locked defaults (quest-01 scenes 14–15, inline gaps, server-only scoring, answer stripping), phased checklist aligned with **web-task-type-ui**. |
| 2026-06-03 | Removed legacy-engine references; web-only interaction spec (§3). |
| 2026-06-03 | Product sign-off: agent-authored fixture copy; scene 14 `minRatioToComplete: 0.67`; legacy stubs must pass catalog load; v1 typing-only (no word bank). |
