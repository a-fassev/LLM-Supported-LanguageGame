# Quest scene content format

**Status:** Draft v1 — decisions locked (see §13). Format + sample content only until task payloads and Supabase runs ship.

**Purpose:** Define how chapters, quests, and scenes are stored as JSON on the server (`lib/content/`). The game client renders shell chrome (HUD, pause, documento, Controlla); this spec covers **authored data only**.

**Principles:**

- One **scene** = one screen the player is on until progress advances.
- Strict **order**: chapter → quests → scenes.
- **Server** validates content and applies **scoring**; the client never invents rewards.

---

## 1. Folder layout

```text
lib/content/
└── chapters/
    └── {chapterId}/
        ├── chapter.json
        └── quests/
            └── {questId}/
                ├── quest.json
                └── scenes/
                    ├── 01.json
                    ├── 02.json
                    └── ...
```

| File | Contains |
| ---- | -------- |
| `chapter.json` | Chapter title, order, list of quest ids |
| `quest.json` | Quest title, kind, unlock (`requiresQuestId`) |
| `scenes/NN.json` | One scene (envelope + `content`) |

Scene order is the **numeric prefix** on filenames (`01`, `02`, …). When mapping a raw act to multiple files, keep the **same order** as in `docs/content_raw/` between story (`info`) and task scenes (e.g. exercises before a narrator line that summarizes their result).

---

## 2. Chapter and quest

### `chapter.json`

```jsonc
{
  "id": "chapter-00",
  "title": "Area di prova (team)",
  "order": 0,
  "reference": true,
  "quests": ["quest-01", "quest-02", "quest-01-bonus"],
  "background": "chapters/00/chapter/bg-missions"
}
```

| Field | Description |
| ----- | ----------- |
| `id` | Chapter id (`chapter-NN`). |
| `title` | Hub title. |
| `order` | Sort order on the chapter map (**0-based**, contiguous `0 … n−1` across all chapters). |
| `background` | **Required.** Asset key for the chapter mission list hub (`/chapters/[chapterId]`). Resolved via `resolveAssetUrl` → `public/content-assets/`. |
| `locked` | Optional, default `false`. When `true`, the chapter is **not playable** (hub shows locked; server rejects start, resume, snapshot (in-progress run), advance, attempt, and retreat with API code `chapter_locked`). Use for classroom pilots—change in git and deploy; independent of learner progress. |
| `reference` | Optional, default `false`. When `true`, the chapter is a **team sandbox** (task-type fixtures): always playable when not `locked`, and **does not gate** the next progression chapter. At most one chapter in the catalog may set `reference: true`. |
| `quests` | Ordered quest folder ids for this chapter. |

**Progression chapters** (`chapter-01` …) use `order: 1` and up without `reference`. **Sandbox** lives in `chapter-00` (`order: 0`, `reference: true`) — all task-type smoke fixtures for web development.

### `quest.json`

```jsonc
{
  "id": "quest-01",
  "title": "Il biglietto",
  "order": 1,
  "kind": "main",
  "requiresQuestId": null,
  "background": "chapters/01/quests/01/bg-overview"
}
```

| Field | Description |
| ----- | ----------- |
| `background` | **Required.** Asset key for quest overview art (carried in bootstrap DTOs; chapter hub uses `chapter.background`). |
| `kind` | `main` (required for chapter progress) or `bonus` (extra pizza, optional). |
| `requiresQuestId` | Previous **main** quest in the same chapter (`null` for the first quest in that chapter). For **bonus**, usually the last main quest that must finish before the bonus unlocks on the mission list. |
| `title` | Short Italian hub label. For **`kind: "bonus"`**, prefix with **`Extra: `** (e.g. `Extra: sfida vocabolario`) so learners see it as optional—not a required main mission. Do not rely on the loanword “Bonus” alone. |

Reading text for tasks lives on **each task scene**, not on the quest (see §5.2).

**After a quest completes:** the client returns to **`/chapters/[chapterId]`**; the next mission is chosen from the list when unlocked. There is **no** `autoStartQuestId` / automatic jump into the following quest on `/play`.

**Progression (sequential play):**

- The game is played **in order**: chapters by `chapter.order`, quests by `chapter.json` → `quests`, scenes by filename `01.json`, `02.json`, …
- **Next chapter** unlocks when every **main** quest in the current chapter is complete. Bonus quests are optional and do not block the next chapter.
- Optional **`locked: true`** on a chapter (see table above) manually withholds that chapter until authors remove the flag and deploy.
- Progression otherwise uses catalog order and completed runs only (§12).

---

## 3. Scene envelope

Every scene file uses the same top-level shape:

```jsonc
{
  "id": "chapter-01-quest-01-scene-03",
  "scene_type": "task",
  "screen_type": "multiple_choice",
  "background": "chapters/01/quests/01/bg-task-station",
  "content": { },
  "scoring": { }
}
```

**`id` convention (required):**

```text
{chapterId}-{questId}-scene-{NN}
```

