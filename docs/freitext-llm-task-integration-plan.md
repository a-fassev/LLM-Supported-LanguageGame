# Freitext (LLM) task integration — implementation plan

**Status:** Agreed baseline (2026-06-03) — implementation in progress on `web-based-implementation`.  
**Scope:** `screen_type: "free_text"` — scene JSON contract, catalog validation, web UI (`TaskPanel`), **server-side LLM scoring** wired through the **scene attempt API**, fixtures, tests, docs.  
**Out of scope (this pass):** Separate public evaluate route; evaluation-gate persistence; per-dimension feedback panels in the UI; streaming LLM responses; changing judge system-prompt language beyond existing defaults.

**Related:** `docs/multiple-choice-task-integration-plan.md`, `docs/matching-task-integration-plan.md`, `docs/drag-drop-task-integration-plan.md`, `docs/quest-scene-content-format.md`, `docs/web-game-ui-architecture.md`, `AGENTS.md`, `.cursor/skills/web-task-type-ui/SKILL.md`, `lib/llm/*`.

**Branch:** `web-based-implementation`.

---

## 1. Goals

| Goal | Notes |
| ---- | ----- |
| Replace placeholder for `free_text` | Multiline answer in `TaskBodyLayout`; no dev textarea in `TaskPanel`. |
| Reuse existing LLM stack | `lib/llm/freitextLlmContentSchema.ts`, `freitextLlmEvaluationService.ts`, NVIDIA env from `.env.example`. |
| Authoring-friendly JSON | Strict Zod at catalog load; quest-01 + chapter-03 fixtures. |
| Learner UX | Busy state on **Controlla**, optional word/char stats, client min/max word checks, child-safe feedback tone. |
| Scene-native progression | **One** `POST /api/game/runs/[runId]/attempt` per submit — LLM runs inside `completeTaskScene`. |
| Server remains authoritative | Ratio / pass / pizza from server only; client never pre-scores with LLM output. |

---

## 2. Locked product / tech decisions

### Final decisions (2026-06-03)

- **Quest-01 scene-12:** `minRatioToComplete: 0.7` (retry path testable in QA).
- **Completion gate:** `scoring.pizza.minRatioToComplete` only; `evaluation.passThreshold` is LLM metadata, not a second gate.
- **Retry overlay:** Always `summaryFeedback` (normalized); append `nextStepAdvice` only when present and short.
- **Rate limits:** No freitext-specific stricter cap in v1.
- **Validation copy:** Fixed Italian strings in `lib/game/tasks/freitext/freitext-messages.ts`.
- **Smoke:** `GAME_SMOKE_AUTO_PASS` skips evaluation for **all** task types (including `free_text`), `ratio = 1`.

| Topic | Decision |
| ----- | -------- |
| **Fixture placement (quest-01)** | Add **`scenes/12.json`** — minimal `free_text` **after** drag-drop fixtures **09–11**. Quest-01 flow becomes **12 scenes**: `info` ×3 → `multiple_choice` ×2 → `matching` ×3 → `drag_drop` ×3 → **`free_text` ×1**. |
| **Fixture placement (chapter-03)** | Repair `lib/content/chapters/chapter-03/quests/quest-02/scenes/02.json` (richer copy + `referenceDocument`; `task: {}` today). |
| **Screen vs task type names** | Catalog / DTO: `screen_type: "free_text"`. Attempt + service: `taskType: "FreitextLlm"`. |
| **Copy hierarchy** | `content.title` → header. `content.instruction` → **`TaskChrome`** only. `content.task.prompt` → **`TaskBodyLayout`** only. |
| **Instruction for LLM** | Normalizer passes scene `content.instruction` into parsed payload as `instruction` for the judge. |
| **Reference document** | Scene-level `content.referenceDocument` only; not required in `task` for v1. Quest-01 scene 12: **none** (minimal). Chapter-03 scene 02: **keep** existing documento. |
| **Submit flow** | Single **Controlla** → `POST …/attempt` with `{ sceneId, attempt }`. Server runs LLM inside `completeTaskScene`. |
| **Pass / fail UX (LLM feedback)** | See **§2.1** — retry uses LLM copy in overlay; success keeps generic reward copy. **Locked:** see Final decisions above. |
| **Loading** | Disable textarea + primary button; inline *Sto leggendo il tuo testo…*. |
| **Client validation** | Non-empty answer; `minWords` / `maxWords` (Italian); hard cap **8000** characters. |
| **Word count UI** | Stats row when `showWordCount`, `showCharacterCount`, or min/max words set (*Parole:*, *Caratteri:*). |
| **Catalog validation** | Merged payload validated with `parseFreitextLlmStepContent` — fail catalog load on invalid JSON. |
| **Env missing** | `503` + `evaluator_unavailable` when the LLM path runs (not when `GAME_SMOKE_AUTO_PASS` skips eval). |
| **`GAME_SMOKE_AUTO_PASS`** | Skips eval for **all** scored types including `free_text`; `ratio = 1`. See **§2.2**. |
| **Rate limits** | Existing attempt route limits; optional stricter per-account cap for LLM after load testing. |
| **Sanitizer** | No answer keys to strip; `evaluation` may stay client-visible in v1. |
| **Delivery mode** | Phases 1→3 in order (data → UI → play/server). |

