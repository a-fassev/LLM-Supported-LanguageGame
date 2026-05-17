---
name: unity-task-type-ui
description: >-
  Adds or extends Unity per-task-type step UI (Multiple Choice, Drag & Drop,
  cutscenes, etc.): contentJson contract, IStepView/TaskStepBase mechanics,
  prefabs, StepTemplateCatalog, QuestShellView fallback wiring. Use when the
  user adds a new task type, step template, quest step UI, contentJson shape,
  StepTemplateCatalog entry, ComposableStepRootView layered prefab, or points
  to docs/task-type-ui-guide.md.
---

# Unity task-type step UI

Editor-authored layouts; **`contentJson`** from the backend drives copy and data. Follow the repo order: **contract → C# mechanic → prefabs → catalog → verify**.

Full narrative, tables, and file index: **`docs/task-type-ui-guide.md`** at the repository root (read when details matter).

## Schema conventions (shell-centric tasks)

These match how **`QuestShellView`**, the game API, and Supabase steps are wired today.

### Domain identifiers

- **`taskType`**: string from the API / `game_quest_steps.task_type` (e.g. `ClozeText`, `MultipleChoice`). Must match:
  - **`StepTemplateCatalog`** entry (`taskType`, optional **`templateKey`** for variants).
  - **`QuestShellView.AddTaskViewComponent`** branch (exact string; `switch` is case-sensitive).
  - **`StepTemplateCatalog`** resolution is case-insensitive—still keep API and Unity consistent.
- **Prefab path**: referenced from the catalog asset (**`StepTemplateCatalog_Default`** or whatever **`QuestShellView`** uses), not hard-coded in shell code.

### Prefab structure & Unity YAML (task step prefabs)

- **Slim task prefab vs quest shell**: Task prefabs contain **mechanic UI only** (title, body, inputs, template roots, etc.). **Back**, **Check**, validation overlay, and **reward overlay** live on **`QuestShellView`**—do not re-add them inside the task prefab. When stripping old chrome, **do not remove functional hosts** (e.g. **`ClozeLinesHost`**, line/template roots) that the task **StepView** script serializes.

- **Keep every `fileID` resolvable**: If you delete YAML blocks by script or by hand, **all** pointers must still exist: root (and parent) **`m_Children`**, **`m_Father`**, and every **`MonoBehaviour`** / **`RectTransform`** serialized reference (e.g. **`linesHost: {fileID: …}`** on the view). A missing object causes **Broken text PPtr**, **`Transform child can't be loaded`**, and prefab **import failure**. Prefer editing in the Unity Editor; if you edit YAML, update parents and view fields in the **same** change set.

- **Runtime fallback is not authoring**: Some views implement helpers (e.g. **`EnsureLinesHost()`**) that spawn a host **`RectTransform`** + **`VerticalLayoutGroup`** when the reference is missing. That **does not fix** a broken prefab on disk: the asset should still contain the host so **import**, version control, and batch authoring stay valid. Use the same layout/anchors in prefab as the runtime path where possible.

- **Built-in UI script GUIDs**: When hand-authoring YAML for uGUI components (**`VerticalLayoutGroup`**, **`HorizontalLayoutGroup`**, etc.), take **`m_Script`** **`guid`** from **this project’s** package cache, e.g. `Library/PackageCache/com.unity.ugui@…/**/*.cs.meta`, for the **same Unity/editor version** as the repo—**do not guess** GUIDs across versions.

- **`IStepView` placement**: Shell resolves **`GetComponent<IStepView>()` on the catalog prefab root only**—either put the view on the root or use **`ComposableStepRootView`** + one inner mechanic (see guide).

### `Bind(StepContext)` and submit

- **`contentJson`**: pass through from context; parse in the view for **task UI** (prompts, options, cloze lines). This is **not** where wallet rewards are defined (see below).
- **`rewardRulesJson`**: include in **`StepContext`** only when the step UI **must** read authoring metadata client-side (e.g. copy hints). **Wallet awards** come from **`reward_rules`** on the server / complete-task API response, not from decoding JSON in the task view for payout.
- **Submit**: tasks complete through the shell **Check** button → **`ISubmitFromShell.SubmitFromShell()`** on the active step (or equivalent **`StepCompletionRequest`** from a custom **`IStepView`**). Do not add a second “submit” UX that bypasses the shell.

### Validation and overlays

- **Client validation errors** → **`PresentValidationFeedback`** / **`StepContext.presentValidationMessage`** (shell-owned overlay / validation mode). **Do not** add a separate task-local “result / error” overlay that duplicates the shell pattern.
- **Success rewards** (“Pizza gained …”) → shell reward overlay fed by **complete-task HTTP response** (`awardedSlices`, `awardedBackpackPieces`); not by parsing task **`contentJson`**.

## Workflow