- `chapterId` / `questId` match the parent folder and `chapter.json` / `quest.json` `id` fields (e.g. `chapter-01`, `quest-01`).
- `NN` is two digits, zero-padded, and **must match** the scene filename (`03.json` → `scene-03`).
- Globally unique across the game.

| Field | Required | Description |
| ----- | -------- | ----------- |
| `id` | yes | Stable string per convention above (runs, logging, Supabase). |
| `scene_type` | yes | `story` or `task` — which shell the client uses. |
| `screen_type` | yes | Variant within that shell (§4). |
| `background` | yes | Asset key for the full-screen background image. |
| `content` | yes | Payload for this `screen_type` (§5). |
| `scoring` | task only | Pizza rules (§6). Omit on story scenes. |

**Not in JSON** (built into the client): pause, next/back, task HUD (pizza + backpack), documento button, Controlla.

**Navigation (product):** Player may go **back** to an earlier scene in the quest. Re-opening a completed **task** is allowed for reading only — **no second scoring** or wallet award (§12). Story scenes advance with a single **Avanti** tap (no timer).

---

## 4. Scene types and screen types

### Story (`scene_type: "story"`)

No Controlla, no `scoring`. Player continues with **Avanti**.

| `screen_type` | Player sees | Authored content (v1) |
| ------------- | ----------- | --------------------- |
| `info` | Story text on the scene (rules, hints, setup, character lines). Avatar art, if any, is part of the **background** image — no separate avatar field. | Single `text` only. |

### Task (`scene_type: "task"`)

Exercise with **Controlla** and server-checked answers.

| `screen_type` | Player does |
| ------------- | ----------- |
| `cloze` | Fill gaps in a passage (own type, not multiple choice). |
| `error_spotting` | Find and fix mistakes in a passage. |
| `drag_drop` | Drag items into slots or order. |
| `free_text` | Short Italian answer scored on the server via LLM (`FreitextLlm`). |
| `matching` | Match pairs between two columns. |
| `multiple_choice` | Pick one or more options. |
| `bonus` | **Deprecated** placeholder — use `quest.kind: "bonus"` + `screen_type: "matching"` for bonus exercises. |

Mechanics inside `content.task` are defined per type in a later pass (§5.2).

---

## 5. Content payloads

### 5.1 Story — `info`

```jsonc
{
  "text": "In questa missione impari a salutare qualcuno in italiano."
}
```

| Field | Required | Description |
| ----- | -------- | ----------- |
| `text` | yes | Full copy for the info block. |

---

### 5.2 Task — all `screen_type`s

Shared shell for every task scene:

```jsonc
{
  "title": "Scegli la risposta giusta",
  "instruction": "Leggi la frase e scegli.",
  "referenceDocument": {
    "title": "Il biglietto",
    "body": "Testo lungo per il pulsante documento…"
  },
  "task": {}
}
```

| Field | Required | Description |
| ----- | -------- | ----------- |
| `title` | yes | Task heading in the quest shell (`GameShellHeader`; long titles truncate with ellipsis). |
| `instruction` | no | Scene-level line in **`TaskChrome`** (bold, fixed above the exercise). Not the per-question prompt. |
| `referenceDocument` | no | **Documento** overlay on this scene: optional intro `body`, `sections[]` (profile blocks), and/or `figures[]` (image key + caption). If omitted or invalid, the documento button is hidden. See shape below. |
| `task` | yes | Type-specific exercise data. Shape depends on `screen_type` (see below). Often includes a **`prompt`** for the task body (see layout below). |

#### Web UI — copy hierarchy and layout (all task types)

The web client uses the same shell for every `screen_type`. Implement new task renderers inside this frame; do not add a second instruction strip or a duplicate prompt box.

| Layer | JSON / source | Component | Typography | Scroll |
| ----- | ------------- | --------- | ---------- | ------ |
| Header | `content.title` | `GameShellHeader` | Large title (hub header styles) | — |
| Instruction | `content.instruction` (or legacy `instructions` / `task.instruction`) | `TaskChrome` | `TASK_PLAY_INSTRUCTION_TEXT` (`text-base md:text-lg`, **semibold**), fixed | No |
| Prompt | `content.task.prompt` for flat tasks; per-item `prompt` when the schema defines it (e.g. MC `questions[]`) | `TaskBodyLayout` | `TASK_PLAY_PROMPT_TEXT` (normal weight), fixed | No |
| Meta | — (validation, progress, type hints) | `TaskBodyLayout` `beforeScroll` | `TASK_PLAY_META_TEXT` (`text-sm md:text-base`, muted) | No |
| Exercise | `content.task` (type-specific) | Children of `TaskBodyLayout` | `TASK_PLAY_BODY_TEXT` (e.g. MC option labels) | **Yes** — only this region scrolls when content overflows |
| Actions | — | `TaskChrome` footer | Buttons (`Indietro`, `Controlla`, or MC multi-question `Avanti`) | No |

Helpers in `lib/game/scene-display.ts`:

- `readTaskSceneTitle`, `readTaskSceneInstruction`, `readTaskScenePrompt` — resolve copy from `content` / `content.task`.
- `readTaskChromeInstructions` — instruction for `TaskChrome`; no default placeholder string for `multiple_choice` (prompt-only scenes are OK).