### 2.1 LLM feedback in the UI (UX — locked)

Align with other scored tasks: feedback after **Controlla** goes through **`SuccessOverlay` + `taskOutcome`**, not a second inline essay under the textarea (avoids duplicate messaging and matches MC/matching retry rhythm).

| Outcome | `taskOutcome.headline` | `taskOutcome.body` |
| ------- | ---------------------- | ------------------- |
| **Retry** (`409`, below `minRatioToComplete`) | Generic retry headline from `buildTaskOutcome` (*Quasi!* + percent line) | **`normalizeFeedbackForLearner(summaryFeedback)`** from the judge; if present, append one short line from `nextStepAdvice` (capped, child-safe). Learner edits text and taps **Riprova** — answer draft **retained** on retry. |
| **Success** | Generic success praise from `buildTaskOutcome` (*Bravissimo!* / reward line) | **Do not** replace with LLM summary — keeps the moment reward-focused; avoids long AI text when the child already passed. |
| **Provider / config errors** | — | Toast per `toast-from-api` policy; inline only for client validation (`answer_empty`, word limits). |

**Not in v1:** grammar / vocabulary / register breakdown panels (store in attempt payload server-side if useful later; do not render in UI).

### 2.2 `GAME_SMOKE_AUTO_PASS` (current)

`completeTaskScene` uses `skipEval = (GAME_SMOKE_AUTO_PASS === "true")` for **every** scored task type, including **`free_text`**. When smoke is on: no `evaluateTaskAttempt`, no `evaluateFreitextLlmScene`, `ratio = 1` (then normal pizza completion rules).

**Supersedes:** An earlier plan had a freitext-only exception (always run LLM under smoke). That exception was **removed** so local walkthrough behaves uniformly without NVIDIA keys on freetext scenes.

---

## 3. Current repository state (audit)

### 3.1 Already implemented

| Area | Location | State |
| ---- | -------- | ----- |
| LLM judge + scoring helpers | `lib/llm/freitextLlmEvaluationService.ts` | Ready to call from service |
| Content Zod | `lib/llm/freitextLlmContentSchema.ts` | Ready |
| Env resolver | `lib/llm/freitextLlmEnv.ts` | Returns `null` if NVIDIA vars missing |
| Catalog enum | `contentCatalogSchema` | `free_text` allowed |
| Quest-01 drag-drop chain | `scenes/09.json`–`11.json` | Precedes planned scene **12** |
| Chapter-03 placeholder | `chapter-03/quest-02/scenes/02.json` | Shell OK, `task: {}` |

### 3.2 Not implemented

| Area | State |
| ---- | ----- |
| `catalog-loader` validation for `free_text` | Missing |
| `completeTaskScene` freitext + smoke exception | Missing (`501` today) |
| Web UI + play draft/attempt | Placeholder |
| `scenes/12.json` | **To add** |
| `quest-scene-content-format.md` §`free_text` | “Later” |

### 3.3 Server scoring flow (target)

`evaluateFreitextLlmScene` in `lib/game/tasks/freitext/`:

1. Parse merged content; validate attempt + word limits.  
2. `resolveFreitextLlmEvaluatorEnv()` → 503 if null.  
3. `invokeFreitextLlmJudge` (timeout).  
4. `ratio = weightedSkillRatio(...)`.  
5. `meetsScoredPizzaMinimum(ratio, pizzaRules)` → complete or `409` + `taskOutcome` per §2.1.  

**Not** subject to global smoke skip (§2.2).

---

## 4. Data contract — `content.task` for `screen_type: "free_text"`

### 4.1 Scene shell

Same as other tasks: `title`, optional `instruction`, optional `referenceDocument`, `task`.

### 4.2 `content.task` shape (canonical)

```jsonc
{
  "prompt": "Descrivi cosa ordini al bar usando almeno due frasi.",
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": false,
  "minWords": 2,
  "maxWords": 40,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.65,
    "registerTarget": "informal",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": ["…"],
    "targetStructures": ["vorrei", "per favore"]
  }
}
```

Scene `background` holds the art key (not `sceneBackgroundAsset` inside `task`).

### 4.3 Normalizer

`lib/game/tasks/freitext/normalize-freitext-content.ts` — merge `content.task` + `content.instruction` for parse + UI.

### 4.4 Attempt payload

```jsonc
{
  "taskType": "FreitextLlm",
  "freitextLlm": { "answerText": "…" }
}
```

### 4.5 Fixture — quest-01 `scenes/12.json` (new, minimal)

