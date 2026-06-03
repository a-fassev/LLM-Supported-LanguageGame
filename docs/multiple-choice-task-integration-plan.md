# Multiple Choice task integration — implementation plan

**Status:** Agreed baseline (2026-06-03) — ready for implementation phases.  
**Scope (this pass):** Multiple choice only — data contract, example content in **chapter-01 / quest-01**, web UI in `TaskPanel`, architecture for future task types.  
**Out of scope (later):** Matching, drag-and-drop, freetext/LLM, error spotting, bonus screens, SpecialScreen*, option **images and audio** in UI.

**Related:** `docs/quest-scene-content-format.md`, `docs/web-game-ui-architecture.md`, `AGENTS.md`, `.cursor/skills/product/SKILL.md`.

---

## 1. Goals

| Goal | Notes |
| ---- | ----- |
| Render real MC UI in the quest task area | Below shell `instruction` (`TaskChrome`), inside `TaskPanel` — not a dev textarea. |
| Authoring-friendly JSON | Strict contract; **two MC fixture scenes at the end of quest-01** (minimal + rich) for layout/styling QA. |
| Clean task-type architecture | One dispatcher, one folder per type; shared patterns for attempt building and validation. |
| Server remains authoritative | Scoring and correctness only on server (`evaluateMultipleChoice`); client never uses `correctOptionIds` for UX. |
| Web-native implementation | New React UI and helpers in this repo; no dependency on legacy client code paths. |

---

## 2. Locked product / tech decisions

| Topic | Decision |
| ----- | -------- |
| **Fixture placement** | **chapter-01 → quest-01**, last scenes of the dummy/smoke quest: **scene 04** = minimal MC, **scene 05** = rich MC (new file). Flow: `info` → `info` → `info` → MC minimal → MC rich. |
| **Option label field** | Authoring uses **`label`**. Zod + UI **normalizer** accepts legacy **`text`** as `label ?? text` so old JSON does not break silently. |
| **v1 UI media** | **Text-only** options (`label`). Ignore `assetId` / `imageUrl` / audio in UI until a later phase. |
| **Multi-question UX** | When `questions.length > 1`: **one question per screen** with in-task labels **Precedente / Prossima** and **`1 / N`** progress. Selections are retained when switching questions. |
| **Option order** | **Shuffle** option order on mount when `preserveOptionOrder` is not `true` (omitted or `false`). Set `preserveOptionOrder: true` on a question when authors need stable order (e.g. rich fixture regression). |
| **Copy hierarchy** | Use scene `title` in header + scene `instruction` as the text above the task. **No `subtitle` UI in v1**. Question `prompt` is rendered in the task content area for each question. |
| **Multi-select guidance** | If `selectionMode` is multi, show a small helper line in the task content area: *Seleziona tutte le risposte corrette.* |
| **Submit validation UX** | On `Controlla`, if any question is unanswered: show inline error and jump to the **first unanswered question**. |
| **Catalog validation** | Validate `content.task` with `parseMultipleChoiceContent` when `screen_type === "multiple_choice"` — **fail catalog load** (tests/CI) on invalid MC payloads. |

**Still open (non-blocking):** `screen_type: "bonus"` renderer vs reusing MC chrome — decide when bonus UI is scheduled.

---

## 3. Current repository state (audit)

### Already implemented (server / lib)

| Area | Location | State |
| ---- | -------- | ----- |
| Catalog scene shell | `contentCatalogSchema` | `content.task` is still a generic `Record` until Phase 1 wires MC validation. |
| MC Zod schema | `lib/game/schemas/multipleChoiceContentSchema.ts` | Exists; permissive today — tighten in Phase 1. |
| Scoring | `lib/game/scoring/evaluateTaskAttempt.ts` | `evaluateMultipleChoice` + `mcQuestions()` support flat single question and `questions[]`. |
| Attempt API | `mcAttemptSchema` | `{ taskType: "MultipleChoice", multipleChoice: { selections: string[][] } }`. |
| Minimal fixture (draft) | `quest-01/scenes/04.json` | Flat single question, short copy, `label` on options. |