Shared layout: `components/game/tasks/TaskBodyLayout.tsx`. Example for a future task type:

```tsx
<TaskBodyLayout prompt={promptFromContent} beforeScroll={optionalMeta}>
  <YourTaskWidget />
</TaskBodyLayout>
```

`TaskPanel` dispatches by `screen_type`; each type supplies prompt + scrollable body. **Multiple choice** uses per-question `prompt` from `questions[i]` and puts options in the scroll area (see below).

`referenceDocument` shape (intro text and/or structured blocks for documento overlay):

```jsonc
{
  "documentId": "optional-stable-id",
  "title": "string",
  "body": "string", // catalog JSON; alias of bodyText at load
  "sections": [{ "title": "…", "body": "…" }], // e.g. Steckbrief profiles
  "figures": [{ "image": "chapters/02/quests/03/ref-quiz-verdi", "caption": "Giuseppe Verdi" }]
}
```

At least one of: non-empty `body`, non-empty `sections[]`, or non-empty `figures[]`. No HTML in body/sections.

#### `multiple_choice` — `content.task`

Validated at catalog load (`parseMultipleChoiceContent`). Web v1 renders **text-only** options and per-question `prompt`.

**Flat (single question):**

```jsonc
{
  "selectionMode": "single",
  "prompt": "Optional question line in the task panel",
  "options": [
    { "id": "opt-a", "label": "Ciao!" },
    { "id": "opt-b", "label": "Grazie." }
  ],
  "correctOptionIds": ["opt-a"]
}
```

**Multiple questions:**

```jsonc
{
  "questions": [
    {
      "id": "q1",
      "selectionMode": "single",
      "prompt": "…",
      "options": [ /* min 2 */ ],
      "correctOptionIds": ["…"]
    }
  ]
}
```

| Rule | Notes |
| ---- | ----- |
| Options | Min 2 per question; unique `id`; display `label` (legacy `text` accepted). |
| Single-select | Exactly one `correctOptionId`. |
| Multi-select | `selectionMode`: `multi` or `multiple`; set equality on server. |
| Order | `preserveOptionOrder: true` keeps author order; otherwise UI shuffles on display. |
| Scene copy | `title` in header; `instruction` in `TaskChrome`; per-question `prompt` in `TaskBodyLayout`. No `subtitle` in web v1. See **Web UI — copy hierarchy and layout**. |

Fixture scenes in quest-01: `scenes/04.json` (minimal flat), `scenes/05.json` (rich `questions[]`). See also `docs/multiple-choice-task-integration-plan.md`.

#### `matching` — `content.task`

Validated at catalog load (`parseMatchingContent`). Web renders **text-only** cards with tap-to-pair and drag-to-pair (connector lines).

**Pool authoring (bonus vocab):** Author `poolPairs` + `sampleSize` instead of concrete `leftItems` / `rightItems` / `correctPairs`. The server samples `sampleSize` pairs per run, persists them in `player_scene_materializations`, and sends only the sampled set to the client (no full pool, no `correctPairs`). Resume reuses the same sample.

```jsonc
"task": {
  "prompt": "10 parole scelte a caso dal capitolo.",
  "sampleSize": 10,
  "poolPairs": [
    { "id": "v01", "leftLabel": "ciao", "rightLabel": "hello" }
  ],
  "presentation": { "leftLabel": "Italiano", "rightLabel": "Traduzione", "shuffleRightOrder": true }
}
```

Use **`scoring.pizza.mode: "scored"`** on bonus scenes (per-scene `maxSlices`, `minRatioToComplete`, etc.). See `docs/bonus-quest-implementation-plan.md`.

```jsonc
{
  "prompt": "Optional question line in the task body",
  "leftItems": [
    { "id": "left-ciao", "label": "Ciao" }
  ],
  "rightItems": [
    { "id": "right-hello", "label": "Hello" },
    { "id": "right-bye", "label": "Goodbye" }
  ],
  "correctPairs": [
    { "leftItemId": "left-ciao", "rightItemId": "right-hello" }
  ],
  "presentation": {
    "leftLabel": "Italiano",
    "rightLabel": "Traduzione",
    "shuffleRightOrder": true
  }
}
```

| Rule | Notes |
| ---- | ----- |
| Items | Unique `id` per column; display `label` (legacy `text` accepted). |
| Pairs | Each `leftItemId` appears **exactly once** in `correctPairs`; each `rightItemId` at most once. Extra right items are distractors. |
| Order | Left column keeps authoring order; right column shuffles when `shuffleRightOrder !== false` (default shuffle). |
| Scene copy | `title` in header; `instruction` in `TaskChrome`; `prompt` in `TaskBodyLayout`. Do **not** repeat the same meaning in instruction and prompt. Interaction hint (*Trascina una linea o tocca due carte.*) is fixed in `MATCHING_DRAG_HINT` (`lib/game/tasks/matching/matching-types.ts`) → `TaskBodyLayout` `beforeScroll` (`TASK_PLAY_META_TEXT`). |
| Attempt | `{ taskType: "Matching", matching: { pairs: { [leftId]: rightId } } }` — one entry per left item. |

