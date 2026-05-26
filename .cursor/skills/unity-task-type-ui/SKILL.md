---
name: unity-task-type-ui
description: >-
  Adds or extends Unity per-task-type step UI using UI Toolkit inside the quest shell:
  contentJson contract, IStepView implementations, ToolkitStepFactory wiring, UXML/USS.
  Use when adding a task type, changing StepContext/contentJson, or updating quest step UI.
---

# Unity task-type step UI (UI Toolkit)

Quest steps render inside **`QuestShellScreen`** (`Assets/Resources/UI/LearningToolkit/QuestShellScreen.uxml`): the **`step-host`** `VisualElement` is cleared and populated at runtime.

Full narrative and **`contentJson`** tables: **`docs/task-type-ui-guide.md`**.

Composite **Special Screen** tasks (`SpecialScreen*`): see **`.cursor/skills/unity-special-screen-ui/SKILL.md`**.

## Flow

1. **`QuestShellView`** loads server step → **`ToolkitStepFactory.Create(step, stepHost, coroutineHost)`** → **`IStepView.Bind(StepContext, …)`**.
   - **Non-task** steps → **`CutsceneToolkitStep`**. **Task** steps → **`switch (taskType)`** to a concrete `*ToolkitStep`; unknown types → **`StubToolkitTaskStep`**.
2. Shell owns **Back**, **primary** (**Next** / **Controlla** / **Finish quest**), loading overlay, validation overlay, reward overlay (`LearningToolkitOverlays`).
3. Tasks submit via **`ISubmitFromShell.SubmitFromShell()`** when the learner taps **Controlla**. Cutscenes use shell **Weiter** (default label; beat/root `primaryCtaLabel` overrides)—see **Cutscenes** below.
4. Client validation uses **`StepContext.presentValidationMessage`** only (shell reward modal validation mode).
5. **Slow operations** (server round-trips, LLM gates): use **`StepContext.presentBusyOverlay(message)`** / **`dismissBusyOverlay()`** (injected by the shell from the same overlay as quest loading). Always **`dismiss`** on error and early exit. Do not add a second loading UI stack inside the step.

Successful task **`POST .../complete`** returns **`taskItemsCorrect`** / **`taskItemsTotal`** in **`GameCompleteTaskEnvelope`** when the server evaluated a scored attempt (otherwise **`-1`**). The shell uses these for Italian reward-overlay headlines (partial vs perfect), not for wallet math.

## Adding or extending a task type

1. **`taskType`** string must match API / DB (`game_quest_steps.task_type`). **`ToolkitStepFactory`** uses a **`switch`** — casing must match server payloads. Keep **`Assets/Scripts/Application/GameProgressContracts.cs`** (and any **`apps/web`** payload validators) aligned when introducing or renaming a type.

2. **Implement `IStepView`** (and **`ISubmitFromShell`** for tasks submitted by shell Controlla):
   - Place class under `Assets/Scripts/Presentation/Steps/` (e.g. `*ToolkitStep.cs`).
   - **`Bind`**: parse **`context.contentJson`**, attach UI under **`stepHost`**, avoid duplicate listeners on re-bind.
   - **`Teardown`**: **`RemoveFromHierarchy`** on roots you own; clear delegates / schedules.
   - **`SetInteractable`**: disable inputs during **`CompleteServerTaskRoutine`** / **`AdvanceCutsceneRoutine`**.

3. **Register in `ToolkitStepFactory`**: add a **`case "YourTaskType":`** returning your step class.

4. **Styling**: Prefer USS classes (`lg-*`) from `Assets/Resources/UI/LearningToolkit/`. Runtime **`UiThemeProvider`** / **`UiDesignTokens`** may supply palette data where needed.

5. **Stub / placeholder**: Unimplemented types use **`StubToolkitTaskStep`** until a real mechanic exists.

## Cutscenes (`step_kind: cutscene`)

- **Payload:** `contentJson` is **`beats[]`** only (Zod: `apps/web/lib/game/schemas/cutsceneContentSchema.ts`). Each beat: required **`presentationMode`** + **`body`**; optional `title`, `subtitle`, `speakerId`, `autoAdvanceMs`, `primaryCtaLabel`. Root optional **`npcCast[]`**, **`navigation`** (`blockBack`, `primaryCtaLabel`). No legacy root `title`/`body`.
- **Implementation:** `CutsceneToolkitStep` + **`ICutsceneBeatNavigator`**. `QuestShellView` calls **`TryAdvanceBeat()`** on **Weiter** until the last beat, then existing **`AdvanceCutsceneRoutine`** / advance RPC. When **`IsContentValid`** is false, **Weiter** is disabled and the server step must not advance.
- **Client validation:** `TryDeserialize` mirrors web Zod (`presentationMode` enum, `npcDialog` + `speakerId`, cast membership when `npcCast` is non-empty).
- **`onCutsceneBeatChanged`:** `StepContext` callback — shell refreshes CTA / back chrome after local beat changes (incl. auto-advance).
- **`autoAdvanceMs`:** Beat auto-continues via coroutine on **`StepContext.coroutineHost`** (quest shell). Cancel on manual **Weiter** / teardown.
- **Quest meta (not in cutscene JSON):** `GameFlowController.ServerQuestMetaJson` from API **`metaJson`** — reference document button, pause menu, `flow.blockBack`, `flow.autoStartQuestSlug`. Do not duplicate brochure text in every task `contentJson`; use quest **`meta_payload.referenceDocument`**.
- **New shell/cutscene navigation:** Extend **`ICutsceneBeatNavigator`** and shell wiring in **`QuestShellView`**—do not add parallel advance paths.

## Checklist

- [ ] Stable **`contentJson`** aligned with backend.
- [ ] **`ToolkitStepFactory`** **`case`** for **`taskType`**.
- [ ] **`Bind` / `Teardown` / `SetInteractable`** correct; **`ISubmitFromShell`** for shell-driven submit.
- [ ] Validation only via **`presentValidationMessage`** (no second overlay stack).
- [ ] Long waits use **`presentBusyOverlay` / `dismissBusyOverlay`** only (no duplicate loaders).
- [ ] Play Mode: shell Controlla → API flow; wallet overlay after server success.

## Key paths

| Role | Path |
|------|------|
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Contracts | `IStepView`, `ISubmitFromShell`, `ICutsceneBeatNavigator`, `StepContext`; `GameProgressContracts`, `QuestMetaPayloadDto` |
| Cutscene USS | `Assets/Resources/UI/LearningToolkit/cutscene-narrative.uss` |
| UXML shell | `Assets/Resources/UI/LearningToolkit/QuestShellScreen.uxml` |
| Theme | `Assets/Resources/UI/LearningToolkit/*.uss`, `LearningMenusTheme.tss` |
