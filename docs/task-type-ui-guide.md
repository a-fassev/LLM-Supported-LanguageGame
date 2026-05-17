# Building task-specific UI (Unity)

This guide describes how to add or extend **per-task-type** screens (Multiple Choice, Drag & Drop, etc.) so layouts and styling are authored in the **Unity Editor**, while **content** can be driven by **`contentJson`** from the backend.

Related code:

- Shell: `Assets/Scripts/Presentation/QuestShellView.cs`
- Catalog: `Assets/Scripts/Presentation/Steps/StepTemplateCatalog.cs`, default asset `Assets/Resources/Steps/StepTemplateCatalog_Default.asset`
- Contract: `Assets/Scripts/Presentation/Steps/IStepView.cs`, `StepContext.cs`
- Shared task baseline: `Assets/Scripts/Presentation/Steps/TaskStepBase.cs`
- Layered prefab root shim: `Assets/Scripts/Presentation/Steps/ComposableStepRootView.cs`
- Task type identifiers (domain): `Assets/Scripts/Domain/TaskType.cs`
- Tokens: `Assets/Scripts/Presentation/UiDesignTokens.cs`, `UiThemeProvider.cs`, `UiTokenApplier.cs`

---

## Architecture (short)

1. `QuestShellView` resolves the active server step and instantiates UI under **`stepHost`**.
2. It asks **`StepTemplateCatalog.TryResolve(templateKey, taskType)`** for a prefab.
3. If a prefab exists, Unity **`Instantiates`** it; otherwise it creates a minimal runtime **`RectTransform`** and attaches a view component chosen by **`taskType`** (see `AddTaskViewComponent`).
4. The instantiated object must implement **`IStepView`**. **`Bind(StepContext, onRequest)`** receives **`contentJson`** and other metadata; **`onRequest`** is used to complete the step or navigate back.

**Completion:** when the learner has finished the interaction, invoke:

```csharp
onRequest(new StepCompletionRequest { requestComplete = true });
```

(**`TaskStepBase`** already does this from its primary “check” flow; override or complement as needed.)

**Shell resolution:** `QuestShellView` calls `GetComponent<IStepView>()` **only on the instantiated Catalog root**. Place `IStepView` on that root (either a mechanic/cutscene class directly or **`ComposableStepRootView`** below).

---

## Composable layered prefabs (`ComposableStepRootView`)

Use when you want **reusable mechanic/cutscene UI** nested under editor-authored **story or backdrop** hierarchies—the same **`MultipleChoice`/`DragDrop`/`CutsceneStepBase`** prefab can appear inside many visually different compositions.

### How it works

1. **`StepTemplateCatalog` prefab root** has **`ComposableStepRootView`** + children:
   - **Story/decoration**: plain `RectTransform` / `Image` / layout nodes (drag-and-drop in Prefab Mode).
   - **Mechanic module**: a **nested prefab** whose root exposes a component implementing **`IStepView`** (`TaskStepBase` subclass or `CutsceneStepBase`).
2. On the shim, assign **`Inner Step View`** (`_innerStepView`) by dragging **that mechanic `MonoBehaviour`** from the Hierarchy (typically the nested prefab’s step script).
3. The shim **forwards** `Bind`, `SetInteractable`, and `Teardown` to the inner view. Exactly **one** inner `IStepView` keeps behaviour unambiguous (`QuestShellView` does **not** search children automatically).

Optional **`ComposableStepRootView`** fields for missing/invalid **`Inner Step View`** (Play Mode diagnostic):

- Assigned **`Misconfiguration Banner`** prefab subtree is shown whenever the leaf cannot bind (ensure ancestor Transforms stay **active**; inactive parents hide the banner regardless of **`SetActive(true)`** here).

- If no banner is set, **`Create Runtime Misconfiguration Fallback`** (**on** by default) spawns an on-screen message so authoring mistakes are visible without staring at the console—it uses **`UiDesignTokens.palette.errorBackground`**, **`errorText`**, and **caption typography** when **`UiThemeProvider`** resolves; otherwise literal defaults aligned with **`LoadErrorBanner`**.

