# Agent guidance

**Git branch for agent work:** `web-based-implementation` (create from `main` when needed). At the start of a task, confirm you are on this branch—not `main` for feature work unless the user says otherwise.

Learner-facing product rules: `.cursor/skills/product/SKILL.md`. Durable team notes: `LEARNINGS.md` (via `/apply-learnings`).

Run locally: `npm run dev` (secrets in `.env.local` only; see `.env.example`).

---

## Core principle

**UNDERSTAND → CLARIFY → CODE** — Always understand the current situation first, then ask questions and give suggestions, and only start coding after user confirmation.

### 3-phase response protocol

**Phase 1: Understand current state**

- Analyze existing code, setup, and tools
- Identify problem/need and constraints
- Map what exists vs. what is needed

**Phase 2: Clarify & suggest before coding**

- Ask clarifying questions (unclear specs, missing details, scope, integration)
- Offer strategic suggestions (better approaches, risks, improvements)
- **No coding yet** — wait for user confirmation

**Phase 3: Implement after confirmation**

- Implement exactly what was confirmed
- Follow the user’s chosen approach
- No scope creep or unrequested additions

---

## Development philosophy

- **Clean & simple:** KISS, minimal dependencies, clear naming, no over-engineering
- **Modern & modular:** Single responsibility, separation of concerns, reusable modules
- **Server-authoritative game logic:** Scoring, unlock rules, and narrative catalog live in `lib/` (JSON + services); Supabase stores **auth, wallet, and run/scene progress** only (no chapter/quest/step catalog in Postgres)
- **Type-safe contracts:** Zod for step payloads and API bodies; extend schemas when content shape changes

---

## Key rules

- **Never code immediately** — analyze the status quo first (unless the user explicitly asks for a direct fix in a tiny, isolated spot).
- **Ask questions specific to this project** — not generic checklist questions.
- **Give suggestions in context** — grounded in this repo’s patterns.
- **Wait for confirmation** before non-trivial implementation.
- **No scope creep** — only what was discussed and agreed.
- **Language:** Code and committed docs in **English**; conversation with the user may be in **German**.
- **Secrets:** Never commit `.env.local`, API keys, or session tokens.
- **Documentation files:** Do **not** create `*_SUMMARY.md`, `*_GUIDE.md`, `*_AUDIT.md`, `TODO.md`, or similar unless the user explicitly asks. Put explanations in chat. Exception: implementation code the user requested, or docs they explicitly want (e.g. `docs/web-stack-setup-plan.md` already exists as a planned stack checklist).
- **Product vs tech:** Player motivation, copy, pacing → `.cursor/skills/product/SKILL.md`. Contracts, API, schemas, stack → this file.
- **Dual-doc rule:** When a change affects **both** learner-visible behavior **and** technical contracts, update **product skill + `AGENTS.md`** (see `.cursor/commands/apply-learnings.md`).

### Debugging

When debugging, use **existing** process output: terminal logs from `npm run dev` / tests, and browser DevTools for the web client. Do **not** start ad-hoc servers whose only purpose is logging or debugging.

---

## When to use skills


| Domain                         | Use                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Product**                 | UX, Italian copy, progression, rewards, task design — `.cursor/skills/product/SKILL.md` |
| **Chapter content**         | Raw `docs/content_raw/` → `lib/content/chapters/` JSON — `.cursor/skills/chapter-content-authoring/SKILL.md` |
| **Web task UI**             | New/changed task `screen_type`, TaskChrome/TaskBodyLayout, play submit — `.cursor/skills/web-task-type-ui/SKILL.md` |
| **Supabase (MCP / plugin)** | Schema, SQL, RLS, Auth — Supabase skill + MCP when configured                          |
| **UI**                         | Tailwind v4, shadcn (`app/globals.css`, `components.json`) — add components via `npx shadcn@latest add` |


Optional CLIs when MCP is not enough: **GitHub** (`gh`) for PRs and CI; **Supabase CLI** for local DB/migrations (align with team workflow).

---

## Most important

- Keep changes **small and correct** — match existing patterns in `lib/` and `app/api/`.
- **Do not** put LLM or Supabase secrets in the client.
- **Validate** new step shapes with Zod and tests where behavior is non-obvious.
- **Ground** wallet/bootstrap behavior in `game-progress-service` and `game-progress-repository`—not one-off route logic.

---

## Project architecture overview

### Tech stack


| Layer             | Choice                                 | Notes                                                               |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Framework         | **Next.js 16** App Router              | Repo root: `app/`, `lib/`, `proxy.ts`                               |
| Language / UI     | **TypeScript 6**, **React 19**         | Game shell in `app/(game)/`, `components/game/`; six task types implemented (MC, matching, drag_drop, free_text, error_spotting, cloze) |
| Styling           | **Tailwind CSS v4**, **shadcn/ui**     | `app/globals.css`, `components.json`, `components/ui/`; **`shadcn` npm package** required for `@import "shadcn/tailwind.css"` |
| Data / auth       | **Supabase** (`@supabase/supabase-js`) | Postgres + RLS in linked project; `SUPABASE_SECRET_KEY` server-only |
| Validation        | **Zod 4**                              | Step payloads, attempts, pizza rules                                |
| LLM               | **LangChain** + OpenAI-compatible API  | **FreitextLlm** evaluate only (`lib/llm/`)                          |
| Passwords         | **argon2**                             | Registration / login                                                |
| Tests             | **Vitest 4**                           | `npm test` — Node environment, `**/*.test.ts`                       |
| Lint              | **ESLint 9** + `eslint-config-next`    | `npm run lint` → `eslint .` (`next lint` removed in Next 16)        |


