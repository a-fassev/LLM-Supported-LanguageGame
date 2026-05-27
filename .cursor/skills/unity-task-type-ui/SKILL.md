---
name: unity-task-type-ui
description: >-
  Adds or extends Unity per-task-type step UI using UI Toolkit inside the quest shell:
  contentJson contract, IStepView implementations, ToolkitStepFactory wiring, UXML/USS.
  Use when adding a task type, changing StepContext/contentJson, or updating quest step UI.
---

# Unity task-type step UI (UI Toolkit)

Task steps render inside **`TaskShellScreen`** (`Assets/Resources/UI/LearningToolkit/Shells/TaskShellScreen.uxml`); cutscenes use **`CutShellScreen.uxml`**. **`QuestStepShellHost`** swaps shells in the **`Quest`** scene. The **`step-host`** `VisualElement` is cleared and populated at runtime.

**Layout = UXML templates** under `Assets/Resources/UI/LearningToolkit/Templates/`; **content = `contentJson`** from the API. Use **`ToolkitStepUx.TryMount`** / **`Instantiate`** and stable **`name`** anchors (see **`ToolkitStepTemplatePaths`**). **Shell overlays** (pause, reward, loading, …): `Templates/Overlays/*.uxml` + `ToolkitOverlayTemplatePaths` + classes under `Assets/Scripts/Presentation/Overlays/` — same Option B fixtures; do not rebuild overlay DOM in C#. Do not add a second shell primary button in step UXML. Styling: [`DOC/03-styling.md`](DOC/03-styling.md).

**GameArt media:** Sprites under `Assets/Resources/UI/GameArt/`. Step JSON may set **`sceneBackgroundAsset`** (full-step background; shells bind `scene-background-host` via **`ToolkitSceneBackgroundBinder`**) and per-item **`assetId`** (bind with **`ToolkitStepMediaBinder`**; keep **`imageUrl`** only as legacy fallback). Constants and defaults: **`GameArtAssetKeys`** (`TryNormalizeGameArtKey` mirrors web Zod). New static keys: add PNG under `GameArt/`, run **`scripts/populate-gameart-placeholders.py`** when using placeholder masters. Pair new fields with Zod in **`apps/web/lib/game/stepContentValidation.ts`**.

**Scene backgrounds (shell / navigation UXML):** Root `lg-scene-bg-root lg-gameart-bg--{screen}` + child `scene-background-host` (`lg-scene-background-host`); content column uses **`lg-fill-screen--transparent`** (not `lg-fill-screen`). USS previews in `game-art-backgrounds.uss`; runtime via **`ToolkitNavigationScreenBinder`** (nav) or **`BindFromContentJson`** (per-step JSON on host only). New navigation screen: add `lg-gameart-bg--*` rules in USS, keys in **`GameArtAssetKeys`**, call `Apply*Screen` in the view `Awake`. Theme: **`LearningMenusTheme.tss`** / **`LearningMenusPanelSettings`** for UI Builder.

**Single-source parts + UI Builder preview:** recurring row/card/bubble markup lives only in **`Templates/Parts/{domain}/*.uxml`** (e.g. `Parts/MultipleChoice/McOptionRowPart.uxml`). Task templates under **`Templates/Tasks/{taskType}/`** compose previews with **`ui:Template`** ( `src="project://database/Assets/Resources/UI/LearningToolkit/Templates/Parts/{domain}/{Part}.uxml?fileID=9197481963319205126&amp;guid={from .meta}&amp;type=3#{Part}"` (hash = filename without `.uxml`, not the element `name=` anchor) ) and **`ui:Instance template="..."`** inside named **hosts**—never duplicate the same subtree inline. Nested parts (e.g. `ClozeLineRowPart` instancing literal/gap parts) use the same pattern. On **`Bind`**, **`ToolkitStepUx.ClearHost(host)`** on every dynamic host (and on nested containers inside instantiated parts before adding runtime children, e.g. drag-drop **`drag-drop-drop-zone`**), then rebuild with **`ToolkitStepUx.InstantiatePart`** from the same part paths (**`ToolkitStepTemplatePaths`**). Preview sample counts are manual in the task template; JSON drives runtime counts. Label-root parts: override preview copy on **`ui:Instance`** (e.g. `text="Destra"`). Error Spotting marked-slot preview uses **`ErrorSpottingSlotMarkedPart.uxml`** (slot + inline-field instances). Editor menu **Tools → Learning Toolkit → Validate UXML Template References** checks `ui:Template` `src` GUIDs against part `.meta` files and that each `ui:Instance template="…"` is declared in the same UXML; imports under `LearningToolkit/` log failures automatically. Optional `lg-preview-sample` is editor-only; separate `*Preview.uxml` is not the default path.

Full narrative and **`contentJson`** tables: **`docs/task-type-ui-guide.md`**.

Composite **Special Screen** tasks (`SpecialScreen*`): see **`.cursor/skills/unity-special-screen-ui/SKILL.md`**.

## Shell routing (`Quest` scene)