### Not implemented (web UI)

| Area | Location | State |
| ---- | -------- | ----- |
| Task renderer | `components/game/tasks/TaskPanel.tsx` | Placeholder `<textarea>` for all task types. |
| Rich fixture | `quest-01/scenes/05.json` | **To add** in Phase 1. |
| Play attempt state | `app/(game)/play/page.tsx` | `buildPlaceholderAttempt` auto-picks first MC option — replace with real selections. |

### Smoke tests to update (Phase 1)

`lib/game/content/chapter-01-smoke-content.test.ts` still expects `questions[]` on scene 04 and three scene types ending at one MC. After fixtures land, expect:

- `screen_type` sequence: `info`, `info`, `info`, `multiple_choice`, `multiple_choice`
- Scene 04: flat `options` (minimal)
- Scene 05: `questions[]` with richer copy (rich)

---

## 4. UI placement (web shell)

```
QuestShell
├── GameShellHeader (scene title from content.title)
├── TaskChrome
│   ├── instruction strip  ← content.instruction
│   ├── TaskPanel          ← dispatch by screen_type
│   └── Indietro | Controlla   ← scene retreat / submit (unchanged)
└── overlays (Documento, Pausa, SuccessOverlay, …)
```

| Layer | Fields | Shown in |
| ----- | ------ | -------- |
| Scene shell | `content.title`, `content.instruction` | Header + instruction strip (text above task) |
| Exercise body | `content.task` (`prompt`, `options`) | `TaskPanel` |

**Documento:** Use `content.referenceDocument` at scene level only (rich fixture on scene 05).
**No subtitle in v1:** `subtitle` is not rendered in the web MC UI.

---

## 5. Data contract — `content.task` for `screen_type: "multiple_choice"`

### 5.1 Canonical shapes

**A. Single question (flat)** — scene **04** (minimal):

```jsonc
{
  "selectionMode": "single",
  "prompt": "Short lead-in (optional)",
  "options": [
    { "id": "opt-a", "label": "Ciao!" },
    { "id": "opt-b", "label": "Grazie." }
  ],
  "correctOptionIds": ["opt-a"]
}
```

**B. Multiple questions** — scene **05** (rich):

```jsonc
{
  "questions": [
    {
      "id": "q1",
      "selectionMode": "single",
      "preserveOptionOrder": true,
      "prompt": "Longer situational prompt…",
      "options": [ /* 5–6 labels */ ],
      "correctOptionIds": ["…"]
    },
    {
      "id": "q2",
      "selectionMode": "multi",
      "prompt": "…",
      "options": [ /* … */ ],
      "correctOptionIds": ["id-a", "id-b"]
    }
  ]
}
```

### 5.2 Authoring rules

| Rule | Notes |
| ---- | ----- |
| `options.length >= 2` | Per question. |
| Option `id` unique within question | Used in attempt payload. |
| `correctOptionIds` ⊆ option ids | Validated at catalog load; scoring on server only. |
| Single-select | Exactly one id in `correctOptionIds`; UI uses radio group. |
| Multi-select | Multiple ids; UI uses checkboxes; evaluator uses set equality. |
| Display string | `label` (fallback `text` via normalizer). |
### 5.3 Attempt payload (client → `POST .../attempt`)

```json
{
  "taskType": "MultipleChoice",
  "multipleChoice": {
    "selections": [["opt-ciao"], ["opt-a", "opt-b"]]
  }
}
```

- `selections.length` must equal question count (flat = 1).
- Empty inner array = unanswered → not counted correct.
- **Controlla:** inline error if any question has no selection and auto-jump to first unanswered question (e.g. *Rispondi a tutte le domande prima di controllare.*).

### 5.4 Service mapping

`multiple_choice` → `MultipleChoice` in `game-progress-service` (no change).

---

## 6. Example content — quest-01 fixtures

Both scenes are **dummy/smoke tasks** at the **end** of the first quest so the team can play through story previews, then minimal MC, then rich MC.