**Supabase schema:** DDL under `supabase/migrations/` (auth, wallets, player run tables; **no** `game_chapters` / `game_quests` / `game_quest_steps`). Apply via Supabase MCP/CLI to the linked project.

### Architecture principles

- **Route handlers thin, services thick:** `app/api/`* → `lib/game/services/*` → `lib/game/repositories/*` → Supabase.
- **Session auth:** Bearer token in `Authorization` header; validated via `lib/require-session.ts` against `student_sessions` (hashed token).
- **Content validation at boundaries:** `lib/game/stepContentValidation.ts` + per-type schemas under `lib/game/schemas/`.
- **Deterministic scoring:** Task attempts evaluated in `lib/game/scoring/evaluateTaskAttempt.ts`; pizza rules in `lib/game/scoring/pizzaReward.ts`.
- **Image-driven UI:** Asset keys in scene JSON; client resolves via `lib/game/content/resolve-asset-url.ts` → `public/content-assets/` (see Design system).

### State management

Next.js serves **both** the web UI and `/api/*`. Treat the **server** as the source of truth for game rules, progression, and scoring. The browser holds only **short-lived UI state** and the session credential—not a copy of the full game world.

#### Three kinds of state


| Kind | Examples | Where it lives | Who owns updates |
| ---- | -------- | -------------- | ---------------- |
| **Player persistence** | Wallet, run position, completed scenes/quests, leaderboard | Supabase (`student_*`, `player_wallets`, `player_quest_runs`, `player_scene_completions`, …) via `game-progress-repository` | Services only |
| **Content & rules** | Scene payloads, unlock gates, scoring | `lib/content/` + `lib/game/content/catalog-loader.ts`, Zod in `lib/game/schemas/`; **not** in Supabase | Server on bootstrap / run APIs |
| **UI-local** | Current answer draft, open documento overlay, form fields | Client component `useState` / `useReducer` | Component; discard on unmount unless submitted |

Do **not** mirror player persistence (chapters unlocked, run step index, pizza totals) in a global client store. After a successful mutation, refresh from the server (`router.refresh()`, a targeted refetch, or navigation) instead of patching client caches by hand.

#### Reads vs writes

- **Reads (lists, bootstrap, run snapshot):** Prefer **Server Components** and service/repository calls in `lib/` so data is assembled on the server and passed as props. Avoid client-side `fetch` loops for content the page already has.
- **Writes (login, start quest, complete step, evaluate Freitext):** Thin **Client Components** call same-origin `/api/*` (or Server Actions only if the team adopts them consistently). Keep route handlers thin; logic stays in `game-progress-service`.
- **Navigation context** (chapter id, quest id, run id when useful): Prefer the **URL** (`app/` segments or `searchParams`) so back/forward and deep links work without extra global state.

#### Session

- Bearer token: `sessionStorage` key `game.session.token`, exposed via `lib/game/session-context.tsx` (`GameSessionProvider` on `app/(game)/layout.tsx`).
- Gate `(game)` routes on `GET /api/auth/session` through `refreshSession`; on `401`, clear credentials and send the player to login.
- Never put Supabase service keys or LLM keys in client state.

#### Local UI state guidelines

- Client `useEffect` + `await fetch`: before `setState` after the await, guard with `useMountedRef()` (`lib/game/use-mounted-ref.ts`). React Strict Mode remounts leave a plain `useRef(false)` cleanup stuck false.
- One quest step screen: local state for **in-progress input** until the player taps **Controlla** / submit; then POST to the API and use the response (and server refresh) for feedback and rewards.
- Cutscene/story steps: minimal state (current beat index only if the server does not drive it via `advance`).
- Shared chrome (pause, documento open): lift state only as high as needed—Context is fine for **session + shell chrome**, not for game progression.
- **Success overlay after pass:** Server advances `run.currentScene` before the player dismisses UI. On task success with `taskOutcome`, `/play` holds **background** (`backgroundHoldKey`) and **chrome** (`chromeHoldScene` → `displayScene` for `TaskPanel` / header / MC index) on the **submitted** scene; defer `syncTaskDraftsForScene` until overlay dismiss (`pendingDraftSyncSceneRef`). Same chrome hold for quest-complete overlays (`onAdvanceStory` when a quest ends). After dismiss, `/play` returns to the **chapter mission list** (`/chapters/[chapterId]`). Retry **409** skips draft sync so answers stay in place.

#### Content source

Narrative catalog is **git-versioned JSON** under `lib/content/chapters/` (see `docs/quest-scene-content-format.md`), loaded by `lib/game/content/catalog-loader.ts` and validated with `lib/game/schemas/contentCatalogSchema.ts`. **Authoring large chapters (01–04):** Italian copy and task answer keys live in `scripts/generate-chapter-NN-catalog.mjs`; `node scripts/generate-chapter-NN-catalog.mjs` **deletes and rewrites** `lib/content/chapters/chapter-NN/` — edit the script, then commit generated JSON (`npm run build` does **not** run generators). **Chapter 04 generator** also syncs asset placeholder dirs under `public/content-assets/` and rewrites `chapters/04/ASSET_KEYS.txt` (all `background` + `referenceDocument.figures[].image` keys); drop PNGs at those paths with no code change. Reuse that asset-sync pattern for chapter 05+ generators. **Runtime:** `loadContentCatalog()` only reads and validates files on disk. In **development**, `loadContentCatalog()` bypasses the in-memory cache by default (`NODE_ENV === "development"`); tests pass explicit `bypassCache`. `GET /api/game/bootstrap` returns wallet totals, **`chapters`** (metadata list), and **`completedQuestIds`** — each entry is **`chapterId:questId`** (see `lib/game/quest-progress-id.ts`), because quest directory names repeat per chapter. Active play uses run snapshot APIs (current **scene**, not legacy step-index rows). Clients must not invent catalog or unlock state locally beyond display helpers (`lib/game/unlock-display.ts`).

