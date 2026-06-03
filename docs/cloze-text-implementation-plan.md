# Cloze text — implementation checklist

**Source:** [cloze-text-task-integration-plan.md](./cloze-text-task-integration-plan.md)  
**Branch:** `web-based-implementation`

## Status

| Phase | Done when |
| ----- | --------- |
| A — Docs | Implementation doc + integration plan scene **14–15** |
| B — `lib/game/tasks/cloze/` | Helpers + tests |
| C — UI | `ClozeTextTask.tsx` |
| D — Play | Draft sync, submit, `SceneRouter` props |
| E — Fixtures | `scenes/14.json`, `15.json` |
| F — Tests/docs | Sanitizer test, smoke test, quest-scene format § |
| G — Verify | `npm test`, `npm run lint` |

## Fixtures

| File | Scene id | Profile |
| ---- | -------- | ------- |
| `scenes/14.json` | `chapter-01-quest-01-scene-14` | Minimal: 2 gaps, `minRatioToComplete: 1` |
| `scenes/15.json` | `chapter-01-quest-01-scene-15` | Rich: 6+ gaps, `referenceDocument`, `minRatioToComplete: 0.67` |

Scene **13** remains `error_spotting`.

## Already on branch (do not redo)

- `clozeTextContentSchema.ts` (server + client parsers)
- `catalog-loader.ts` cloze validation
- `sanitize-task-payload-for-client.ts` (`stripClozeAnswers`)
- `evaluateCloze` + boolean `ignoreCase` in scoring
- Legacy stub JSON in chapters 02/04/05/06

## Out of scope

Word bank, SpecialScreen cloze UI, per-gap retry hints.
