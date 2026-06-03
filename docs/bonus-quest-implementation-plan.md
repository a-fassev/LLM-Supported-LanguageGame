# Bonus quests — product shape & web implementation plan

**Status:** Draft (2026-06-03) — direction for web `web-based-implementation`.  
**Scope:** Optional end-of-chapter **bonus quests** with **scored** pizza rewards, **auto-start after the last main quest** (with **skip**), implemented as **matching + vocabulary pool** on the web stack (git JSON catalog, scene runs, existing matching UI).  
**Pilot:** **Chapter 01 only** (`quest-01-bonus`) until the flow is validated.  
**Out of scope:** A new `screen_type` / task evaluator named `bonus`; game catalog in Postgres; replay of completed quests; chapter-03 bonus migration in the first PR.

**Related:** `docs/quest-scene-content-format.md`, `docs/matching-task-integration-plan.md`, `.cursor/skills/web-task-type-ui/SKILL.md`, `AGENTS.md`.

**Note:** Bonus is **not** a new `screen_type` rollout. Use the web-task-type-ui skill for **shared layers** (catalog, sanitizer, play attempt flow, tests, copy hierarchy) and for **matching** as the reused exercise type. Phases below adapt skill §「Implementation phases」to pool materialization + quest `kind`.

---

## 0. Methodology (before coding)

Follow **`AGENTS.md` → UNDERSTAND → CLARIFY → CODE** (same as web-task-type-ui):

1. **Understand** — §7 audit: what already ships for matching vs what bonus still needs.
2. **Clarify** — §8 confirmed product defaults (2026-06-03). **No implementation until explicitly requested.**
3. **Implement** — §9 phased deliverables; §10 testing; `npm test` + `npm run lint` each phase.

**Scope discipline:** No `BonusTask.tsx`, no new evaluator branch. Extend **matching + run service + catalog** only.

---

## 1. What “bonus” means (two layers)

| Layer | Field | Meaning |
| ----- | ----- | ------- |
| **Quest** | `quest.json` → `"kind": "bonus"` | Optional chapter-end activity. Does **not** count toward “all main quests done” for the next chapter. Offers **extra pizza** when completed. |
| **Exercise** | Task scene → `"screen_type": "matching"` | Same mechanic as main-line matching: two columns, pair items, **Controlla**, server `evaluateMatching`. |

**Not** a separate task type: no `evaluateBonus`, no `BonusTask.tsx`, no `screen_type: "bonus"` renderer long term.

**Core logic:** Authors maintain a **large vocabulary pool** in JSON; the server **samples** a fixed number of pairs per run, materializes a normal matching payload, scores the attempt, and awards **variable pizza** from the result. Progression and unlock are driven by **`quest.kind`**, not by a special screen type.

---

## 2. Learner experience

### Flow

1. Learner completes the chapter’s **main** quests in order (`chapter.json` → `quests`, `kind: "main"`).
2. On the **last main quest’s** final scene success, the shell offers **auto-start into the bonus quest** (see §2.1) — same continuous feel as main quest chaining.
3. Learner may **skip** the bonus and return to the **chapter map**; bonus stays unlocked and can be started later from the map (optional, not required for next chapter).
4. If they accept (or start from map): **story** (`info`) → **matching** task with sampled pool → **Controlla** → scored **SuccessOverlay** (or retry below `minRatioToComplete` on that scene).
5. After bonus (or skip), learner continues on the chapter map; **next chapter** unlock does not depend on bonus completion.

### 2.1 Auto-start & skip (locked)

