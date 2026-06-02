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
- **Server-authoritative game logic:** Scoring, unlocks, and progression live in `lib/` + Supabase—not in client-only rules
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
| **Supabase (MCP / plugin)** | Schema, SQL, RLS, Auth — Supabase skill + MCP when configured                          |
| **UI**                         | Tailwind v4, shadcn (`app/globals.css`, `components.json`) — add components via `npx shadcn@latest add` |


Optional CLIs when MCP is not enough: **GitHub** (`gh`) for PRs and CI; **Supabase CLI** for local DB/migrations (align with team workflow).

---

## Most important

- Keep changes **small and correct** — match existing patterns in `lib/` and `app/api/`.
- **Do not** put LLM or Supabase secrets in the client.
- **Validate** new step shapes with Zod and tests where behavior is non-obvious.
- **Ground** game behavior in `game-progress-service` and repository RPCs—not one-off route logic.

---

## Project architecture overview

### Tech stack


| Layer             | Choice                                 | Notes                                                               |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Framework         | **Next.js 16** App Router              | Repo root: `app/`, `lib/`, `middleware.ts`                          |
| Language / UI     | **TypeScript 6**, **React 19**         | Game UI growing; today mostly API + placeholder pages               |
| Styling           | **Tailwind CSS v4**, **shadcn/ui**     | `app/globals.css`, `components.json`, `lib/utils.ts` — no UI components in repo yet |
| Data / auth       | **Supabase** (`@supabase/supabase-js`) | Postgres + RLS in linked project; `SUPABASE_SECRET_KEY` server-only |
| Validation        | **Zod 4**                              | Step payloads, attempts, pizza rules                                |
| LLM               | **LangChain** + OpenAI-compatible API  | **FreitextLlm** evaluate only (`lib/llm/`)                          |
| Passwords         | **argon2**                             | Registration / login                                                |
| Tests             | **Vitest 4**                           | `npm test` — Node environment, `**/*.test.ts`                       |
| Lint              | **ESLint 9** + `eslint-config-next`    | `npm run lint` → `eslint .` (`next lint` removed in Next 16)        |


**Not in this repo:** Full Supabase schema and narrative SQL seeds (live in the linked Supabase project / migrations workflow).

### Architecture principles

- **Route handlers thin, services thick:** `app/api/`* → `lib/game/services/*` → `lib/game/repositories/*` → Supabase.
- **Session auth:** Bearer token in `Authorization` header; validated via `lib/require-session.ts` against `student_sessions` (hashed token).
- **Content validation at boundaries:** `lib/game/stepContentValidation.ts` + per-type schemas under `lib/game/schemas/`.
- **Deterministic scoring:** Task attempts evaluated in `lib/game/scoring/evaluateTaskAttempt.ts`; pizza rules in `lib/game/scoring/pizzaReward.ts`.
- **Image-driven UI (target):** Asset keys in content JSON; resolve in the client once the design system lands (see Design system).

### State management

Next.js serves **both** the web UI and `/api/*`. Treat the **server** as the source of truth for game rules, progression, and scoring. The browser holds only **short-lived UI state** and the session credential—not a copy of the full game world.

#### Three kinds of state


| Kind | Examples | Where it lives | Who owns updates |
| ---- | -------- | -------------- | ---------------- |
| **Player persistence** | Wallet, completed quests, active run, leaderboard | Supabase via `lib/game/repositories/*` | Services + RPCs only |
| **Content & rules** | Step payloads, unlock gates, scoring, LLM evaluate | `lib/` (+ DB or repo files for authored content) | Server at read/submit time |
| **UI-local** | Current answer draft, open documento overlay, form fields | Client component `useState` / `useReducer` | Component; discard on unmount unless submitted |

Do **not** mirror player persistence (chapters unlocked, run step index, pizza totals) in a global client store. After a successful mutation, refresh from the server (`router.refresh()`, a targeted refetch, or navigation) instead of patching client caches by hand.

#### Reads vs writes

- **Reads (lists, bootstrap, run snapshot):** Prefer **Server Components** and service/repository calls in `lib/` so data is assembled on the server and passed as props. Avoid client-side `fetch` loops for content the page already has.
- **Writes (login, start quest, complete step, evaluate Freitext):** Thin **Client Components** call same-origin `/api/*` (or Server Actions only if the team adopts them consistently). Keep route handlers thin; logic stays in `game-progress-service`.
- **Navigation context** (chapter id, quest id, run id when useful): Prefer the **URL** (`app/` segments or `searchParams`) so back/forward and deep links work without extra global state.

#### Session

- Store the bearer token in a **small, explicit** place (e.g. `sessionStorage` + a narrow React Context, or httpOnly cookie if introduced later)—not scattered across components.
- Gate client routes on `GET /api/auth/session`; on `401`, clear credentials and send the player to login.
- Never put Supabase service keys or LLM keys in client state.