Fixture scenes in quest-01 (after MC): `scenes/06.json` (minimal), `07.json` (medium), `08.json` (rich). See `docs/matching-task-integration-plan.md`.

#### `drag_drop` — `content.task`

Validated at catalog load (`parseDragDropContent`). Web v1 supports **`presentation.targetMode: "blocks"`** only (category bank + drop zones). **`lines`** mode is rejected in the web catalog until server scoring exists.

```jsonc
{
  "prompt": "Dove va ogni parola?",
  "presentation": { "targetMode": "blocks" },
  "shuffleItemOrder": true,
  "requireBankEmpty": false,
  "items": [
    { "id": "item-mela", "label": "mela" }
  ],
  "targets": [
    {
      "id": "cat-frutta",
      "title": "Frutta",
      "matchMode": "one",
      "correctItemIds": ["item-mela"]
    }
  ]
}
```

| Rule | Notes |
| ---- | ----- |
| Items | Unique `id`; display `label` (legacy `text` accepted). |
| Targets | Unique `id`; `correctItemIds` required for catalog/scoring (stripped on client snapshot). |
| `matchMode` | **`one`** (default): scoring — exactly **one** placed tile must be in `correctItemIds` (OR list). UI may show multiple tiles per zone while editing; more than one at Controlla scores that target wrong. **`all`**: every listed id must be in the bucket. |
| Flags | `shuffleItemOrder` (default on). `requireBankEmpty` is **legacy** in JSON (ignored on web; do not block Controlla). |
| Controlla | Web always accepts **partial** layouts (empty zones, cards still in bank). Server `evaluateDragDrop` scores; retry via `taskOutcome` when below `minRatioToComplete`. |
| Presentation | Optional `sourceLabel` / `targetLabel`; defaults in `lib/game/tasks/drag-drop/drag-drop-types.ts`. |
| Scene copy | `instruction` → `TaskChrome`; `prompt` → `TaskBodyLayout`; optional `subtitle` or default drag hint in `beforeScroll`. |
| Attempt | `{ taskType: "DragDrop", dragDrop: { assignments: { [targetId]: string \| string[] } } } }` — arrays for `all` buckets. |

Fixture scenes in quest-01 (after matching): `scenes/09.json` (minimal), `10.json` (medium + `referenceDocument`), `11.json` (bucket `matchMode: "all"`). See `docs/drag-drop-task-integration-plan.md`.

#### `error_spotting` — `content.task`

Validated at catalog load (`parseErrorSpottingContent`). Snapshots strip `isError` and `acceptedCorrections` from each segment; when `expectedErrorRange` is omitted, the sanitizer injects `{ min, max }` from the authored error count for caption display.

```jsonc
{
  "prompt": "Trova l'errore nel testo.",
  "counterCaption": "Nel testo ci sono {count} errori.",
  "expectedErrorRange": { "min": 1, "max": 1 },
  "segments": [
    { "id": "a", "text": "Maria", "isError": false },
    { "id": "b", "text": " vai", "isError": true, "acceptedCorrections": ["va"] },
    { "id": "c", "text": " a scuola ogni giorno.", "isError": false }
  ]
}
```

| Rule | Notes |
| ---- | ----- |
| Segments | Unique non-empty `id`; display `text` inline as tappable chips. |
| Spacing | **No trailing whitespace** on any segment. The **first** segment must not start with whitespace; every **later** segment must start with exactly **one** leading space. **Punctuation** (`. , ! ? ; :`) belongs on the preceding word segment — never as a standalone segment. |
| Errors | `isError: true` requires non-empty `acceptedCorrections[]` (server-only, stripped on snapshot). |
| Range | `expectedErrorRange` optional; when present, `min ≤ errorCount ≤ max`. |
| Scoring | False-positive selections are **ignored** (no instant zero). `ratio = fixedTrueErrors / totalTrueErrors`. |
| Scene copy | `instruction` → `TaskChrome`; `prompt` → `TaskBodyLayout`; error-count hint in `beforeScroll`. Tap segment → inline correction field; **×** or Escape clears mark. |
| Attempt | `{ taskType: "ErrorSpotting", errorSpotting: { selectedSegmentIds: string[], corrections: Record<string, string> } }` |

Fixture scenes: `chapter-03/quest-01/scenes/02.json` (minimal, flat), `chapter-00/quest-01/scenes/13.json` (short, flat) + `scenes/14.json` (long, scored). See `docs/error-spotting-task-integration-plan.md`.

#### `cloze` — `content.task`

Validated at catalog load (`parseClozeTextContent`). Snapshots strip `correctAnswers` from each `gap` segment; the client uses `parseClozeClientContent` only.

```jsonc
{
  "prompt": "Completa il testo.",
  "caseSensitive": false,
  "lines": [
    {
      "segments": [
        { "kind": "text", "text": "Il gatto " },
        { "kind": "gap", "placeholder": "…", "maxLength": 16, "correctAnswers": ["mangia"] },
        { "kind": "text", "text": " il topo." }
      ]
    }
  ]
}
```