| Shell | When | UXML | Presenter |
|-------|------|------|-----------|
| Task | `step.isTask`, pending quest finish, or no current step | `TaskShellScreen.uxml` | `TaskShellPresenter` |
| Cut | `step_kind = cutscene` | `CutShellScreen.uxml` | `CutsceneShellPresenter` |

`QuestStepShellHost` tears down one `UIDocument` and mounts the other when the active step type changes. **`QuestShellSharedRuntime`** owns shared overlays and session flags (`PendingFinishRunId`, reward pending advance); overlays attach to the active shell’s `overlay-plane` on each mount.

## Flow

1. **`QuestStepShellHost`** routes to **`TaskShellPresenter`** or **`CutsceneShellPresenter`** → **`ToolkitStepFactory.Create(step, stepHost, coroutineHost)`** → **`IStepView.Bind(StepContext, …)`**.
   - **Cutscene** shell → **`CutsceneToolkitStep`**. **Task** shell → **`switch (taskType)`** to a concrete `*ToolkitStep`; unknown types → **`StubToolkitTaskStep`**.
2. Shell owns **Back**, **primary** (**Next** / **Controlla** / **Finish quest**), loading overlay, validation overlay, reward overlay (`Presentation/Overlays/`).
3. Tasks submit via **`ISubmitFromShell.SubmitFromShell()`** when the learner taps **Controlla**. Cutscenes use shell **Weiter** (default label; beat/root `primaryCtaLabel` overrides)—see **Cutscenes** below.
4. Client validation uses **`StepContext.presentValidationMessage`** only (shell reward modal validation mode).
5. **Slow operations** (server round-trips, LLM gates): use **`StepContext.presentBusyOverlay(message)`** / **`dismissBusyOverlay()`** (injected by the shell from the same overlay as quest loading). Always **`dismiss`** on error and early exit. Do not add a second loading UI stack inside the step.

Successful task **`POST .../complete`** returns **`taskItemsCorrect`** / **`taskItemsTotal`** in **`GameCompleteTaskEnvelope`** when the server evaluated a scored attempt (otherwise **`-1`**). The shell uses these for Italian reward-overlay headlines (partial vs perfect), not for wallet math.

## Adding or extending a task type

1. **`taskType`** string must match API / DB (`game_quest_steps.task_type`). **`ToolkitStepFactory`** uses a **`switch`** — casing must match server payloads. Keep **`Assets/Scripts/Application/GameProgressContracts.cs`**, **`ToolkitStepContentDtos.cs`**, and **`apps/web/lib/game/stepContentValidation.ts`** (plus a Zod schema file) aligned when introducing or renaming a type.

2. **Add UXML template(s)** under `Assets/Resources/UI/LearningToolkit/Templates/Tasks/` (or `Cutscenes/` for beat layouts). Put repeating rows/cards in **`Templates/Parts/`**; reference them from the task template via **`ui:Template`** + **`ui:Instance`** for UI Builder preview (do not copy inline duplicates). Register part paths in **`ToolkitStepTemplatePaths`**. Every bindable control needs a stable **`name`**; document protected names in UXML comments. Preview instances belong **only** under hosts that **`ClearHost`** clears.

3. **Implement `IStepView`** (and **`ISubmitFromShell`** for tasks submitted by shell Controlla):
   - Place class under `Assets/Scripts/Presentation/Steps/` (e.g. `*ToolkitStep.cs`).
   - **Constructor**: **`ToolkitStepUx.TryMount(stepHost, path, rootName, out _root)`**; cache **`QueryRequired`** / **`QueryOptional`** results for hosts and labels.
   - **`Bind`**: parse **`context.contentJson`**; **`ClearHost`** on every dynamic host **and** on nested containers inside instantiated parts before adding runtime children (Part UXML with **`ui:Instance`** previews clones those children in Play Mode — missing nested **`ClearHost`** causes duplicate hints/tiles); fill static slots; clone with **`InstantiatePart`**; avoid duplicate listeners on re-bind.
   - **`Teardown`**: **`RemoveFromHierarchy`** on mounted root; clear delegates / schedules.
   - **`SetInteractable`**: disable inputs during **`CompleteServerTaskRoutine`** / **`AdvanceCutsceneRoutine`**.

4. **Register in `ToolkitStepFactory`**: add a **`case "YourTaskType":`** returning your step class.

5. **Styling**: Prefer USS classes (`lg-*`) from `Assets/Resources/UI/LearningToolkit/` (`task-templates.uss` for shared step chrome). Runtime **`UiThemeProvider`** / **`UiDesignTokens`** only when USS cannot express the need.

6. **Stub / placeholder**: Unimplemented types use **`StubToolkitTaskStep`** until a real mechanic exists.

## Cutscenes (`step_kind: cutscene`)