#### Error handling (client boundary)

- APIs return `{ ok: false, error, code? }` via `jsonError` (`lib/http.ts`). User-facing Italian copy comes from `lib/game/clientMessages.ts`.
- Use **`lib/api-client.ts`** for all client `/api/*` calls (`ApiResult`, auth header, envelope parse); map `code` when the UI must branch.
- Do not invent a parallel error taxonomy in components—reuse server `error` / `code` and `clientMessages`.
- Post-**Controlla** success/retry copy and reward summary: server **`taskOutcome`** from `lib/game/task-outcome-messages.ts` → `SuccessOverlay` on `/play` (not a toast). Below min ratio: **409** with `taskOutcome` in `details` (`kind: "retry"`). When the scene was already completed in this run (`completeSceneOnce` `inserted: false`), **`rewardsAlreadyClaimed`** zeroes overlay pizza/backpack and uses “already earned” copy—client **`showRewardSummary`** only when awarded amounts are greater than 0. Finished quest runs: overlay primary **«Alla lista missioni»** → `/chapters/[chapterId]`; story quest-end uses **`QUEST_COMPLETE_STANDARD`** («Missione completata!»).

**Inline (default):** Wrong password, empty answer, field validation—show **in context**. Routine task mistakes use the success overlay in retry mode, not Sonner.

**Toasts (shadcn Sonner):** `<Toaster />` in root `app/layout.tsx`; trigger via `lib/game/toast-from-api.ts` (**network unreachable** `status === 0`, **5xx**, or `BLOCKING_CODES` only—e.g. `catalog_unavailable`, `active_run_exists`, `quest_already_completed`, `chapter_locked`, session invalid). Do not toast per-attempt wrong answers or quest-locked hints on the map. **`/play` load** with `quest_already_completed`: toast + `router.replace(/chapters/[chapterId])`.

**Do not toast:** Per-attempt scoring feedback, rate limits on username suggest, validation on a single form field, or any error the child can fix on the same screen without losing progress context.

#### Anti-patterns

- Putting unlock/scoring/pizza logic only in the client.
- Client-only shop purchases or room inventory (server must debit wallet and persist layout).
- Comparing bare `quest.id` to `completedQuestIds` (always use `toQuestProgressId(chapterId, questId)`).
- Global stores for bootstrap payload or full quest step lists.
- Duplicating Zod validation on the client as the authority (server validation remains required; client checks are optional UX only).
- Optimistic UI that shows rewards before the server confirms completion.
- Toasts for routine task mistakes or field-level validation (use inline feedback instead).

---

## Directory structure

```text
LLM-Supported-LanguageGame-1/
├── .cursor/
│   ├── commands/          # apply-learnings, review-code, strategic-plan, …
│   ├── plans/             # Foundations and backlog (planning only unless user executes)
│   └── skills/            # product, unity-* (reference only on web branch), …
├── .github/workflows/     # deploy-azure.yml (push web-based-implementation)
├── app/
│   ├── (auth)/            # login, register
│   ├── (game)/            # menu, chapters, shop, leaderboard, play (QuestShell)
│   ├── api/auth/          # login, register, logout, session, suggest-username
│   ├── api/game/          # bootstrap, leaderboard, runs/*
│   ├── layout.tsx         # globals, Sonner Toaster
│   └── page.tsx           # redirect: session → menu, else login
├── components/
│   ├── ui/                # shadcn primitives
│   └── game/              # layout, shell, overlays, screens, tasks
├── lib/
│   ├── api-client.ts      # client fetch + DTO types
│   ├── content/chapters/  # git-versioned quest/scene JSON
│   ├── auth/
│   ├── game/
│   │   ├── content/       # catalog-loader, resolve-asset-url
│   │   ├── schemas/       # Zod (tasks + contentCatalogSchema)
│   │   ├── scoring/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── session-context.tsx, unlock-display.ts, quest-progress-id.ts, toast-from-api.ts
│   │   └── task-outcome-messages.ts
│   └── llm/
├── public/content-assets/ # backgrounds from content keys
├── supabase/migrations/   # auth, wallet, run/scene tables (no game_chapters)
├── docs/                  # web-game-ui-architecture, quest-scene-content-format, …
├── proxy.ts
└── package.json
```

**Note:** Do **not** treat `apps/web/` or Unity `Assets/` as canonical on this branch. Unity skills under `.cursor/skills/unity-*` are **reference** for the legacy client only.

---

## Game domain (technical)

**Supabase today:** `student_accounts`, `student_sessions`, `player_wallets`, **`player_quest_runs`** (text `chapter_id` / `quest_id` / `current_scene_id`; at most one `in_progress` run per account), **`player_scene_completions`**, **`player_task_attempts`**, **`player_scene_materializations`** (`run_id`, `scene_id`, `materialized_task` jsonb — matching pool samples per run/scene). No `game_chapters` / `game_quests` / `game_quest_steps` (dropped in `20260602120000_remove_game_content_catalog.sql`; greenfield run schema in `20260602221000_player_scene_progress_greenfield.sql`). Apply `supabase/migrations/20260603160000_player_scene_materializations.sql` in every environment before bonus pool features ship.

