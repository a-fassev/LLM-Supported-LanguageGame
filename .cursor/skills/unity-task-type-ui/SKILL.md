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

## Workflow

1. **`contentJson`**: Agree fields with whoever owns `game_quest_steps` / API. Prefer **prefab structure + JSON data** over generic “widgets from JSON only.”

2. **Mechanic (C#)**: Add a view under `Assets/Scripts/Presentation/Steps/`—typically **`TaskStepBase`** (tasks) or **`CutsceneStepBase`** (cutscenes), or **`IStepView`** directly.
   - Implement **`Bind`**, **`Teardown`**, **`SetInteractable`**; fire **`onRequest(new StepCompletionRequest { requestComplete = true })`** when the learner finishes (or `requestBackToChapters` when leaving).
   - Guard **`Bind`** so listeners are not duplicated.
   - **`TaskStepBase.Bind`** is not virtual—extend via helpers, refactor, or implement **`IStepView`** without the base if you drop the scaffold.

3. **`QuestShellView.AddTaskViewComponent`**: Add a **`case "YourExactTaskType":`** with the **same casing** the shell uses (C# `switch` is **case-sensitive**). Required when the catalog misses and the empty **`RectTransform`** fallback runs. **`StepTemplateCatalog`** matching is **case-insensitive**—keep API strings consistent anyway.

4. **`TaskType.cs`**: Extend **`Assets/Scripts/Domain/TaskType.cs`** only if you keep enum / tooling parity with content authors.

5. **Prefab authoring**: **`QuestShellView`** calls **`GetComponent<IStepView>()` only on the catalog prefab root**—do not leave **`IStepView`** only on a deep child.
   - **Direct**: step script on the instantiated root.
   - **Layered**: root has **`ComposableStepRootView`**; assign **`Inner Step View`** to the nested mechanic’s **`IStepView`**. One inner view only. Optional misconfiguration banner / runtime fallback for bad wiring (see guide).

6. **`StepTemplateCatalog`**: Add entry on `Assets/Resources/Steps/StepTemplateCatalog_Default.asset` (or the asset **`QuestShellView`** references): **`taskType`** (API `taskType`), optional **`templateKey`** for variants, **`prefab`**.

7. **Styling**: Use **`UiThemeProvider`** + **`UiTokenApplier`** with **`UiDesignTokens`**; do not scatter one-off literals.

8. **Cutscenes vs tasks**: Respect **`suppressHostedContinueNavigation`** / shell **Next**; tasks hide shell **nextTaskButton**—completion is inside the step (**Check** / `requestComplete`).

## Checklist (new task type)

- [ ] Stable **`contentJson`** contract (backend aligned).
- [ ] **`IStepView`** implementation + **`AddTaskViewComponent`** case.
- [ ] Prefab: **Direct** root **`IStepView`** **or** **`ComposableStepRootView`** + nested mechanic.
- [ ] **`StepTemplateCatalog`** row (`taskType` / `templateKey` + prefab).
- [ ] Tokens applied; layered prefab smoke-tested in Play Mode (`requestComplete` reaches shell).

## Key paths (quick lookup)

| Role | Path |
|------|------|
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
| Catalog | `Assets/Scripts/Presentation/Steps/StepTemplateCatalog.cs`, `Assets/Resources/Steps/StepTemplateCatalog_Default.asset` |
| Contracts | `Assets/Scripts/Presentation/Steps/IStepView.cs`, `StepContext.cs` |
| Task baseline | `Assets/Scripts/Presentation/Steps/TaskStepBase.cs` |
| Layered root | `Assets/Scripts/Presentation/Steps/ComposableStepRootView.cs` |
| Domain id | `Assets/Scripts/Domain/TaskType.cs` |