| Topic | Decision |
| ----- | -------- |
| **Auto-start** | After the **last main quest** in a chapter is completed, the game **starts the bonus quest run** by default (navigate to `/play` for the bonus `chapterId` + `questId`), wired via `autoStartQuestId` on that main quest (see §3.5). |
| **Skip** | On the quest-complete moment (success overlay or equivalent), a **secondary control** (e.g. *Salta bonus* / *Più tardi*) sends the learner to the **chapter map** without starting the bonus run. No permanent “bonus declined” flag required for v1 — skipping only defers. |
| **Catalog rule** | `autoStartQuestId` **may** point to a quest with `kind: "bonus"` (replace today’s loader rule that allows only `main` targets). |
| **Bonus quest** | `autoStartQuestId: null` on the bonus quest itself unless product later chains to another quest. |
| **Implementation note** | Web today: completing a run sets `status: completed` and success overlay sends the player to the chapter map (`play/page.tsx`). Auto-start + skip is **new shell/service work** (Phase 3b in §9), not only JSON. |

### Product rules (locked)

- Bonus is **optional** for chapter progression (`unlock-display` / bootstrap ignore `kind: "bonus"` for “main quests remaining”).
- Bonus is **scored** per **task scene** (`scoring.pizza` on each bonus matching scene — authors set `maxSlices`, `minRatioToComplete`, mapping per scene).
- **Auto-start** after last main quest, with **skip** (§2.1).
- Familiar UI: existing **Matching** task shell (`TaskChrome` instruction, `TaskBodyLayout` prompt, connector lines, Controlla).
- **One run per quest** while in progress; resuming the same run must show the **same sampled pairs** (not a new random set).

### Copy (Italian, examples)

| Place | Example |
| ----- | ------- |
| Quest title | `Extra: i saluti` |
| Story `info` | `Missione bonus: ripassa il vocabolario e guadagna pizza extra.` |
| Task `instruction` (TaskChrome) | `Abbina ogni parola italiana alla traduzione corretta.` |
| Task `prompt` (TaskBodyLayout) | `Sfida bonus — 10 parole a caso da questo capitolo.` |
| Locked bonus (hub hint) | `Completa le altre missioni del capitolo per sbloccare il bonus.` |

---

## 3. Content shape

### 3.1 Quest folder

```text
lib/content/chapters/chapter-01/quests/quest-01-bonus/
├── quest.json
└── scenes/
    ├── 01.json   # story — info
    └── 02.json   # task — matching (pool authoring)
```

**`chapter.json`** (excerpt) — bonus is a normal folder id in the chapter list:

```jsonc
{
  "id": "chapter-01",
  "quests": ["quest-01", "quest-02", "quest-01-bonus"]
}
```

**Last main quest** (`quest-02/quest.json`) — chains into bonus:

```jsonc
{
  "id": "quest-02",
  "kind": "main",
  "requiresQuestId": "quest-01",
  "autoStartQuestId": "quest-01-bonus"
}
```

**Bonus quest** (`quest-01-bonus/quest.json`):

```jsonc
{
  "id": "quest-01-bonus",
  "title": "Extra: i saluti",
  "order": 3,
  "kind": "bonus",
  "requiresQuestId": "quest-02",
  "autoStartQuestId": null
}
```

- `requiresQuestId`: last **main** quest in the chapter (unlock gate).
- `autoStartQuestId` on **quest-02**: bonus starts automatically after quest-02 completes (unless learner skips).
- Listed in `chapter.json` → `quests` **after** main quests (authoritative order).

### 3.5 How bonus is configured (quest vs scenes)

Think of **three layers** — no separate “bonus level” file:

| Layer | File(s) | What you configure |
| ----- | ------- | ------------------- |
| **Chapter** | `chapter.json` | Which quests exist and their **order** (`quest-01`, `quest-02`, `quest-01-bonus`). |
| **Quest (progression)** | `quests/<id>/quest.json` | `kind: "bonus"` (optional for chapter unlock), `requiresQuestId` (when bonus unlocks), `autoStartQuestId` on the **previous main** quest (auto-start target). |
| **Scenes (content + rewards)** | `quests/<id>/scenes/01.json`, `02.json`, … | Story text, matching pool (`task.poolPairs`, `task.sampleSize`), and **`scoring.pizza`** per task scene. |