**Content:** `lib/content/chapters/**` + `catalog-loader.ts`. Scene order from `scenes/01.json`, `02.json`, …; scene ids derived in loader. When splitting a raw act into scenes, **preserve the raw order** of story beats vs tasks (e.g. a narrator summary after exercises stays in a later scene file than those tasks). Chapter **`order`** is **0-based and contiguous** (`0 … n−1` after sort); `catalog-loader` fails on gaps.

**Reference sandbox (`chapter-00`):** Optional team-only chapter with `"reference": true` and `"order": 0` (today: task-type fixtures under `lib/content/chapters/chapter-00/`). It is **always playable** when not `"locked": true` and **does not gate** the next progression chapter (`chapter-01` …)—see `lib/game/chapter-progression.ts` (`getPreviousProgressionChapter`) and matching hub/server unlock in `unlock-display.ts` / `lib/game/quest-progression-lock.ts`. At most one `reference: true` chapter per catalog. Learner narrative lives in **`chapter-01`+**; web task fixtures and smoke tests point at **`chapter-00`**, not `chapter-01`.

**Removing `chapter-00` later (when the sandbox is no longer needed):** Content-only teardown plus renumbering—no unlock/run API changes required if no chapter sets `reference: true` anymore.

1. Delete `lib/content/chapters/chapter-00/`.
2. **Renumber `order`** on every remaining `chapter.json` so values stay contiguous from **0** (e.g. `chapter-01` → `order: 0`, `chapter-02` → `order: 1`, …). Skipping this breaks `loadContentCatalog()`.
3. Update tests: remove or relocate `lib/game/content/chapter-00-smoke-content.test.ts`; adjust `lib/game/content/catalog-chapters.test.ts` (chapter count/ids).
4. Update fixture paths in `AGENTS.md` (this section), `docs/quest-scene-content-format.md`, `.cursor/skills/web-task-type-ui/SKILL.md`.
5. Optional Supabase cleanup: rows with `chapter_id = 'chapter-00'` or scene ids `chapter-00-*` (or ignore).
6. Optional code cleanup: `reference` in `chapter.json` / `chapter-progression.ts` can remain unused.

See also `docs/content-chapter-sandbox-migration.md` (one-time `chapter-01` → `chapter-00` player-data migration).

**Progression:** Sequential chapters → quests → **scenes**; server advances by catalog scene order. Hub **display** locks use `lib/game/unlock-display.ts` from bootstrap **`completedQuestIds`** (`chapterId:questId` strings) and bootstrap **`chapters[].locked`**, and run APIs enforce unlocks server-side (`requiresQuestId` + previous chapter completion, same qualified ids). **Hub UI:** `components/game/screens/ChapterGrid.tsx`, `QuestList.tsx` — completed = **Completata/o**, `disabled`, `cursor-not-allowed`, full opacity; locked = **Bloccata/o** + `opacity-60`. Chapter card disabled only when **`isChapterFullyComplete`** (all quests incl. bonus); open bonus keeps chapter **Sbloccato** and clickable. **`POST /api/game/runs/start`** returns **`quest_already_completed`** (409) for finished quests (including resume guard). **No `autoStartQuestId`:** after any quest completes, client returns to **`/chapters/[chapterId]`**; next mission starts from the list only. Scene rewards are once per `(run_id, scene_id)` via `completeSceneOnce`; replay after **retreat** does not call `incrementWalletTotals` again (`taskOutcome` uses `rewardsAlreadyClaimed`). **`POST /api/game/runs/[runId]/retreat`** moves `current_scene_id` to the previous catalog scene only — it does not delete scene completions or reverse wallet rewards. Snapshot includes **`canRetreat`** when `sceneNumber > 1`.

**Manual chapter lock (pilot control):** Optional `"locked": true` in `chapter.json` (authoring: `docs/quest-scene-content-format.md` §2; Zod default `false`). Independent of learner progress—use for classroom pilots (change in git + deploy, no Supabase flag). Server: `isChapterManuallyLocked` / `isQuestProgressionLockedForAccount` in `lib/game/quest-progression-lock.ts`; block **start**, **resume**, **`GET /api/game/runs/snapshot`** for `in_progress` runs (`buildSnapshotFromRun`), **advance**, **attempt**, and **retreat** when the chapter is manually locked. API code **`chapter_locked`** + `gameClientMessages.chapterLocked` (not **`quest_locked`**, which is progression / `requiresQuestId`). Include **`chapter_locked`** in `lib/game/toast-from-api.ts` `BLOCKING_CODES`. Chapter detail deep-link: `router.replace("/chapters")` when `isChapterLocked`. Current content pilot: **chapter-03**, **chapter-04**, and **chapter-05** unlocked (`locked: false`); **chapter-06** remains locked until authors remove the flag.

**Bonus quests:** A bonus is **`quest.json` → `"kind": "bonus"`**, not `screen_type: "bonus"` (deprecated placeholder). **List title:** prefix **`Extra: `** in `title` (Italian optional add-on; see `docs/quest-scene-content-format.md`). The exercise is normal **`matching`** with optional **`poolPairs` + `sampleSize`**; the server materializes concrete items once per `(run_id, scene_id)` via `lib/game/tasks/matching/resolve-matching-scene-task.ts` and **`insertSceneMaterializationIfAbsent`** (INSERT on conflict ignore, then re-read — not blind upsert). **Fail-closed:** if insert loses a race and re-read fails, or `getSceneMaterialization` returns `{ ok: false }` (DB error), return **`materialization_failed`** — never return a fresh in-memory sample that reshuffles pairs mid-run. Snapshots/attempts send only the materialized task; `sanitize-task-payload-for-client` also strips `poolPairs`, `sampleSize`, and `correctPairs`. Unlock via **`requiresQuestId`** on the bonus quest (same chapter mission list as main quests). After any quest completes, `/play` returns to **`/chapters/[chapterId]`**; the learner starts the bonus from the list when it shows as unlocked. Authoring: `docs/quest-scene-content-format.md` (pool + scored pizza on bonus scenes). **`docs/bonus-quest-implementation-plan.md`** mentions removed auto-start — historical only.

