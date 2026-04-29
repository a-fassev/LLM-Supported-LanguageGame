# Italian NPC Chat + KPI Analysis — Requirements Foundation

> **Purpose**: Build a simple, modular web prototype that simulates a child-facing Italian NPC conversation and generates structured language-skill feedback, so these functions can later be reused in the game.

## Problem Statement
Today there is no practical surface to test real conversational learning behavior and post-conversation language evaluation.  
The team needs a concrete, user-facing prototype where a learner can chat with an NPC (streaming responses), then trigger a structured assessment that explains performance in a clear, encouraging way suitable for children.

---

## Confirmed Decisions
| Question | Decision |
|----------|----------|
| Initial scope | Prototype only in Next.js: one page with streaming chat, KPI panel, and analysis trigger; no persistence/auth/db in v1. |
| Pedagogy target | Level-config driven from start (explicit level input per chat/NPC config). |
| Prompt management | LangSmith Hub-ready architecture with safe local fallback prompt templates. |
| Model strategy | Two configurable model env vars: one default chat model and one default evaluator model. |
| NPC language policy | NPC speaks Italian, with short bilingual help hints only when learner struggles. |
| Conversation memory handling | Use LangChain summarization middleware in the chat agent to compress long histories while keeping recent turns. |

---

## User Experience

### User Flows
1. Learner opens the page and sees a split layout: left chat area, right KPI/analysis area.
2. Learner starts a conversation with an NPC persona configured by level and character settings.
3. NPC replies stream in real time for a responsive, natural chat experience.
4. Learner can continue multiple turns, with clear chat bubbles and simple input controls.
5. Learner clicks **Analyze Conversation** on the right panel.
6. System sends the full conversation transcript plus scenario metadata to an evaluation LLM call.
7. KPI cards and structured feedback appear (scores, tags, strengths, mistakes, next steps).

### Empty / Loading / Error States
- Empty chat: guidance text and starter prompt examples.
- Streaming state: input and send button have clear busy behavior; user sees live typing tokens.
- Analysis loading: dedicated panel loader with “analyzing conversation…” state.
- Chat/API failure: non-technical retry message and retry action.
- Analysis failure: preserve transcript and let user retry without losing conversation.

### User Expectations
- Responses begin quickly and stream progressively.
- UI feels simple, calm, and child-appropriate.
- Feedback is constructive, specific, and easy to understand.
- Evaluation output is consistent and structured enough for future in-game reuse.

---

## Scope

### In Scope
- Next.js single route UI in `LLM Test Integration/app/page.tsx`.
- Basic design system tokens and app-level styling updates in `LLM Test Integration/app/globals.css`.
- shadcn/ui-based chat + panel component structure.
- LangChain-powered chat orchestration with streaming.
- LangChain summarization middleware in the conversation agent.
- LangChain tool-calling structured output analysis chain for KPI evaluation.
- LangSmith tracing + prompt-management integration path (Hub pull optional via config).
- NVIDIA OpenAI-compatible endpoint usage via `ChatOpenAI` custom `baseURL` configuration.
- Modular config inputs for level, NPC persona, and evaluation profile.

### Out of Scope
- Unity scene integration or runtime embedding in this phase.
- Authentication, user accounts, role management.
- Database persistence / long-term history storage.
- Teacher dashboard, cohort analytics, exports.
- Production hardening (rate limiting, full observability dashboards, CI pipelines).

---

## Engineering Design

### Unity
N/A for v1 implementation. Only design for future portability of chat/evaluation functions into Unity integration.

### Next.js app
- App Router single-page implementation under `LLM Test Integration/app`.
- Add API routes for:
  - streaming NPC chat completion
  - post-hoc conversation analysis
- Keep modules small:
  - `lib/llm/chatClient`
  - `lib/llm/evaluator`
  - `lib/prompts/*`
  - `lib/types/*`