The **exercise** is not configured in `quest.json` — only in the **task scene JSON** (`screen_type: "matching"`, `content.task`, `scoring`). The quest file only marks *that this folder is the optional bonus branch* and how it connects to the main chain.

**Chapter 01 wiring (target):**

```text
quest-01 (main) ──requires──► quest-02 (main) ──autoStart──► quest-01-bonus (bonus)
                                      ▲                           │
                                      └──── requiresQuestId ──────┘
```

- **Unlock:** bonus needs `quest-02` completed (`requiresQuestId: "quest-02"`).
- **Auto-start:** set on **quest-02**, not on the bonus quest — `autoStartQuestId: "quest-01-bonus"`.
- **Scoring / sample size:** only on `quest-01-bonus/scenes/02.json` (per-scene `scoring.pizza`, `task.sampleSize`, pool size).

### 3.2 Story scene

```jsonc
{
  "id": "chapter-01-quest-01-bonus-scene-01",
  "scene_type": "story",
  "screen_type": "info",
  "background": "chapters/01/quests/bonus/bg-info-01",
  "content": {
    "text": "Missione bonus: ripassa il vocabolario e guadagna pizza extra."
  }
}
```

### 3.3 Task scene — matching + pool

Replace current placeholders (`screen_type: "bonus"`, empty `task: {}`) with **`matching`** and pool authoring:

```jsonc
{
  "id": "chapter-01-quest-01-bonus-scene-02",
  "scene_type": "task",
  "screen_type": "matching",
  "background": "chapters/01/quests/bonus/bg-task-01",
  "content": {
    "title": "Sfida bonus",
    "instruction": "Abbina ogni parola italiana alla traduzione corretta.",
    "referenceDocument": null,
    "task": {
      "prompt": "10 parole scelte a caso dal capitolo.",
      "sampleSize": 10,
      "poolPairs": [
        { "id": "v01", "leftLabel": "ciao", "rightLabel": "hello" },
        { "id": "v02", "leftLabel": "buongiorno", "rightLabel": "good morning" }
        // … author as many pairs as needed (≥ sampleSize); pool size is per scene
      ],
      "presentation": {
        "leftLabel": "Italiano",
        "rightLabel": "Traduzione",
        "shuffleRightOrder": true
      }
    }
  },
  "scoring": {
    "backpack": { "pieces": 1 },
    "pizza": {
      "mode": "scored",
      "maxSlices": 3,
      "minRatioToComplete": 0.6,
      "rounding": "floor",
      "mapping": { "kind": "linear" }
    }
  }
}
```

**Per-scene tuning:** Each bonus **task scene** carries its own `scoring.pizza` and `task.sampleSize`. A chapter with multiple bonus task scenes (future) can use different `maxSlices` / `minRatioToComplete` / pool sizes per file.

**Authoring rules:**

- `poolPairs[].id` unique within the scene.
- `sampleSize` ≤ `poolPairs.length` (schema already enforces).
- Pool labels are chapter vocabulary (Italian left, L1 right — or as designed per chapter).
- Do **not** author `leftItems` / `rightItems` / `correctPairs` in git for bonus scenes; the server materializes them per run.

### 3.4 Retire `screen_type: "bonus"`

| Item | Action |
| ---- | ------ |
| Catalog enum | Keep `bonus` only until content migration finishes, then remove from `contentCatalogSchema` allowed `screen_type` values. |
| Fixture `chapter-01/quest-01-bonus` | Rewrite scene `02.json` to `matching` + pool + scored pizza; set `quest-02` → `autoStartQuestId: "quest-01-bonus"`. |
| `docs/quest-scene-content-format.md` | Update §4 table: bonus = quest `kind`, task = `matching`. |

---

## 4. Scored pizza (required for bonus)

Bonus tasks use the same **`scoring.pizza`** contract as main matching tasks (`docs/quest-scene-content-format.md` §6).

| Mode | Bonus usage |
| ---- | ------------- |
| **`scored`** | **Yes.** Ratio from `evaluateMatching` → slices via `linear` or `bands`; completion gated by `minRatioToComplete`. |
| **`flat`** | **No** for bonus. Fixed slices do not reflect performance. |