| File | Scene id | Role | Content profile |
| ---- | -------- | ---- | ----------------- |
| `scenes/04.json` | `chapter-01-quest-01-scene-04` | **Minimal** | Flat single question; 3 short `label`s; short `title` / `instruction`; no `referenceDocument`; `selectionMode: "single"`. |
| `scenes/05.json` | `chapter-01-quest-01-scene-05` | **Rich** | `questions[]` (2–3 items); long `prompt`; 5–6 options on at least one question; one **multi** question; `content.referenceDocument` with long `body`; mix of shuffled vs `preserveOptionOrder: true`; dummy text content is acceptable for now. |

**Scoring:** `scored` + `minRatioToComplete: 1` on both so Controlla, retry overlay, and pizza behave like production.

**Manual QA path:** Login → chapter 01 → quest **Arrivo** → advance through scenes 01–03 → style scene **04** → advance → style scene **05**.

---

## 7. Client architecture (task types)

### 7.1 Directory layout

```text
components/game/tasks/
├── TaskPanel.tsx
├── TaskPlaceholder.tsx
└── types/
    └── multiple-choice/
        ├── MultipleChoiceTask.tsx
        ├── McQuestionView.tsx
        ├── McOptionList.tsx
        └── McQuestionNav.tsx      # in-task prev/next when N > 1

lib/game/tasks/multiple-choice/
├── normalize-mc-content.ts      # flat → questions[]; label ?? text
├── build-mc-attempt.ts
└── mc-content.types.ts
```

### 7.2 Dispatcher (`TaskPanel`)

```tsx
switch (scene.screen_type) {
  case "multiple_choice":
    return <MultipleChoiceTask scene={scene} draft={draft} onDraftChange={onDraftChange} />;
  default:
    return <TaskPlaceholder screenType={scene.screen_type} />;
}
```

v1: only MC wired; other `screen_type`s keep placeholder until their pass.

### 7.3 State ownership

| State | Owner |
| ----- | ----- |
| Selected option ids per question index | `MultipleChoiceTask` |
| Current question index (if N > 1) | `MultipleChoiceTask` |
| Shuffled option order per question | Derived on mount; honor `preserveOptionOrder` |
| Submit / overlay | `play/page` |

### 7.4 Presentation (web v1)

| Topic | Choice |
| ----- | ------ |
| Single select | shadcn `RadioGroup`, vertical full-width rows |
| Multi select | shadcn `Checkbox` list |
| Multi-question | In-task **Precedente / Prossima** + `1 / N` (see §2) |
| Validation before Controlla | Inline under task area (no toast), jump to first unanswered question |
| Styling | Game tokens in `app/globals.css`; tune against scenes 04 and 05 |

---

## 8. Play page integration

1. Replace `attemptText` with `taskAttemptDraft` (opaque or small union).
2. `SceneRouter` → `TaskPanel` with draft + setter.
3. **Controlla** → `buildMcAttempt(draft)` for MC scenes.
4. Remove MC auto-first-option branch from `buildPlaceholderAttempt`.

Never send `correctOptionIds` from the client.

---

## 9. Schema & catalog (Phase 1)

| Step | Action |
| ---- | ------ |
| 1 | `catalog-loader`: after `parseSceneFile`, if task + `multiple_choice`, `parseMultipleChoiceContent(content.task)`. |
| 2 | Tighten schema: min options, correct ids, single vs multi rules; option transform `label = label ?? text`. |
| 3 | Export `MultipleChoiceTaskContent` for components. |
| 4 | Add `scenes/05.json`; update `chapter-01-smoke-content.test.ts`. |
| 5 | Document MC under `docs/quest-scene-content-format.md` §5.2 (link here). |

---

## 10. Phased checklist

### Phase 0 — Plan ✅

- [x] Fixtures at end of quest-01 (04 minimal, 05 rich).
- [x] Text-only v1 UI.
- [x] Label + `text` fallback; shuffle default; paginated multi-question.
- [x] In-task labels `Precedente / Prossima` to avoid clash with scene `Indietro`.
- [x] No subtitle in v1; scene instruction above task + per-question prompt in task area.
- [x] Multi-select helper text + submit jump to first unanswered question.