1. **`contentJson`**: Agree fields with whoever owns `game_quest_steps` / API. Prefer **prefab structure + JSON data** over generic “widgets from JSON only.”

2. **Mechanic (C#)**: Add a view under `Assets/Scripts/Presentation/Steps/`—typically **`TaskStepBase`** (tasks) or **`CutsceneStepBase`** (cutscenes), or **`IStepView`** directly.
   - Implement **`Bind`**, **`Teardown`**, **`SetInteractable`**; for task types extending **`TaskStepBase`**, completion is triggered by the shell **Check** via **`ISubmitFromShell.SubmitFromShell()`** (or invoke **`onRequest(new StepCompletionRequest { requestComplete = true })`** yourself from custom **`IStepView`** implementations).
   - Use **`PresentValidationFeedback`** (**`TaskStepBase`** helper → **`presentValidationMessage`**) or **`StepContext.presentValidationMessage`** directly for client-side validation (shell overlay only)—not a second result overlay on the task prefab.
   - Guard **`Bind`** so listeners are not duplicated.
   - **`TaskStepBase.Bind`** is not virtual—extend via helpers, refactor, or implement **`IStepView`** without the base if you drop the scaffold.

3. **`QuestShellView.AddTaskViewComponent`**: Add a **`case "YourExactTaskType":`** with the **same casing** the shell uses (C# `switch` is **case-sensitive**). Required when the catalog misses and the empty **`RectTransform`** fallback runs. **`StepTemplateCatalog`** matching is **case-insensitive**—keep API strings consistent anyway.

4. **`TaskType.cs`**: Extend **`Assets/Scripts/Domain/TaskType.cs`** only if you keep enum / tooling parity with content authors.

5. **Prefab authoring**: **`QuestShellView`** calls **`GetComponent<IStepView>()` only on the catalog prefab root**—do not leave **`IStepView`** only on a deep child.
   - **Direct**: step script on the instantiated root.
   - **Layered**: root has **`ComposableStepRootView`**; assign **`Inner Step View`** to the nested mechanic’s **`IStepView`**. One inner view only. Optional misconfiguration banner / runtime fallback for bad wiring (see guide).

6. **`StepTemplateCatalog`**: Add entry on `Assets/Resources/Steps/StepTemplateCatalog_Default.asset` (or the asset **`QuestShellView`** references): **`taskType`** (API `taskType`), optional **`templateKey`** for variants, **`prefab`**.

7. **Styling**: Use **`UiThemeProvider`** + **`UiTokenApplier`** with **`UiDesignTokens`**; do not scatter one-off literals.

8. **Cutscenes vs tasks**: Shell **Next** advances cutscenes; shell **Check** calls **`ISubmitFromShell.SubmitFromShell()`** on task steps. Do not add duplicate navigation inside step prefabs.

## Checklist (new task type)

- [ ] **Domain**: stable **`taskType`** string (API + DB), optional **`templateKey`**, **`StepTemplateCatalog`** row with correct **prefab** reference, **`AddTaskViewComponent`** case for catalog-miss fallback.
- [ ] **`contentJson`** contract documented / aligned with `content_payload` (backend).
- [ ] **`IStepView`** (or **`TaskStepBase`**) **`Bind`**: use **`contentJson`** for UI data; **`rewardRulesJson`** only if the view truly needs it (rewards still authoritative on server).
- [ ] Submit path: shell **Check** → **`ISubmitFromShell`** / **`requestComplete`**—no duplicate task chrome.
- [ ] Validation: **`PresentValidationFeedback`** / **`presentValidationMessage`** only; **no** extra task-local result overlay for errors.
- [ ] Prefab: **root `IStepView`** or **`ComposableStepRootView`** + inner; **task children only** (no shell Back/Check/reward chrome); **all `fileID` / `m_Children` / view refs valid** after any YAML edit; **functional hosts** preserved; runtime **`Ensure*Host`** fallbacks not relied on as the only valid state.
- [ ] If YAML is hand-edited: uGUI **`m_Script` guids** match **`Library/PackageCache/com.unity.ugui@…`** for this Unity version.
- [ ] Tokens applied; layered prefab smoke-tested in Play Mode (`requestComplete` reaches shell).

## Key paths (quick lookup)

| Role | Path |
|------|------|
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
| Catalog | `Assets/Scripts/Presentation/Steps/StepTemplateCatalog.cs`, `Assets/Resources/Steps/StepTemplateCatalog_Default.asset` |
| Contracts | `Assets/Scripts/Presentation/Steps/IStepView.cs`, `ISubmitFromShell.cs`, `StepContext.cs` |
| Task baseline | `Assets/Scripts/Presentation/Steps/TaskStepBase.cs` |
| Layered root | `Assets/Scripts/Presentation/Steps/ComposableStepRootView.cs` |
| Domain id | `Assets/Scripts/Domain/TaskType.cs` |