**Scene contract (authoring):** Per-scene JSON — `scene_type` (`story` | `task`), `screen_type`, `content`, `background`, optional `scoring`. Story scenes use `screen_type: "info"` only (`content.text`). Legacy step fields in older docs map to this model; see `docs/quest-scene-content-format.md`.

**Reference document (documento):** Optional scene-level `content.referenceDocument` on **any** task `screen_type` (validated in `lib/game/schemas/referenceDocumentSchema.ts`). Shape: required `title`; at least one of non-empty `body`/`bodyText`, `sections[]` (profile blocks), or `figures[]` (`image` asset key + `caption`, optional `alt`). Play: `readReference()` on `/play` → `toReferenceDocumentView()` (`lib/game/reference-document-view.ts`) → `ReferenceDocumentOverlay`. Freetext still merges shell ref into the task for LLM eval (`mergeFreitextSceneContent`; `body` → `bodyText`). Figure PNGs: `public/content-assets/{key}.png` (not scene backgrounds) — see `public/content-assets/README.md`. **Fixtures:** chapter-00 quest-01 scenes **04** (6-face gallery), **12** (single figure); learner chapter-02 quiz/profession/menu figures; chapter-03 uses **text-only** documento (volantino, Lorenzo story, rivista) on MC/cloze/drag scenes — no `figures[]` in ch.3; chapter-04 **quest-02** foto freetext uses **4-figure** documento (`ref-foto-*` under `public/content-assets/chapters/04/quests/02/`).

**Task types (schemas):** `ClozeText`, `MultipleChoice`, `DragDrop`, `Matching`, `ErrorSpotting`, `FreitextLlm`, plus `SpecialScreen`* variants (web UI: **multiple choice**, **matching**, **drag_drop**, **`free_text`** (`FreitextLlm`), **`error_spotting`** (`ErrorSpotting`), and **`cloze`** (`ClozeText`) implemented end-to-end; unknown `screen_type` values fall back to `TaskPlaceholder` in `TaskPanel`). **Raw authoring trap:** German `docs/content_raw/` „Freitext-Eingabe mit Auto-Check“ = typed gaps + fixed `correctAnswers` → **`cloze`**, not **`free_text`** / LLM (see `.cursor/skills/chapter-content-authoring/SKILL.md`). **Freetext:** shell `content.referenceDocument` is merged via `mergeFreitextSceneContent` when the task has none (catalog `body` → `bodyText`); same merge at catalog load, `evaluateFreitextLlmScene`, and client normalizers. The LLM judge prompt must include reference text (`lib/llm/freitextLlmEvaluationService.ts`). **Scored** pizza: completion uses **`minRatioToComplete` only** — `evaluation.passThreshold` does not gate pass/fail (flat freetext still uses `passThreshold`). **Cloze retry:** draft preservation on 409 is via skipping `syncTaskDraftsForScene`, not `clozePreserveForTransition` after success (server advances immediately). **Error spotting authoring:** segment spacing validated at catalog load (`validate-error-spotting-segment-text.ts`); see `docs/quest-scene-content-format.md`. **Cloze:** gap order = `lines[]` then segments left-to-right; snapshots strip `correctAnswers` per gap. Raw „one of two gap positions“ (A/B before/after noun) → **one `gap` per line** with the **full correct phrase** in `correctAnswers[]`; do not use a partial answer plus a literal noun that repeats in the sentence. Test every `correctAnswers[]` entry in `chapter-NN-task-scoring.test.ts`. See `.cursor/skills/chapter-content-authoring/SKILL.md`.

**Scoring:** `evaluateTaskAttempt` + pizza rules in service; **`free_text`** uses async `evaluateFreitextLlmScene` (LLM in `lib/llm/`) when evaluation runs. **`error_spotting`:** false-positive selections are **ignored** (no instant `ratio: 0`); `ratio = fixedTrueErrors / totalTrueErrors`. **`GAME_SMOKE_AUTO_PASS=true`** skips evaluation for **all** scored task types (including `free_text`) and uses `ratio = 1`. When eval runs: **`scored`** completion uses `minRatioToComplete`; **`flat`** freetext uses `evaluation.passThreshold` (`meets-freitext-completion-minimum.ts`). Client snapshots strip `task.evaluation` via `sanitize-task-payload-for-client.ts`. Rewards recorded on scene completion; wallet in `player_wallets`. Do not auto-pass unsupported **scored** task types in service logic—unsupported scored scenes must fail clearly (`task_eval_not_implemented`) until an evaluator exists. For smoke/placeholder authoring, use `scoring.pizza.mode: "flat"` or `GAME_SMOKE_AUTO_PASS=true` in `.env.local`—never enable in production Azure unless intentional. `POST …/attempt` is rate-limited per IP and per account (`lib/rate-limit.ts`).