**Example policy (tunable per bonus task scene — Chapter 01 pilot defaults):**

| Field | Chapter 01 pilot | Effect |
| ----- | ---------------- | ------ |
| `sampleSize` | `10` | Ten pairs shown per run (confirmed). |
| `maxSlices` | `3` (example) | Up to 3 slices on a perfect run — **set per scene JSON**. |
| `minRatioToComplete` | `0.6` (example) | Completion bar — **set per scene JSON**. |
| `mapping.kind` | `linear` | Partial credit from ratio × `maxSlices`. |
| `rounding` | `floor` | Same convention as main matching scenes. |

**Server path:** For `pizza.mode: "scored"`, attempt/completion routes call `evaluateTaskAttempt("Matching", …)` on the **materialized** task, then `meetsScoredPizzaMinimum` + `slicesFromRatio`. Bonus scenes must use this path (not `flat`, which skips evaluation for non–free-text tasks today).

**Retry UX:** Below `minRatioToComplete` → `409` + `taskOutcome` retry overlay (standard task policy; no toast).

---

## 5. Server architecture

### 5.1 Pool materialization

Pure function + service hook (new for web), invoked on **run start**, **snapshot**, and **attempt** when the catalog task has `poolPairs` + `sampleSize` and no concrete items:

1. Load existing materialization for `(runId, sceneId)` if any → reuse (stable resume).
2. Else cryptographically shuffle `poolPairs`, take `sampleSize`, build:
   - `leftItems`: `{ id: "left_{poolId}", label: leftLabel }`
   - `rightItems`: `{ id: "right_{poolId}", label: rightLabel }`
   - `correctPairs`: `{ leftItemId, rightItemId }` per picked pair
3. Persist materialized task JSON (server-only; includes `correctPairs` for scoring).
4. Expose to the client via snapshot DTO: sanitized task without answer keys (`sanitize-task-payload-for-client` + `parseMatchingClientContent`).

Suggested module layout:

- `lib/game/tasks/matching/materialize-matching-pool.ts` — shuffle + build payload (Vitest: deterministic seed optional for tests).
- `lib/game/services/game-progress-service.ts` — call materialization when assembling scene for a run.

### 5.2 Persistence (Supabase migration)

Store materialized tasks per run and scene (greenfield schema has no materialization table yet).

**Workflow (team):**

1. Add migration under `supabase/migrations/` (filename with timestamp prefix).
2. **Apply to the linked Supabase project via Supabase MCP** (same flow as other migrations in this repo — do not rely on ad-hoc SQL in chat only).
3. Regenerate / verify types if the project uses generated DB types.

**DDL (to ship in migration file):**

```sql
CREATE TABLE public.player_scene_materializations (
  run_id uuid NOT NULL REFERENCES public.player_quest_runs(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  materialized_task jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, scene_id)
);

CREATE INDEX player_scene_materializations_run_idx
  ON public.player_scene_materializations (run_id);
```

Repository: `getSceneMaterialization`, `upsertSceneMaterialization`. Service applies materialization when building snapshot DTOs and before `evaluateTaskAttempt`.

**Note:** Migration is **Phase 1** work; apply with MCP when implementation starts (not before).

### 5.3 Catalog loader

Today: matching scenes **must** ship concrete `leftItems` / `rightItems` / `correctPairs` at load time (`catalog-loader.ts`).

**Change:** Allow **pool-only** matching when `poolPairs` + `sampleSize` validate under `matchingContentSchema`. Fail load if pool too small or duplicate ids.

### 5.4 Scoring & completion

| Step | Behavior |
| ---- | -------- |
| Attempt | `buildMatchingAttempt` + `evaluateMatching` on **materialized** task. |
| Complete | `minRatioToComplete` from scene `scoring.pizza`; award `slicesFromRatio`. |
| Wallet | Idempotent scene completion (no double pizza on replay — completed quest cannot restart). |