| Rule | Notes |
| ---- | ----- |
| Segments | `kind: "text"` (or legacy `"literal"`) for literals; `kind: "gap"` for inputs. |
| Gaps | Each gap needs `correctAnswers[]` with ≥1 non-empty string at catalog load (server-only). |
| Raw A/B (one of two positions) | One **`gap` per line** with the **full correct phrase** in `correctAnswers[]` (e.g. `un solo studente`). Do not author a partial answer plus trailing literal text that repeats the noun; word-order alternates must both be complete phrases. |
| Case | Default insensitive when `caseSensitive` is omitted or `false`; per-gap `ignoreCase` overrides. |
| Scene copy | `instruction` → `TaskChrome`; `prompt` → `TaskBodyLayout`. |
| Controlla | Web requires every gap filled before submit; scoring is partial credit per gap (`evaluateCloze`). |
| UI placeholders | Optional `placeholder` on gap segments is **not** shown in the web UI (authoring/metadata only). |
| Attempt | `{ taskType: "ClozeText", clozeText: { answers: string[] } }` — one entry per gap, line order then left-to-right. |

Fixture scenes: `chapter-00/quest-01/scenes/15.json` (minimal, 2 gaps, long Bologna narrative), `16.json` (rich, ≥6 gaps + `referenceDocument`). Scroll QA aligns with error_spotting `scenes/14.json`. See `docs/cloze-text-task-integration-plan.md`.

#### `free_text` — `content.task`

Validated at catalog load (`parseFreitextLlmStepContent` on merged `content.task` + scene `instruction` + shell `content.referenceDocument` when the task payload has no `referenceDocument`). **Scene completion** uses **`scoring.pizza.minRatioToComplete`** when `pizza.mode` is `scored` ( **`evaluation.passThreshold` is ignored** for the pass/fail bar), and **`evaluation.passThreshold`** when `pizza.mode` is `flat`. **`evaluation.passThreshold`** on scored scenes and **`scoringPolicy`** feed the LLM rubric only — they do **not** gate completion on web. The LLM judge runs when evaluation is not skipped (`GAME_SMOKE_AUTO_PASS` skips all task types including `free_text`). Snapshots strip `task.evaluation` before the browser (see `sanitize-task-payload-for-client.ts`).

```jsonc
{
  "prompt": "Come ti presenteresti a un nuovo compagno?",
  "targetLanguage": "it",
  "showWordCount": true,
  "minWords": 2,
  "maxWords": 40,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "taskFulfillmentWeight": 1,
    "passThreshold": 0.6,
    "registerTarget": "informal",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": ["Use a simple Italian greeting"],
    "targetStructures": ["ciao", "mi chiamo"]
  }
}
```

| Rule | Notes |
| ---- | ----- |
| `prompt` | Required; shown in `TaskBodyLayout`. |
| `evaluation` | Required weights (`grammarWeight`, `vocabularyWeight`, `registerWeight`, optional `taskFulfillmentWeight` default 1) + `passThreshold`. LLM returns four scores; `ratio` is their weighted mean. Stripped from client snapshots. |
| `taskFulfillmentWeight` | Weight for **task fulfillment** (prompt + instruction + `evaluationCriteria` + `targetStructures`). Default **1** when omitted. |
| `pizza.mode` | Prefer **`scored`** with `minRatioToComplete`. **`flat`** still calls the LLM; completion uses **`evaluation.passThreshold`** as the ratio bar (slices use the flat value). |
| Limits | Optional `minWords` / `maxWords`; enforced client + server. |
| Counters | `showWordCount` / `showCharacterCount` toggle stats under the prompt. |
| Scene copy | `instruction` → `TaskChrome`; optional scene-level `referenceDocument` for documento. |
| Attempt | `{ taskType: "FreitextLlm", freitextLlm: { answerText: "…" } }`. |
| Retry UX | Below `minRatioToComplete`: `409` + `taskOutcome` with LLM `summaryFeedback` in overlay body. |

Fixture scenes: quest-01 `scenes/12.json` (minimal smoke), chapter-03 quest-02 `scenes/02.json` (rich + `referenceDocument`). See `docs/freitext-llm-task-integration-plan.md`.

---

## 6. Scoring (pizza + backpack)

**Task scenes only** (story scenes omit `scoring`). The server applies rules **once per first successful completion** of a scene (retries / going back do not re-award — §12).

### Pizza

The server derives a correctness **ratio** (0–1) from the attempt (when task mechanics exist), then maps it through `scoring.pizza`. Authors can mix **flat** and **scored** per scene. Do not rely on service-side auto-pass for unsupported scored task types: use `flat` until evaluator support exists, or the API returns `task_eval_not_implemented`.

### Backpack

Configured **per scene** under `scoring.backpack` (not a global constant).

```jsonc
"scoring": {
  "backpack": { "pieces": 1 }
}
```

| Field | Notes |
| ----- | ----- |
| `pieces` | Non-negative integer added to backpack progress on **first** completion of this scene. Use `0` to skip backpack for a scene. |

