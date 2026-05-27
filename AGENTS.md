# Agent guidance

**Git branch for agent work:** Implement and commit **only** on `unity-implementation`. Do **not** do agent work on `main` or any other branch. Create this branch from `main` when needed (`git checkout main && git pull && git checkout -b unity-implementation`). At the start of every session, confirm you are on it: `git checkout unity-implementation`.

## Repository overview

The **committed** repository is a **Unity 6.4** project at the **repository root** (not under `apps/`). `git ls-files` is the source of truth for what ships in version control; extra folders in a local clone (for example `apps/` with leftover `node_modules` / build output) may be **untracked** and must not be treated as the canonical layout.


| Area | Path | Role |
| -------------------- | -------------------------------------------------------------------- | ---- |
| **Unity (2D / URP)** | `Assets/`, `Packages/`, `ProjectSettings/` | Game client — URP 2D, New Input System, multi-scene **navigation** (`Auth` -> `MainMenu` -> `ChapterOverview` -> `QuestOverview` -> reusable `Quest`; `Leaderboard` from main menu; `AvatarShop` from chapter overview via `GameFlowController`, returns to chapter overview). Editor: `6000.4.6f1` per `ProjectSettings/ProjectVersion.txt`. |
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
- **Navigation:** `Assets/Scripts/Application/GameFlowController.cs` loads `Auth`, `MainMenu`, `Leaderboard`, `ChapterOverview`, `QuestOverview`, `AvatarShop`, and a single reusable `Quest` scene. Content and progression are server-backed (`/api/game/*`) with DB-first chapter/quest/step data from Supabase. Presentation includes `AuthView`, `MainMenuView`, `LeaderboardView`, `ChapterOverviewView`, `QuestOverviewView`, `QuestStepShellHost` (task + cutscene shells), and `AvatarShopView` under `Assets/Scripts/Presentation/`. Keep `ProjectSettings/EditorBuildSettings.asset` aligned with scene names; preserve `GameFlowController` + `AuthApiClient` + `GameProgressApiClient` on the `GameFlow` object in `Auth` as `DontDestroyOnLoad` carries them into later scenes.

**Unity UI / scene conventions (navigation flow):**

- **UI Toolkit:** Menus and quest shell use **UI Toolkit** (`UIDocument`, UXML/USS under `Assets/Resources/UI/LearningToolkit/`). `LearningToolkitBootstrap` wires shared `PanelSettings` / theme. Do not add **Canvas** / **uGUI** for these navigation screens.
- **Camera:** Menu, map, chapter/quest overview, and quest-shell scenes include an active **Main Camera**; mirror that when adding scenes to the same flow unless you intentionally use a different rendering setup.
- **UI design tokens:** Shared styling data lives in `UiDesignTokens` (`Assets/Scripts/Presentation/UiDesignTokens.cs`, ScriptableObject). `UiThemeProvider` exposes tokens at runtime; optional default asset at `Resources/UI/UiDesignTokens_Default`. Prefer USS theme classes under `Assets/Resources/UI/LearningToolkit/` for menus and quest shell instead of scattering literals in C#.
- **Wallet HUD (pizza + backpack pieces):** Canonical structure in **`Templates/Parts/Navigation/NavigationWalletHudPart.uxml`**, composed via **`NavigationPageHeaderWithWalletPart`** (`ui:Template` / `ui:Instance` on **ChapterOverview**, **QuestOverview**, **task quest shell**, **AvatarShop**). Runtime values via **`WalletHudBinder`** + **`WalletUiTotals`**. **Cutscene steps hide the wallet** (story mode). **`MainMenu` may omit wallet labels** while bootstrap still refreshes session totals for later scenes. **Leaderboard** uses **`NavigationPageHeaderMinimalPart`** (no wallet).
- **Leaderboard screen:** `MainMenuScreen.uxml` exposes **`leaderboard-button`** (under **Continue**). `LeaderboardView` + `LeaderboardScreen.uxml` preview list/team rows via **`ui:Template` / `ui:Instance`** from `Templates/Parts/Leaderboard/LeaderboardPlayerRowPart.uxml` and `LeaderboardTeamSummaryPart.uxml`; runtime **`ToolkitStepUx.ClearHost`** + `ToolkitLeaderboardUx` rebuilds from API data. **Overall** lists all players by pizza total; **Teams** shows blue/red team totals plus the player list. Data from **`GET /api/game/leaderboard`** (initial load on open; **`refresh-button`** re-fetches in place). Pause chrome returns to main menu (`LearningToolkitPauseChromeBinder`). Editor: **Tools → Learning Toolkit → Validate UXML Template References** checks `ui:Template` `src` GUIDs/hash against `.meta` files and `ui:Instance` template names (auto-run on Learning Toolkit UXML import).

