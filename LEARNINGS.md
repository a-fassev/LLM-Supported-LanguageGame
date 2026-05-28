# Learnings

Captured for `/apply-learnings` — highest-value, durable notes only. Newest entries first.

---

### One-time quest policy with sequential gating - Date: 2026-05-28

**Category**: Architecture

**Context**: Implemented non-replayable progression for main and bonus quests while keeping chapter bonus quests optional for chapter unlock.

**Learning**: Quest replay must be blocked in the backend start flow, not only in Unity UI. In `apps/web/lib/game/services/game-progress-service.ts`, `startOrResumeQuest` now enforces both chapter-internal sequential order and a hard completed-quest gate (`quest_already_completed`), while still allowing resume for an existing `in_progress` run. `bootstrapGameState` should expose completed-state semantics so navigation UIs can reflect terminal quest status consistently.

**Action**: Update AGENTS.md progression integrity notes to explicitly require server-side no-replay and sequential gating, with Unity UI treated as a secondary affordance.

---

### Matching bonus tasks require run-scoped materialization - Date: 2026-05-28

**Category**: Patterns

**Context**: Added Chapter 1 bonus vocabulary matching with randomized 10-item sets while preserving stable state across resume/reload.

**Learning**: Authoring payloads can define `poolPairs + sampleSize`, but runtime payloads sent to Unity must be concrete `leftItems/rightItems/correctPairs`. This requires run+step-scoped persistence (`public.player_step_materializations`) and server-side materialization before returning bootstrap/start/get-run responses and before scoring matching attempts. Re-sampling in-memory without persistence causes inconsistent player state across resume.

**Action**: Update `.cursor/skills/supabase-chapter-content-seeding/SKILL.md` and task-type docs to document pool-authoring vs runtime materialization and the required persistence table pattern.

---

### Chapter bonus optionality is managed in web unlock code - Date: 2026-05-28

**Category**: Architecture

**Context**: Ensured bonus quests exist for integrated chapters without blocking next-chapter progression.

**Learning**: Bonus optionality for chapter unlock is not solely a SQL unlock-rule concern; it is controlled by `apps/web/lib/game/chapterUnlockProgress.ts` via `OPTIONAL_CHAPTER_QUEST_SLUGS`. Whenever a new chapter bonus quest is added in Supabase migrations (e.g. `chapter-01-quest-04-bonus-vocab`), the slug must be registered there and covered by chapter unlock tests, or chapter progression behavior drifts from product intent.

**Action**: Add/refresh an AGENTS.md bullet in the chapter seeding section that ties every new `*-bonus-vocab` migration to `OPTIONAL_CHAPTER_QUEST_SLUGS` + unlock tests.

---

