# Agent guidance

**Git branch for agent work:** Implement and commit **only** on `unity-implementation`. Do **not** do agent work on `main` or any other branch. Create this branch from `main` when needed (`git checkout main && git pull && git checkout -b unity-implementation`). At the start of every session, confirm you are on it: `git checkout unity-implementation`.

## Repository overview

The **committed** repository is a **Unity 6.4** project at the **repository root** (not under `apps/`). `git ls-files` is the source of truth for what ships in version control; extra folders in a local clone (for example `apps/` with leftover `node_modules` / build output) may be **untracked** and must not be treated as the canonical layout.


| Area | Path | Role |
| -------------------- | -------------------------------------------------------------------- | ---- |
| **Unity (2D / URP)** | `Assets/`, `Packages/`, `ProjectSettings/` | Game client — URP 2D, New Input System, multi-scene **navigation** (`Auth` -> `MainMenu` -> `ChapterOverview` -> `QuestOverview` -> reusable `Quest`; `AvatarShop` from chapter overview via `GameFlowController`, returns to chapter overview). Editor: `6000.4.6f1` per `ProjectSettings/ProjectVersion.txt`. |
| **Next.js (local API)** | `apps/web/` | Auth + game/progress API for Unity (`/api/auth/*`, `/api/game/*`), backed by Supabase Postgres; run with `npm run dev` (secrets via `.env.local` only). |
| **Planning / deferred work** | `.cursor/plans/` | Long-term backlog and milestones; **deferred scope** is consolidated in `long-term-todos.md` (anchor: foundation plan *Out of Scope*). Prefer extending that file over duplicating roadmaps here. |
| **Repo meta** | `.gitignore`, `.gitattributes`, `AGENTS.md` | Version control and agent conventions. |

**Deprecated layout note:** An older monorepo placed Unity under `apps/unity/`. **Open the Unity editor from this repository root** (folder containing `Assets` + `ProjectSettings`). The Next.js app lives at `apps/web/` (not `apps/unity/`).

---

## Tech stack (current tree)

### Unity (repository root)

- **Engine:** Unity 6.4 (`6000.4.6f1` per `ProjectSettings/ProjectVersion.txt`).
- **Rendering:** 2D **Universal Render Pipeline (URP)** — settings under `Assets/Settings/` and `ProjectSettings/` (e.g. `URPProjectSettings.asset`).
- **Input:** New Input System — `Assets/InputSystem_Actions.inputactions`.
- **Language:** C# — gameplay and editor scripts under `Assets/Scripts/` (`LanguageGame.Application`, `LanguageGame.Domain`, `LanguageGame.Presentation` for the navigation skeleton).
- **Navigation:** `Assets/Scripts/Application/GameFlowController.cs` loads `Auth`, `MainMenu`, `ChapterOverview`, `QuestOverview`, `AvatarShop`, and a single reusable `Quest` scene. Content and progression are server-backed (`/api/game/*`) with DB-first chapter/quest/step data from Supabase. Presentation includes `AuthView`, `MainMenuView`, `ChapterOverviewView`, `QuestOverviewView`, `QuestShellView`, and `AvatarShopView` under `Assets/Scripts/Presentation/`. Keep `ProjectSettings/EditorBuildSettings.asset` aligned with scene names; preserve `GameFlowController` + `AuthApiClient` + `GameProgressApiClient` on the `GameFlow` object in `Auth` as `DontDestroyOnLoad` carries them into later scenes.

**Unity UI / scene conventions (navigation flow):**

- **EventSystem:** With the New Input System, use the **Input System UI Input Module** on `EventSystem` in UI scenes — not the legacy standalone input module — so Canvas interactions work.
- **Camera:** Menu, map, chapter/quest overview, and quest-shell scenes include an active **Main Camera**; mirror that when adding scenes to the same flow unless you intentionally use a different rendering setup.
- **Scene-authored UI + runtime fallback (same Canvas):** If a view resolves refs from the hierarchy but may rebuild UI when incomplete (pattern used by `AuthView`), gate fallback on **all required controls** being present—not only “Canvas has no children”—otherwise partially drifted hierarchies fail silently. Before rebuilding under `Awake`, remove existing Canvas children with **`DestroyImmediate`**, not `Destroy`, so deferred teardown does not leave old widgets alive alongside new UI.
- **UI design tokens:** Shared uGUI styling lives in `UiDesignTokens` (`Assets/Scripts/Presentation/UiDesignTokens.cs`, ScriptableObject). `UiThemeProvider` exposes tokens for runtime builders; optional default asset at `Resources/UI/UiDesignTokens_Default`. Use `UiTokenApplier` helpers for typography and related properties—avoid scattering duplicate literals in new Presentation code.
- **Wallet HUD (pizza + backpack pieces):** **Scene-authored** Canvas widgets — **ChapterOverview**, **Quest**, **AvatarShop** mirror the pizza layout pattern for backpack totals (anchors/layering with shops and chrome). Prefer hierarchy tweaks over spawning separate runtime HUD objects. **`MainMenu` deliberately omits wallet labels** (`PizzaSlicesText` / `BackpackPiecesText`): bootstrap still refreshes session/flow for later scenes that show totals.

### Web / auth API (`apps/web`)

