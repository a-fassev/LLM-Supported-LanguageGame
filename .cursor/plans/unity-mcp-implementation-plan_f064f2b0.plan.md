---
name: unity-mcp-implementation-plan
overview: Implementation plan for the Unity 2D shell based on the agreed foundation, with Unity MCP as the preferred execution path for later rollout.
todos:
  - id: mcp-preflight
    content: Unity MCP preflight and capture current scenes / Build Settings
    status: completed
  - id: create-core-scripts
    content: Implement TaskType, GameFlowController, and three views as navigation base
    status: completed
  - id: assemble-scenes
    content: Create or adjust target scenes and Canvas UI structure per foundation
    status: completed
  - id: wire-navigation
    content: Bind buttons/pins on views and delegate to GameFlow
    status: completed
  - id: validate-flow
    content: MCP console/hierarchy checks plus manual Play-mode smoke test
    status: completed
isProject: false
---

# Unity 2D shell — implementation plan (Unity MCP)

## Starting point
- Primary spec: [`/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/.cursor/plans/unity-2d-grundgeruest-foundation.md`](/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/.cursor/plans/unity-2d-grundgeruest-foundation.md)
- Fixed Unity version: `6000.4.6f1`
- Project layout: root Unity project under [`/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets`](/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets), [`/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/ProjectSettings`](/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/ProjectSettings)

## Target state
- Clickable end-to-end flow: `MainMenu → CityMap → Level* → CityMap`, plus `CityMap → MainMenu`
- Nine scenes present and referenced (`MainMenu`, `CityMap`, seven level stubs)
- Level shells aligned: static small figure left (same sprite), task placeholder right
- Central navigation via `GameFlowController` (singleton + `DontDestroyOnLoad`) and thin scene view scripts

## Implementation steps
1. **MCP preflight and project scan**
   - Load project context with Unity MCP (active scene, Build Settings, existing objects/scripts).
   - Confirm `Assets/Scenes` paths and script folders exist; create in MCP flow if missing.

2. **Code skeleton for clean architecture**
   - Scripts under [`/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets/Scripts`](/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets/Scripts):
     - `Domain/TaskType.cs`
     - `Application/GameFlowController.cs`
     - `Presentation/MainMenuView.cs`
     - `Presentation/CityMapView.cs`
     - `Presentation/LevelShellView.cs`
   - `GameFlowController` owns scene-name / `TaskType` mapping with `LoadMainMenu`, `LoadCityMap`, `LoadLevel(TaskType)`.
   - Defensive guards: null checks, unknown scene ⇒ fallback `MainMenu` + console log.

3. **Scene inventory setup / unify**
   - Create or tune scenes:
     - `MainMenu`, `CityMap`, `LevelErrorSpotting`, `LevelDragDrop`, `LevelClozeText`, `LevelMatching`, `LevelMultipleChoice`, `LevelFreeText`, `LevelRelativeClause`
   - Build Settings: `MainMenu` at index 0; include remaining scenes loadable by name.

4. **UI components and bindings per scene (Canvas)**
   - `MainMenu`: title + **Play** button.
   - `CityMap`: map area, seven pins (all active), **Main menu** button.
   - `Level*`: player figure zone left (same placeholder sprite), task zone right with copy **Task logic to follow**, button **City map**.
   - Wire buttons to view scripts; views only call `GameFlowController.Instance`.

5. **Unity-MCP-assisted wiring and validation**
   - Use MCP to verify hierarchies and component assignments (missing references, bad names, duplicate controllers).
   - Run compile/console checks in the Editor; iterate on errors.

6. **Acceptance vs. foundation**
   - Manual Play-mode smoke tests:
     - App starts on `MainMenu`
     - **Play** ⇒ `CityMap`
     - Each pin opens correct `Level*`
     - **City map** works from all levels
     - **Main menu** from map works
     - No **Quit** button

## Unity MCP execution strategy (implementation phase)
- **Scenes / hierarchy:** `Unity_ManageScene`, `Unity_ManageGameObject`
- **Script create/edit:** `Unity_CreateScript`, `Unity_ScriptApplyEdits` (or compatible `Unity_ManageScript`)
- **Verification:** `Unity_ReadConsole`/`Unity_GetConsoleLogs`, `Unity_ManageScene(Action=GetHierarchy)`
- **Assets / context:** `Unity_GetProjectData`, `Unity_FindProjectAssets`

## Risks and mitigations
- **Scene-name drift vs. code** → central constants/mapping in `GameFlowController`.
- **Missing Inspector bindings** → `OnValidate`/`Awake` warnings in views.
- **Multiple controller instances** → singleton guard + destroy duplicates in `Awake`.

## Deliverables
- New or tuned scenes under [`/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets/Scenes`](/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets/Scenes)
- Scripts under [`/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets/Scripts`](/Users/jannikendress/ITBL/LLM-Supported-LanguageGame/Assets/Scripts)
- Build Settings consistent with final scene flow
