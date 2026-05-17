# Building task-specific UI (Unity, UI Toolkit)

Per-task screens run **inside the quest shell**: `QuestShellView` clears the **`step-host`** region of **`QuestShellScreen`** (`Assets/Resources/UI/LearningToolkit/QuestShellScreen.uxml`) and **`ToolkitStepFactory`** builds an **`IStepView`** implementation for the active server step.

Legacy **uGUI**, **`StepTemplateCatalog`**, and step **prefabs** were removed; do not follow older prefab/catalog workflows.

## Related code

| Role | Path |
|------|------|
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Contracts | `Assets/Scripts/Presentation/Steps/IStepView.cs`, `ISubmitFromShell.cs`, `StepContext.cs` |
| Implemented steps | `DragDropToolkitStep.cs`, `ClozeTextToolkitStep.cs`, `MultipleChoiceToolkitStep.cs`, `CutsceneToolkitStep.cs`, `StubToolkitTaskStep.cs` |
| Tokens | `UiDesignTokens.cs`, `UiThemeProvider.cs`; USS under `Assets/Resources/UI/LearningToolkit/` |

---

## Architecture

1. **`GameFlowController`** loads **`Quest`**; **`QuestShellView`** mirrors server progression.
2. **`BindStep`** calls **`ToolkitStepFactory.Create(step, _toolkitStepHost, this)`**.
3. If the factory returns **`null`** (only when **`stepHost`** is **`null`**), the shell installs **`MissingToolkitStepView`** — visible message + **`SubmitFromShell`** routes validation feedback so the learner is not stuck silently.
4. **Shell chrome**: Back, primary (**Next** / **Check** / **Finish quest**), loading, validation, reward overlays (`LearningToolkitOverlays`).
5. **Tasks**: shell **Check** → **`ISubmitFromShell.SubmitFromShell()`**. **Cutscenes**: **Next** → **`StepCompletionRequest`** / advance RPC flow.

Complete a step from code:

```csharp
onRequest(new StepCompletionRequest { requestComplete = true });
```

Use **`StepContext.presentValidationMessage`** for client-side validation errors (shell-owned overlay).

---

## Workflow for a new `taskType`

1. Agree **`contentJson`** shape with whoever owns **`game_quest_steps`** / API.
2. Add **`YourSomethingToolkitStep : IStepView`** (+ **`ISubmitFromShell`** if the shell submits it).
3. Build UI with **`UnityEngine.UIElements`** under **`stepHost`** in **`Bind`**; **`Teardown`** removes what you added.
4. Add **`case "YourTaskType":`** to **`ToolkitStepFactory`**.
5. Prefer **`lg-*`** USS classes; avoid duplicating shell overlays inside the step.

Optional: extend **`Assets/Scripts/Domain/TaskType.cs`** only if tooling still mirrors enums.

---

## `contentJson` reference (implemented types)

Implementation classes contain DTOs / parsers (names may differ slightly from legacy **`\*StepView`** files):

### DragDrop (`taskType`: DragDrop)

**Implementation:** **`DragDropToolkitStep`**.

Behaviour summary: drag items into targets; validation on **Check** (including optional **`requireBankEmpty`**). **`imageUrl`** / remote assets must be **`http`** / **`https`**.

Top-level fields (see **`DragDropToolkitStep`** for full DTO):

| Field | Notes |
|-------|--------|
| **`prompt`** / **`subtitle`** | Title / instructions |
| **`shuffleItemOrder`** | Shuffle source tiles |
| **`requireBankEmpty`** | All items must be placed |
| **`items`** | **`id`**, **`label`**, optional **`imageUrl`** |
| **`targets`** | **`id`**, **`title`**, **`correctItemIds`**, **`targetMode`** semantics |
| **`presentation`** | **`targetMode`**: **`blocks`** or **`lines`**; section labels |
| **`lines`** | Sentence segments when **`lines`** mode |

Examples (blocks vs lines) match the shapes previously documented for DragDrop; validate against **`DragDropToolkitStep`** when extending.

---

### MultipleChoice (`taskType`: MultipleChoice)

**Implementation:** **`MultipleChoiceToolkitStep`**.

Root / per-question fields include **`stem`** blocks (**text** / **image** / **audio**), **`options`**, **`correctOptionIds`**, **`selectionMode`** (**single** / **multiple**), **`preserveOptionOrder`**. See **`MultipleChoiceToolkitStep`** / nested DTO types for exact tables.

---

### ClozeText (`taskType`: ClozeText)

**Implementation:** **`ClozeTextToolkitStep`**. Parse and behaviour live in that file.

---

### Cutscenes (`isTask`: false)

**Implementation:** **`CutsceneToolkitStep`**.

---

### Stub types (`Matching`, `FreeText`, `RelativeClause`, `ErrorSpotting`, unknown)

**Implementation:** **`StubToolkitTaskStep`** — placeholder UX until a dedicated toolkit step exists.

---

## Cutscenes vs tasks

- **`QuestShellView.ConfigureShellPrimaryChrome`** sets **Next** vs **Check**.
- **`presentValidationMessage`** feeds the shell validation overlay.
- Server authoritative rewards still come from complete-step / advance-step API responses.

---

## Checklist (new task type)

1. [ ] Stable **`contentJson`** with backend.
2. [ ] **`IStepView`** (+ **`ISubmitFromShell`** when shell submits).
3. [ ] **`ToolkitStepFactory`** **`case`** for **`taskType`**.
4. [ ] USS / tokens consistent with menus theme.
5. [ ] Play Mode: **Check** / **Next**, validation overlay, reward overlay after success.

---

## See also

- **`AGENTS.md`** — navigation, UI Toolkit conventions, wallet HUD.