**LLM (freitext only):** `lib/llm/` + `lib/game/tasks/freitext/evaluate-freitext-llm-scene.ts`; wired through run **attempt** (no separate public evaluate route). Judge returns four scores → `weightedSkillRatio`: **grammar**, **vocabulary**, **register**, **task fulfillment** (prompt + instruction + `evaluationCriteria` + `targetStructures`; weight `taskFulfillmentWeight`, default 1). Learners see only `summaryFeedback` / `nextStepAdvice` on retry overlay—not per-dimension breakdowns.

**NVIDIA / local dev:** Keys in `.env.local` only. `MODEL_TIMEOUT` usually means the **model** is slow or hung on `chat/completions`, not that the app skipped the LLM. Prefer a fast dev model (e.g. `mistralai/ministral-14b-instruct-2512`); some large catalog models may never respond within `LLM_TASK_TIMEOUT_MS` even when the API key and base URL work.

---

## Key patterns

### API surface (`app/api/`)

All game routes require a valid session unless noted. Rate limiting via `lib/rate-limit.ts` on sensitive routes.

**Auth**


| Method | Path                         | Purpose                            |
| ------ | ---------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`         | Account + balanced team assignment |
| POST   | `/api/auth/login`            | Session token                      |
| POST   | `/api/auth/logout`           | Revoke session                     |
| GET    | `/api/auth/session`          | Current account                    |
| GET    | `/api/auth/suggest-username` | Generated username candidate       |

Team assignment ownership: `student_accounts.team` is assigned in Postgres (`assign_balanced_student_team` trigger). Keep API register routes free of app-side balancing reads.


**Game**


| Method | Path                  | Purpose                                      |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/api/game/bootstrap` | Wallet, `chapters`, `completedQuestIds` (`chapterId:questId` each) |
| GET    | `/api/game/leaderboard` | Overall / team rankings by pizza slices |
| POST   | `/api/game/runs/start` | Start/resume quest run (`chapterId`, `questId`) |
| GET    | `/api/game/runs/snapshot` | Active `in_progress` run + current scene + `canRetreat` (null run if none active) |
| POST   | `/api/game/runs/[runId]/advance` | Story scene → next |
| POST   | `/api/game/runs/[runId]/retreat` | Move to previous scene (`sceneId` = current); no completion rollback |
| POST   | `/api/game/runs/[runId]/attempt` | Task attempt → score; may return `taskOutcome` |


JSON helpers: `lib/http.ts` (`jsonOk`, `jsonError`). User-facing message keys: `lib/game/clientMessages.ts`.

### Layer responsibilities


| Layer          | Responsibility                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Route**      | HTTP method, rate limit, `requireSessionAccount`, map status codes                                                       |
| **Service**    | `game-progress-service.ts` — bootstrap, runs, scoring, `taskOutcome`; `leaderboard-service.ts` — rankings |
| **Repository** | `game-progress-repository.ts` — wallets, runs, scene completions, leaderboard |
| **Schemas**    | Parse/validate `content_payload` per `task_type`                                                                         |
| **Scoring**    | Pure functions + `evaluateTaskAttempt` for attempt JSON                                                                  |


### Adding a task type

**Agent guide:** `.cursor/skills/web-task-type-ui/SKILL.md`. **Reference implementations** (sandbox `chapter-00`, not learner `chapter-01`): multiple choice — `components/game/tasks/types/multiple-choice/`, `lib/game/tasks/multiple-choice/`, `chapter-00/quests/quest-01/scenes/04.json` (MC + **6-figure documento gallery**) + `05.json` (long text-only documento); matching — `chapter-00/quests/quest-01/scenes/06.json`–`08.json`; drag_drop — `chapter-00/quests/quest-01/scenes/09.json`–`11.json`; **free_text** — `chapter-00/quests/quest-01/scenes/12.json` (**single-figure documento**), `docs/freitext-llm-implementation.md`; **error_spotting** — `chapter-00/quests/quest-01/scenes/13.json` + `14.json`; **cloze** — `chapter-00/quests/quest-01/scenes/15.json` (minimal, 2 gaps) + `16.json` (rich + text `referenceDocument`), `docs/cloze-text-task-integration-plan.md`. Learner **chapter-02** documento figures: quiz gallery, profession/menu freetext. **Chapter-03** (Lezione 3): MC + text `referenceDocument` (`quest-02` scene 05, `quest-04` scene 08), cloze congiuntivo/suffix/si impersonale, drag-drop Made in Italy — generator `scripts/generate-chapter-03-catalog.mjs`; **no** `free_text` in ch.3. **Chapter-04** (Lezione 4): freetext foto + mediation mail (LLM), cloze congiuntivo/infinito + SMS, error_spotting, MC invito — generator `scripts/generate-chapter-04-catalog.mjs` (+ asset placeholder sync → `public/content-assets/chapters/04/ASSET_KEYS.txt`). **Chapter-05** (Lezione 5): MC Lucca (documento S. 104–105), drag_drop pro/contro, cloze aggettivo + mail formale, matching imperativi — generator `scripts/generate-chapter-05-catalog.mjs` (+ `public/content-assets/chapters/05/ASSET_KEYS.txt`); **no** `free_text` in ch.5.

**Server (all types):**

1. Zod schema under `lib/game/schemas/` (LLM types under `lib/llm/` if needed).
2. Register parser in `lib/game/stepContentValidation.ts`.
3. Add branch in `lib/game/scoring/evaluateTaskAttempt.ts` if scored server-side.
4. Wire scene completion in `game-progress-service` (run attempt/advance paths).
5. Add Vitest coverage for schema + scoring edge cases.

