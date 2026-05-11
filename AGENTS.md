# Agent guidance

## Repository overview

This workspace is a **hybrid repo**:


| Area                 | Path                                       | Role                                                                                                                                    |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Unity (2D / URP)** | `apps/unity/Assets/`, `apps/unity/ProjectSettings/`, `apps/unity/Packages/` | Game client — scenes, input actions, render pipeline settings (Unity 6.4, editor `6000.4.6f1` per `apps/unity/ProjectSettings/ProjectVersion.txt`). |
| **Next.js app**      | `apps/web/`                                | LLM integration web stack — React 19, Next.js 16, TypeScript. Task evaluation (`app/api/tasks/evaluate`) plus a minimal local **WebGL play shell** (`app/game/page.tsx` → iframe `/unity-webgl/index.html`). |
| **Repo meta**        | `.gitignore`, `.gitattributes`             | Version control conventions.                                                                                                            |


Anything outside these folders in your clone may appear as new worktrees or local-only files; treat the table above as the committed project skeleton.

---

## Tech stack

### Game client (Unity)

- **Engine:** Unity 6.4 (`6000.4.6f1` per `apps/unity/ProjectSettings/ProjectVersion.txt`)
- **Rendering:** 2D **Universal Render Pipeline (URP)** — assets and pipeline settings under `apps/unity/Assets/Settings/` and `apps/unity/ProjectSettings/`
- **Input:** New Input System (`apps/unity/Assets/InputSystem_Actions.inputactions`)
- **Language:** C# — Unity scripts and gameplay code live under `apps/unity/Assets/`
- **Learning-game runtime (`apps/unity/Assets/_Project/`):** `GameBootstrap` ensures `GameRoot` + `SceneRouter` (entry via `apps/unity/Assets/_Project/Scenes/`). Level payloads are JSON under `apps/unity/Assets/_Project/Content/` (schema `Content/Schemas/level-content.schema.json`); `LevelContentLoader` tries **`Resources` first** (WebGL / browser), then falls back to `Application.dataPath` + filesystem outside WebGL. For reliable WebGL, mirror needed level JSON as `TextAsset` under `Assets/**/Resources/` (paths like `Content/Levels/...`) so catalog paths resolve. `ContentValidator` gates `LevelContentDocument` before play. Task flow uses hub/level controllers, `TaskSequenceOrchestrator`, and `LevelModeRegistry` (built-in + LLM modes). EditMode tests live in `apps/unity/Assets/_Project/Tests/EditMode/`.

### Web app (`apps/web/`)

- **Framework:** Next.js **16.x** (App Router)
- **UI:** React **19**, **TypeScript**
- **Tooling:** ESLint with `eslint-config-next`
- **Styling:** Minimal global styles via `app/globals.css` and Tailwind CSS base import
- **LLM / validation:** `@langchain/openai`, `@langchain/core`, `zod` — pinned versions in `package.json`
- **Scope:** No chat/KPI UI; web surface is a minimal start page, **`/game`** (iframe to static WebGL build), and `POST /api/tasks/evaluate`.
- **Local browser playtest:** Copy a Unity **WebGL** build output into `apps/web/public/unity-webgl/` (`index.html`, `Build/`, etc.); run `npm run dev:web` from repo root and open `http://localhost:3000/game`. Build artifacts are gitignored (folder keeps `.gitkeep`). Same-origin avoids CORS for `/api/tasks/evaluate`. Non-LLM tasks need no API; LLM tasks need valid server env (e.g. `NVIDIA_API_KEY` in `apps/web/.env.local`).

---

## Architecture principles

- **Clean separation:** Unity game client vs. Next.js task-evaluation app; avoid coupling unless there is an explicit integration contract (API, build step, shared types). **Exception (local UX only):** Next may serve a **static** WebGL folder under `public/unity-webgl` so testers use one origin for game + evaluate API — no game logic in Next.
- **LLM boundary:** Provider API keys and LangChain orchestration live **only** on the Next.js server (`apps/web/lib/llm/`, `apps/web/app/api/*`). Do not embed secrets in Unity or ship them to the browser client.
- **Task evaluation (in-game tasks):** Structured LLM scoring for task submissions uses only `POST /api/tasks/evaluate` (`app/api/tasks/evaluate/route.ts`, `lib/llm/taskEvaluationService.ts`, Zod types/schemas in `lib/llm/` and `lib/types/`). Unity calls it through `apps/unity/Assets/_Project/Runtime/Infrastructure/Networking/TaskEvaluationApiClient.cs` (endpoint URL, optional `x-task-eval-api-key`, timeouts/retries from `GameRuntimeConfig`). Server env `TASK_EVAL_API_KEY` is optional; when set it must match Unity’s `taskEvaluationApiKey`.
- **Task evaluation errors:** `apps/web/docs/task-evaluation-error-contract.md` is the canonical mapping from HTTP status + API `code` to Unity `AppErrorCode`. Treat API `message` as diagnostic; player-facing copy comes from `ErrorMessageCatalog`, not the response text.
- **Composition:** Prefer small, focused React components and Unity scripts with a single clear responsibility.
- **Type safety:** Strict TypeScript for the web app; consistent C# patterns in Unity scripts.
- **State:** Prefer React’s built-in `useState` / `useReducer` and context where shared UI state is needed; keep state as local as is practical.
- **Errors and UX:** Graceful handling and clear user feedback on the web; sensible logging in Unity.