| Field | Planned value |
| ----- | ------------- |
| `id` | `chapter-01-quest-01-scene-12` |
| `screen_type` | `free_text` |
| `content.title` | Short Italian heading (e.g. saluto / due frasi) |
| `content.instruction` | One line (*Scrivi due frasi in italiano.*) |
| `content.referenceDocument` | omitted |
| `content.task.prompt` | Simple situational prompt (greeting or self-intro) |
| `content.task` | `showWordCount: true`, `minWords: 2`, modest `evaluation` (weights 1/1/1, `passThreshold` ~0.6) |
| `scoring.pizza` | `mode: "scored"`, **`minRatioToComplete: 0.7`** |

Purpose: smoke catalog + manual LLM UX at end of quest-01 without opening chapter 3.

### 4.6 Fixture — repair `chapter-03/quest-02/scenes/02.json`

Keep title, instruction, `referenceDocument`, scoring; fill `task` with prompt + `evaluation` + `minWords: 2`.

---

## 5. UI placement (web shell)

```text
QuestShell → TaskChrome (instruction) → TaskPanel (FreeTextTask) → SuccessOverlay
TaskBodyLayout: prompt | beforeScroll (stats, errors) | scroll: Textarea
```

**No multi-step** — **Indietro** / **Controlla** only.

---

## 6. Server & API

### 6.1 `completeTaskScene` branch

```text
if pizzaRules.kind !== "flat" && !(smokeAutoPass && screen_type !== "free_text"):
  if screen_type === "free_text":
    ratio ← await evaluateFreitextLlmScene(...)   // always when freetext, incl. smoke flag
  else:
    ratio ← evaluateTaskAttempt(...)
```

Build `taskOutcome` with §2.1 freitext body override on retry when judge output exists.

### 6.2 Errors

| Situation | HTTP | UX |
| --------- | ---- | -- |
| `evaluator_unavailable` | 503 | Toast |
| Timeout / provider 5xx / 429 | 504 / 503 / 429 | Toast |
| `answer_*` validation | 400 | Inline |
| Below pizza minimum | 409 | Overlay retry + LLM summary in body |

---

## 7. Phased checklist

### Phase 0 — Plan

- [x] Audit + agreed decisions (§2, §2.1, §2.2).  
- [x] Product input: quest-01 scene 12, UX feedback, smoke LLM exception.

### Phase 1 — Data & catalog

- [ ] `catalog-loader`: validate `free_text`.  
- [ ] `normalize-freitext-content.ts`.  
- [ ] Add `quest-01/scenes/12.json`.  
- [ ] Repair `chapter-03/quest-02/scenes/02.json`.  
- [ ] Update `chapter-01-smoke-content.test.ts` (12-scene flow + scene 12 assertions).  
- [ ] `taskAttemptSchema` + Vitest helpers.  
- [ ] `docs/quest-scene-content-format.md` §`free_text`.

### Phase 2 — UI

- [ ] `FreeTextTask` + `TaskPanel` dispatch.  
- [ ] Stats + Italian validation copy.

### Phase 3 — Play & server

- [ ] Play draft/sync + `buildFreitextAttempt`.  
- [ ] `evaluateFreitextLlmScene` + `completeTaskScene` + **§2.2 smoke exception**.  
- [ ] `taskOutcome` freitext body on retry (§2.1).  
- [ ] Service tests: mock judge; freitext **not** auto-passed when `GAME_SMOKE_AUTO_PASS=true`; other types still auto-pass.  
- [ ] `AGENTS.md` + `.env.example` comments.  
- [ ] Manual QA: quest-01 scene 12 + chapter-03 scene 02 with NVIDIA keys; smoke flag on + off.

### Phase 4 — Polish (defer)

- [ ] Dimension feedback UI; stricter LLM rate limits.

---

## 8. Testing

| Layer | Focus |
| ----- | ----- |
| Catalog | Quest-01: 12 scene types ending in `free_text`; scene 12 + ch.3 scene 02 valid. |
| Smoke service | `GAME_SMOKE_AUTO_PASS=true` → MC/matching still `ratio=1`; **freitext calls mocked judge** and respects fail/pass. |
| Pure | Normalizer, word count, `weightedSkillRatio`. |
| Manual | Loading line; retry overlay shows Italian LLM summary; success overlay generic; 503 without keys even with smoke flag. |

---

## 9. Code references

| Topic | Path |
| ----- | ---- |
| LLM stack | `lib/llm/freitextLlm*.ts` |
| Attempt API | `app/api/game/runs/[runId]/attempt/route.ts` |
| Completion + smoke flag today | `lib/game/services/game-progress-service.ts` |
| Smoke content tests | `lib/game/content/chapter-01-smoke-content.test.ts` |
| New fixture | `lib/content/chapters/chapter-01/quests/quest-01/scenes/12.json` |
| Chapter-03 fixture | `lib/content/chapters/chapter-03/quests/quest-02/scenes/02.json` |

---

## 10. Implementation order

1. Normalizer + catalog validation + fixtures (12 + ch.3).  
2. Async evaluator + smoke exception + service tests.  
3. UI + play wiring + `taskOutcome` copy (§2.1).  
4. Docs (`quest-scene-content-format`, `AGENTS.md`, `.env.example`).  
5. Manual QA with NVIDIA + `GAME_SMOKE_AUTO_PASS` matrix (§8).