### Phase 1 — Data & fixtures

- [ ] Add `scenes/05.json` (rich).
- [ ] Catalog MC validation + tightened Zod.
- [ ] Update smoke tests for five-scene quest-01 flow.
- [ ] Quest-scene format doc MC subsection.

### Phase 2 — MC UI (text-only)

- [ ] `normalize-mc-content` + `build-mc-attempt`.
- [ ] `MultipleChoiceTask` + `TaskPanel` dispatch.
- [ ] Wire `play/page`; inline “answer all” validation.

### Phase 3 — Polish

- [ ] Option card / selected / focus styles on 04 vs 05.
- [ ] Viewport pass (mobile + desktop).

### Phase 4 — Rich media (defer)

- [ ] Stem image/audio; option images via `resolveAssetUrl`.

### Later — other task types

Same pattern: schema → catalog validate → `types/<name>/` → dispatcher → attempt builder.

| `screen_type` | Folder | Evaluator |
| ------------- | ------ | --------- |
| `matching` | `types/matching/` | `evaluateMatching` |
| `drag_drop` | `types/drag-drop/` | `evaluateDragDrop` |
| `cloze` | `types/cloze/` | `evaluateCloze` |
| `error_spotting` | `types/error-spotting/` | `evaluateErrorSpotting` |
| `free_text` | `types/free-text/` | LLM |
| `bonus` | TBD | TBD |

---

## 11. Testing

| Layer | Focus |
| ----- | ----- |
| Catalog / Zod | Quest-01 scenes 04 and 05 load; invalid MC fails with path. |
| Pure helpers | Normalizer, attempt length vs question count, shuffle respects flag. |
| Scoring | Existing `taskScoring.test.ts` unless contract changes. |
| Manual | Scenes 04 → 05: select, Controlla, retry, Documento on 05. |

---

## 12. Code references (this repo)

| Topic | Path |
| ----- | ---- |
| MC schema | `lib/game/schemas/multipleChoiceContentSchema.ts` |
| MC scoring | `lib/game/scoring/evaluateTaskAttempt.ts` |
| Minimal fixture | `lib/content/chapters/chapter-01/quests/quest-01/scenes/04.json` |
| Rich fixture (planned) | `lib/content/chapters/chapter-01/quests/quest-01/scenes/05.json` |
| Placeholder UI | `components/game/tasks/TaskPanel.tsx` |
| Play placeholder attempt | `app/(game)/play/page.tsx` |

---

## 13. Detailed implementation plan (simple + concrete)

This section is the execution plan for the first implementation pass. It is intentionally small and linear.

### 13.1 Work order

1. Data + fixtures
2. UI components + task dispatch
3. Play-page integration (attempt draft + submit mapping)
4. Tests + docs sync
5. Manual QA pass

No parallelization needed for v1.

### 13.2 Task list with clear TODOs

#### Phase 1 — Data + fixtures

- [ ] Create `lib/content/chapters/chapter-01/quests/quest-01/scenes/05.json` (rich MC fixture).
- [ ] Ensure `scenes/04.json` remains the minimal MC fixture (short copy, single question).
- [ ] Update `lib/game/content/chapter-01-smoke-content.test.ts`:
  - expect screen type flow `info, info, info, multiple_choice, multiple_choice`
  - assert scene 04 = flat options
  - assert scene 05 = `questions[]` payload
- [ ] Tighten `lib/game/schemas/multipleChoiceContentSchema.ts`:
  - enforce min 2 options per question
  - enforce unique option ids per question
  - enforce `correctOptionIds` subset of options
  - enforce single-select has exactly 1 correct id
  - keep fallback normalization `label ?? text`
- [ ] Wire catalog-level validation for MC tasks in `lib/game/content/catalog-loader.ts` (fail fast on invalid payload).

**Done criteria (Phase 1):**
- Catalog loads with new scene 05.
- Smoke tests pass with new 5-scene flow.
- Invalid MC payload fails with clear schema errors.