#### Local UI state guidelines

- One quest step screen: local state for **in-progress input** until the player taps **Controlla** / submit; then POST to the API and use the response (and server refresh) for feedback and rewards.
- Cutscene/story steps: minimal state (current beat index only if the server does not drive it via `advance`).
- Shared chrome (pause, documento open): lift state only as high as needed—Context is fine for **session + shell chrome**, not for game progression.

#### Content source (DB vs repo)

Today, chapters/quests/steps are loaded from **Supabase** at bootstrap. Content may later live in **repo files** under `lib/content/` (still validated with Zod on the server). Either way, the **client receives DTOs** from the server/API—never treat raw content JSON as authoritative on the client.

#### Error handling (client boundary)

- APIs return `{ ok: false, error, code? }` via `jsonError` (`lib/http.ts`). User-facing Italian copy comes from `lib/game/clientMessages.ts`.
- Use a single **`lib/api-client.ts`** (or equivalent) to parse responses; map `code` when the UI must branch (e.g. stale evaluation token, quest locked).
- Do not invent a parallel error taxonomy in components—reuse server `error` / `code` and `clientMessages`.

**Inline (default):** Wrong password, empty answer, task feedback after **Controlla**, field validation—show **in context** (under the field, in the step panel, inline banner on the quest screen). These are normal play flow, not global alerts.

**Toasts (shadcn Sonner):** Reserve for **serious** failures that **block or derail active play**—not every small API rejection. Examples: bootstrap or run load failed (cannot continue), session expired mid-quest, game server unavailable (`gameServerUnavailable`), LLM evaluator down when Freitext is required, unrecoverable run/state conflict. Wire Sonner once in the root layout (`<Toaster />`); call from a thin helper that maps `code` → `clientMessages` when needed.

**Do not toast:** Per-attempt wrong answers, quest locked hints, rate limits on username suggest, validation on a single form field, or any error the child can fix on the same screen without losing progress context.

#### Anti-patterns