### 5.5 Bootstrap / unlock

Use existing web rules:

- Bootstrap / chapter progress: **main** quests only (`quest.kind !== "bonus"`).
- Bonus unlock: `requiresQuestId` on the bonus quest (last main quest in chapter).
- **Source of truth:** `quest.kind: "bonus"` in `quest.json` — not slug allowlists or special screen types.

---

## 6. Client architecture (reuse matching — skill-aligned)

No bonus-specific React task type. Treat bonus as **matching with a server-prepared snapshot**.

| Layer | Shared (skill) | Bonus-specific |
| ----- | -------------- | -------------- |
| `QuestShell` / `SceneRouter` | Story **Avanti** on scene 01; task **Indietro** / **Controlla** on scene 02 | No multi-step nav (all pairs on one screen, like quest-01 matching 06–08). |
| `TaskChrome` | `content.instruction` only (semibold `text-sm`) | Bonus copy; do not merge with prompt. |
| `TaskBodyLayout` | `content.task.prompt` (normal `text-sm`); scroll region for columns | Optional `beforeScroll` hint: *Trascina una linea o tocca due carte.* (same as main matching). |
| `TaskPanel` | Existing `screen_type === "matching"` → `MatchingTask` | **No** `bonus` branch; remove placeholder path after content migration. |
| `/play` | `syncMatchingDraftForScene`, `buildMatchingAttempt`, `validateMatchingDraft` | Draft keys off **materialized** `leftItems` ids from snapshot — no client change if snapshot is correct. |
| Feedback | `SuccessOverlay` + `taskOutcome`; no toast on wrong pairs | Scored retry below `minRatioToComplete` → `409` + overlay. |

**Client rules (from skill — still apply):**

- Never read `correctPairs` in UI.
- Pre-**Controlla**: all left items paired (`validateMatchingDraft` → *Completa ogni abbinamento.* under prompt).
- API via `lib/api-client.ts`; blocking errors only via `toast-from-api` policy.

**Sanitizer gap (must fix in Phase 1):** `stripMatchingAnswers` today only removes `correctPairs`. A pool-authored task sent raw would still expose `poolPairs` / `sampleSize`. After materialization, either (a) snapshot `content.task` contains **only** materialized `leftItems` / `rightItems` / `presentation` / `prompt`, or (b) extend `stripMatchingAnswers` to delete `poolPairs`, `sampleSize`, and any server-only keys. Prefer **(a)** in `sceneToDto` so the client never sees the full pool.

**Today:** `sceneToDto` reads the **catalog** scene unchanged (`game-progress-service.ts`). Bonus **requires** injecting materialized `content.task` (and keeping catalog pool in git only). This is the main service change — not new UI.

---

## 7. Repo audit — exists vs needed (UNDERSTAND)

| Capability | Status | Gap for bonus |
| ---------- | ------ | ------------- |
| `quest.kind: "bonus"` in schema + unlock-display | ✅ | — |
| Matching Zod (`poolPairs` + `sampleSize`) | ✅ in schema | Catalog loader **rejects** pool-only at load |
| `evaluateMatching` + scored pizza | ✅ | Must run on **materialized** task |
| `MatchingTask` + play draft/attempt | ✅ | Needs materialized snapshot |
| `sanitize` strips `correctPairs` | ✅ | Must not leak `poolPairs` |
| `sceneToDto` | ✅ | No materialization hook yet |
| Quest-complete auto-start | ❌ | Overlay → chapter map only; needs Phase 3b |
| `autoStartQuestId` → bonus | ❌ blocked in catalog-loader | Allow bonus target (Phase 1.8) |
| `player_scene_materializations` table | ❌ | Add migration + repository |
| Bonus fixtures | ⚠️ placeholder `screen_type: "bonus"`, empty `task` | Rewrite to `matching` + pool |
| `screen_type: "bonus"` in catalog enum | ⚠️ | Remove after migration |