**Web client (phased — mirror MC rollout):**

1. **Data** — Strict Zod + `catalog-loader.ts` fail-at-load for invalid fixtures; 1–2 fixture scenes; extend `chapter-*-smoke-content.test.ts`.
2. **UI** — `TaskPanel` dispatch → `components/game/tasks/types/<kebab>/`; shared `TaskBodyLayout` + `TaskChrome`. Never read `correct*` fields in client code.
3. **Play** — Type-specific draft on `/play`, `sync*DraftForScene` after snapshot/advance/retreat/attempt, `build*Attempt`, client pre-submit validation where needed; wire `SceneRouter` when multi-step chrome is needed. **Drag-drop:** `validateDragDropDraft` is a no-op — **Controlla** always POSTs partial layouts (empty zones / cards still in bank); `evaluateDragDrop` scores server-side. **Matching / MC / cloze:** block Controlla until every pair, question, or gap is filled. **Cloze:** use `clozePreserveForTransition` so answers stay after a successful attempt when the scene id is unchanged (overlay without advance).
4. **Docs & tests** — `docs/quest-scene-content-format.md`; pure helpers under `lib/game/tasks/<kebab>/`.
5. **Snapshot answers** — Strip server-only keys in `sceneToDto` via `sanitize-task-payload-for-client.ts` (MC, matching — including **`poolPairs` / `sampleSize` / `correctPairs`**, drag_drop, **free_text** strips `evaluation` rubric; **error_spotting** strips `isError` and `acceptedCorrections`; **cloze** strips `correctAnswers` on gap segments). Add a `*ClientContentSchema` and parse it in the type normalizer after sanitize—**never** use the full server/LLM schema on snapshots (`parseFreitextClientContent` for freetext, `parseClozeClientContent` for cloze). Full payload stays in catalog load and server eval only. Matching pool scenes rely on **`resolveCatalogSceneForRun`** before `sceneToDto` (materialized payload only).

**Task shell copy (web):** `content.title` → play header (single line, ellipsis + `title` tooltip). `content.instruction` → `TaskChrome` only via `readTaskChromeInstructions()` (`lib/game/scene-display.ts`, `TASK_PLAY_INSTRUCTION_TEXT`). Task-level or per-item prompt → `TaskBodyLayout` only (`TASK_PLAY_PROMPT_TEXT`). Payload reads via `getTaskPayload(scene)` (`lib/game/get-task-payload.ts`). Do not merge instruction + prompt. Footer buttons stay fixed; only the options/list region scrolls inside `TaskBodyLayout`. **Drag-drop layout:** source bank in `TaskBodyLayout` `beforeScroll` (fixed); category drop zones in scrollable `children`; pointer drag uses `document` listeners + portal preview on `body` (see web-task-type-ui `shell-ux-patterns`).

**Play-scene typography (`lib/game/task-typography.ts`):** Single source for task + story body size — do **not** hardcode `text-sm` / `text-base` on play task UI. `StoryPanel` uses `TASK_PLAY_BODY_TEXT` (`text-base leading-relaxed md:text-lg`). Map: instruction → `TASK_PLAY_INSTRUCTION_TEXT`; prompt → `TASK_PLAY_PROMPT_TEXT`; exercise copy (options, cards, chips, textarea) → `TASK_PLAY_BODY_TEXT`; pre-submit validation → `TASK_PLAY_VALIDATION_ERROR_TEXT` (meta size, red); content mismatch → `TASK_PLAY_ERROR_TEXT`; meta hints (progress, drag hints, char counts) → `TASK_PLAY_META_TEXT` (`text-sm md:text-base`, muted); column/category labels → `TASK_PLAY_SECTION_LABEL_TEXT`. **Inline cloze gaps and error-spotting correction fields** → `TASK_PLAY_INLINE_FIELD_TEXT` (`leading-none`) — not `TASK_PLAY_BODY_TEXT` (tailwind-merge lets `leading-relaxed` override `leading-none` and breaks baseline alignment). Compose with `cn()` from `@/lib/utils`.

**Multi-item scenes (optional):** Reuse shell **Avanti** / **Indietro** in `SceneRouter` (see `getMcQuestionNavState` in `lib/game/tasks/multiple-choice/mc-question-nav.ts`)—no in-task Precedente/Prossima rows. **Avanti** until the last item, then **Controlla**; **Indietro** walks items before scene retreat. Submit validates all items; on failure jump to first incomplete with error under the prompt.

### Hub screens (menu destinations)

Mirror **`app/(game)/leaderboard/page.tsx`**: client page + `HubPage` (`title`, `onBack` → `/menu`, `className="flex flex-col overflow-hidden"`) + thin `components/game/screens/*View.tsx`. Link from **`MainMenuActions.tsx`**. Session gate is **`app/(game)/layout.tsx`** only—do not duplicate auth on the page.

- **Views without hooks** may omit `"use client"` (e.g. `ShopView.tsx` imported from the client page).
- **Empty hub panels** still need a labelled region (`<section aria-labelledby="…">`) and Italian placeholder copy until real content ships.
- Update **`docs/web-game-ui-architecture.md`** and **`docs/background-transitions-qa.md`** when adding a route.

**Shop (Negozio) — `/shop` (shell today):** Entry for future **room preview** and **furnishing** paid with **wallet pizza slices** (`components/game/screens/ShopView.tsx`). `QuestHud` via `useBootstrap` in the header (same as chapter hubs). No shop API or spend logic yet. When purchases ship: extend `ShopView`, add **`lib/game/services/*`** + **`app/api/game/*`** routes; **never** client-only spend or owned-item state. Room layout persistence (if needed) belongs in Supabase via repository, not local-only stores.

