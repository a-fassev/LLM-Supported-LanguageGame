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

- **UI Toolkit:** Menus and quest shell use **UI Toolkit** (`UIDocument`, UXML/USS under `Assets/Resources/UI/LearningToolkit/`). `LearningToolkitBootstrap` wires shared `PanelSettings` / theme. Do not add **Canvas** / **uGUI** for these navigation screens.
- **Camera:** Menu, map, chapter/quest overview, and quest-shell scenes include an active **Main Camera**; mirror that when adding scenes to the same flow unless you intentionally use a different rendering setup.
- **UI design tokens:** Shared styling data lives in `UiDesignTokens` (`Assets/Scripts/Presentation/UiDesignTokens.cs`, ScriptableObject). `UiThemeProvider` exposes tokens at runtime; optional default asset at `Resources/UI/UiDesignTokens_Default`. Prefer USS theme classes under `Assets/Resources/UI/LearningToolkit/` for menus and quest shell instead of scattering literals in C#.
- **Wallet HUD (pizza + backpack pieces):** Displayed via UI Toolkit where the screen defines wallet chips (**ChapterOverview**, **Quest**, **AvatarShop**). **`MainMenu` may omit wallet labels** while bootstrap still refreshes session totals for later scenes.

**Quest shell task steps (patterns):**

- **UXML templates (layout) vs API payloads (content):** Step **layout** is authored in UI Builder under `Assets/Resources/UI/LearningToolkit/Templates/` (`Tasks/*`, `Cutscenes/*`). Runtime loads via `ToolkitStepUx` + `ToolkitStepTemplatePaths` (`TryMount` / `Instantiate`, then `Q<…>("name")`). C# owns parsing `contentJson`, validation, interaction, and filling named slots; **do not** rebuild static chrome in code. **Shell** controls (`Controlla` / `Weiter`, HUD, overlays) stay in `QuestShellScreen.uxml` / `QuestShellView` only—step templates must not duplicate them. Dynamic lists (options, drag tiles, cloze gaps) clone into named **host** elements (e.g. `mc-options-host`, `cloze-lines-host`). **No legacy dual-render path** after a step type is migrated. Authoring: [`docs/task-type-ui-guide.md`](docs/task-type-ui-guide.md), [`DOC/03-styling.md`](DOC/03-styling.md).
- **Single factory router:** `ToolkitStepFactory.Create` maps each `GameQuestStepDto` to an `IStepView`: non-task rows use `CutsceneToolkitStep`; task rows switch on `taskType` (`DragDrop`, `ClozeText`, `MultipleChoice`, `Matching`, `FreitextLlm`, `ErrorSpotting`, …). Unregistered types use `StubToolkitTaskStep` until a real UI exists.
- **Special Screen family:** `SpecialScreen`, `SpecialScreenSms`, `SpecialScreenMailEditor`, `SpecialScreenPhotoViewer`, and `SpecialScreenReader` all resolve to `SpecialScreenToolkitStep` (`IsSpecialScreenTaskType`). Adding another `SpecialScreen*` alias means extending that helper in `ToolkitStepFactory`, plus DTO/`content_json` alignment. New task types generally need a `*ToolkitStep` class, DTO shapes (often `ToolkitStepContentDtos.cs`), a factory case, and DB/API `content_json` kept in sync with `GameProgressContracts` and any Next.js validation.
- **Long-running task work:** `QuestShellView` injects `StepContext.presentBusyOverlay` / `dismissBusyOverlay` (same full-screen loading overlay as progression). Steps with slow HTTP (e.g. LLM evaluation) must use these instead of ad hoc spinners; composite hosts that clone `StepContext` for nested blocks (e.g. `SpecialScreenToolkitStep`) must forward both callbacks.

**Quest shell cutscenes and quest meta (narrative scaffolding):**

- **Cutscene `content_payload`:** Strict **`beats[]`** shape only (no legacy root `title`/`body`). Each beat has **`presentationMode`**: `narrator` | `npcDialog` | `innerMonologue` | `gameInfo`; optional **`npcCast[]`** for multiple NPCs in one cutscene step. Validated in [`cutsceneContentSchema.ts`](apps/web/lib/game/schemas/cutsceneContentSchema.ts); authoring detail in [`DOC/02-steps-and-rewards.md`](DOC/02-steps-and-rewards.md).
- **Local beat pager:** `CutsceneToolkitStep` implements **`ICutsceneBeatNavigator`**. `QuestShellView` **Weiter** calls `TryAdvanceBeat()` until the last beat, then **`advance_quest_cutscene_step`** (one DB cutscene row = one server advance). Optional per-beat **`autoAdvanceMs`** via `StepContext.coroutineHost` (shell `MonoBehaviour`).
- **Quest `meta_payload`:** Column on `game_quests` → API **`metaJson`** on bootstrap/start. Holds quest-wide chrome, not step content: **`referenceDocument`** (brochure modal on all steps in the run), **`flow.blockBack`**, **`flow.autoStartQuestSlug`**. Parsed in Unity via [`QuestMetaPayloadDto.cs`](Assets/Scripts/Application/QuestMetaPayloadDto.cs) / [`QuestMetaPayloadParser.cs`](Assets/Scripts/Application/QuestMetaPayloadParser.cs); Zod in [`questMetaPayloadSchema.ts`](apps/web/lib/game/schemas/questMetaPayloadSchema.ts).
- **Shell overlays:** `LearningToolkitReferenceDocumentModal`, `LearningToolkitPauseMenuModal` in [`LearningToolkitOverlays.cs`](Assets/Scripts/Presentation/LearningToolkitOverlays.cs); USS in [`cutscene-narrative.uss`](Assets/Resources/UI/LearningToolkit/cutscene-narrative.uss). Extend **`ICutsceneBeatNavigator`** for new cutscene CTA/navigation behavior—do not bypass with ad hoc shell logic.
- **Chapter 1 story authoring convention:** **Akt 1** = one `game_chapters` row; **Akt 1.x** = one `game_quests` row per story beat; multi-line dialog in one scene = multiple **`beats[]`** inside one cutscene step (not one DB row per spoken line).

