---
name: web-task-type-ui
description: >-
  Adds or extends a web quest task type (Next.js): Zod schema, catalog validation,
  scoring, TaskPanel renderer, play-page attempt flow, fixtures. Use when implementing
  cloze, matching, drag-drop, error spotting, a new screen_type, TaskChrome/TaskBodyLayout,
  or mirroring the multiple-choice rollout pattern on web-based-implementation.
---

# Web task-type implementation

Branch: **`web-based-implementation`**. Canonical rules: **`AGENTS.md`**, learner UX: **`.cursor/skills/product/SKILL.md`**. Content shape: **`docs/quest-scene-content-format.md`**.

**Reference implementations** (sandbox **`chapter-00`**, not learner **`chapter-01`**): Multiple choice — `components/game/tasks/types/multiple-choice/`, `lib/game/tasks/multiple-choice/`, `chapter-00/quests/quest-01/scenes/04.json` + `05.json`. Matching — `chapter-00/quests/quest-01/scenes/06.json`–`08.json`. Drag_drop — `chapter-00/quests/quest-01/scenes/09.json`–`11.json`. **Free_text** — `chapter-00/quests/quest-01/scenes/12.json`, `docs/freitext-llm-implementation.md`. **Error_spotting** — chapter-03 quest-01 `scenes/02.json`, `chapter-00/quests/quest-01/scenes/13.json` + `14.json`. **Cloze** — `chapter-00/quests/quest-01/scenes/15.json` + `16.json`, `docs/cloze-text-task-integration-plan.md`. Smoke tests: `lib/game/content/chapter-00-smoke-content.test.ts`.

## Methodology (always)

Follow **`AGENTS.md` → UNDERSTAND → CLARIFY → CODE**:

1. **Understand** — Audit schema, `evaluateTaskAttempt`, `stepContentValidation`, `TaskPanel`, play page, existing content fixtures. Map what exists vs what is needed.
2. **Clarify** — Confirm UX locks (copy hierarchy, submit, multi-step nav, scoring mode) and fixture placement. **No coding until the user confirms** (unless they explicitly ask for a direct fix).
3. **Implement** — Phased PR-sized steps below; run `npm test`, `npm run lint`. No scope creep.

Do **not** edit Cursor plan files unless the user asks. Prefer updating `docs/quest-scene-content-format.md` when contracts change.

## Architecture: shared vs per-type

| Layer | Shared (all tasks) | Per task type |
| ----- | ------------------ | ------------- |
| Scene shell | `QuestShell`, `GameShellHeader`, `SceneRouter` | — |
| Chrome | `TaskChrome` — scene **instruction** (`TASK_PLAY_INSTRUCTION_TEXT`), fixed footer **Indietro** / primary | Primary label logic only if multi-step (see MC: **Avanti** → **Controlla**) |
| Body frame | `TaskBodyLayout` — **prompt** (`TASK_PLAY_PROMPT_TEXT`), `beforeScroll` meta (`TASK_PLAY_META_TEXT`), **scrollable** children | Prompt source: `content.task.prompt` or per-item field (e.g. MC `questions[i].prompt`) |
| Dispatch | `TaskPanel` → `components/game/tasks/types/<kebab-name>/` | `*Task.tsx`, option widgets, local helpers |
| Content | `getTaskPayload(scene)`, `readTaskSceneInstruction`, `readTaskChromeInstructions`, `readTaskScenePrompt` | Zod under `lib/game/schemas/` |
| Catalog | `catalog-loader.ts` fails load on invalid task JSON | `parseYourTaskContent` at load for that `screen_type` |
| Server | `stepContentValidation`, `evaluateTaskAttempt` branch, `game-progress-service` attempt path | Scoring + attempt DTO shape |
| Play | `app/(game)/play/page.tsx` — session, overlays, `sync*DraftForScene` pattern | Draft state, `build*Attempt`, pre-submit validation |
| Tests | Smoke content tests, catalog-loader tests | Co-located `*.test.ts` for pure helpers |

**Copy hierarchy (locked):**

- **`content.title`** → play header (truncate single line).
- **`content.instruction`** → `TaskChrome` only.
- **`content.task.prompt`** (or per-question prompt) → `TaskBodyLayout` only.
- Do not merge instruction + prompt into one block. Typography tokens in `lib/game/task-typography.ts` (body matches `StoryPanel`: `text-base md:text-lg`); instruction **semibold**, prompt **normal**.

## Play-scene typography

Import from **`lib/game/task-typography.ts`** — never hardcode `text-sm` / `text-base` on play task UI.

