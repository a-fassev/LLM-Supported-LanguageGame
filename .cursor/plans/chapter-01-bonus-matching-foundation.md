# Chapter 01 Bonus Matching Task — Requirements Foundation

> **Purpose**: Add an end-of-chapter bonus task that helps learners consolidate Chapter 1 vocabulary while fitting the existing quest shell, task template, and scoring architecture.

## Problem Statement
At the end of Chapter 1, learners should get a bonus challenge, but the current shipped chapter content stops at Act 1.3 and does not include the bonus flow from `chapter-1.md`. Learners therefore miss the intended recap moment and extra pizza reward opportunity. We need a bonus task that feels native to the current UX and slots cleanly into a strict one-time, sequential quest flow.

---

## Confirmed Decisions
| Question | Decision |
|----------|----------|
| Should this be a new task type? | No. We will reuse the existing `Matching` task type and extend payload conventions, so we avoid adding a new Unity step class and keep server scoring compatibility. |
| Where should random 10-of-N vocab selection happen? | Server-side in Next.js, with per-run persistence of the selected pair set, so each run can differ but remains stable across resume/reload. |
| Should UI Builder template/parts be redesigned now? | No major redesign. We keep existing `MatchingTaskTemplate` and `Parts/Matching/*`, add only minimal optional styling/preview fixture refinements in a later UI Builder pass. |
| How is bonus progression represented in chapter structure? | As an explicit bonus quest after Act 1.3, with unlock rules tied to main Chapter 1 quest completion and optional completion semantics. |
| How are rewards handled? | Keep existing reward pipeline (`reward_rules`, server-authoritative wallet updates). Bonus reward uses standard pizza reward rules. |
| Should bonus block chapter progression? | No. Bonus remains optional for chapter progression (confirmed). |
| Is the Chapter 1 vocab pool guaranteed to have enough entries? | Yes. We can rely on at least 10 valid pairs being available (confirmed). |
| Should quests be replayable? | No. Quests (including bonus quests) are one-time only and run strictly in sequence. |
| Should existing integrated chapters also receive linked bonus quests in Supabase? | Yes. Add/complete bonus quests for already integrated chapters and wire them into the same sequential flow; apply changes through Supabase MCP. |

---

## User Experience

### User Flows
1. Learner finishes Act 1.3 and sees a short narrative bridge into the chapter bonus.
2. Learner opens the bonus and gets a matching task with 10 Italian-English pairs sampled from the Chapter 1 vocabulary pool.
3. Learner solves matches inside the existing task shell (`Controlla`, validation overlay, reward overlay).
4. On success, learner gets extra pizza slices and can continue to Chapter 2 flow.
5. Completed quests are locked from replay; learner proceeds only to the next not-yet-completed quest in sequence.

### Empty / Loading / Error States
- Loading: existing quest/task shell loading overlays remain the only loading UI.
- Invalid content/pool: server returns `payload_invalid` style errors; Unity shows normal error handling path (no custom bonus-only error UI).
- Not enough pool entries: server rejects with clear validation error rather than silently duplicating pairs.
- Resume flow: persisted sampled set is reused so the same in-progress run does not change mid-attempt.
- Already completed quest/bonus: learner sees a completed state and cannot start it again.

### User Expectations
- Bonus feels optional and rewarding, not blocking main chapter progression.
- Interactions are familiar (same matching controls and feedback as existing matching tasks).
- Progression should feel linear and clear (no reopening of already completed quests).
- Performance and responsiveness should match current matching tasks.

---

## Scope

### In Scope
- Define the bonus quest/step in chapter content seeding for Chapter 1.
- Reuse `Matching` task pipeline with an authoring schema extension for a vocabulary pool.
- Add server logic for per-run random sampling and stable persistence of sampled pairs.
- Keep current Unity matching UI/interaction model; only small template/preview/style touchups if required.
- Align validation in Next.js (`stepContentValidation` + schema) with the new bonus payload convention.
- Add/align bonus quests for chapters already integrated, and link them into each chapter flow via Supabase (MCP-driven DB updates).
- Enforce strict sequential, one-time progression for all quests (including bonus quests).

### Out of Scope
- Creating a brand-new Unity task type or shell presenter.
- Full visual redesign of matching UI.
- New chapter content beyond already integrated chapters.
- Immediate database execution/migration apply in this step (implementation comes later).
- Adding adaptive difficulty or personalized vocab selection logic.

---

## Engineering Design

### Unity
- Continue using `ToolkitStepFactory` -> `MatchingToolkitStep`.
- Keep `MatchingTaskTemplate.uxml` plus `Parts/Matching/*` as the baseline single-source structure.
- Preserve current shell-driven submit path (`TaskShellPresenter` + `ISubmitFromShell`).
- Optional later polish: UI Builder preview fixture data and minor USS adjustments only, no architecture change.