---

## 8. Confirmed decisions (2026-06-03)

| Topic | Decision |
| ----- | -------- |
| Pilot scope | **Chapter 01 only** (`quest-01-bonus` + `quest-02` auto-start). |
| `sampleSize` | **10** for Chapter 01 pilot scene (other chapters/scenes: per scene JSON later). |
| Scored pizza | **Per bonus task scene** — each `scenes/NN.json` sets its own `scoring.pizza` (and may differ by chapter). |
| Pool authoring | Author chooses pool size per scene (must be ≥ `sampleSize`; recommend generous pools for variety). |
| Auto-start / skip | **Auto-start** into bonus after last main quest; learner can **skip** to chapter map (§2.1). |
| Hub locked copy | Use §2 table example when bonus is locked (*Completa le altre missioni…*). |

---

## 9. Implementation phases (adapted from web-task-type-ui)

Execute in order. Phases map to skill **1 — Data**, **2 — UI**, **3 — Play**, **4 — Docs & tests**, with bonus-specific server work in Data/Play.

### Phase 1 — Data (catalog, persistence, pure materialization)

| # | Work | Files / notes |
| - | ---- | ------------- |
| 1.1 | Supabase migration `player_scene_materializations` | `supabase/migrations/` → **apply via Supabase MCP** on linked project |
| 1.2 | Repository `getSceneMaterialization` / `upsertSceneMaterialization` | `lib/game/repositories/game-progress-repository.ts` |
| 1.3 | Pure `materializeMatchingPool(poolPairs, sampleSize, options?)` | `lib/game/tasks/matching/materialize-matching-pool.ts` + `*.test.ts` (optional injected RNG for deterministic tests) |
| 1.4 | Catalog loader: allow pool-only matching when `parseMatchingContent` passes | `lib/game/content/catalog-loader.ts`; extend `catalog-loader.test.ts` |
| 1.5 | Pilot fixtures: `quest-01-bonus/scenes/02.json` + `quest-02/quest.json` `autoStartQuestId` | Pool size author’s choice (≥10); `sampleSize: 10`; scored pizza on scene 02 |
| 1.8 | Catalog loader: `autoStartQuestId` may target `kind: "bonus"` | `catalog-loader.ts` + tests |
| 1.6 | Smoke catalog | `lib/game/content/chapter-*-smoke-content.test.ts` — bonus quest loads; pool-only validates |
| 1.7 | Sanitizer | Ensure client snapshots omit pool + answers (§6 sanitizer gap) |

**Phase 1 exit:** `npm test` green; catalog load succeeds with pool-only bonus JSON; materialization unit tests pass.

### Phase 2 — UI (verification only)

Matching UI already ships. **No new components** unless QA asks for bonus-only chrome.

| # | Work |
| - | ---- |
| 2.1 | Confirm `TaskPanel` routes bonus task scenes as `matching` after content migration |
| 2.2 | Manual smoke on `/play` with **temporary dev shortcut**: materialized fixture injected via service **or** complete Phase 3 first — UI cannot render pool-only catalog snapshot until Phase 3 wires materialization |
| 2.3 | Optional: bonus backgrounds under `chapters/NN/quests/bonus/` (already keyed in placeholders) |

**Phase 2 exit:** Bonus task scene looks like quest-01 matching (columns, lines, Controlla). Copy hierarchy: title / instruction / prompt per skill.

### Phase 3 — Play & server path (end-to-end)

| # | Work | Files / notes |
| - | ---- | ------------- |
| 3.1 | `resolveSceneTaskForRun(runId, scene)` — load catalog scene → materialize if pool → persist → return task object for DTO + eval | `game-progress-service.ts` |
| 3.2 | Use resolved task in `sceneToDto` for `currentScene` (and `nextScene` if task) | Same |
| 3.3 | `POST …/attempt` and `completeTaskScene`: evaluate against **materialized** task, not raw catalog | `evaluateTaskAttempt("Matching", …)` unchanged |
| 3.4 | Run **start** / **snapshot**: materialize current (and optionally next) task scene so first paint has `leftItems` | Start quest + snapshot APIs |
| 3.5 | Resume stability: second snapshot for same `runId` + `sceneId` returns **same** pair ids/labels | Repository read before re-shuffle |
| 3.6 | Play page: no new draft type — existing `syncMatchingDraftForScene` runs on materialized ids | `app/(game)/play/page.tsx` — regression only |