| Token | Use |
| ----- | --- |
| `TASK_PLAY_BODY_TEXT` | Flowing copy: option labels, cards, chips, cloze literals, freetext textarea, error-spotting flow |
| `TASK_PLAY_INSTRUCTION_TEXT` | `TaskChrome` instruction |
| `TASK_PLAY_PROMPT_TEXT` | `TaskBodyLayout` prompt |
| `TASK_PLAY_ERROR_TEXT` | Content mismatch / broken task state (`role="alert"`) |
| `TASK_PLAY_VALIDATION_ERROR_TEXT` | Pre-submit inline validation (meta size, destructive) |
| `TASK_PLAY_META_TEXT` | Progress, drag hints, captions, char counts — one half-step smaller, muted |
| `TASK_PLAY_SECTION_LABEL_TEXT` | Column headers, drag-drop category titles |
| `TASK_PLAY_INLINE_FIELD_TEXT` | Cloze gap inputs, error-spotting inline corrections only |

**Inline fields:** Use `TASK_PLAY_INLINE_FIELD_TEXT` (`leading-none`), not `TASK_PLAY_BODY_TEXT`. If both appear in `cn()`, tailwind-merge keeps `leading-relaxed` from body text and breaks `items-baseline` rows.

Compose classes with **`cn()`** from `@/lib/utils`. Reference: `StoryPanel.tsx`, `TaskChrome.tsx`, `TaskBodyLayout.tsx`.

**Client rules:**

- Never use `correctOptionIds` / `correctPairs` / answers in UI logic.
- Run snapshots strip answer keys in `game-progress-service` → `sceneToDto` → `sanitize-task-payload-for-client.ts`; normalizers use client parsers after sanitize (`parseMultipleChoiceClientContent`, `parseMatchingClientContent`, `parseDragDropClientContent`, **`parseFreitextClientContent`** — freetext also strips `task.evaluation`; **`parseClozeClientContent`** — cloze strips `correctAnswers` on gaps). **Do not** call `parseFreitextLlmStepContent` or full `parseClozeTextContent` in UI normalizers.
- **Free_text server path:** async `evaluateFreitextLlmScene` in `completeTaskScene` (not `evaluateTaskAttempt`). `GAME_SMOKE_AUTO_PASS` skips LLM like other scored types. Shell `content.referenceDocument` is merged when the task has none (`mergeFreitextSceneContent`; catalog `body` → `bodyText`). The judge prompt must include reference text — not only the parsed payload. **Scored** pizza: `minRatioToComplete` gates completion; `evaluation.passThreshold` is rubric-only. Use `TaskBodyLayout` `fillScroll` + full-height textarea; loading copy while attempt is in flight.
- **Matching pool (bonus):** `resolveCatalogSceneForRun` + `insertSceneMaterializationIfAbsent`; on insert race failure with no DB row, return `null` → `materialization_failed` (never return a new local shuffle). `getSceneMaterialization` uses `GetSceneMaterializationResult` — DB read errors are not “no row”.
- **Pre-Controlla validation:** MC/matching/cloze require a complete draft (inline error under prompt; cloze: *Completa tutte le lacune.*). **Drag-drop:** no completeness gate — always submit; wrong/empty zones fail via server ratio + `SuccessOverlay` retry.
- **Drag-drop `matchMode: "one"`:** UI may stack multiple tiles in one zone while sorting; scoring counts the target correct only when **exactly one** placed tile is in `correctItemIds`. Do not “fix” multi-tile zones back to single-slot replace.
- Post-**Controlla** feedback: `SuccessOverlay` + `taskOutcome`, not toasts for wrong answers.
- API calls via `lib/api-client.ts`; errors via `clientMessages` / `toast-from-api` policy in `AGENTS.md`.

## Implementation phases

Execute in order; complete each phase before the next unless the user splits PRs.

| Phase | Goal | Typical deliverables |
| ----- | ---- | -------------------- |
| **1 — Data** | Invalid content fails at catalog load | Strict Zod, `catalog-loader` branch, 1–2 **fixture scenes** (minimal + rich), update `chapter-*-smoke-content.test.ts` |
| **2 — UI** | Real renderer in quest panel | `TaskPanel` branch, `TaskBodyLayout` + type folder under `components/game/tasks/types/`, shadcn primitives as needed |
| **3 — Play** | Submit works end-to-end | Draft state on `/play`, `build*Attempt`, client validation → inline error, wire `SceneRouter` if multi-step chrome |
| **4 — Docs & tests** | Contract documented | `docs/quest-scene-content-format.md` subsection, Vitest for normalize/validate/attempt builders |

After phase 2, manual pass on `/play` with fixtures. After phase 3, verify scored path + retry overlay.

