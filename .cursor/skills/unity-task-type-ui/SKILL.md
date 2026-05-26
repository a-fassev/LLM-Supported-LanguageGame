---
name: unity-task-type-ui
description: >-
  Adds or extends Unity per-task-type step UI using UI Toolkit inside the quest shell:
  contentJson contract, IStepView implementations, ToolkitStepFactory wiring, UXML/USS.
  Use when adding a task type, changing StepContext/contentJson, or updating quest step UI.
---

# Unity task-type step UI (UI Toolkit)

Task steps render inside **`TaskShellScreen`** (`Assets/Resources/UI/LearningToolkit/TaskShellScreen.uxml`); cutscenes use **`CutShellScreen.uxml`**. **`QuestStepShellHost`** swaps shells in the **`Quest`** scene. The **`step-host`** `VisualElement` is cleared and populated at runtime.

**Layout = UXML templates** under `Assets/Resources/UI/LearningToolkit/Templates/`; **content = `contentJson`** from the API. Use **`ToolkitStepUx.TryMount`** / **`Instantiate`** and stable **`name`** anchors (see **`ToolkitStepTemplatePaths`**). Do not add a second shell primary button in step UXML. Styling: [`DOC/03-styling.md`](DOC/03-styling.md).

**UI Builder fixtures (Option B):** production task/cutscene templates may include Italian sample children under named **hosts** so designers style real structure in UI Builder. On **`Bind`**, call **`ToolkitStepUx.ClearHost(host)`** on every dynamic host first, then rebuild with **`ToolkitStepUx.InstantiatePart`** from **`Templates/Parts/*.uxml`** (register paths in **`ToolkitStepTemplatePaths`**). Runtime output must mirror fixture hierarchy and **`lg-*`** USS—do not hand-build divergent trees. Optional `lg-preview-sample` is editor-only; separate `*Preview.uxml` is not the default path.

Full narrative and **`contentJson`** tables: **`docs/task-type-ui-guide.md`**.

Composite **Special Screen** tasks (`SpecialScreen*`): see **`.cursor/skills/unity-special-screen-ui/SKILL.md`**.

## Flow

1. **`QuestStepShellHost`** routes to **`TaskShellPresenter`** or **`CutsceneShellPresenter`** → **`ToolkitStepFactory.Create(step, stepHost, coroutineHost)`** → **`IStepView.Bind(StepContext, …)`**.
   - **Cutscene** shell → **`CutsceneToolkitStep`**. **Task** shell → **`switch (taskType)`** to a concrete `*ToolkitStep`; unknown types → **`StubToolkitTaskStep`**.
2. Shell owns **Back**, **primary** (**Next** / **Controlla** / **Finish quest**), loading overlay, validation overlay, reward overlay (`LearningToolkitOverlays`).
3. Tasks submit via **`ISubmitFromShell.SubmitFromShell()`** when the learner taps **Controlla**. Cutscenes use shell **Weiter** (default label; beat/root `primaryCtaLabel` overrides)—see **Cutscenes** below.
4. Client validation uses **`StepContext.presentValidationMessage`** only (shell reward modal validation mode).
5. **Slow operations** (server round-trips, LLM gates): use **`StepContext.presentBusyOverlay(message)`** / **`dismissBusyOverlay()`** (injected by the shell from the same overlay as quest loading). Always **`dismiss`** on error and early exit. Do not add a second loading UI stack inside the step.

Successful task **`POST .../complete`** returns **`taskItemsCorrect`** / **`taskItemsTotal`** in **`GameCompleteTaskEnvelope`** when the server evaluated a scored attempt (otherwise **`-1`**). The shell uses these for Italian reward-overlay headlines (partial vs perfect), not for wallet math.

## Adding or extending a task type

1. **`taskType`** string must match API / DB (`game_quest_steps.task_type`). **`ToolkitStepFactory`** uses a **`switch`** — casing must match server payloads. Keep **`Assets/Scripts/Application/GameProgressContracts.cs`** (and any **`apps/web`** payload validators) aligned when introducing or renaming a type.

2. **Add UXML template(s)** under `Assets/Resources/UI/LearningToolkit/Templates/Tasks/` (or `Cutscenes/` for beat layouts). Put repeating rows/cards in **`Templates/Parts/`** when the same subtree is used for fixtures and runtime. Register paths in **`ToolkitStepTemplatePaths`**. Every bindable control needs a stable **`name`**; document protected names in UXML comments. Fixture samples belong **only** under hosts that **`ClearHost`** clears.