**Story scenes:** no `scoring` field (no pizza; backpack only if you add story scoring later — currently omit).

### Flat pizza

Award a fixed number of slices on **first successful completion** (task meets `minRatioToComplete` when using scored task rules; for flat-only tasks, completion on pass).

```jsonc
"scoring": {
  "backpack": { "pieces": 1 },
  "pizza": { "mode": "flat", "slices": 2 }
}
```

### Scored

Map ratio → slices up to `maxSlices`. Combine with **linear** or **bands** mapping, optional completion bar, and rounding.

```jsonc
"scoring": {
  "backpack": { "pieces": 1 },
  "pizza": {
    "mode": "scored",
    "maxSlices": 3,
    "minRatioToComplete": 0.6,
    "rounding": "floor",
    "mapping": { "kind": "linear" }
  }
}
```

| Field | Notes |
| ----- | ----- |
| `maxSlices` | Cap (0–5). |
| `minRatioToComplete` | Minimum ratio to count the scene as completed. Default `1` if omitted. |
| `rounding` | `floor` \| `ceil` \| `nearest` on linear mapping. Default `floor`. |
| `mapping.kind` | `linear` — slices from ratio × `maxSlices`. |
| `mapping.kind` | `bands` — arbitrary steps (full flexibility). |

**Bands example:**

```jsonc
"mapping": {
  "kind": "bands",
  "bands": [
    { "minRatio": 0, "slices": 0 },
    { "minRatio": 0.5, "slices": 1 },
    { "minRatio": 0.8, "slices": 2 },
    { "minRatio": 1, "slices": 3 }
  ]
}
```

Bands may be non-uniform (e.g. reward only perfect answers with 3 slices). Server clamps to `maxSlices`.

**Free text:** ratio comes from LLM evaluation policy (defined with `content.task` later).

---

## 7. Assets

`background` (and future keys inside `content.task`) use **lowercase path-style ids** (e.g. `chapters/01/quests/01/bg-task`).

Files live under **`public/content-assets/`** (see README there). **v1:** placeholders only — no PNGs required yet; UI may use a default fill until art exists.

---

## 8. Validation and runtime

1. Authors commit JSON under `lib/content/`.
2. CI validates envelope + `content` per `screen_type`.
3. APIs load the catalog and return the current scene for an active run.
4. Attempt POST → server scores → slices + scene completion.

---

## 9. Deferred (not in v1 envelope)

Likely needed later; intentionally omitted until product asks for them:

| Topic | Why it might matter |
| ----- | ------------------- |
| `content.task` per `screen_type` | Exercise mechanics (options, gaps, rubric, …). |
| Per-scene story backgrounds | Different `background` keys per story scene if needed (e.g. character art in the image). |
| Per-scene navigation | e.g. disable back on a story beat. |
| Chapter / quest hub art | Tiles on chapter map (may live in `chapter.json` extensions). |
| Audio / TTS keys | Pronunciation or listening tasks. |

---

## 10. Next documentation passes

1. Define `content.task` for each task `screen_type`.
2. Free-text rubric inside `task` for LLM scoring.

---

## 11. Implementation plan (not started)

**Status:** Planned work — **no files under `lib/content/` yet.** Execute in order when the format spec is stable enough to author against.

### 11.1 Planned sample catalog

Create a **mini example** under `lib/content/chapters/` (JSON only; UI comes later):

| Chapter | Main quests | Bonus | Scene files (planned) |
| ------- | ----------- | ----- | --------------------- |
| `chapter-01` Bologna | 2 | 1 | 9 |
| `chapter-02` Firenze | 2 | — | 6 |
| `chapter-03` Roma | 2 | 1 | 9 |

**24** scene files across **8** quests and **3** chapters. Italian placeholder copy; where `content.task` is still minimal, prefer `pizza.mode: "flat"` to keep progression deterministic until per-type evaluator contracts are ready.

**Target tree:**

```text
lib/content/chapters/
├── chapter-01/
│   ├── chapter.json
│   └── quests/
│       ├── quest-01/          # Arrivo — 3 scenes (info → info → multiple_choice)
│       ├── quest-02/          # Alla stazione — 4 scenes (+ matching, bands scoring)
│       └── quest-01-bonus/    # 2 scenes (info → bonus task, flat pizza)
├── chapter-02/
│   ├── chapter.json
│   └── quests/
│       ├── quest-01/          # 3 scenes (drag_drop)
│       └── quest-02/          # 3 scenes (error_spotting, flat pizza)
└── chapter-03/
    ├── chapter.json
    └── quests/
        ├── quest-01/          # 3 scenes (free_text)
        ├── quest-02/          # 4 scenes (matching + multiple_choice, referenceDocument)
        └── quest-01-bonus/    # 2 scenes
```

**Authoring notes for the sample:**

- Quest chains: `requiresQuestId` on each main quest; bonus quests use `kind: "bonus"` + `requiresQuestId` pointing at the last required main quest.
- Vary `scoring` (flat, linear, bands) across a few task scenes.
- Use `referenceDocument` on at least one task per chapter where a reading text fits.
- Do **not** commit hub art or real GameArt assets — background keys only.

