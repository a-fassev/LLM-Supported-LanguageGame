# Web task type — phase detail

Expand each phase only as needed for the task at hand. Multiple choice is the template.

## Phase 1 — Data & fixtures

1. **Zod schema** — `lib/game/schemas/<task>ContentSchema.ts`
   - `.strict()` on objects; min lengths for ids/options where applicable.
   - Export `parse*Content` → `{ ok, value } | { ok: false, issues }`.
   - Register in `lib/game/stepContentValidation.ts` for API attempts.

2. **Catalog validation** — `lib/game/content/catalog-loader.ts`
   - When `scene.scene_type === "task"` && `screen_type === "<yours>"`, parse `content.task` and **push load error** on failure (same as MC).

3. **Fixtures** — under `lib/content/chapters/.../scenes/`
   - **Minimal:** short copy, smallest valid payload, flat scoring if smoke-testing.
   - **Rich:** long instruction/prompt, edge layout (many items, multi-step, `referenceDocument` if needed).
   - Do not commit secrets; Italian learner copy per product skill.

4. **Tests** — extend chapter smoke tests: scene order, screen_type, key payload shape (e.g. option count, `questions[]`).

## Phase 2 — UI

1. **`TaskPanel`** — branch on `scene.screen_type`; pass `taskDisabled`, validation props as needed.

2. **`TaskBodyLayout`** (required for all types)
   - Fixed prompt + optional `beforeScroll` (errors, progress, hints).
   - Only **children** scroll (`overflow-y-auto`).
   - Render prop `children={(promptLabelId) => ...}` when the exercise needs `aria-labelledby` (e.g. option lists).

3. **Type module** — `components/game/tasks/types/<name>/`
   - Main `*Task.tsx`: normalize content (`useMemo` on `scene.id`), error state for mismatch.
   - Keep presentation dumb; no scoring.

4. **Styling** — `text-sm` for prompt and primary controls; `text-xs` for secondary hints. Use `components/ui/` shadcn; no one-off panel backgrounds in the task body unless product asks.

5. **Content mismatch** — If draft cannot be built, show `role="alert"` in panel (see `TaskPanel` MC path), not an empty body.

## Phase 3 — Play & API

1. **Draft sync** — On scene change / run load, reset draft (`syncMcDraftForScene` pattern). Use `useMountedRef` after `await` before `setState`.

2. **Submit** — `onSubmitTask` in `app/(game)/play/page.tsx`:
   - Validate draft client-side (UX only); server remains authoritative.
   - `build*Attempt` → `{ taskType: "YourType", yourType: { ... } }` matching `evaluateTaskAttempt` schema.
   - On 409 / `taskOutcome`, open `SuccessOverlay`; do not toast routine mistakes.

3. **SceneRouter** — Only if multi-step or special primary/retreat behavior; extract nav helpers to `lib/game/tasks/<name>/` when non-trivial.

4. **Clamp indices** — If the type uses an item index, clamp when out of range (`clampMcQuestionIndex` pattern).

## Phase 4 — Docs & tests

1. **`docs/quest-scene-content-format.md`** — subsection under task types: fields, v1 scope (e.g. text-only), web UI copy split.

2. **Vitest** — normalize, validate draft, build attempt, scoring edge cases in `lib/game/scoring/`.

3. **Optional** — `docs/<task>-integration-plan.md` only if the user wants a living plan doc (not required for every type).

## MC file map (copy patterns)

| Area | Path |
| ---- | ---- |
| Schema | `lib/game/schemas/multipleChoiceContentSchema.ts` |
| Normalize / draft | `lib/game/tasks/multiple-choice/normalize-mc-content.ts`, `validate-mc-selections.ts`, `build-mc-attempt.ts` |
| UI | `components/game/tasks/types/multiple-choice/*` |
| Shell nav | `lib/game/tasks/multiple-choice/mc-question-nav.ts`, `SceneRouter.tsx` |
| Display | `mc-display-options.ts`, `shuffle-options.ts` |
| Play state | `app/(game)/play/page.tsx` (`mcSelections`, `mcQuestionIndex`, …) |