#### Phase 2 — UI components + dispatch

- [ ] Replace textarea placeholder behavior in `components/game/tasks/TaskPanel.tsx` with `screen_type` dispatch.
- [ ] Add MC components under `components/game/tasks/types/multiple-choice/`:
  - `MultipleChoiceTask.tsx` (state container)
  - `McQuestionView.tsx` (prompt + options)
  - `McOptionList.tsx` (radio/checkbox list)
  - `McQuestionNav.tsx` (`Precedente / Prossima` + `1 / N`)
- [ ] Implement text-only rendering:
  - show question `prompt`
  - ignore media fields (asset/image/audio) in v1
- [ ] Multi-select helper line:
  - show `Seleziona tutte le risposte corrette.` when question mode is multi.
- [ ] Fallback behavior:
  - unknown/unsupported task screen types still render `TaskPlaceholder`.

**Done criteria (Phase 2):**
- Scene 04 and 05 render real MC UI (no textarea).
- Multi-question nav works with retained selections.
- Labels are `Precedente / Prossima` (no clash with scene navigation labels).

#### Phase 3 — Play-page integration

- [ ] Replace `attemptText` draft model with MC-compatible task draft in `app/(game)/play/page.tsx`.
- [ ] Add simple helper(s) in `lib/game/tasks/multiple-choice/`:
  - `normalize-mc-content.ts`
  - `build-mc-attempt.ts`
- [ ] Build submit payload exactly as:
  - `{ taskType: "MultipleChoice", multipleChoice: { selections: string[][] } }`
- [ ] Validation before submit:
  - if a question has no selection, show inline error
  - auto-jump to first unanswered question
- [ ] Remove MC auto-first-option placeholder path from `buildPlaceholderAttempt`.

**Done criteria (Phase 3):**
- `Controlla` sends real user selections.
- Unanswered question flow is blocked with inline feedback and focus jump.
- Retry/success overlay behavior remains unchanged.

#### Phase 4 — Docs + tests cleanup

- [ ] Update `docs/quest-scene-content-format.md` with MC task subsection (canonical fields + v1 text-only rule).
- [ ] Add/adjust focused tests for MC normalization/attempt helpers.
- [ ] Keep existing scoring tests unless contract changes require updates.

**Done criteria (Phase 4):**
- Docs match implementation.
- Helper/unit tests pass.
- No regressions in scoring tests.

### 13.3 Minimal file touch list

Expected files for this pass (small and focused):

- `lib/content/chapters/chapter-01/quests/quest-01/scenes/05.json` (new)
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/04.json` (verify only, maybe tiny copy cleanup)
- `lib/game/schemas/multipleChoiceContentSchema.ts`
- `lib/game/content/catalog-loader.ts`
- `lib/game/content/chapter-01-smoke-content.test.ts`
- `components/game/tasks/TaskPanel.tsx`
- `components/game/tasks/types/multiple-choice/*` (new files)
- `app/(game)/play/page.tsx`
- `lib/game/tasks/multiple-choice/*` (new helpers)
- `docs/quest-scene-content-format.md`

### 13.4 Execution notes (keep simple)

- Implement phase-by-phase, commit-sized chunks.
- Do not add media rendering, analytics, or extra abstractions in v1.
- Reuse existing shadcn primitives and existing game styling tokens.
- Keep APIs and server scoring untouched except for stricter input validation.

---

## Changelog

| Date | Change |
| ---- | ------ |
| 2026-06-03 | Initial draft. |
| 2026-06-03 | Locked decisions: quest-01 scenes 04/05 fixtures; text-only v1; label+text fallback; shuffle default; paginated multi-question; catalog strict validation. Removed Unity-centric plan content. |
| 2026-06-03 | Added final UX decisions: in-task labels `Precedente / Prossima`, no subtitle in v1, multi-select guidance copy, and submit behavior (inline error + jump to first unanswered). |
| 2026-06-03 | Added detailed, concrete implementation plan with phase TODOs, done criteria, and minimal file touch list. |