- **Next.js** App Router API routes under `apps/web/app/api/auth/*` and `apps/web/app/api/game/*` (session-auth game bootstrap, quest start/resume, step completion, run finish).
- **Supabase:** database tables `student_accounts` / `student_sessions` plus canonical game tables (`game_chapters`, `game_quests`, `game_quest_steps`, `player_quest_runs`, `player_step_attempts`, `player_wallets`) defined in [`supabase/migrations/`](supabase/migrations/); apply migrations to your Supabase project. **Secret API key** (`SUPABASE_SECRET_KEY`, server-only) and URL only in `apps/web/.env.local` (never ship to Unity). See `apps/web/.env.example`.
  - **Game migration sequence:** Apply the numbered chain in full (see `supabase/migrations/`). The greenfield migration **drops game tables/functions** (`DROP`/CASCADE) before recreating chapter/quest/step schema plus seed rows. **`complete_quest_step_task`** uses a **four-parameter** signature (legacy `p_awarded_slices` is ignored; pizza/backpack use step `reward_rules`) in **`20260518141500_*`**, immediately after greenfield and **before** **`20260519120000_*`** (`advance_quest_cutscene_step`). If your database still has only a three-argument overload from an older deploy, also apply **`20260521153000_*`**. Do not cherry-pick a subset omitting **`20260518141500_*`**, or task completion RPCs will not exist yet.
- **Progression integrity:** Multi-step game transitions (rewards, chapter/quest unlocks, step/run completion) are enforced with **Postgres RPC** and **RLS** where migrations define them—atomic server-side updates, not client-only state. Example: **`complete_quest_step_task`** credits **backpack pieces at most once per account per logical task key**; revisits/replays do not mint extra backpack credits on the server (engagement placeholders may still differ). When extending schema or currencies, mirror **HTTP DTO <-> `GameProgressContracts` <-> `GameSessionStateStore.SetLatestWalletTotals` <-> UI** like pizza totals. Pair API/RPC changes with resilient loading/error UI on the Unity side.
- Unity talks to the backend over HTTP only (`AuthApiClient` + `GameProgressApiClient` default `http://127.0.0.1:3000`).

If you extend the web stack (e.g. LLM task evaluation), keep **API keys server-side** and prefer a clear HTTP contract to the game client.

---

## Directory structure

Repository layout **as committed today**:

```text
LLM-Supported-LanguageGame/
├── AGENTS.md
├── LEARNINGS.md              # pending notes for /apply-learnings (may be empty)
├── supabase/migrations/      # Postgres schema for game progress (apply via Supabase CLI or SQL editor)
├── Assets/
│ ├── InputSystem_Actions.inputactions
│ ├── Data/                   # optional local authoring data (DB remains source of truth for live chapter/quest/step content)
│ ├── Scenes/                 # Boot, Auth, MainMenu, ChapterOverview, QuestOverview, AvatarShop, Quest
├── apps/
│ └── web/                    # Next.js API (`npm run dev`: auth + game); see `.env.example`
│ ├── Scripts/                # Application, Domain, Presentation
│ └── Settings/               # URP 2D render assets and template scenes
├── .cursor/                  # commands, skills, plans (not all tracked — use git status)
├── Packages/
│ ├── manifest.json
│ └── packages-lock.json
├── ProjectSettings/
├── .gitignore
└── .gitattributes
```

Update this tree when the repository layout changes.

---

## Core principle

**UNDERSTAND → CLARIFY → CODE** — Understand the current situation first, ask questions and suggest options, and only start coding after the user confirms the approach.

---

## 3-phase response protocol

### Phase 1: Understand current state

- Analyze existing code, setup, and tools
- Identify the problem, constraints, and non-negotiables
- Map what already exists vs. what's missing

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

- **Language:** Write **code** (identifiers, comments), **repository documentation** (`AGENTS.md`, `.cursor/` guidance, committed plan markdown), and **technical docs** in **English**. Conversation with the user may be in **German** when they prefer — that does not change the English-only rule for code and committed docs.
- Do not jump straight to code; ground changes in the current codebase
- Questions and suggestions should fit **this** project, not generic lectures
- Wait for confirmation; do not assume unstated requirements
- Do not create documentation files unless the user explicitly asks (no unsolicited `*_SUMMARY.md`, `*_GUIDE.md`, `TODO.md`, etc.). Prefer answering in chat unless they asked for a doc or you're adding real implementation that requires a file
- Before adding a file: *"Did the user ask for this file?"* If not, keep it in the reply

---

## Debugging

- Prefer existing dev surfaces: Unity Console, test output, and (when a web app exists) browser DevTools
- Do not spin up extra servers whose only purpose is ad-hoc logging or debugging

---

## Skills, MCP, and project conventions

When the repo provides skills, rules, or MCP tools, use the ones that match the task (DB, CI, analytics, design system, etc.) instead of guessing.

**Mapping for this repo:**

- **Unity / game client:** follow Unity and C# conventions under `Assets/`; respect `ProjectSettings/` and `Packages/manifest.json` when changing engine behavior or dependencies.
- **Future web / LLM integration:** when present, use that app's `package.json` scripts (`dev`, `build`, `lint`); keep secrets server-side.

---

## CLI tools (optional)

Prefer each vendor's official CLI for local workflows (webhooks, auth, cloud resources) when it's faster or clearer than doing everything through a UI or brittle one-off scripts.

**In use here (from the repo):**

- **Unity Editor** — primary client for this tree
- **npm** / **npx** — only when a `package.json` exists for a web or tooling subfolder

---

## Most important

- Favor simple, maintainable solutions
- Be concise; avoid long essays unless the user wants depth