**Quest scene shell routing (one `Quest` scene, two shells):**

- **`QuestStepShellHost`** (`Assets/Scripts/Presentation/QuestStepShellHost.cs`) mounts **exactly one** shell per refresh: **`TaskShellPresenter`** + `Shells/TaskShellScreen.uxml` or **`CutsceneShellPresenter`** + `Shells/CutShellScreen.uxml`. Switching `step_kind` is a **UIDocument teardown/mount in the same scene**—not separate `Task`/`Cut` scenes.
- **Task shell** (current step is `task`, quest finish, or no step): quest title in header, wallet HUD, optional **reference document** button, task panel (`lg-game-panel`), **Controlla** / quest-finish primary, reward overlay after task complete.
- **Cut shell** (`step_kind = cutscene`): **Pause** (top) + full-stage **`step-host`** + **Weiter** (footer) only—no quest title, wallet, brochure, or task panel. Beat headlines come from **`contentJson` beats** only.
- **Shared:** `QuestShellSharedRuntime` + `QuestShellSessionState` hold overlays (loading, pause, reward, back confirm), pending advance / finish-run flags, and finish / auto-start quest coroutines. Overlays re-attach to each shell’s `overlay-plane` on mount. Layout: `Templates/Overlays/*.uxml` (UI Builder fixtures + `lg-preview-sample`); runtime via `Assets/Scripts/Presentation/Overlays/LearningToolkit*Overlay*.cs` + `ToolkitOverlayTemplatePaths` — do not rebuild overlay DOM in C#.
- **Extend the correct presenter:** task chrome → `TaskShellPresenter`; cutscene CTA / beat pager → `ICutsceneBeatNavigator` + `CutsceneShellPresenter`—do not add a third monolithic shell class.

**Quest shell task steps (patterns):**

- **UXML templates (layout) vs API payloads (content):** Step **layout** is authored in UI Builder under `Assets/Resources/UI/LearningToolkit/Templates/` (`Tasks/*`, `Cutscenes/*`, `Parts/*`, `SpecialScreens/*`). Runtime loads via `ToolkitStepUx` + `ToolkitStepTemplatePaths` (`TryMount` / `Instantiate`, then `Q<…>("name")`). C# owns parsing `contentJson`, validation, interaction, and filling named slots; **do not** rebuild static chrome in code. **Shell** controls (`Controlla` / `Weiter`, HUD, overlays) stay in `TaskShellScreen.uxml` / `CutShellScreen.uxml` and their presenters only—step templates must not duplicate them. **Single source for recurring UI:** each row/card/bubble lives only in **`Templates/Parts/*.uxml`**. Task templates compose full-task UI Builder previews with **`ui:Template`** + **`ui:Instance`** pointing at those part assets (GUID from the part `.meta`, `src` hash = part filename without `.uxml`, e.g. `#McOptionRowPart`)—**do not** copy duplicate fixture trees inline. On bind, **`ToolkitStepUx.ClearHost(host)`** then rebuild from live data via **`ToolkitStepUx.InstantiatePart`** (same part paths). Clear nested containers inside instantiated parts when the binder adds replacement children (e.g. drop-zone inner). Nested parts (e.g. a line row part instancing literal/gap parts) follow the same rule. Preview sample counts stay manual in the task template; JSON still drives runtime counts. Label-root parts may override preview text on **`ui:Instance`** (e.g. `text="Destra"`). Marked Error Spotting preview uses **`ErrorSpottingSlotMarkedPart.uxml`**. Run **Tools → Learning Toolkit → Validate UXML Template References** after moving part assets. Separate `*Preview.uxml` is not the default workflow. Authoring: [`docs/task-type-ui-guide.md`](docs/task-type-ui-guide.md), [`DOC/03-styling.md`](DOC/03-styling.md).
- **Single factory router:** `ToolkitStepFactory.Create` maps each `GameQuestStepDto` to an `IStepView`: non-task rows use `CutsceneToolkitStep`; task rows switch on `taskType` (`DragDrop`, `ClozeText`, `MultipleChoice`, `Matching`, `FreitextLlm`, `ErrorSpotting`, …). Unregistered types use `StubToolkitTaskStep` until a real UI exists.
- **Special Screen family:** `SpecialScreen`, `SpecialScreenSms`, `SpecialScreenMailEditor`, `SpecialScreenPhotoViewer`, and `SpecialScreenReader` all resolve to `SpecialScreenToolkitStep` (`IsSpecialScreenTaskType`). Adding another `SpecialScreen*` alias means extending that helper in `ToolkitStepFactory`, plus DTO/`content_json` alignment. New task types generally need a `*ToolkitStep` class, DTO shapes (often `ToolkitStepContentDtos.cs`), a factory case, and DB/API `content_json` kept in sync with `GameProgressContracts` and any Next.js validation.
- **Long-running task work:** Task/cutscene shells inject `StepContext.presentBusyOverlay` / `dismissBusyOverlay` (same full-screen loading overlay as progression). Steps with slow HTTP (e.g. LLM evaluation) must use these instead of ad hoc spinners; composite hosts that clone `StepContext` for nested blocks (e.g. `SpecialScreenToolkitStep`) must forward both callbacks.