3. **Implement `IStepView`** (and **`ISubmitFromShell`** for tasks submitted by shell Controlla):
   - Place class under `Assets/Scripts/Presentation/Steps/` (e.g. `*ToolkitStep.cs`).
   - **Constructor**: **`ToolkitStepUx.TryMount(stepHost, path, rootName, out _root)`**; cache **`QueryRequired`** / **`QueryOptional`** results for hosts and labels.
   - **`Bind`**: parse **`context.contentJson`**; **`ClearHost`** on dynamic hosts; fill static slots; clone dynamic children with **`InstantiatePart`** (or structure-identical markup); avoid duplicate listeners on re-bind.
   - **`Teardown`**: **`RemoveFromHierarchy`** on mounted root; clear delegates / schedules.
   - **`SetInteractable`**: disable inputs during **`CompleteServerTaskRoutine`** / **`AdvanceCutsceneRoutine`**.

4. **Register in `ToolkitStepFactory`**: add a **`case "YourTaskType":`** returning your step class.

5. **Styling**: Prefer USS classes (`lg-*`) from `Assets/Resources/UI/LearningToolkit/` (`task-templates.uss` for shared step chrome). Runtime **`UiThemeProvider`** / **`UiDesignTokens`** only when USS cannot express the need.

6. **Stub / placeholder**: Unimplemented types use **`StubToolkitTaskStep`** until a real mechanic exists.

## Cutscenes (`step_kind: cutscene`)

- **Payload:** `contentJson` is **`beats[]`** only (Zod: `apps/web/lib/game/schemas/cutsceneContentSchema.ts`). Each beat: required **`presentationMode`** + **`body`**; optional `title`, `subtitle`, `speakerId`, `autoAdvanceMs`, `primaryCtaLabel`. Root optional **`npcCast[]`**, **`navigation`** (`blockBack`, `primaryCtaLabel`). No legacy root `title`/`body`.
- **Implementation:** `CutsceneToolkitStep` + **`ICutsceneBeatNavigator`**. **`CutsceneShellPresenter`** calls **`TryAdvanceBeat()`** on **Weiter** until the last beat, then **`AdvanceCutsceneRoutine`** / advance RPC. When **`IsContentValid`** is false, **Weiter** is disabled and the server step must not advance.
- **Client validation:** `TryDeserialize` mirrors web Zod (`presentationMode` enum, `npcDialog` + `speakerId`, cast membership when `npcCast` is non-empty).
- **`onCutsceneBeatChanged`:** `StepContext` callback — shell refreshes CTA / back chrome after local beat changes (incl. auto-advance).
- **`autoAdvanceMs`:** Beat auto-continues via coroutine on **`StepContext.coroutineHost`** (quest shell). Cancel on manual **Weiter** / teardown.
- **Quest meta (not in cutscene JSON):** `GameFlowController.ServerQuestMetaJson` from API **`metaJson`** — reference document on **task shell only**, pause menu on both shells, `flow.blockBack`, `flow.autoStartQuestSlug`. Do not duplicate brochure text in every task `contentJson`; use quest **`meta_payload.referenceDocument`**.
- **New shell/cutscene navigation:** Extend **`ICutsceneBeatNavigator`** and **`CutsceneShellPresenter`**—do not add parallel advance paths.

## Checklist

- [ ] UXML template(s) + **`Templates/Parts/`** where needed + **`ToolkitStepTemplatePaths`** entries; protected **`name`** slots unchanged vs C# queries; fixtures only under **`ClearHost`** targets.
- [ ] Stable **`contentJson`** aligned with backend.
- [ ] **`ToolkitStepFactory`** **`case`** for **`taskType`**.
- [ ] **`Bind` / `Teardown` / `SetInteractable`** correct; **`ISubmitFromShell`** for shell-driven submit.
- [ ] Validation only via **`presentValidationMessage`** (no second overlay stack).
- [ ] Long waits use **`presentBusyOverlay` / `dismissBusyOverlay`** only (no duplicate loaders).
- [ ] Play Mode: shell Controlla → API flow; wallet overlay after server success.

## Key paths

| Role | Path |
|------|------|
| Shell host | `Assets/Scripts/Presentation/QuestStepShellHost.cs` |
| Task shell | `Assets/Scripts/Presentation/TaskShellPresenter.cs` |
| Cutscene shell | `Assets/Scripts/Presentation/CutsceneShellPresenter.cs` |
| Shared runtime | `Assets/Scripts/Presentation/QuestShellSharedRuntime.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Contracts | `IStepView`, `ISubmitFromShell`, `ICutsceneBeatNavigator`, `StepContext`; `GameProgressContracts`, `QuestMetaPayloadDto` |
| Cutscene USS | `Assets/Resources/UI/LearningToolkit/cutscene-narrative.uss` |
| Step templates | `Assets/Resources/UI/LearningToolkit/Templates/` |
| Template loader | `ToolkitStepUx.cs`, `ToolkitStepTemplatePaths.cs` |
| UXML task shell | `Assets/Resources/UI/LearningToolkit/TaskShellScreen.uxml` |
| UXML cut shell | `Assets/Resources/UI/LearningToolkit/CutShellScreen.uxml` |
| Theme | `Assets/Resources/UI/LearningToolkit/*.uss`, `LearningMenusTheme.tss` |