### Web / auth API (`apps/web`)

- **Next.js** App Router API routes under `apps/web/app/api/auth/*` and `apps/web/app/api/game/*` (session-auth game bootstrap, quest start/resume, step completion, run finish).
- **Supabase:** database tables `student_accounts` / `student_sessions` plus canonical game tables (`game_chapters`, `game_quests` incl. **`meta_payload`**, `game_quest_steps`, `player_quest_runs`, `player_step_attempts`, `player_wallets`) defined in [`supabase/migrations/`](supabase/migrations/); apply migrations to your Supabase project. **Secret API key** (`SUPABASE_SECRET_KEY`, server-only) and URL only in `apps/web/.env.local` (never ship to Unity). See `apps/web/.env.example`.
  - **Game migration sequence:** Apply the numbered chain in full (see `supabase/migrations/`). The greenfield migration **drops game tables/functions** (`DROP`/CASCADE) before recreating chapter/quest/step schema plus seed rows. **`complete_quest_step_task`** uses a **four-parameter** signature `(account_id, run_id, step_id, p_awarded_slices)`: for **`reward_rules.pizza.mode = 'scored'`**, credited pizza is **`p_awarded_slices`** clamped to **0..maxSlices**; for **`flat`**, pizza slices come from **`reward_rules.pizza`** in SQL and the passed value is **not** used for pizza (see **`20260530120000_*`** and neighbors). Apply **`20260518141500_*`** before **`20260519120000_*`** (`advance_quest_cutscene_step`). If your database still has only a three-argument overload from an older deploy, also apply **`20260521153000_*`**. Do not cherry-pick a subset omitting **`20260518141500_*`**, or task completion RPCs will not exist yet.
- **Pizza rewards (authoritative):** Task `reward_rules.pizza` is **`flat`** (fixed slice count in DB JSON) or **`scored`** (integer slices derived on the server from performance). **Non–FreitextLlm** scored tasks: `POST .../steps/[stepId]/complete` may include **`attempt`** (task-type-shaped JSON); `completeQuestStepTask` in `apps/web/lib/game/services/game-progress-service.ts` runs `evaluateTaskAttempt` → `meetsScoredPizzaMinimum` → `slicesFromRatio` (`apps/web/lib/game/scoring/`), then passes the result as **`p_awarded_slices`**. The same JSON response includes **`taskItemsCorrect`** / **`taskItemsTotal`** (or **`-1`** when no discrete breakdown, e.g. flat pizza or FreitextLlm) for the quest-shell reward overlay copy. **FreitextLlm:** `.../evaluate` persists **`pizza_slices_award`** on **`player_freitext_llm_gates`**; `.../complete` redeems it with **`evaluationGateToken`**—**`minRatioToComplete`** (pizza rules) applies at evaluate time together with content **`passThreshold`**. **SpecialScreen:** server scoring only supports **`blockType`** **stub** / **cloze** / **error_spotting** (see `evaluateTaskAttempt`); stub-only `blocks[]` completes without minting pizza for non-exercises (`ratio` vs `pizzaRatio` in scoring). Unity: **`ITaskAttemptPayloadProvider`** + `QuestShellView` / `GameProgressApiClient` for attempt payloads when pizza is scored.
- **Progression integrity:** Multi-step game transitions (rewards, chapter/quest unlocks, step/run completion) are enforced with **Postgres RPC** and **RLS** where migrations define them—atomic server-side updates, not client-only state. Example: **`complete_quest_step_task`** credits **backpack pieces at most once per account per logical task key**; revisits/replays do not mint extra backpack credits on the server (engagement placeholders may still differ). When extending schema or currencies, mirror **HTTP DTO <-> `GameProgressContracts` <-> `GameSessionStateStore.SetLatestWalletTotals` <-> UI** like pizza totals. Pair API/RPC changes with resilient loading/error UI on the Unity side.
- Unity talks to the backend over HTTP only (`AuthApiClient` + `GameProgressApiClient` default `http://127.0.0.1:3000`).

If you extend the web stack (e.g. LLM task evaluation), keep **API keys server-side** and prefer a clear HTTP contract to the game client.

---

## Directory structure

Repository layout **as committed today**:

```text
LLM-Supported-LanguageGame/
├── AGENTS.md
├── DOC/                      # concise authoring docs (game config, step JSON/rewards, UI styling)
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
