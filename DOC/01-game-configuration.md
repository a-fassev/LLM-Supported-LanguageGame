# Game configuration (overview)

## Hierarchy

`Chapter` → `Quest` → ordered `QuestStep` rows (`order_index`).

- **Cutscene step:** `step_kind = cutscene` → API `isTask: false` → Unity [`CutsceneToolkitStep`](../Assets/Scripts/Presentation/Steps/CutsceneToolkitStep.cs).
- **Task step:** `step_kind = task` → API `isTask: true` → Unity resolves UI by `task_type` ([`ToolkitStepFactory`](../Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs)).

## Storage ↔ API

| DB / authoring | API field (`GameQuestStepDto`) | Notes |
|----------------|-------------------------------|--------|
| `content_payload` (jsonb) | `contentJson` (stringified JSON) | Built in [`buildQuestStepDto`](../apps/web/lib/game/services/game-progress-service.ts) |
| `reward_rules` (jsonb) | `rewardRulesJson` | Pizza + backpack rules; see [02-steps-and-rewards.md](02-steps-and-rewards.md) |
| `task_type` | `taskType` | Exact string match for routing |
| `logical_task_key` | `logicalTaskKey` | Backpack dedupe key (fallback to step id in RPC) |
| `template_key` | `templateKey` | Opaque authoring label |
| Chapter `theme_json` | `themeJson` | Chapter-level payload (shape not enforced here) |
| Quest `meta_payload` (jsonb) | `metaJson` | Reference document + flow flags; see [02-steps-and-rewards.md](02-steps-and-rewards.md) |

Cutscene payloads are validated when mapping steps ([`mapQuestStepRowsWithCutsceneValidation`](../apps/web/lib/game/services/game-progress-service.ts)); malformed cutscenes fail quest bootstrap/start.

### Story authoring convention (Chapter 1)

- **Akt 1** → one `game_chapters` row (e.g. `chapter-01`).
- **Akt 1.x** → one `game_quests` row per story beat (quest slug), ordered by `order_index`.
- Cutscene dialog with multiple NPCs → one cutscene step with multiple `beats[]` entries (not one DB row per line).

## Bootstrap objects (partial)

From [`GameProgressContracts.cs`](../Assets/Scripts/Application/GameProgressContracts.cs):

- **`currentStepOrderIndex`:** 0-based index of the **pending** step among **all** ordered steps (cutscenes + tasks).
- **`currentTaskOrderIndex`:** Count of **completed task** steps in the run; **not** incremented by advancing cutscenes.

Chapters expose `isUnlocked`, `unlockHint`; quests expose `isUnlocked`, `unlockHint`, `hasCompletedAnyRun`, `steps[]`.

## `task_type` matrix

| `task_type` | Unity UI | Server `evaluateTaskAttempt` |
|-------------|----------|------------------------------|
| *(cutscene)* | Cutscene | N/A |
| `DragDrop` | Implemented | Yes |
| `ClozeText` | Implemented | Yes |
| `MultipleChoice` | Implemented | Yes |
| `Matching` | Implemented | Yes |
| `ErrorSpotting` | Implemented | Yes |
| `FreitextLlm` | Implemented | LLM evaluate route + gate (not `evaluateTaskAttempt`) |
| `SpecialScreen`, `SpecialScreenSms`, `SpecialScreenMailEditor`, `SpecialScreenPhotoViewer`, `SpecialScreenReader` | [`SpecialScreenToolkitStep`](../Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs) | Yes (embedded blocks only; see doc 02) |
| `FreeText`, `RelativeClause` | Stub placeholder | No |
| Any other string | Stub placeholder | No — **do not use `pizza.mode: scored`** (completion will reject attempt) |

## Navigation (runtime)

Scene flow: Auth → MainMenu → ChapterOverview → QuestOverview → Quest shell (+ AvatarShop). Driven by [`GameFlowController`](../Assets/Scripts/Application/GameFlowController.cs); progress APIs under `/api/game/*`.

## See also

- Step JSON + rewards: [02-steps-and-rewards.md](02-steps-and-rewards.md)
- USS / theme: [03-styling.md](03-styling.md)
- RPC behaviour summary: [AGENTS.md](../AGENTS.md) (pizza + backpack)