## Error spotting (`error_spotting`)

**Authoring — segment spacing (catalog-enforced):** Validated in `validate-error-spotting-segment-text.ts` + `errorSpottingContentSchema.ts`. Before shipping fixtures, check:

- [ ] No **trailing** whitespace on any segment (`"Maria "` is invalid).
- [ ] **First** segment has no leading space; **later** segments start with exactly **one** leading space (`"Maria"`, `" vai"`, `" a scuola."`).
- [ ] **Punctuation** is on the word segment, not standalone (`" mattina."` not `"."` as its own segment).
- [ ] Concatenating all `text` values reads naturally (no double space before `.`).

Full spec: `docs/quest-scene-content-format.md` §error_spotting.

**Scoring:** False-positive marks are ignored — do not reintroduce instant `ratio: 0` without product sign-off. Keep coverage in `taskScoring.test.ts`.

**UI (locked):**

- Tap word/phrase chip → inline correction field; unmark via **×** or Escape (no global reset button).
- Field width from `correctionFieldWidth(segmentText)` — based on **original segment text** + chrome for × (not typed length). Body copy uses `TASK_PLAY_BODY_TEXT`; inline input uses `TASK_PLAY_INLINE_FIELD_TEXT`.
- Scroll QA fixtures: consecutive `chapter-00/quest-01/scenes/13.json` (short) + `14.json` (long).
- Inline correction fields: `autoComplete="off"`, neutral `name`, `data-1p-ignore` / `data-lpignore="true"` (see `ErrorSpottingInlineField.tsx`).

## Cloze (`cloze`)

**Server:** `clozeTextContentSchema.ts`, `evaluateCloze` in `evaluateTaskAttempt.ts`, attempt `{ taskType: "ClozeText", clozeText: { answers: string[] } }` (gap order: `lines[]` then segments L→R).

**Play:** `syncClozeDraftForScene`, `buildClozeAttempt`, `validateClozeDraft`; **409 retry** keeps answers by skipping `syncTaskDraftsForScene`. `clozePreserveForTransition` only applies when sync runs with the same scene id (unusual after success because the server advances immediately).

**Fixtures (chapter-00 quest-01):** `scenes/15.json` — minimal (2 gaps, `minRatioToComplete: 1`); `scenes/16.json` — rich (≥6 gaps, `referenceDocument`, `0.67`). Long **Bologna gita** narrative aligned with error_spotting `scenes/14.json` for scroll QA (`joinedText.length > 2000` in smoke test).

**UI (locked):**

- Inline `Input` per gap inside flowing `lines` (`TaskBodyLayout` scroll); literals use `TASK_PLAY_BODY_TEXT`, gap inputs use `TASK_PLAY_INLINE_FIELD_TEXT`, `items-baseline` wrap.
- Do **not** render `placeholder` on gap inputs (`segment.placeholder` in JSON is authoring-only).
- Compact fields: `h-9`, `focus-visible:ring-0`, width from `maxLength` in `ch`.
- Autofill off: `autoComplete="off"`, per-gap `name` like `cloze-{sceneId}-g{index}`, `autoCorrect="off"`, `autoCapitalize="off"`, `data-1p-ignore`, `data-lpignore="true"`.

Full spec: `docs/quest-scene-content-format.md` §cloze.

## Multi-step tasks (optional)

If the type has multiple items per scene (e.g. MC `questions[]`):

- One item visible at a time; selections retained in client draft.
- Reuse **shell** buttons: **Avanti** = next item, last item = **Controlla**; **Indietro** = previous item then scene retreat (`SceneRouter` + `getMcQuestionNavState` pattern in `lib/game/tasks/multiple-choice/mc-question-nav.ts`).
- Do **not** add in-task Precedente/Prossima rows unless product asks.
- Submit validates **all** items; jump to first incomplete; message under **prompt**.

## Checklist before “done”

- [ ] Catalog load fails on bad fixture JSON (CI catches authoring errors).
- [ ] Server evaluator returns sensible ratio; unsupported scored scenes do not silent-pass (see `AGENTS.md`).
- [ ] Instruction / prompt / scroll regions match `TaskBodyLayout` pattern.
- [ ] Scored types: sanitizer + client schema + normalizer updated; snapshot responses omit answer keys.
- [ ] `npm test` and `npm run lint` pass.
- [ ] `docs/quest-scene-content-format.md` updated if JSON or UI contract changed.

## Deeper reference

- Phase detail and MC file list: [`references/implementation-phases.md`](references/implementation-phases.md)
- Common shell UX pitfalls (scroll, copy, header): [`references/shell-ux-patterns.md`](references/shell-ux-patterns.md)