### 11.2 Implementation steps

| Step | Area | Work |
| ---- | ---- | ---- |
| **A** | Content | Add the sample tree in §11.1 (`chapter.json`, `quest.json`, `scenes/01.json`, …) per this spec. |
| **B** | Backend | Content loader: read `lib/content/chapters/**`, scene order from numeric filenames, expose catalog on bootstrap / start-quest. |
| **C** | Backend | Zod envelope + per-`screen_type` `content` validation in CI (`npm test`). |
| **D** | Backend | Loader tests + validation only (no quest APIs yet). |
| **E** | Frontend | *Deferred* — chapter / quest UI. |
| **F** | Frontend | *Deferred* — story shell (`info`). |
| **G** | Frontend | *Deferred* — task shell; empty `task` until per-type UI exists. |
| **H** | Content / doc | Fill `content.task` per `screen_type` when task mechanics are specified (§10). |

**Current focus:** **A–C** (sample JSON, loader, Zod). **D–G** and **§12** when you pick up game UI and Supabase.

**Suggested order:** **A → C** first; then UI (**E–G**); then **§12** (persistence); then **H** (task payloads).

---

## 12. Player progress in Supabase (later track)

**Product rule:** After the player **finishes a scene** (story advance or successful task completion), the server **persists** that progress for the logged-in user. The client does not own unlock state, run position, or wallet totals.

### 12.0 Legacy Supabase (Unity era) — do not anchor on it

The project already used Supabase for the **old** implementation (content catalog in Postgres, quest RPCs, run tables tied to `game_*` UUIDs). After the web reset, **game content no longer lives in Supabase**; the remote database may still contain **leftover tables, columns, or empty run rows** from that era.

**Policy for this format:**

- Treat persistence as **greenfield design** aligned with §3–§7 (`sceneId`, string chapter/quest ids, per-scene saves).
- **Do not** keep old shapes just because they exist — rename, replace, or drop tables when a simpler model is clearer.
- **Reuse only when it clearly saves work** and fits the new model (see below).

| Keep (likely) | Reason |
| ------------- | ------ |
| `student_accounts`, `student_sessions` | Auth already wired; unrelated to quest JSON. |
| `player_wallets` | Leaderboard + pizza/backpack totals; bootstrap already reads it. |

| Legacy (safe to ignore or remove) | Notes |
| --------------------------------- | ----- |
| `game_chapters`, `game_quests`, `game_quest_steps` | Dropped from product path; catalog is `lib/content/`. |
| `player_quest_runs`, `player_step_attempts`, `player_step_materializations`, `player_freitext_llm_gates` | Shaped for old step UUIDs and RPCs; **replace or redesign** rather than patch. |
| Postgres RPCs (`advance_quest_cutscene_step`, `complete_quest_step_task`, …) | Removed; logic belongs in Next.js `lib/game/services/*`. |

Repo migration `20260602120000_remove_game_content_catalog.sql` is a **hint** about what was cut, not a contract for the final schema. When you implement §12, prefer **one new migration** (or a controlled reset on dev) that matches this doc — not incremental fixes to every legacy column.

**Split of concerns:**

| Layer | Stores |
| ----- | ------ |
| **`lib/content/`** | Catalog only — chapters, quests, scene JSON. Versioned in git. |
| **Supabase** | Per-account **wallet**, **quest runs**, **per-scene completion** (and task **attempts** where useful). Table names are **your choice** on rebuild. |

Content ids in JSON (`chapter-01`, `quest-01`, `chapter-01-quest-01-scene-03`) are the **stable keys** progress rows should reference.

### 12.1 What to save per scene (target behaviour)

When a scene completes, the server should (in one logical transaction):

1. **Run pointer** — one row per active/completed quest playthrough: `chapter_id`, `quest_id`, `current_scene_id` or order index, `status` (`in_progress` / `completed`).
2. **Scene record** — record that `scene_id` completed for this run (and `account_id`).
3. **Task-only** — optional attempt row on **first** scored completion: payload or hash, ratio, **`awarded_slices`** from `scoring.pizza`.
4. **Wallet** — add pizza slices and **`scoring.backpack.pieces`** from that scene’s JSON (idempotent — no duplicate awards).

**Resume:** **One active run per account** (global). After each scene complete, persist position; on return, resume at the **last saved scene** (or next incomplete).

**Going back:** Player may view an earlier scene. **Do not** re-run scoring or wallet updates for a task scene already marked complete.

Story scenes: complete on **Avanti**; steps 1–2 + wallet backpack if you add `scoring` to story later (v1: story has no `scoring`).

### 12.2 Preparations you can make now (before full game logic)

These align authoring and **code structure** with §11 — **no obligation** to keep legacy Supabase tables:

