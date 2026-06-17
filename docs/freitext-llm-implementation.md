# Freitext LLM — implementation record

**Status:** Implemented on `web-based-implementation` (2026-06-03). OpenAI migration 2026-06-13.  
**Spec:** [freitext-llm-task-integration-plan.md](./freitext-llm-task-integration-plan.md)

## Delivered

- **Fixtures:** `chapter-00/quests/quest-01/scenes/12.json` (minimal smoke + single-figure documento); learner examples in `chapter-02` freetext profession/menù scenes.
- **Server:** `evaluateFreitextLlmScene` + `completeTaskScene` branch. LLM judge scores **grammar, vocabulary, register, task fulfillment** (`taskFulfillmentScore` + `taskFulfillmentWeight`, default weight 1). `GAME_SMOKE_AUTO_PASS` skips the LLM like other task types.
- **Provider:** OpenAI via `@langchain/openai` (`ChatOpenAI`), single `OPENAI_API_KEY`. Default model: `gpt-5.4-nano-2026-03-17`.
- **UI:** `FreeTextTask`, play draft/submit, loading copy, success overlay with LLM summary in body + review section.
- **Tests:** catalog smoke, service mocks, validation/outcome helpers.

## Key paths

| Area | Path |
| ---- | ---- |
| Evaluator | `lib/game/tasks/freitext/evaluate-freitext-llm-scene.ts` |
| UI | `components/game/tasks/types/free-text/FreeTextTask.tsx` |
| LLM judge | `lib/llm/freitextLlmEvaluationService.ts` |
| Env | `lib/llm/freitextLlmEnv.ts` |

## Local QA

1. Set `OPENAI_API_KEY` in `.env.local` (see `.env.example`).
2. Optional: `GAME_SMOKE_AUTO_PASS=true` — all task types auto-pass without LLM (local smoke only).
3. Play quest-01 through scene 12 or chapter-02 freetext scenes.

### Checklist (manual, with real keys)

| Case | How to trigger | Expected |
| ---- | -------------- | -------- |
| **503 evaluator** | Remove `OPENAI_API_KEY` from `.env.local`, restart `npm run dev`, submit freetext | `503`, code `evaluator_unavailable`, blocking toast; no scene completion |
| **504 timeout** | Set `LLM_TASK_TIMEOUT_MS=1`, submit a long answer | `504`, code `MODEL_TIMEOUT`; draft retained |
| **429 rate limit** | Burst many freetext submits until OpenAI returns 429 | `RATE_LIMITED`; learner can retry **Controlla** |
| **Low ratio** | Weak answer on scored freetext | `200` success overlay with partial pizza; LLM summary in `taskOutcome.body` |
| **Success** | Strong Italian answer on scene 12 | Generic success overlay + pizza/backpack rewards |

Automated coverage: `evaluate-freitext-llm-scene.test.ts` (503 env, 504 abort), `attempt/route.test.ts` (account rate limit).

## Azure App Service configuration

Set these as **Application settings** on `enigma-di-bologna` (or GitHub Actions secrets if injected at deploy time). Never commit keys.

| Setting | Notes |
| ------- | ----- |
| `OPENAI_API_KEY` | Required |
| `OPENAI_EVAL_MODEL` | Default `gpt-5.4-nano-2026-03-17` if omitted |
| `LLM_TASK_TIMEOUT_MS` | Optional — default `45000` |
| `LLM_TASK_MAX_RETRIES` | Optional — LangChain SDK retries; default `2` |

**Migration from Gemini (2026-06):** Remove `GEMINI_API_KEY_*` and `GEMINI_EVAL_MODEL` from App Service settings. Add `OPENAI_API_KEY` (and optional `OPENAI_EVAL_MODEL`), then restart the web app before or immediately after deploying this build — otherwise freetext scenes return `evaluator_unavailable`.

After changing settings, restart the web app. Verify in logs that freetext attempts complete without `evaluator_unavailable`.
