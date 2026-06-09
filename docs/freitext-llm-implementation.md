# Freitext LLM — implementation record

**Status:** Implemented on `web-based-implementation` (2026-06-03). Gemini migration 2026-06-08.  
**Spec:** [freitext-llm-task-integration-plan.md](./freitext-llm-task-integration-plan.md)

## Delivered

- **Fixtures:** `chapter-00/quests/quest-01/scenes/12.json` (minimal smoke + single-figure documento); learner examples in `chapter-02` freetext profession/menù scenes.
- **Server:** `evaluateFreitextLlmScene` + `completeTaskScene` branch. LLM judge scores **grammar, vocabulary, register, task fulfillment** (`taskFulfillmentScore` + `taskFulfillmentWeight`, default weight 1). `GAME_SMOKE_AUTO_PASS` skips the LLM like other task types.
- **Provider:** Google AI Studio **Gemini** via `@langchain/google` (`ChatGoogle`), with optional **key pool** (`GEMINI_API_KEY_1` … `_4`) and 429 failover in `lib/llm/gemini-api-key-pool.ts`.
- **UI:** `FreeTextTask`, play draft/submit, loading copy, retry overlay with LLM summary.
- **Tests:** catalog smoke, service mocks, validation/outcome helpers, key-pool rotation.

## Key paths

| Area | Path |
| ---- | ---- |
| Evaluator | `lib/game/tasks/freitext/evaluate-freitext-llm-scene.ts` |
| UI | `components/game/tasks/types/free-text/FreeTextTask.tsx` |
| LLM judge | `lib/llm/freitextLlmEvaluationService.ts` |
| Key pool | `lib/llm/gemini-api-key-pool.ts` |
| Env | `lib/llm/freitextLlmEnv.ts` |

## Local QA

1. Set `GEMINI_API_KEY_1` (and optionally `_2` … `_4`) in `.env.local` (see `.env.example`).
2. Optional: `GAME_SMOKE_AUTO_PASS=true` — all task types auto-pass without LLM (local smoke only).
3. Play quest-01 through scene 12 or chapter-02 freetext scenes.

### Checklist (manual, with real keys)

| Case | How to trigger | Expected |
| ---- | -------------- | -------- |
| **503 evaluator** | Remove all `GEMINI_API_KEY_*` from `.env.local`, restart `npm run dev`, submit freetext | `503`, code `evaluator_unavailable`, blocking toast; no scene completion |
| **504 timeout** | Set `LLM_TASK_TIMEOUT_MS=1`, submit a long answer | `504`, code `MODEL_TIMEOUT`; draft retained |
| **429 rotation** | Burst many freetext submits across one key until 429; with multiple keys configured, server tries next key before failing | Eventual success or `RATE_LIMITED` only after all keys exhausted |
| **Retry below bar** | Answer below `minRatioToComplete` (scored) or `passThreshold` (flat) | `409` + retry overlay with LLM `body` |
| **Success** | Strong Italian answer on scene 12 | Generic success overlay + pizza/backpack rewards |

Automated coverage: `evaluate-freitext-llm-scene.test.ts` (503 env, 504 abort), `gemini-api-key-pool.test.ts`, `meets-freitext-completion-minimum.test.ts`, `attempt/route.test.ts` (account rate limit).

## Azure App Service configuration

Set these as **Application settings** on `enigma-di-bologna` (or GitHub Actions secrets if injected at deploy time). Never commit keys.

| Setting | Notes |
| ------- | ----- |
| `GEMINI_API_KEY_1` | Required — first Google AI Studio project |
| `GEMINI_API_KEY_2` … `_4` | Optional — separate AI Studio projects for higher free-tier throughput |
| `GEMINI_EVAL_MODEL` | Default `gemini-3.5-flash` if omitted |
| `LLM_TASK_TIMEOUT_MS` | Optional — default `45000` |
| `LLM_TASK_MAX_RETRIES` | Optional — LangChain SDK retries per key attempt; pool failover is separate |

After changing settings, restart the web app. Verify in logs that freetext attempts complete without `evaluator_unavailable`.