**Quest shell cutscenes and quest meta (narrative scaffolding):**

- **Cutscene `content_payload`:** Strict **`beats[]`** shape only (no legacy root `title`/`body`). Each beat has **`presentationMode`**: `narrator` | `npcDialog` | `innerMonologue` | `gameInfo`; optional **`npcCast[]`** for multiple NPCs in one cutscene step. Validated in [`cutsceneContentSchema.ts`](apps/web/lib/game/schemas/cutsceneContentSchema.ts); authoring detail in [`DOC/02-steps-and-rewards.md`](DOC/02-steps-and-rewards.md).
- **Avatar beats (`innerMonologue` / `npcDialog`):** Fixed **25% `avatar-slot` + 75% `bubble-col`** in `CutsceneInnerMonologueBeat.uxml` / `CutsceneNpcDialogBeat.uxml` (`lg-cutscene-beat-row--playerLeft` = player left + thought bubble right; `--npcRight` = speech left + NPC right). Player portrait is **not** in beat JSON — `CutscenePlayerPortraitProvider` loads `Resources/UI/CutscenePortraits/Player/current`; NPCs use `npcCast[].portraitId` → `Resources/UI/CutscenePortraits/Npc/{id}`. **`CutsceneAvatarSlotBinder`** clears `avatar-slot` and sets `backgroundImage` or `lg-cutscene-avatar-slot--placeholder`. **`npcCast.side`** is schema-only for layout (Unity ignores it). `narrator` / `gameInfo` beats unchanged.
- **Local beat pager:** `CutsceneToolkitStep` implements **`ICutsceneBeatNavigator`**. `CutsceneShellPresenter` **Weiter** calls `TryAdvanceBeat()` until the last beat, then **`advance_quest_cutscene_step`** (one DB cutscene row = one server advance). Optional per-beat **`autoAdvanceMs`** via `StepContext.coroutineHost` (shell `MonoBehaviour`).
- **Quest `meta_payload`:** Column on `game_quests` → API **`metaJson`** on bootstrap/start. Holds quest-wide chrome, not step content: **`referenceDocument`** (brochure modal on **task shell** steps), **`flow.blockBack`**, **`flow.autoStartQuestSlug`**. Parsed in Unity via [`QuestMetaPayloadDto.cs`](Assets/Scripts/Application/QuestMetaPayloadDto.cs) / [`QuestMetaPayloadParser.cs`](Assets/Scripts/Application/QuestMetaPayloadParser.cs); Zod in [`questMetaPayloadSchema.ts`](apps/web/lib/game/schemas/questMetaPayloadSchema.ts).
- **Shell overlays:** `LearningToolkitReferenceDocumentModal`, `LearningToolkitPauseMenuModal` under [`Assets/Scripts/Presentation/Overlays/`](Assets/Scripts/Presentation/Overlays/); USS in [`cutscene-narrative.uss`](Assets/Resources/UI/LearningToolkit/cutscene-narrative.uss). Extend **`ICutsceneBeatNavigator`** for new cutscene CTA/navigation behavior—do not bypass with ad hoc shell logic.
- **Learning Toolkit folder layout:** navigation UXML under `Screens/`; quest shells under `Shells/`; recurring rows in `Templates/Parts/{Navigation|Leaderboard|ClozeText|MultipleChoice|DragDrop|Matching|ErrorSpotting|SpecialScreen|Common}/`; task layouts in `Templates/Tasks/{taskType}/`. See [`docs/ui-learning-toolkit-inventory.md`](docs/ui-learning-toolkit-inventory.md) §0.
- **Chapter 1 story authoring convention:** **Akt 1** = one `game_chapters` row; **Akt 1.x** = one `game_quests` row per story beat; multi-line dialog in one scene = multiple **`beats[]`** inside one cutscene step (not one DB row per spoken line).