### Navigation split with the shell

- **Cutscenes:** `QuestShellView` exposes **Next** (primary chrome); **`CutsceneStepBase`** can suppress its hosted Continue button when **`suppressHostedContinueNavigation`** is set (shell already advances).
- **Tasks:** **`nextTaskButton` is hidden** for task steps—the learner completes via **`Check`** / task flow **inside** the step UI (`ConfigureShellPrimaryChrome` in **`QuestShellView`**). Compose story layers **above** or **alongside** the mechanic container so they do not block required controls.

---

## Recommended workflow per task type

Follow **contract → foundational mechanic (C#) → prefabs → catalog → verify strings**. Implement behaviour before branching many visual variants (`templateKey` layering).

### 1. Define a stable `contentJson` contract

Align with **`game_quest_steps.content_json`** (or equivalent) **per logical task shape**:

- Decide fields (prompt text, choices, pairs, slots, asset keys, correctness rules).
- Version or extend carefully: changing shapes requires coordinated API + Unity parsing.

Prefer **templates + data**: the prefab defines structure; JSON supplies counts, strings, IDs, ordering.

---

### 2. Implement foundational mechanics (`IStepView` / `TaskStepBase`)

This is **gameplay and wiring**, independent of decorative story layers.

1. **Add a C# view class** for the **`task_type`** string the server emits (typically a **`TaskStepBase`** subclass beside the stubs under `Assets/Scripts/Presentation/Steps/`, or a `MonoBehaviour` that implements **`IStepView`** directly if you deliberately skip that base).

2. **`Bind(StepContext context, Action<StepCompletionRequest> onRequest)`** — load lesson data:
   - Parse **`context.contentJson`** (and other fields when needed) with **`JsonUtility`** or a serializer aligned with your API payloads.
   - Wire buttons, drag sources/targets, option lists—watch for repeated **`Bind`** and attach listeners safely (e.g. guard with a flag).

3. **`requestComplete`** — call **`onRequest(new StepCompletionRequest { requestComplete = true })`** when the learner solves the activity (**`requestBackToChapters`** when leaving to the overview). Tasks often reuse **`TaskStepBase`’s** **Check** scaffold. **`TaskStepBase.Bind`** is **not virtual** yet; evolve behaviour inside **`TaskStepBase` or its subclasses**, add **`virtual`/`override`**/`protected` helpers when refactoring, or implement **`IStepView`** directly if you abandon the scaffold.

4. **`SetInteractable(bool)`** — disable inputs during server round-trips (**`CompleteTask`** / **`AdvanceCutscene`** disable the hosted view).

5. **`Teardown`** — remove listeners / clear caches so pooled or re-bound instances do not duplicate handlers.

6. **`QuestShellView.AddTaskViewComponent`** — add a **`case "YourTaskType":`** alongside the **`case`**-sensitive string set (required when the catalog misses and the shell spawns the empty **`RectTransform` fallback`). Extend **`Assets/Scripts/Domain/TaskType.cs`** only if you keep an enum/tooling parity with content authors.

For **cutscenes**, use **`CutsceneStepBase`** (or parallel **`IStepView`**) the same way, respecting **`suppressHostedContinueNavigation`** together with shell **Next**.

**Reuse tip:** Implement the mechanic as a **self-contained prefab** (everything the exercise needs underneath one root that carries **`IStepView`**). Nested instances of that prefab plug into **`ComposableStepRootView`** when you wrap story/backdrop visuals without rewriting mechanics.

---

### 3. Author prefabs in the Editor

The shell only resolves **`GetComponent<IStepView>()` on the Catalog prefab root** (`QuestShellView.BindStep`). The mechanic **`IStepView`** must satisfy that constraint:

| Pattern | Layout | Catalog root |
|---------|--------|--------------|
| **Direct** | Single hierarchy—the step script sits on the instantiated root **`GameObject`**. | `YourStepView : TaskStepBase` (etc.) implementing **`IStepView`**. |
| **Layered** | Root siblings for story/decoration + **nested mechanic prefab**. | **`ComposableStepRootView`** with **`Inner Step View`** dragged to the nested mechanic component. |

- Build **`RectTransform` / LayoutGroup / buttons / draggable areas`; assign **`[SerializeField]`** targets on the mechanic script.
- **`UiThemeProvider.TryGet`** + **`UiTokenApplier`** pull colors and typography from **`UiDesignTokens`**.

Do **not** leave **`IStepView`** only on a deep child—the shell performs **no** `GetComponentInChildren` crawl unless you deliberately add **`ComposableStepRootView`** wiring.

---

### 4. Register the prefab in `StepTemplateCatalog`

Open or duplicate the **`StepTemplateCatalog`** asset (default: `Assets/Resources/Steps/StepTemplateCatalog_Default.asset`).

Add an **entry**:

| Field           | Purpose |
|----------------|---------|
| **`taskType`** | Matches **`GameQuestStepDto.taskType`** from the API (resolver is **case-insensitive**). Example: `DragDrop`, `MultipleChoice`. |
| **`templateKey`** | Optional: if set and the step carries the same **`templateKey`**, this entry wins over `taskType` (exact match). Use for variants (e.g. image vs text multiple choice). |
| **`prefab`**   | Drag your UI prefab here. |

Ensure the **`Quest` scene’s** `QuestShellView` uses this catalog (`stepTemplateCatalog` field or Resources fallback loads `StepTemplateCatalog_Default`).

---

### 5. Match server `taskType` strings

The shell switch uses **case-sensitive** C# **`case`** labels (e.g. `"DragDrop"`). **`StepTemplateCatalog`** matching is **case-insensitive**. Keep API **`task_type`** values consistent.

---

## Editor-driven vs runtime-built UI

| Approach | When to use |
|----------|--------------|
| **Fixed layout + JSON fills content** | Fixed max slots / layout; JSON turns elements on/off and sets text. Simplest authoring. |
| **Container + small child prefabs** | JSON declares N items; **`Bind`** **instantiates** card/slot prefabs under a **`LayoutGroup`**. Fits the foundational mechanic workflow (widgets still live in-editor as prefabs). |

Fully generic “compose unknown widget types only from JSON” is out of scope here; prefer a **known widget set** + data.

---

## Cutscenes vs tasks

- **`suppressHostedBackChapterNavigation`** / **`suppressHostedContinueNavigation`** on **`StepContext`** tell the hosted view whether shell chrome already provides Back / Continue.
- Tasks complete through the game API (“complete step” flow); **`requestComplete`** from the step view triggers that path for tasks (**`QuestShellView.OnStepRequest`**).

---

## Checklist for a new task type

1. [ ] Stable **`contentJson`** schema agreed with backend.
2. [ ] Foundational **`IStepView`** logic: **`Bind` / `Teardown` / `SetInteractable`**, **`AddTaskViewComponent`** case for new **`task_type`** (required for catalog-off fallback paths).
3. [ ] Prefab authored for the mechanic (**Direct** root `IStepView` **or** **Layered** root **`ComposableStepRootView`** referencing nested mechanic).
4. [ ] **`StepTemplateCatalog`** entry (**`taskType`** and/or **`templateKey`** + prefab).
5. [ ] Tokens applied for typography/colors (**`UiThemeProvider`** / **`UiTokenApplier`**).
6. [ ] (**Layered only**) Play Mode smoke: inner view binds, **`Check`** / **`requestComplete`** still reaches **`QuestShellView.OnStepRequest`**.
7. [ ] Extend **`Assets/Scripts/Domain/TaskType.cs`** only when you maintain an enum mirrored to authoring tooling.

---

## See also

- Repository agent and layout overview: **`AGENTS.md`** (Unity navigation, Quest shell, Wallet HUD conventions).
