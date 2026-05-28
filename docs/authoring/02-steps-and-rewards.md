# Steps, content JSON, and rewards

Payload shape matches Unity **`JsonUtility`** parsing unless noted (JSON keys = camelCase fields on DTOs in [`ToolkitStepContentDtos.cs`](../../Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs); Matching schema lives in [`MatchingToolkitStep.cs`](../../Assets/Scripts/Presentation/Steps/MatchingToolkitStep.cs) private nested types).

## Shared: `reward_rules` (`rewardRulesJson`)

Stored per step in DB; surfaced verbatim to Unity.

### Pizza (`reward_rules.pizza`)

Parsed server-side by [`parsePizzaRewardRules`](../../apps/web/lib/game/scoring/pizzaReward.ts):

| `mode` | Meaning | Completion behaviour |
|--------|---------|----------------------|
| `flat` | Fixed slices (`value` or `slices`, clamped 0–5) | RPC credits pizza from **stored rules**; `p_awarded_slices` from API layer does **not** override pizza |
| `scored` | `maxSlices` + optional `minRatioToComplete` + `rounding` + `mapping` (`linear` or `bands`) | Server computes ratio from learner **`attempt`** (or Freitext gate); derives slices via [`slicesFromRatio`](../../apps/web/lib/game/scoring/pizzaReward.ts); must pass [`meetsScoredPizzaMinimum`](../../apps/web/lib/game/scoring/pizzaReward.ts) |

**`minRatioToComplete`:** defaults to **1** when omitted on scored pizza rules. Use **`0`** when learners may complete with partial correctness and receive proportional slices via `mapping` (e.g. `linear` with `maxSlices: 2` → 50% ratio awards 1 slice with `rounding: floor`).

**Partial credit example (narrative chapters):**

```json
{
  "pizza": {
    "mode": "scored",
    "maxSlices": 2,
    "minRatioToComplete": 0.01,
    "rounding": "floor",
    "mapping": { "kind": "linear" }
  },
  "backpack": { "mode": "first_completion", "value": 1 }
}
```

**Task attempt requirement:** Scored pizza on normal tasks requires `POST .../steps/:stepId/complete` body **`attempt`** matching [`taskAttemptSchema`](../../apps/web/lib/game/scoring/evaluateTaskAttempt.ts). Helpers: [`requiresTaskAttemptPayload`](../../apps/web/lib/game/scoring/pizzaReward.ts).

### Backpack (`reward_rules.backpack`)

Implemented in Postgres **`complete_quest_step_task`** (see migration [`20260530120000_pizza_scored_completion_and_gate_award.sql`](../../supabase/migrations/20260530120000_pizza_scored_completion_and_gate_award.sql)):

- Uses **`logical_task_key`** on the step (fallback: step UUID string).
- Typical authoring pattern from seeds: `"backpack": { "mode": "first_completion", "value": 1 }` — credits backpack pieces **at most once per account per logical task key** (repeat completions mint **0** extra backpack).

### Authoring pitfalls

- **`task_type` without server scorer + scored pizza:** completion fails (`attempt_invalid` / `unsupported_task`). Use **`flat`** pizza or implement routing + scoring first (matrix in [01-game-configuration.md](01-game-configuration.md)).
- **FreitextLlm:** scored pizza flows through **`evaluate`** + **evaluation gate token**, not through generic `evaluateTaskAttempt`; see below.

---

## Cutscene (`step_kind: cutscene`, `isTask: false`)

DTO: **`CutsceneContentDto`** ([`ToolkitStepContentDtos.cs`](../../Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs)). Validated by [`cutsceneContentSchema.ts`](../../apps/web/lib/game/schemas/cutsceneContentSchema.ts) (strict; unknown keys rejected).

### Root

| Field | Required | Notes |
|-------|----------|--------|
| `beats` | yes (min 1) | Ordered narrative beats; one-beat cutscene = single narrator line |
| `npcCast` | no | `{ id, displayName, portraitId?, side? }` for `speakerId` on beats |
| `navigation` | no | `{ blockBack?, primaryCtaLabel? }` cutscene-level shell defaults |

**Unity layout (avatar beats):**