### Web / auth API (`apps/web`)

- **Next.js** App Router API routes under `apps/web/app/api/auth/*` and `apps/web/app/api/game/*` (session-auth game bootstrap, quest start/resume, step completion, run finish, leaderboard).
- **Supabase:** database tables `student_accounts` (incl. **`team`**: `blue` | `red`) / `student_sessions` plus canonical game tables (`game_chapters`, `game_quests` incl. **`meta_payload`**, `game_quest_steps`, `player_quest_runs`, `player_step_attempts`, `player_wallets`) defined in [`supabase/migrations/`](supabase/migrations/); apply migrations to your Supabase project (Supabase MCP or CLI). **Secret API key** (`SUPABASE_SECRET_KEY`, server-only) and URL only in `apps/web/.env.local` (never ship to Unity). See `apps/web/.env.example`.
- **Team assignment (registration):** **Server-only** — Unity does not send or choose team. On insert into `student_accounts`, Postgres trigger **`student_accounts_set_team_on_insert`** sets `team` via **`assign_balanced_student_team()`** (assign to the smaller team; random on tie). Migration: **`20260602120000_student_accounts_team.sql`**. `/api/auth/register` may return `team` in the JSON response; test mirror: `apps/web/lib/auth/balancedTeamPick.ts`.
- **Leaderboard API:** `GET /api/game/leaderboard` (Bearer session) returns `self`, `overall` (players ranked by `player_wallets.total_slices`, tie-break username), and `teams` (aggregated slice totals per team). Service: `apps/web/lib/game/services/leaderboard-service.ts`; Unity DTOs in `GameProgressContracts` / `GameProgressApiClient.GetLeaderboard`.
  - **Game migration sequence:** Apply the numbered chain in full (see `supabase/migrations/`). The greenfield migration **drops game tables/functions** (`DROP`/CASCADE) before recreating chapter/quest/step schema plus seed rows. **`complete_quest_step_task`** uses a **four-parameter** signature `(account_id, run_id, step_id, p_awarded_slices)`: for **`reward_rules.pizza.mode = 'scored'`**, credited pizza is **`p_awarded_slices`** clamped to **0..maxSlices**; for **`flat`**, pizza slices come from **`reward_rules.pizza`** in SQL and the passed value is **not** used for pizza (see **`20260530120000_*`** and neighbors). Apply **`20260518141500_*`** before **`20260519120000_*`** (`advance_quest_cutscene_step`). If your database still has only a three-argument overload from an older deploy, also apply **`20260521153000_*`**. Do not cherry-pick a subset omitting **`20260518141500_*`**, or task completion RPCs will not exist yet.
- **Pizza rewards (authoritative):** Task `reward_rules.pizza` is **`flat`** (fixed slice count in DB JSON) or **`scored`** (integer slices derived on the server from performance). **Non–FreitextLlm** scored tasks: `POST .../steps/[stepId]/complete` may include **`attempt`** (task-type-shaped JSON); `completeQuestStepTask` in `apps/web/lib/game/services/game-progress-service.ts` runs `evaluateTaskAttempt` → `meetsScoredPizzaMinimum` → `slicesFromRatio` (`apps/web/lib/game/scoring/`), then passes the result as **`p_awarded_slices`**. The same JSON response includes **`taskItemsCorrect`** / **`taskItemsTotal`** (or **`-1`** when no discrete breakdown, e.g. flat pizza or FreitextLlm) for the quest-shell reward overlay copy. **FreitextLlm:** `.../evaluate` persists **`pizza_slices_award`** on **`player_freitext_llm_gates`**; `.../complete` redeems it with **`evaluationGateToken`**—**`minRatioToComplete`** (pizza rules) applies at evaluate time together with content **`passThreshold`**. **SpecialScreen:** server scoring only supports **`blockType`** **stub** / **cloze** / **error_spotting** (see `evaluateTaskAttempt`); stub-only `blocks[]` completes without minting pizza for non-exercises (`ratio` vs `pizzaRatio` in scoring). Unity: **`ITaskAttemptPayloadProvider`** + `TaskShellPresenter` / `GameProgressApiClient` for attempt payloads when pizza is scored.
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
│ ├── Scenes/                 # Boot, Auth, MainMenu, Leaderboard, ChapterOverview, QuestOverview, AvatarShop, Quest
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