| Prep | Why |
| ---- | --- |
| **Keep `sceneId` globally unique** in all authored JSON | Natural key for completions and errors. |
| **Author with string slugs** (`chapter-01`, `quest-01`) everywhere | Same ids in run rows; no Postgres content UUIDs. |
| **Sketch the new tables** (names up to you) | e.g. `player_quest_runs` + `player_scene_completions`, or one completions table + run header — pick the smallest model that supports resume + idempotent complete. |
| **One active run per account** | Partial unique index on `(account_id) where status = 'in_progress'` (pattern worth keeping; table can be new). |
| **Completion uniqueness** | Unique `(run_id, scene_id)` so retries do not double-award pizza or backpack. |
| **Repository boundary** | Methods in `game-progress-repository` (or successor): `startRun`, `completeScene`, `getRunSnapshot` — implement when §12 starts; legacy methods can be deleted. |
| **Service owns rules** | Unlock (`requiresQuestId`) and pizza math in `lib/game/services/*` + `lib/game/scoring/*`, not SQL RPCs. |
| **API sketch** (optional) | e.g. advance story scene vs submit task attempt — avoids UI guessing wrong contracts. |

**Reuse from app code (not Supabase schema):** `pizzaReward.ts` / `evaluateTaskAttempt.ts` for scoring behaviour.

**Do not block on:** cleaning every old table in dev, RLS polish, Freitext gate tables, or leaderboard schema until run writes exist.

### 12.3 Implementation steps (persistence track)

| Step | Area | Work |
| ---- | ---- | ---- |
| **P1** | Database | **Greenfield migration** (or dev reset): new run + completion tables using text `chapter_id`, `quest_id`, `scene_id`; drop or ignore legacy `player_*` quest tables if still present. Keep auth + wallet unless you merge wallet elsewhere. |
| **P2** | Backend | `completeScene(runId, sceneId, …)` in `game-progress-service`: validate scene against loaded catalog, idempotent complete, wallet update. |
| **P3** | Backend | Task branch: accept attempt JSON, `evaluateTaskAttempt`, apply `scoring.pizza`, then call `completeScene`. |
| **P4** | Backend | Bootstrap/run APIs: return current scene from run + catalog; expose completed `scene_id`s for unlock UI. |
| **P5** | Frontend | Resume quest from server snapshot only (no local progression source of truth). |

Steps **P1–P5** depend on **§11 A–C** (loader + validation). UI (**E–G**) and **P4–P5** when the client exists.

---

## 13. Locked decisions (team answers)

| # | Topic | Decision |
| - | ----- | -------- |
| 1 | Task types in catalog | All: `cloze`, `error_spotting`, `drag_drop`, `free_text`, `matching`, `multiple_choice`, `bonus`. |
| 2 | Cloze | Own `screen_type`, not MC. |
| 3 | Bonus | `quest.kind: "bonus"` + task `screen_type: "matching"` (pool optional). |
| 4 | Story scenes | Single story `screen_type`: **`info`** only (`content.text`). |
| 5 | Chapter unlock | Strict sequential play; next chapter when current chapter’s **main** quests are done. |
| 6–7 | Quest unlock | `requiresQuestId` gates unlock; bonus unlocks when its required main quest is completed. |
| 8 | Back to earlier task | Allowed; **no re-scoring**. |
| 9 | Backpack | Per scene via `scoring.backpack.pieces`. |
| 10 | Flat pizza | Award on **first successful** scene completion; idempotent persist prevents double pay. |
| 11 | Story advance | Single button (**Avanti**), no timer. |
| 12 | Scene `id` | `{chapterId}-{questId}-scene-{NN}` (§3). |
| 13 | `chapter.json` `quests` | Authoritative quest **order**; loader validates folders exist. Scenes ordered by `NN.json` only. |
| 14 | `schemaVersion` | Not used. |
| 15 | Assets | `public/content-assets/` tree; placeholders until art exists. |
| 16 | Avatar | Optional character art baked into **background** image; no avatar field in JSON. |
| 17 | APIs / UI in format phase | Out of scope until later (**§11 E–G** deferred). |
| 18 | `content.task` bodies | Spec + implementation **later**; `{}` valid for now. |
| 19 | Runs | **One** `in_progress` run per account; resume at last saved scene after each complete. |

---

*Changelog:*

- 2026-06-02 — greenfield rewrite.
- 2026-06-02 — story `info` / `interaction` simplified to `text`; task shell (`title`, `instruction`, `referenceDocument`, `task` placeholder); quest-level document removed; scoring flexibility called out.
- 2026-06-02 — §11 implementation plan (sample catalog + steps A–H); files not created yet.
- 2026-06-02 — §12 Supabase per-scene progress (later track) + preparations; §11 split from persistence.
- 2026-06-02 — §12.0 legacy Supabase policy: greenfield OK, reuse auth/wallet only when sensible.
- 2026-06-02 — §13 locked decisions; `dialogue`; `cloze`; per-scene backpack; id convention; `public/content-assets/`; scope A–C vs UI/Supabase.
- 2026-06-03 — Removed story `screen_type` **`dialogue`**; all story scenes use **`info`** only.
- 2026-06-03 — §5.2 **Web UI — copy hierarchy and layout**: `TaskChrome` instruction + `TaskBodyLayout` prompt + scrollable exercise body for all task types; MC per-question `prompt` unchanged.