| `presentationMode` | Layout | Portraits |
| ------------------ | ------ | --------- |
| `innerMonologue` | Player avatar **left** (~25%), thought bubble **right** (~75%) | Player only — **not** in JSON; client loads `Resources/UI/CutscenePortraits/Player/current` (equipped avatar hook later) |
| `npcDialog` | Speech bubble **left** (~75%), NPC avatar **right** (~25%) | `npcCast[].portraitId` → `Resources/UI/CutscenePortraits/Npc/{portraitId}` (Sprite/Texture2D); missing asset → USS placeholder |
| `narrator`, `gameInfo` | Unchanged centered / info panels | No portrait slots |

`npcCast.side` remains in schema for backward compatibility but **does not affect layout** in Unity (NPC is always on the right); it may later drive sprite facing only. `portraitId` must be alphanumeric plus `_` / `-` (invalid ids fall back to placeholder).

### Per beat

| Field | Required | Notes |
|-------|----------|--------|
| `presentationMode` | yes | `narrator` \| `npcDialog` \| `innerMonologue` \| `gameInfo` |
| `body` | yes | Plain text |
| `title`, `subtitle` | no | Optional headline lines |
| `speakerId` | yes when `npcDialog` | Must reference `npcCast[].id` when `npcCast` is non-empty |
| `autoAdvanceMs` | no | Positive ms; shell auto-advances beat (tap still works) |
| `primaryCtaLabel` | no | Overrides shell CTA for this beat (default **Weiter**) |

Example:

```json
{
  "npcCast": [{ "id": "ricci", "displayName": "Prof.ssa Ricci", "portraitId": "ricci", "side": "right" }],
  "beats": [
    { "presentationMode": "narrator", "body": "Du betrittst das Klassenzimmer." },
    { "presentationMode": "npcDialog", "speakerId": "ricci", "body": "Guten Morgen!" }
  ],
  "navigation": { "blockBack": false }
}
```

Rewards: cutscene advance uses empty `{}` `reward_rules` in seeds; RPC awards no pizza/backpack.

---

## Quest meta (`game_quests.meta_payload` → API `metaJson`)

Validated leniently on read via [`questMetaPayloadSchema.ts`](../../apps/web/lib/game/schemas/questMetaPayloadSchema.ts). Unity: [`QuestMetaPayloadDto`](../../Assets/Scripts/Application/QuestMetaPayloadDto.cs).

| Field | Notes |
|-------|--------|
| `referenceDocument` | `{ documentId?, title, bodyText, buttonLabel? }` — quest shell **Broschüre ansehen** modal on all steps |
| `flow.blockBack` | When true, hide **leave quest** in the pause menu (no chapter exit) |
| `flow.autoStartQuestSlug` | After quest finish, client starts this quest slug if unlocked (else quest overview) |

---

## Special Screen (`task_type` in SpecialScreen\* family)

Single composite step; **`blocks`** executed in order. DTO: **`SpecialScreenContentDto`**.

### Chrome selection

Match **`task_type`** and optional **`screenVariant`** (see XML doc comments on [`SpecialScreenContentDto`](../../Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs)). Rough mapping:

| `task_type` | Intended chrome |
|-------------|-----------------|
| `SpecialScreenSms` | `smsChrome` (chat + embedded mechanic bubbles) |
| `SpecialScreenMailEditor` | `mailChrome` |
| `SpecialScreenPhotoViewer` | `photoViewerChrome` |
| `SpecialScreenReader` | `readerChrome` |
| `SpecialScreen` | Generic / variant-driven |

**SMS embedding:** `smsChrome.messages[].hostsEmbeddedMechanic` + **`embeddedMechanicBlockIndex`** must reference the correct **`blocks`** index. JsonUtility defaults missing ints to **0** — always set this field explicitly when embedding anything other than block `0`.

### Block types (`blocks[].blockType`)

| Block `blockType` values | Nested payload | Server scoring ([`evaluateSpecialScreen`](../../apps/web/lib/game/scoring/evaluateTaskAttempt.ts)) |
|--------------------------|----------------|----------------------------------|
| `stub` | `stub` | Ignored for scoring |
| `cloze_text` / `ClozeText` | `clozeText` | Uses cloze evaluator |
| `error_spotting` / `ErrorSpotting` | `errorSpotting` | Uses error-spotting evaluator |
| Other | — | **HTTP 502** `unsupported_special_screen_block` |

**Stub-only screens:** ratio **1** (complete) but **`pizzaRatio` 0** so scored pizza mints **no** slices.

