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

**Reference implementation:** Multiple choice — `components/game/tasks/types/multiple-choice/`, `lib/game/tasks/multiple-choice/`, quest-01 `scenes/04.json` + `05.json`, `docs/multiple-choice-task-integration-plan.md` (historical detail).

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
| Chrome | `TaskChrome` — scene **instruction** (bold `text-sm`), fixed footer **Indietro** / primary | Primary label logic only if multi-step (see MC: **Avanti** → **Controlla**) |
| Body frame | `TaskBodyLayout` — **prompt** (normal `text-sm`), `beforeScroll` meta, **scrollable** children | Prompt source: `content.task.prompt` or per-item field (e.g. MC `questions[i].prompt`) |
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
- Do not merge instruction + prompt into one block. Same font size; instruction **semibold**, prompt **normal**.

**Client rules:**

- Never use `correctOptionIds` / `correctPairs` / answers in UI logic.
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
- [ ] `npm test` and `npm run lint` pass.
- [ ] `docs/quest-scene-content-format.md` updated if JSON or UI contract changed.

## Deeper reference

- Phase detail and MC file list: [`references/implementation-phases.md`](references/implementation-phases.md)
- Common shell UX pitfalls (scroll, copy, header): [`references/shell-ux-patterns.md`](references/shell-ux-patterns.md)