- Putting unlock/scoring/pizza logic only in the client.
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
│   └── skills/            # product, …
├── .github/workflows/     # deploy-azure.yml (push web-based-implementation)
├── app/
│   ├── api/auth/          # login, register, logout, session, suggest-username
│   ├── api/game/          # bootstrap, quests, runs, leaderboard
│   ├── layout.tsx
│   └── page.tsx           # Placeholder / growing game shell
├── lib/
│   ├── auth/              # balanced team pick at registration
│   ├── game/
│   │   ├── schemas/       # Zod content per task type + cutscene + game art
│   │   ├── scoring/       # evaluateTaskAttempt, pizzaReward
│   │   ├── services/      # game-progress-service, leaderboard-service
│   │   ├── repositories/  # Supabase access + RPC wrappers
│   │   └── stepContentValidation.ts
│   ├── llm/               # FreitextLlm schema, evaluation service, env
│   ├── require-session.ts
│   ├── supabase-admin.ts
│   └── http.ts, rate-limit.ts, …
├── docs/
│   └── web-stack-setup-plan.md   # Planned Tailwind + shadcn init
├── middleware.ts          # CORS for /api/*
├── AGENTS.md
├── LEARNINGS.md
└── package.json
```

**Note:** A duplicate tree may exist under `apps/web/` from an earlier layout. Treat **repo root** `app/` + `lib/` as canonical unless the user directs otherwise.

---

## Game domain (technical)

**Progression:** Sequential chapters → sequential quests → ordered **steps**. Optional **bonus** quests at chapter end (extra pizza; not required for next chapter). Unlock logic: `lib/game/chapterUnlockProgress.ts` + service bootstrap.

**Step contract (authoring mental model → DB today):**


| Authoring field               | DB / API (typical)                                                    |
| ----------------------------- | --------------------------------------------------------------------- |
| `scene_type` `story` | `task` | `step_kind` `cutscene` | `task`                                       |
| `screen_type`                 | `task_type` (tasks) or cutscene template                              |
| `content`                     | `content_payload` (JSONB), exposed as `contentJson` string to clients |
| `background`                  | Inside payload / `sceneBackgroundAsset` (see `gameArtAssetSchema`)    |
| `scoring`                     | `reward_rules` / `rewardRulesJson` (pizza rules)                      |


**Task types (server):** `ClozeText`, `MultipleChoice`, `DragDrop`, `Matching`, `ErrorSpotting`, `FreitextLlm`, plus `SpecialScreen`* variants. **Bonus** quests are content/flow, not necessarily a separate `task_type`.

**Scoring:**


| Currency         | Role                                   | Implementation                                                                                   |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Pizza slices** | Performance on tasks                   | `pizzaReward.ts`, evaluate routes, wallet `total_slices`                                         |
| **Backpack**     | Completion progress (product: 0–100 %) | Bootstrap exposes `totalBackpackPieces` today—align UI copy with product skill when building HUD |


**LLM:** Only `FreitextLlm` uses `lib/llm/freitextLlmEvaluationService.ts` (NVIDIA/OpenAI-compatible env in `.env.example`). Gate/retry behavior lives in progress service + repository.

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


**Game**


| Method | Path                                             | Purpose                                            |
| ------ | ------------------------------------------------ | -------------------------------------------------- |
| GET    | `/api/game/bootstrap`                            | Chapters, quests, steps, wallet totals, active run |
| POST   | `/api/game/quests/[questId]/start`               | Start or resume quest run                          |
| GET    | `/api/game/runs/[runId]`                         | Run + step materialization                         |
| POST   | `/api/game/runs/[runId]/steps/[stepId]/advance`  | Cutscene / story step forward                      |
| POST   | `/api/game/runs/[runId]/steps/[stepId]/complete` | Submit task attempt (deterministic types)          |
| POST   | `/api/game/runs/[runId]/steps/[stepId]/evaluate` | FreitextLlm judge + gate                           |
| POST   | `/api/game/runs/[runId]/finish`                  | Complete quest run                                 |
| GET    | `/api/game/leaderboard`                          | Overall / team rankings by pizza slices            |


JSON helpers: `lib/http.ts` (`jsonOk`, `jsonError`). User-facing message keys: `lib/game/clientMessages.ts`.

### Layer responsibilities


| Layer          | Responsibility                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Route**      | HTTP method, rate limit, `requireSessionAccount`, map status codes                                                       |
| **Service**    | `game-progress-service.ts` — bootstrap, start quest, advance, complete, evaluate, finish; payload validation errors      |
| **Repository** | `game-progress-repository.ts` — queries, RPCs (`rpcCompleteQuestStepTask`, `rpcAdvanceQuestCutsceneStep`, wallet, gates) |
| **Schemas**    | Parse/validate `content_payload` per `task_type`                                                                         |
| **Scoring**    | Pure functions + `evaluateTaskAttempt` for attempt JSON                                                                  |


### Adding a task type

1. Zod schema under `lib/game/schemas/` (LLM types under `lib/llm/` if needed).
2. Register parser in `lib/game/stepContentValidation.ts`.
3. Add branch in `lib/game/scoring/evaluateTaskAttempt.ts` if scored server-side.
4. Extend progress service / RPC usage if new completion semantics.
5. Add Vitest coverage for schema + scoring edge cases.
6. Client step renderer (when web quest UI exists).

### Design system (implementation)

- **Image-driven:** Backgrounds and chrome use authored asset keys, not only CSS.
- **Static backgrounds** — hubs (main menu, chapter map).
- **Dynamic backgrounds** — chapter/quest/step contexts from content.
- **Tokens** — central typography, colour, spacing, radii, shadows (after Tailwind/shadcn init per setup plan).
- **Schemas:** `lib/game/schemas/gameArtAssetSchema.ts` and task payloads that reference `sceneBackgroundAsset`.

Do not sprinkle one-off colours in feature PRs; extend tokens or shared UI primitives.

### CORS and middleware

`middleware.ts` applies CORS to `/api/`* (OPTIONS + response headers). Configure `CORS_ALLOWED_ORIGINS` for deployed clients.

---

## Development guidelines

### Backend (Route Handlers + `lib/`)

- Use `export const runtime = "nodejs"` on API routes that touch Supabase/crypto.
- Never log raw bearer tokens or passwords.
- Prefer structured `jsonError(status, message, code?, details?)` over throwing for expected client errors.
- Content errors at bootstrap: `collectStepPayloadErrors` — fix seeds/schemas, do not weaken validation silently.

### Frontend (in progress)

- Follow `docs/web-stack-setup-plan.md` before adding shadcn components ad hoc.
- Italian player-facing strings for game chrome (see product skill); English for code and committed docs.
- When adding pages, keep **game shell** concerns separate from **API** (client calls same-origin `/api/`* with bearer token).
- Follow **State management** above: Server Components + props for reads; `useState` for drafts; no global game state.
- Add `lib/api-client.ts` when the first client mutation ships; reuse `clientMessages` for display text.
- Install **Sonner** via shadcn when the UI foundation lands; use toasts only for serious, play-blocking errors (see **Error handling** under State management).

### Tests

```bash
npm test              # all Vitest tests
npm run lint
npm run build
```

Co-locate tests as `*.test.ts` next to modules. Favor pure tests for scoring, schemas, and unlock math; service tests mock repository boundaries where already established.

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
| `docs/web-stack-setup-plan.md`        | Approved-next stack upgrade checklist                     |