**Attempt shape:** `attempt.specialScreen.blocks[]` aligns by index with content `blocks[]`; each non-stub scorable block requires matching inner attempt (`taskType` discriminated union in [`evaluateTaskAttempt.ts`](../../apps/web/lib/game/scoring/evaluateTaskAttempt.ts)).

---

## Task: ClozeText

DTO **`ClozeTextContentDto`**: `prompt`, `caseSensitive`, `lines[]` → `segments[]`.

Segment **`kind`**:

- **`text`** — renders `text` as label (plain).
- **`gap`** — input field; **`correctAnswers`** required for authoring; optional per-gap `ignoreCase` overrides root case logic.

Server gaps: kinds normalized to **`gap`** in scoring ([`clozeGapSpecs`](../../apps/web/lib/game/scoring/evaluateTaskAttempt.ts)).

---

## Task: MultipleChoice

DTO **`MultipleChoiceContentDto`**.

- **`stem[]`:** blocks with `kind` **`text`**, **`image`**, or **`audio`** (`StemBlockDto`).
- Either legacy flat **`options`** + **`correctOptionIds`** **or** **`questions[]`** each with its own stem/options/correctOptionIds.
- **`selectionMode`:** enforced client-side for UX (server validates selected ids vs correct sets).

---

## Task: DragDrop

DTO **`DragDropContentDto`**.

- **`items[]`**, **`targets[]`** (`correctItemIds` per target), optional **`presentation`**, **`shuffleItemOrder`**, **`requireBankEmpty`**.
- **`lines[]`.`segments[]`:** inline layout — **`text`** segments vs **`slot`** segments (`targetId` ties to drop zone).

---

## Task: Matching

Schema in **`MatchingToolkitStep`** (same JSON keys as typical authoring):

| Field | Purpose |
|-------|---------|
| `prompt`, `subtitle` | Copy |
| `leftItems[]`, `rightItems[]` | `{ id, label?, imageUrl? }` — each side needs label and/or allowed `imageUrl` |
| `correctPairs[]` | `{ leftItemId, rightItemId }` — each left appears exactly once; each right at most once |
| `presentation` | `leftLabel`, `rightLabel`, `shuffleRightOrder` |

---

## Task: ErrorSpotting

DTO **`ErrorSpottingContentDto`**: `prompt`, `instruction`, optional `counterCaption`, **`expectedErrorRange`** (`min`/`max`), **`segments[]`**.

Segment: `id`, `text`, **`isError`**, **`acceptedCorrections`** (case-insensitive compare after whitespace normalize — client validates interactively).

---

## Task: FreitextLlm

DTO **`FreitextLlmContentDto`** + nested **`evaluation`** (`FreitextLlmEvaluationPayloadDto`): weights, **`passThreshold`**, **`registerTarget`**, `scoringPolicy`, `maxPoints`, optional `evaluationCriteria`, `targetStructures`.

Flow ([`game-progress-service.ts`](../../apps/web/lib/game/services/game-progress-service.ts)):

1. **`POST /api/game/runs/:runId/steps/:stepId/evaluate`** with answer text — server scores LLM, applies **`passThreshold`** **and** scored pizza **`minRatioToComplete`** when issuing gate.
2. **`POST .../complete`** with **`evaluationGateToken`** — redeems stored pizza slices for scored pizza; rejects missing/stale tokens.

Word bounds: `minWords` / `maxWords` enforced server-side on evaluate.

**Flat pizza:** gate awards **0** slices at evaluate; RPC still handles completion per rules.

---

## Task: FreeText / RelativeClause / unknown types

Rendered as **stub** UI ([`ToolkitStepFactory`](../../Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs)). Treat content JSON as **unsupported** until a real step ships.

---

## Text formatting (plain text vs structured)

| Mechanism | Behaviour |
|-----------|-----------|
| Cutscene `body` / subtitle | Plain label text; JSON string escapes only |
| Cloze / DragDrop inline `text` segments | Plain labels |
| MultipleChoice stem blocks | Plain text / media URLs (no rich markup in `text`) |
| SpecialScreen `readerChrome.bodyText` | Documented in DTO as **newlines preserved** |
| Freitext learner answer | Plain textarea |

There is **no** shared Markdown renderer across steps — do not assume `**bold**` works unless a specific step documents it.

---

## API references (Unity client)

- Complete task: [`GameProgressApiClient.CompleteStepTask`](../../Assets/Scripts/Application/GameProgressApiClient.cs)
- Freitext evaluate: **`EvaluateFreitextLlmStep`** → `/evaluate`