### Next.js app
- Extend matching payload schema to support a bonus-vocabulary pool contract (authoring format) while still producing standard `leftItems` / `rightItems` / `correctPairs` for runtime consumption.
- Implement run-specific materialization in game progress service flow (start/resume/get-run paths) so Unity receives concrete matching pairs.
- Keep scoring unchanged by emitting the same attempt contract (`taskType: "Matching"` with pair map).
- Enforce one-time quest completion by rejecting restarts of completed quests and exposing clear lock/completed state in bootstrap/start logic.
- Enforce strict sequence (next quest unlocks only after predecessor completion), including bonus placement at chapter end.

### Integration
- Contract remains HTTP `contentJson` in existing quest step DTOs.
- Unity does not need bonus-specific logic if server materializes standard matching payload before response.

### Data & persistence
- Add persistence for the sampled bonus pair set per run and step (new table or equivalent run-linked JSON storage).
- Seed Chapter 1 bonus quest/step via migration in `supabase/migrations/` using idempotent upserts and existing chapter content conventions.
- Add/patch bonus quest rows for already integrated chapters in Supabase and wire unlock dependencies so chapter flow remains coherent.
- Persist completion state as terminal for each quest so replay is blocked (main + bonus).

### Error Handling
- Validate pool size and pair integrity server-side before sampling.
- Return explicit API errors when sampling/materialization fails.
- Fall back to existing task shell validation and error overlays on Unity side.

### Security
- No new client secrets or trust-boundary changes.
- Sampling and reward decisions stay server-side and authoritative.

### Performance
- Sampling 10 pairs from in-memory payload/server-side data should be negligible.
- Avoid repeated re-sampling within one run by persisting selection.
- Keep Unity rendering cost unchanged (same matching template and part count envelope).

---

## Validated Assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| Bonus should be optional for chapter progression, not a hard gate. | ✅ Validated | Keep unlock rules bonus-optional by design. |
| Existing Matching UX is acceptable for bonus (no new mechanic). | ✅ Validated | If UX review disagrees, do a focused UI Builder polish without changing task architecture. |
| 10 random pairs are always available from Chapter 1 vocab pool. | ✅ Validated | Keep validation guard anyway to prevent authoring regressions. |
| Server-side sampling with run persistence is preferred over client randomization. | ✅ Validated | If persistence becomes too heavy, pre-materialize sampled pairs at run creation and store directly in run-step state. |
| All quests incl. bonus should be one-time only and sequential. | ✅ Validated | If future product changes require replay, gate with explicit per-quest replay policy flag. |

---

## Identified Risks
| Risk | Mitigation |
|------|------------|
| Sampled pairs change during resume/reconnect and confuse learners. | Persist sampled set per run+step and always reuse it until run completion. |
| Content schema drift between Unity parser and web schema causes `payload_invalid`. | Update schema/router + migration payload together and add tests for bonus payload materialization. |
| UI Builder preview diverges from runtime due to missing `ClearHost` assumptions. | Keep parts single-source and ensure preview fixtures only exist in hosts that runtime clears/rebuilds. |
| Bonus quest unlock behavior conflicts with chapter progression rules. | Explicitly model unlock rules and verify chapter completion logic in service tests. |
| Existing players with already completed/replayed runs might violate new one-time rules. | Add migration-safe transition logic and tests for legacy data paths before enabling strict block. |

---

## Success Criteria
- [ ] Learner can access a Chapter 1 bonus matching task after the main Act 1 flow.
- [ ] Bonus remains optional for chapter progression.
- [ ] Each bonus run samples 10 vocab pairs from the configured Chapter 1 pool; resumed run keeps the same sampled set.
- [ ] Bonus completes with existing matching UX and server-authoritative reward flow.
- [ ] Validation and error handling prevent invalid bonus pools from reaching runtime.
- [ ] Completed quests (main + bonus) are locked and cannot be replayed.
- [ ] Integrated chapters have consistent bonus quest linkage in Supabase and a clean sequential flow.

---

## Implementation Areas (for planning mode)
1. Chapter 1 bonus content modeling (quest + step payload + unlock/reward rules in migration files).
2. Matching bonus payload schema extension and validation in `apps/web`.
3. Run-scoped sampled-set persistence design and repository/service wiring.
4. Start/resume/get-run materialization path to deliver concrete matching pairs to Unity.
5. Sequential one-time progression enforcement across bootstrap/start/run lifecycle.
6. Supabase MCP rollout plan for already integrated chapters (bonus quest creation + dependency wiring).
7. Unity-side template/parts/dummy preview/style sanity pass (minimal, no new step type).
8. Automated tests for sampling stability, payload validity, one-time lock behavior, and progression flow.
