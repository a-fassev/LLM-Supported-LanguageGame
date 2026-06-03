# Freitext LLM — implementation record

**Status:** Implemented on `web-based-implementation` (2026-06-03).  
**Spec:** [freitext-llm-task-integration-plan.md](./freitext-llm-task-integration-plan.md)

## Delivered

- **Fixtures:** `chapter-00/quests/quest-01/scenes/12.json` (minimal smoke + single-figure documento); learner examples in `chapter-02` freetext profession/menù scenes.
- **Server:** `evaluateFreitextLlmScene` + `completeTaskScene` branch. LLM judge scores **grammar, vocabulary, register, task fulfillment** (`taskFulfillmentScore` + `taskFulfillmentWeight`, default weight 1). `GAME_SMOKE_AUTO_PASS` skips the LLM like other task types.
- **UI:** `FreeTextTask`, play draft/submit, loading copy, retry overlay with LLM summary.
- **Tests:** catalog smoke, service mocks, validation/outcome helpers.

## Key paths

| Area | Path |
| ---- | ---- |
| Evaluator | `lib/game/tasks/freitext/evaluate-freitext-llm-scene.ts` |
| UI | `components/game/tasks/types/free-text/FreeTextTask.tsx` |
| LLM | `lib/llm/freitextLlmEvaluationService.ts` |

## Local QA

1. Set `NVIDIA_*` in `.env.local` (see `.env.example`).
2. Optional: `GAME_SMOKE_AUTO_PASS=true` — all task types auto-pass without LLM (local smoke only).
3. Play quest-01 through scene 12 or chapter-03 quest-02 scene 02.

### Checklist (manual, with real keys)

| Case | How to trigger | Expected |
| ---- | -------------- | -------- |
| **503 evaluator** | Remove `NVIDIA_API_KEY` (or eval model) from `.env.local`, restart `npm run dev`, submit freetext | `503`, code `evaluator_unavailable`, blocking toast; no scene completion |
| **504 timeout** | Set `LLM_TASK_TIMEOUT_MS=1`, submit a long answer | `504`, code `MODEL_TIMEOUT`; draft retained |
| **Retry below bar** | Answer below `minRatioToComplete` (scored) or `passThreshold` (flat) | `409` + retry overlay with LLM `body` |
| **Success** | Strong Italian answer on scene 12 | Generic success overlay + pizza/backpack rewards |

Automated coverage: `evaluate-freitext-llm-scene.test.ts` (503 env, 504 abort), `meets-freitext-completion-minimum.test.ts`, `attempt/route.test.ts` (account rate limit).
