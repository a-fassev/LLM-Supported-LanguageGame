# Building task-specific UI (Unity, UI Toolkit)

Per-task screens run **inside the quest shell**: `QuestShellView` clears the **`step-host`** region of **`QuestShellScreen`** (`Assets/Resources/UI/LearningToolkit/QuestShellScreen.uxml`) and **`ToolkitStepFactory`** builds an **`IStepView`** implementation for the active server step.

Legacy **uGUI**, **`StepTemplateCatalog`**, and step **prefabs** were removed; do not follow older prefab/catalog workflows.

## Related code

| Role | Path |
|------|------|
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Contracts | `Assets/Scripts/Presentation/Steps/IStepView.cs`, `ISubmitFromShell.cs`, `StepContext.cs` |
| Implemented steps | `DragDropToolkitStep.cs`, `ClozeTextToolkitStep.cs`, `MultipleChoiceToolkitStep.cs`, `MatchingToolkitStep.cs`, `FreitextLlmToolkitStep.cs`, `CutsceneToolkitStep.cs`, `StubToolkitTaskStep.cs` |
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

### Remote media URLs (`http` / `https`)

Steps that load remote images or audio (`imageUrl`, MultipleChoice `audioUrl`, etc.) use **`ToolkitStepHttpResourceUrl`**: **string-level checks** when parsing `contentJson`, and **`TryVerifyForClientFetch`** immediately before `UnityWebRequest` so **hostnames** are **resolved** and blocked when any address is loopback, private (RFC1918), link-local, or IPv6 ULA (with a small per-host session cache). If **`Dns.GetHostAddresses`** throws (offline, some runtimes), verification may **fail open** with a logged warning — prefer trusted CDNs and author-controlled URLs.

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

### Matching (`taskType`: Matching)

**Implementation:** **`MatchingToolkitStep`**.

Learners connect **left** and **right** items. **Drag** from a left card and release on the correct right card (rubber-band line while dragging), **or** **tap** a left item then a right item. **`imageUrl`** values must be absolute **`http`/`https`** when present.

| Field | Notes |
|-------|--------|
| **`prompt`**, **`subtitle`** | Title / instructions |
| **`leftItems`**, **`rightItems`** | Each: **`id`**, **`label`**, optional **`imageUrl`** |
| **`correctPairs`** | Each pair: **`leftItemId`**, **`rightItemId`** — each left id appears **exactly once**; each right id at most **once** (one-to-one matching). |
| **`presentation`** | Optional **`leftLabel`**, **`rightLabel`**, **`shuffleRightOrder`** (shuffle the right column for display). If labels are omitted, defaults are **Sinistra** / **Destra**. |

Learners can remove a pair with the **×** control on a paired left row (or re-pair / toggle as before).

Example (minimal):

```json
{
  "prompt": "Abbina le coppie",
  "leftItems": [
    { "id": "l1", "label": "Buongiorno" },
    { "id": "l2", "label": "Grazie" }
  ],
  "rightItems": [
    { "id": "r1", "label": "Mattina" },
    { "id": "r2", "label": "Ringraziamento" }
  ],
  "correctPairs": [
    { "leftItemId": "l1", "rightItemId": "r1" },
    { "leftItemId": "l2", "rightItemId": "r2" }
  ],
  "presentation": {
    "leftLabel": "Italiano",
    "rightLabel": "Significato",
    "shuffleRightOrder": true
  }
}
```

---

### FreitextLlm (`taskType`: FreitextLlm)

**Implementation:** **`FreitextLlmToolkitStep`** + **`IEvaluationGateForTaskCompletion`**.

Behaviour summary:

- Multiline **`TextField`** captures the learner response.
- **Check** first calls **`POST /api/game/runs/{runId}/steps/{stepId}/evaluate`** with `{ "answerText": "<learner reply>" }`. The LLM verdict must pass before **`POST .../complete`** may run **with `{ "evaluationGateToken": "<uuid>" }`**.
- Tokens are mirrored into `player_freitext_llm_gates` (see migrations) and revoked after authoritative completion.

Minimal `contentJson` / **`content_payload`** template:

```json
{
  "prompt": "Italian writing prompt headline.",
  "instruction": "Extra guidance beneath the headline (optional).",
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": false,
  "minWords": 6,
  "maxWords": 120,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.72,
    "registerTarget": "neutral",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": [
      "Italian grammar clarity",
      "Word-choice fit versus prompt",
      "Register aligns with communicated audience"
    ],
    "targetStructures": ["relative pronouns"]
  }
}
```

---

### Cutscenes (`isTask`: false)

**Implementation:** **`CutsceneToolkitStep`**.

---

### ErrorSpotting (`taskType`: ErrorSpotting)

**Implementation:** **`ErrorSpottingToolkitStep`**.

Interactive “Fehlersuche”: learner taps erroneous word/phrase spans, fills corrections, validates on shell **Check** (client compares against authoring).

| Field | Notes |
| ----- | ------ |
| **`prompt`** | Title / headline |
| **`instruction`** | Hint under headline (optional) |
| **`expectedErrorRange`** | **`min`**, **`max`** — authoring must match counted `true` error segments (`isError`), e.g. 4 mistakes with `{ "min": 4, "max": 5 }` works only if **`min ≤ 4 ≤ max`**. Unity shows a learner-facing hint line and validates selection + corrections |
| **`segments`** | Ordered list of **`id`**, **`text`**, **`isError`**, **`acceptedCorrections`** (required when `isError`; case-insensitive, whitespace-collapsed matching), optional **`hint`**

Learner must select **exactly all** erroneous segments (and **no** non-errors) and supply a typed correction matching one of **`acceptedCorrections`** before completion.

Example (minimal):

```json
{
  "prompt": "Trova e correggi",
  "instruction": "Tocca le parti sbagliate e scrivi la forma corretta.",
  "expectedErrorRange": { "min": 1, "max": 1 },
  "segments": [
    { "id": "t1", "text": "Maria ", "isError": false },
    { "id": "t2", "text": "vai ", "isError": true, "acceptedCorrections": ["va"] },
    { "id": "t3", "text": "a scuola ogni giorno.", "isError": false }
  ]
}
```

---

### Stub types (`FreeText`, `RelativeClause`, unknown)

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