- **Payload:** `contentJson` is **`beats[]`** only (Zod: `apps/web/lib/game/schemas/cutsceneContentSchema.ts`). Each beat: required **`presentationMode`** + **`body`**; optional `title`, `subtitle`, `speakerId`, `autoAdvanceMs`, `primaryCtaLabel`. Root optional **`sceneBackgroundAsset`**, **`npcCast[]`**, **`navigation`** (`blockBack`, `primaryCtaLabel`). No legacy root `title`/`body`.
- **Implementation:** `CutsceneToolkitStep` + **`ICutsceneBeatNavigator`**. **`CutsceneShellPresenter`** calls **`TryAdvanceBeat()`** on **Weiter** until the last beat, then **`AdvanceCutsceneRoutine`** / advance RPC. When **`IsContentValid`** is false, **Weiter** is disabled and the server step must not advance.
- **Avatar beats:** `innerMonologue` / `npcDialog` use **`CutsceneInnerMonologueBeat.uxml`** / **`CutsceneNpcDialogBeat.uxml`** — stable anchors **`avatar-slot`**, **`bubble-col`**, **`beat-body`** (and **`npc-name`** on NPC). Option B Italian fixtures in UXML; on bind, **`CutsceneToolkitStep`** overwrites labels and **`CutsceneAvatarSlotBinder.BindPlayerSlot` / `BindNpcSlot`** after **`ClearHost(avatar-slot)`**. Portraits: **`GameArt/portraits/player/current`** and **`GameArt/portraits/npc/{portraitId}`** via **`GameArtResourceLoader`** only. Do not drive row order from **`npcCast.side`** (fixed NPC-right layout). USS: **`cutscene-narrative.uss`** (`lg-cutscene-beat-row`, placeholders).
- **Client validation:** `TryDeserialize` mirrors web Zod (`presentationMode` enum, `npcDialog` + `speakerId`, cast membership when `npcCast` is non-empty).
- **`onCutsceneBeatChanged`:** `StepContext` callback — shell refreshes CTA / back chrome after local beat changes (incl. auto-advance).
- **`autoAdvanceMs`:** Beat auto-continues via coroutine on **`StepContext.coroutineHost`** (quest shell). Cancel on manual **Weiter** / teardown.
- **Quest meta (not in cutscene JSON):** `GameFlowController.ServerQuestMetaJson` from API **`metaJson`** — reference document on **task shell only**, pause menu on both shells, `flow.blockBack`, `flow.autoStartQuestSlug`. Do not duplicate brochure text in every task `contentJson`; use quest **`meta_payload.referenceDocument`**.
- **New shell/cutscene navigation:** Extend **`ICutsceneBeatNavigator`** and **`CutsceneShellPresenter`**—do not add parallel advance paths.

## Checklist

- [ ] UXML template(s) + **`Templates/Parts/`** where needed + **`ToolkitStepTemplatePaths`** entries; task template previews use **`ui:Template`** / **`ui:Instance`** (no inline duplicate part trees); protected **`name`** slots unchanged vs C# queries; preview instances only under **`ClearHost`** targets.
- [ ] After nesting **`ui:Instance`** inside **`Templates/Parts/`**, audit **`*ToolkitStep.cs`** binders: **`ClearHost`** every container that gets runtime **`InstantiatePart`** children (not only top-level hosts like **`cloze-lines-host`** / **`bank-wrap`**).
- [ ] After moving/renaming parts: **Tools → Learning Toolkit → Validate UXML Template References** (`Assets/Editor/LearningToolkitUxmlTemplateGuidValidator.cs`; import hook **`LearningToolkitUxmlTemplateImportValidator.cs`**).
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
| Cutscene step | `Assets/Scripts/Presentation/Steps/CutsceneToolkitStep.cs` |
| Avatar bind | `Assets/Scripts/Presentation/Steps/CutsceneAvatarSlotBinder.cs`, `CutscenePlayerPortraitProvider.cs` |
| Avatar beats UXML | `Templates/Cutscenes/CutsceneInnerMonologueBeat.uxml`, `CutsceneNpcDialogBeat.uxml` |
| Portrait sprites | `Assets/Resources/UI/GameArt/portraits/Player/`, `Npc/` |
| Step templates | `Assets/Resources/UI/LearningToolkit/Templates/` |
| Overlay templates | `Assets/Resources/UI/LearningToolkit/Templates/Overlays/` |
| Template loader | `ToolkitStepUx.cs`, `ToolkitStepTemplatePaths.cs` |
| UXML template validator | `Assets/Editor/LearningToolkitUxmlTemplateGuidValidator.cs`, `LearningToolkitUxmlTemplateImportValidator.cs` |
| Overlay loader | `ToolkitOverlayUx.cs`, `ToolkitOverlayTemplatePaths.cs`, `Presentation/Overlays/*.cs` |
| UXML task shell | `Assets/Resources/UI/LearningToolkit/Shells/TaskShellScreen.uxml` |
| UXML cut shell | `Assets/Resources/UI/LearningToolkit/Shells/CutShellScreen.uxml` |
| Theme | `Assets/Resources/UI/LearningToolkit/*.uss`, `LearningMenusTheme.tss` |
