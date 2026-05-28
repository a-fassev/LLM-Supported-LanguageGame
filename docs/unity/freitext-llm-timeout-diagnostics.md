# Freitext LLM evaluate timeout — diagnostics (no fix yet)

This note records evidence from playtesting **Chapter 2 / Nutelleria** (`chapter-02-q2-freitext-professions`) while the product team investigates repeated evaluate timeouts. **Do not treat this as a resolved incident**; timeout behaviour is unchanged until a follow-up change is agreed.

## Symptoms (Unity)

- Learner taps **Controlla** on a `FreitextLlm` step.
- Busy overlay: *Sto leggendo il tuo testo…*
- After a long wait, validation toast (often Italian copy from API `error`; HTTP `code` is not always shown on non-2xx paths).

## Server path

`POST /api/game/runs/{runId}/steps/{stepId}/evaluate` → `evaluateFreitextLlmQuestStep` → `invokeFreitextLlmJudge` (LangChain / NVIDIA).

Default wall-clock cap: **`LLM_TASK_TIMEOUT_MS`** (45s) via `AbortController` + `ChatOpenAI({ timeout })`. LangChain **`maxRetries`** default 2 inside the same abort window.

Successful evaluate **upserts** `player_freitext_llm_gates` (run + step, `pizza_slices_award`, expiry). **`complete`** only redeems the gate token; it does not call the model.

## Evidence collected (2026-05-28)

| Source | Finding |
|--------|---------|
| **Supabase** (`language-game-dev`) | `player_freitext_llm_gates`: **0 rows** total. No `player_step_attempts` for any `FreitextLlm` step. |
| **Run state** | Account `503bfef0-…`, run `2f72f5b8-…`, quest `chapter-02-quest-02-nutelleria`, `current_step_order_index = 3` (Freitext), `has_freitext_gate = false`. |
| **Next.js dev log** | `POST .../steps/7d995a6b-e857-4fcd-8b8e-dd1648882bc9/evaluate` → **504** in **~102571 ms** (step id matches Freitext step). |
| **Supabase API logs** | Normal game RPC/REST (sessions, `complete_quest_step_task`, cutscene advance). **No** evaluate-route logging in Supabase (evaluate runs in Next.js, not PostgREST). |

## Interpretation

- The evaluate request **did not complete successfully** on the server: no gate row was written, and the dev server returned **504** after ~102s.
- That pattern fits **server-side timeout / hung LLM path** rather than a successful model pass that failed only in Unity.
- Distinguish on the next repro:
  - **`code: MODEL_TIMEOUT`** + duration ≈ `LLM_TASK_TIMEOUT_MS` → app abort while waiting on the model.
  - **`PROVIDER_UNAVAILABLE`** / **`EVALUATOR_ERROR`** with shorter duration → provider or config error.
  - **~10s** failure with generic gateway HTML → hosting proxy limit (route has no explicit `maxDuration` in repo).

## Follow-up checks (when fixing)

1. Capture evaluate response JSON (`ok`, `code`, `error`) and wall-clock time.
2. Grep Next.js stderr for `[game-progress] evaluateFreitextLlmQuestStep`.
3. Confirm `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `NVIDIA_EVAL_MODEL` in `apps/web/.env.local`.
4. After a successful evaluate, confirm a row in `player_freitext_llm_gates` for the active run + step.

## Related code

- `apps/web/app/api/game/runs/[runId]/steps/[stepId]/evaluate/route.ts`
- `apps/web/lib/game/services/game-progress-service.ts`
- `apps/web/lib/llm/freitextLlmEvaluationService.ts`
- `Assets/Scripts/Presentation/Steps/FreitextLlmToolkitStep.cs`