### Design system (implementation)

- **Image-driven:** Backgrounds and chrome use authored asset keys, not only CSS.
- **Static backgrounds** — hubs (main menu, chapter map).
- **Dynamic backgrounds** — chapter/quest/step contexts from content.
- **Tokens** — central typography, colour, spacing, radii, shadows (after Tailwind/shadcn init per setup plan). Play task/story readable copy: `lib/game/task-typography.ts` (see task-shell typography in **Adding a task type**).
- **Schemas:** `lib/game/schemas/gameArtAssetSchema.ts` and task payloads that reference `sceneBackgroundAsset`.

**Background hosts (no per-page remount):** One `GameBackground` per route segment — do **not** wrap individual auth/hub/play pages with their own `GameBackground`.

| Segment | Host | Keys |
| ------- | ---- | ---- |
| Auth | `app/(auth)/layout.tsx` | `authBackgroundKeyForPath()` + `authBackgroundPreloadKeys` in `lib/game/content/hub-background-keys.ts` |
| Game hubs | `HubBackgroundHost` in `app/(game)/layout.tsx` (not `/play`) | `useRegisterHubBackground` / `HubPage` props |
| Play | `app/(game)/play/page.tsx` only | `QuestShell` is content-only; `run.currentScene.background` + preload `run.nextSceneBackground` |

Pipeline: `resolveAssetUrl` → `preloadAssetUrl` → dual-layer crossfade in `components/game/layout/GameBackground.tsx` (stale-async guard on `activeTargetUrlRef`). Files: `public/content-assets/` (see README). QA: `docs/background-transitions-qa.md`. Do **not** use `loading="lazy"` on full-viewport backgrounds.

**Documento overlay (`ReferenceDocumentOverlay`):** No extra `game-panel` / bordered inner box around the full scroll body; optional bordered **per-figure** cards. Figures use `aspect-[4/3] w-full` — do **not** add `max-h-*` on the same node (caps height but not width → flat “wide” frames). Single figure: `max-w-sm` centered; galleries: `md:grid-cols-2`. `resolveAssetUrl` is **synchronous** (`string | null`); use `useMemo`, not `useEffect` + `.then()`.

Do not sprinkle one-off colours in feature PRs; extend tokens or shared UI primitives.

### CORS and proxy

`proxy.ts` applies CORS to `/api/`* (OPTIONS + response headers). Configure `CORS_ALLOWED_ORIGINS` for deployed clients.

---

## Development guidelines

### Backend (Route Handlers + `lib/`)

- Use `export const runtime = "nodejs"` on API routes that touch Supabase/crypto.
- Never log raw bearer tokens or passwords.
- Prefer structured `jsonError(status, message, code?, details?)` over throwing for expected client errors.
- Validate catalog and scene payloads at loader/service boundaries (`contentCatalogSchema`, `collectStepPayloadErrors` where used); do not weaken Zod silently.

### Frontend

- Shell shipped: `app/(auth)/`, `app/(game)/`, `components/game/*` — see `docs/web-game-ui-architecture.md`.
- Task scenes use `TaskChrome` + `TaskBodyLayout` for copy hierarchy and scroll regions — see **Adding a task type** and web-task-type-ui skill.
- Add shadcn primitives via `npx shadcn@latest add …`; extend `app/globals.css` tokens rather than one-off colours.
- Italian player-facing strings (product skill); English for code and committed docs.
- Client calls same-origin `/api/*` through `lib/api-client.ts` with bearer from `session-context`.
- Follow **State management**: Server Components where reads are server-assembled; `useState` for drafts on `/play`; refetch bootstrap/snapshot after mutations.
- **Inline task inputs** (cloze gaps, error-spotting corrections): disable browser/password-manager autofill — `autoComplete="off"`, neutral per-field `name` (e.g. `cloze-${sceneId}-g${index}`), `data-1p-ignore` / `data-lpignore="true"`; see web-task-type-ui skill.
- Toasts only via `lib/game/toast-from-api.ts` for play-blocking errors (see **Error handling**).

### Tests

```bash
npm test              # all Vitest tests
npm run lint
npm run build
```

Co-locate tests as `*.test.ts` next to modules. Favor pure tests for scoring, schemas, and unlock math; service tests mock repository boundaries where already established. When changing unlock or bootstrap completion, extend `lib/game/unlock-display.test.ts` (chapter-qualified ids).

---

## Deployment

- **CI/CD:** `.github/workflows/deploy-azure.yml` — on push to `web-based-implementation`, `npm ci` → `npm run build` → Azure Web App (`enigma-di-bologna`).
- **Node:** 22.x in CI (align local Node with workflow when possible).
- **Secrets:** GitHub / Azure environment for `SUPABASE_SECRET_KEY`, publish profile, LLM keys—not in the repo.

---

## Related agent files


| File                                  | Role                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| `.cursor/skills/product/SKILL.md`     | Learner experience, progression, rewards, copy            |
| `.cursor/commands/apply-learnings.md` | Promote chat learnings into `LEARNINGS.md` / docs         |
| `.cursor/commands/review-code.md`     | Review checklist (update if still references old layouts) |
| `docs/web-stack-setup-plan.md`        | Stack upgrade checklist (mostly done)                     |
| `docs/web-game-ui-architecture.md`    | Web shell layout, screens, overlays, data flow            |
| `docs/quest-scene-content-format.md`  | `lib/content/` authoring spec                             |