**Phase 3 exit:** Full bonus quest playable: info → matching → Controlla → scored success or retry overlay.

### Phase 3b — Auto-start & skip (shell)

| # | Work | Notes |
| - | ---- | ----- |
| 3b.1 | After **main** quest run completes, read `autoStartQuestId` from catalog | From completed quest’s `quest.json` |
| 3b.2 | If target is bonus and unlocked → default path starts bonus (`POST /api/game/runs/start` + `/play?…`) | Server may expose `suggestedNextQuest` on completion response (optional DTO) |
| 3b.3 | Success overlay (or quest-end UI): primary → continue to auto-start target; secondary **skip** → chapter map | Italian labels TBD (*Vai alla sfida bonus* / *Salta*) |
| 3b.4 | Skip does not block chapter progression or future bonus start from map | No skip flag in DB for v1 |
| 3b.5 | Tests: quest-02 completion offers bonus start; skip navigates without creating bonus run | Play/integration or service test |

**Phase 3b exit:** Finishing Chapter 01 `quest-02` offers bonus entry; skip returns to chapter hub.

### Phase 4 — Docs, content breadth, cleanup

| # | Work |
| - | ---- |
| 4.1 | `docs/quest-scene-content-format.md` — bonus = `quest.kind`; task = `matching` + `poolPairs` / `sampleSize`; scored pizza example |
| 4.2 | Remove `screen_type: "bonus"` from `contentCatalogSchema` when chapter-01 pilot migrated; other chapters’ bonus placeholders in a later pass |
| 4.3 | Remove dead placeholder handling if any (`screen_type: "bonus"` in `TaskPanel` / loader messages) |
| 4.4 | Optional: trim `lib/game/chapterUnlockProgress.ts` slug allowlist if redundant with `quest.kind` |

**Phase 4 exit:** Docs match behavior; CI smoke covers all chapters with bonus folders.

### Suggested PR split (optional)

| PR | Phases | Rationale |
| -- | ------ | --------- |
| **PR1** | 1 + 3.1–3.3 | Materialization + attempt path testable via API/unit tests |
| **PR2** | 3.4–3.6 + 3b + 2 | Snapshot, auto-start/skip, manual `/play` |
| **PR3** | 4 + other chapters | Content/docs only |

---

## 10. Testing strategy

### Automated (Vitest)

| Area | What to assert | Where |
| ---- | ---------------- | ----- |
| Materialization | Correct item count; stable ids `left_{poolId}`; `sampleSize` > pool fails | `materialize-matching-pool.test.ts` |
| Materialization | Same inputs + seeded RNG → same output; different seed → may differ | Same |
| Catalog | Pool-only bonus scene loads; duplicate pool id fails; `sampleSize` > len fails | `catalog-loader.test.ts`, smoke tests |
| Scoring | 6/10 correct → ratio 0.6 meets `minRatioToComplete` 0.6; slices linear | `taskScoring.test.ts` / matching eval tests |
| Sanitizer | Client payload has no `correctPairs`, no `poolPairs` | `sanitize-task-payload-for-client.test.ts` extend |
| Service | Mock repo: first snapshot writes materialization; second read does not reshuffle | New `game-progress-service` test or repository integration |

### Manual `/play` (after Phase 3)

Prerequisites: logged-in dev account; main quests through `requiresQuestId` completed (or temporary dev bootstrap override — **not** for production).