- Chat agent includes `summarizationMiddleware` with configurable trigger/keep behavior (default: summarize older context when token/message threshold is hit, preserve recent messages for conversational quality).
- shadcn component usage for chat input, messages, cards, buttons, badges, separators.

### Integration
- Game/web integration is not implemented yet.
- Contract-first design: define reusable payloads (`conversationMessages`, `npcProfile`, `levelConfig`, `analysisResult`) so Unity can call equivalent endpoints or shared services later.

### Data & persistence
- In-memory per browser session only.
- No storage layer in v1.

### Error Handling
- Distinguish `chat_stream_error` vs `analysis_error`.
- Return user-friendly UI messages while retaining technical details in server logs/traces.
- Fallback behavior:
  - if LangSmith Hub prompt pull fails, use local prompt constants.
  - if evaluator schema validation fails, return typed error and keep raw model text for debug trace.

### Security
- Validate all request payloads with schema (`zod`) before model calls.
- Keep API keys server-only via env vars.
- Sanitize user text for prompt construction boundaries (no direct string interpolation without role/message structure).

### Performance
- Stream first token quickly (target depends on model/network).
- Keep UI render lightweight and avoid expensive reprocessing each token.
- Evaluation call is on-demand only (button-triggered), not every turn.

---

## Validated Assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| NVIDIA endpoint works with OpenAI-compatible `ChatOpenAI` config (`baseURL` + bearer key). | ✅ Validated | Switch to direct OpenAI SDK call wrapper if provider quirks break LangChain path. |
| `stream_options` may not be supported by proxies/providers. | ✅ Validated (documented risk) | Set `streamUsage: false` in `ChatOpenAI` config. |
| Structured output via tool-calling strategy is required and suitable for KPI schema. | ✅ Validated | Keep JSON mode fallback behind an internal adapter if strict tool calling fails for specific model. |
| Prompt registry usage may be unavailable in some dev environments. | ✅ Validated | Use local prompt fallback with same input variables. |
| Summarized conversation context remains good enough for learner-facing continuity. | ⚠️ Needs check | Tune trigger/keep thresholds and allow short-session no-summary behavior. |

---

## Identified Risks
| Risk | Mitigation |
|------|------------|
| Model/provider differences may break strict tool-calling schema output. | Use strict zod schema + parser guard + fallback error path and retry guidance. |
| Overly complex KPI schema reduces reliability. | Start with compact schema and mixed output formats only where useful (scores, enums, arrays, short text fields). |
| Child-facing feedback could become too technical or discouraging. | Encode tone guardrails in evaluator prompt and include encouraging next-step fields as required. |
| Shadcn setup could bloat first iteration. | Limit to essential components only; avoid custom framework abstractions. |
| Aggressive summarization may lose key learner mistakes from early turns. | Preserve recent turns, include important error tags in summaries, and keep analysis on full local transcript when available. |

---

## Success Criteria
- [ ] User can chat with an NPC in a split-screen UI and receive streaming responses.
- [ ] User can click Analyze and get structured KPI feedback from a dedicated evaluator call.
- [ ] Output includes level-aware, encouraging language feedback with reusable typed schema.
- [ ] LangSmith traces capture both chat and evaluation calls; prompts can be pulled from Hub with local fallback.
- [ ] Config supports modular inputs for future level/NPC expansion without refactoring core flow.

---

## Implementation Areas (for planning mode)
1. Foundation setup: dependencies, env contract, minimal design tokens, shadcn baseline.
2. Domain modeling: message, NPC profile, level config, KPI schema, evaluation result types.
3. LLM infrastructure: NVIDIA-compatible LangChain clients (chat + evaluator), LangSmith tracing, prompt loader, and summarization middleware config.
4. Chat streaming API and UI: split layout, message rendering, streaming input/output flow.
5. Analysis API and KPI panel: transcript packaging, tool-calling structured output, score visualization.
6. UX polish and cleanup: loading/error/empty states, reset flow, modular boundaries for later Unity reuse.