### Unity client — persistence seam and runtime config

- **Local JSON (V1):** `JsonSaveStore` writes `SaveData` under `Application.persistentDataPath`. `PersistenceRepositoryFactory` wires `JsonProgressRepository` + `JsonPlayerProfileRepository`.
- **Provider selection:** When `ITBL_PERSISTENCE_PROVIDER` is set to a non-empty value, it selects the backend. When it is unset or whitespace-only, `GameRuntimeConfig.persistenceProviderWhenEnvUnset` is used (often empty → factory normalizes to `local`).
- **Future Supabase:** Implement `IProgressRepository` and `IPlayerProfileRepository` under `apps/unity/Assets/_Project/Runtime/Infrastructure/Persistence/` (e.g. `SupabaseProgressRepository`). Selecting provider `supabase` today logs and falls back to local until those classes exist.
- **Runtime config asset:** `GameRuntimeConfig` ScriptableObject (`apps/unity/Assets/_Project/Runtime/Core/GameRuntimeConfig.cs`) controls `resumeLastAttempt`, task-evaluation HTTP endpoint/timeouts/retries, optional persistence default, and optional user-facing error overrides (`ErrorMessageCatalog` fallback remains).

---

## Directory structure

Repository layout today (high level):

```text
LLM-Supported-LanguageGame/
├── AGENTS.md                 # Agent guidance (this file)
├── LEARNINGS.md              # Scratchpad for /save-learning → /apply-learnings (may be empty)
├── apps/
│   ├── unity/                # Unity project root
│   │   ├── Assets/
│   │   ├── Packages/
│   │   └── ProjectSettings/
│   └── web/                  # Next.js task-evaluation app
│       ├── app/
│       │   ├── api/tasks/evaluate/
│       │   ├── game/page.tsx    # iframe → /unity-webgl/index.html
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── public/
│       │   └── unity-webgl/     # local WebGL build drop (gitignored except .gitkeep)
│       ├── lib/
│       │   ├── config/
│       │   ├── llm/
│       │   └── types/
│       ├── tests/
│       ├── docs/
│       ├── .env.example
│       ├── eslint.config.mjs
│       ├── next.config.ts
│       ├── next-env.d.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/                 # shared packages (currently placeholder)
├── package.json              # root workspace scripts
├── package-lock.json         # root workspace lockfile
├── .gitignore
└── .gitattributes
```

Update this tree when the repository layout changes so it stays accurate.

---

## Core principle

**UNDERSTAND → CLARIFY → CODE** — Understand the current situation first, ask questions and suggest options, and only start coding after the user confirms the approach.

---

## 3-phase response protocol

### Phase 1: Understand current state

- Analyze existing code, setup, and tools
- Identify the problem, constraints, and non-negotiables
- Map what already exists vs. what’s missing

### Phase 2: Clarify and suggest (before coding)

- Ask clarifying questions (spec gaps, scope, integrations)
- Offer focused suggestions (tradeoffs, risks, simpler alternatives)
- No coding yet — wait for explicit confirmation

### Phase 3: Implement after confirmation

- Build what was agreed
- Follow the chosen approach
- No scope creep or unrequested extras

---

## Development philosophy

- **Clean and simple:** avoid over-engineering; minimal dependencies; clear names
- **Modern and modular:** single responsibility, separation of concerns, reusable pieces

---

## Key rules

- Do not jump straight to code; ground changes in the current codebase
- Questions and suggestions should fit **this** project, not generic lectures
- Wait for confirmation; do not assume unstated requirements
- Do not create documentation files unless the user explicitly asks (no unsolicited `*_SUMMARY.md`, `*_GUIDE.md`, `TODO.md`, etc.). Prefer answering in chat unless they asked for a doc or you’re adding real implementation that requires a file
- Before adding a file: *“Did the user ask for this file?”* If not, keep it in the reply

---

## Debugging

- Prefer existing dev surfaces: app terminal logs, test output, and browser DevTools
- Do not spin up extra servers whose only purpose is ad-hoc logging or debugging

---

## Skills, MCP, and project conventions

When the repo provides skills, rules, or MCP tools, use the ones that match the task (DB, CI, analytics, design system, etc.) instead of guessing.

**Mapping for this repo:**

- **Unity / game client:** follow Unity and C# conventions under `apps/unity/Assets/`; respect `apps/unity/ProjectSettings` and `apps/unity/Packages/manifest.json` when changing engine behavior or dependencies.
- **Next.js / LLM integration:** work in `apps/web/`; use `npm run dev`, `build`, `lint` as defined in that folder’s `package.json`.
- **Cross-cutting:** prefer small, reviewable changes; don’t mix unrelated Unity and web changes in one step unless the user ties them together.

---

## CLI tools (optional)

Prefer each vendor’s official CLI for local workflows (webhooks, auth, cloud resources) when it’s faster or clearer than doing everything through a UI or brittle one-off scripts.

**In use here (from the repo):**

- **npm** / **npx** — dependency install and scripts for `apps/web/` (Next.js, ESLint).

---

## Most important

- Favor simple, maintainable solutions
- Be concise; avoid long essays unless the user wants depth