| Step | Expected |
| ---- | -------- |
| Chapter map | Bonus quest visible/unlocked after last main quest; chapter 02 still unlockable without bonus done |
| Finish `quest-02` | Success UI offers bonus auto-start; **skip** → chapter map without bonus run |
| Start `quest-01-bonus` (or auto-start) | Scene 01 info → Avanti → scene 02 with **10** pairs (not full pool) |
| Retreat / refresh | Same 10 pairs (labels unchanged) |
| Partial correct Controlla | Retry overlay; draft kept |
| ≥ `minRatioToComplete` | Success overlay; pizza slices match performance (not flat 2) |
| New run (new quest start after complete) | N/A if one-time quest locked — document expected lock behavior |

**Do not use `GAME_SMOKE_AUTO_PASS=true` when validating scored bonus** — it skips evaluation and masks ratio/slice behavior. Use normal env for bonus QA.

### Regression

- Main-line matching scenes (`quest-01` scenes 06–08) unchanged: still concrete authoring at catalog load.
- `npm run lint` + `npm test` before merge.

---

## 11. Chapter 01 pilot checklist

- [ ] Vocabulary pool: saluti / station / chapter-01 lexicon (≥10 pairs, target 20–40 in pool).
- [ ] `quest-02` → `autoStartQuestId: "quest-01-bonus"`.
- [ ] `quest-01-bonus` scene 02 → `matching` + `sampleSize: 10` + **scene-local** scored pizza (author values).
- [ ] After `quest-02`: auto-start bonus + skip to map; hub shows bonus unlocked; chapter 02 unlock does not require bonus.
- [ ] `npm test` + manual `/play` bonus path.

---

## 12. Decisions log

| Question | Decision |
| -------- | -------- |
| New task type `bonus`? | **No** — `matching` + `quest.kind: "bonus"`. |
| Pizza for bonus? | **`scored`** only (not `flat`); **per task scene** JSON. |
| Random vocab per run? | **Yes** — server sample from `poolPairs`; persist per run. |
| Authoring in git | **Pool only**; concrete pairs are runtime materialization. |
| Auto-start bonus? | **Yes** — `autoStartQuestId` on last **main** quest → bonus quest id. |
| Skip bonus? | **Yes** — defer to chapter map; bonus remains optional on hub. |
| `screen_type: "bonus"`? | **Retire** after chapter-01 migration. |

---

## 13. web-task-type-ui checklist (before “done”)

Apply skill 「Checklist before done」to this feature:

- [ ] Catalog load fails on bad pool JSON (CI).
- [ ] Server evaluator uses materialized `correctPairs`; no silent pass for scored bonus.
- [ ] Instruction / prompt / scroll match `TaskBodyLayout` (no bonus-specific merge).
- [ ] Snapshots omit `correctPairs` and full `poolPairs`.
- [ ] `npm test` + `npm run lint` pass.
- [ ] `docs/quest-scene-content-format.md` updated (Phase 4 in §9).

---

## 14. References (this repo)

| Topic | Path |
| ----- | ---- |
| Pilot content | `chapter-01/quests/quest-01-bonus/`, `chapter-01/quests/quest-02/quest.json` (`autoStartQuestId`) |
| Matching UI | `components/game/tasks/types/matching/`, `docs/matching-task-integration-plan.md` |
| Matching helpers | `lib/game/tasks/matching/` (`build-matching-attempt`, `normalize-matching-content`, `validate-matching-draft`) |
| Play wiring | `app/(game)/play/page.tsx` (`syncMatchingDraftForScene`) |
| Scoring | `lib/game/scoring/pizzaReward.ts`, `lib/game/scoring/evaluateTaskAttempt.ts` |
| Sanitizer | `lib/game/content/sanitize-task-payload-for-client.ts` |
| Catalog | `lib/game/content/catalog-loader.ts`, `lib/game/schemas/matchingContentSchema.ts` |
| Progression | `lib/game/unlock-display.ts`, `lib/game/services/game-progress-service.ts` |
| Skill | `.cursor/skills/web-task-type-ui/SKILL.md` |
