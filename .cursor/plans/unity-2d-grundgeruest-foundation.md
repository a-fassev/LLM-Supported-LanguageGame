# Unity 2D shell — requirements foundation

> **Purpose:** Provide a clickable Unity 2D shell so the team can reliably test navigation, level structure, and task-type stubs, then fill them with real task logic later.

## Problem statement
There was no playable shell with clear user guidance yet. Players need a simple entry through a main menu, a clear overview of tasks via a city map, and a consistent way back out of every level. Without this base, the team cannot efficiently iterate, test, or author content per task type.

---

## Confirmed decisions
| Question | Decision |
|----------|----------|
| Main hub: free roam or UI-based? | UI-based city map with pins; no movable figures on the map. |
| Entry scene? | `MainMenu` is always the first scene and fixed starting point. |
| Level completion flow? | Leaving a level always returns to `CityMap`. |
| Exit button in the first milestone? | No — removed entirely. |
| Level layout? | Small static player figure on the left (same sprite in all levels), task area on the right. |
| Scene split? | One scene per task type (seven types), each a clickable stub. |
| Scene-switch architecture? | Central `GameFlowController` (singleton + `DontDestroyOnLoad`) with thin view scripts per scene. |

---

## User experience

### User flows
1. Player launches into `MainMenu`.
2. **Play** loads `CityMap`.
3. In `CityMap`, all task-type pins are visible and clickable.
4. Clicking a pin opens the matching `Level*` scene.
5. In each level, the player sees the small figure on the left and the task area on the right (stub content for now).
6. **City map** (button) exits the level and returns to `CityMap`.
7. From `CityMap`, **Main menu** always navigates back to `MainMenu`.

### Empty / loading / error states
- **Empty (level stub):** Show a clear placeholder on the right (`Task logic to follow`) so status is obvious.
- **Loading:** No separate loading screen in the first milestone; direct scene load.
- **Error (missing scene / wrong name):** Defensive guard in the flow controller with a debug log and fallback to `MainMenu` instead of a hard crash.

### User expectations
- Navigation is reversible and unambiguous at every step.
- No dead ends: always a clear path back to the map or main menu.
- UI reacts immediately and consistently even when task logic is not final.

---

## Scope

### In scope
- Unity 2D shell with these scenes:
  - `MainMenu`
  - `CityMap`
  - `LevelErrorSpotting`
  - `LevelDragDrop`
  - `LevelClozeText`
  - `LevelMatching`
  - `LevelMultipleChoice`
  - `LevelFreeText`
  - `LevelRelativeClause`
- Fixed flow: `MainMenu → CityMap → Level* → CityMap`, plus `CityMap → MainMenu`.
- City map with clickable pins for every task type.
- Level shell layout left/right (figure left, task area right).
- Central scene switching via `GameFlowController`.
- View scripts per scene for UI bindings.

### Out of scope
- Concrete task logic per type.
- Scoring system (deterministic or LLM).
- Progression/unlock rules on the map.
- Login, backend, persistence, telemetry.
- Audio, animations, polish, skin unlocks.

---

## Engineering design

### Unity
- Project stays 2D / URP.
- Build Settings: `MainMenu` as first scene; other scenes loaded by name.
- Each scene only contains UI objects needed for its role.
- No gameplay physics required for hub/navigation (`Rigidbody2D` for hub explicitly not needed).

### Next.js app
N/A for this shell milestone.

### Integration
N/A for this shell milestone (no Unity–web/backend integration yet).

### Data & persistence
N/A for the first milestone (no persisted player progress).

### Error handling
- `GameFlowController` validates destination scene names before/during load.
- On invalid target: log error, fall back to `MainMenu`.
- Null checks in view scripts when button references are missing.

### Security
N/A for this shell (no external input, tokens, or personal data in scope).

### Performance
- Goal: immediate, jitter-free loads for small stub scenes.
- Lightweight UI layouts; no heavy runtime systems in step one.

---

## Clean architecture (for this shell)

### Layering
- **Presentation layer (Unity UI + scene views):**
  - `MainMenuView`, `CityMapView`, `LevelShellView`
  - Responsible for button events and presentation.
- **Application layer (flow orchestration):**
  - `GameFlowController`
  - Responsible for navigation, routing, and high-level global app state.
- **Domain layer (task model, later):**
  - `TaskType` as central enum/model for task types.
  - No grading rules yet in milestone one.
- **Infrastructure layer (Unity `SceneManagement`):**
  - Wraps `SceneManager.LoadScene` behind clear methods.

### Dependency rule
- Views only know the application entry (`GameFlowController.Instance`), not direct scene or task logic.
- Application knows domain types (`TaskType`) and infrastructure (scene loading).
- Domain stays independent of Unity UI.

### Benefits for this project
- Clear split between UI click logic and navigation logic.
- Task-type logic can be plugged into each level on the right later without redoing global flow.
- Navigation decisions remain testable through well-named methods.

---

## Validated assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| All seven task types should exist as separate stub levels. | ✅ Validated | If scope is too high: temporarily merge levels and disable pins. |
| Main hub is only the city-map UI without free movement. | ✅ Validated | If desired later: add explorative hub as separate scope. |
| One unified small figure on the left suffices for milestone 1. | ✅ Validated | Extend later to skin/state variants. |
| No global **Quit** button is acceptable for the target context. | ✅ Validated | Add platform-specific later if needed (standalone only). |

---

## Identified risks
| Risk | Mitigation |
|------|------------|
| Scene names drift vs. Build Settings and code | Central constants/mapping table and one naming convention. |
| Duplicate `GameFlowController` instances from scene setup | Singleton guard in `Awake` + immediate `Destroy` on duplicates. |
| UI references missing after prefab/scene edits | `[SerializeField]` + validation in `OnValidate`/`Awake` with clear errors. |

---

## Success criteria
- [ ] Game always starts in `MainMenu`.
- [ ] **Play** navigates to `CityMap`.
- [ ] Each pin in `CityMap` loads the correct `Level*` scene.
- [ ] Each `Level*` stub has the same small figure left and task placeholder right.
- [ ] **City map** works consistently from all levels.
- [ ] **Main menu** from the map always works.
- [ ] No **Quit** button in the shell.

---

## Implementation areas (planning mode)
1. Create scenes and finalize Build Settings order.
2. Build UI shells for `MainMenu`, `CityMap`, and `Level*` stubs.
3. Implement `TaskType` mapping and `GameFlowController`.
4. Implement view scripts per scene and wire buttons.
5. Add minimal error handling and reference checks.
