# Task Template Parts Single Source — Requirements Foundation

> **Purpose**: Ensure every recurring UI component in quest task screens has exactly one structural source (`Templates/Parts/*.uxml`) so UI Builder preview and runtime output stay visually aligned with lower maintenance risk.

## Problem Statement
Today, task templates contain inline fixture copies of recurring rows/cards/bubbles while runtime rebuilds from separate part files via `ClearHost` + `InstantiatePart`. This creates two parallel UI definitions of the same component shape. The result is that full task composition is harder to trust in UI Builder, and styling can drift between preview fixtures and production runtime.

---

## Confirmed Decisions
| Question | Decision |
|----------|----------|
| Where does recurring component structure live? | Only in `Templates/Parts/*.uxml` (single source of truth for recurring row/card/bubble/etc.). |
| What does each task template contain? | Layout composition + host placement + preview sample data by referencing/instancing the same part assets, not copied inline duplicates. |
| Does runtime binding architecture change? | No. Runtime remains `ClearHost` + `TryInstantiatePart`/`InstantiatePart`; no second runtime path is introduced. |
| Does JSON contract change? | No. `contentJson` continues to drive content text and runtime item counts. |
| Who controls preview quantity? | Task templates keep manually chosen preview sample counts (for example 4 options), independent from runtime JSON counts (for example 2 or 8). |
| Is "style-in-task, auto-propagate-to-parts" included? | No. No editor automation tool is part of this scope. |
| How strict is migration policy? | Strict by default: recurring components are moved to part references/instances everywhere; temporary inline fallback is allowed only as a short-lived blocker workaround and must be tracked for immediate follow-up. |

---

## User Experience

### User Flows
1. A UI author opens a task template (`Templates/Tasks/*TaskTemplate.uxml`) and sees a complete composed task in UI Builder.
2. Recurring elements in that preview are instances/references of part assets from `Templates/Parts`, not duplicate inline trees.
3. To restyle a recurring component, the author edits the relevant part file (or navigates to source from an instance), then saves.
4. The updated component appearance is reflected consistently in both UI Builder task previews and runtime-instantiated gameplay UI.

### Empty / Loading / Error States
- **UI authoring level**: Missing part assets or broken root names should fail visibly in editor/runtime and be treated as migration defects.
- **Runtime level**: Existing error behavior remains (template/part load failures still surface through current `ToolkitStepUx` guardrails and validation messages).
- **Player-facing loading/error**: unchanged by this feature; no new network or gameplay loading states are introduced.

### User Expectations
- UI authors expect the UI Builder preview to be representative of runtime composition.
- Component-level style edits should not require synchronizing duplicate trees.
- Protected slot names used by C# binders stay stable and predictable.

---

## Scope

### In Scope
- Migrate recurring inline fixtures in task templates to part references/instances from `Templates/Parts`.
- Keep full task composition visible in UI Builder via sample part instances.
- Preserve required `name` anchors and part root names consumed by C# query/bind code.
- Keep styling ownership primarily in parts and shared USS (`lg-*`) instead of template-local inline divergence.
- Validate parity across affected task templates in Unity UI Builder and runtime play path.

### Out of Scope
- No gameplay logic or scoring changes.
- No API, Next.js, or Supabase schema changes.
- No automatic editor tooling that propagates task-level style edits back into part files.
- No change to JSON payload schema or runtime item-count semantics.
- No redesign of `ToolkitStepUx`, `ToolkitStepTemplatePaths`, or step factory architecture beyond migration-safe updates if needed.

---

## Engineering Design

### Unity
- Primary surface: `Assets/Resources/UI/LearningToolkit/Templates/Tasks/*.uxml` and `Assets/Resources/UI/LearningToolkit/Templates/Parts/*.uxml`.
- Runtime binder pattern remains intact in step presenters (`ClozeTextToolkitStep`, `ErrorSpottingToolkitStep`, `DragDropToolkitStep`, `MatchingToolkitStep`, `MultipleChoiceToolkitStep`), which already clear hosts and instantiate parts dynamically.
- Migration requirement: task templates use part instances for preview fixtures while preserving anchors queried by `ToolkitStepUx.QueryRequired(...)`.
- Keep Option-B fixture workflow intent: preview fixtures are still allowed, but now sourced from actual parts rather than duplicated trees.

### Next.js app
N/A.

### Integration
N/A (no Unity-web contract change).

### Data & persistence
N/A (no persistence contract change).

### Error Handling
- Missing part template or root-name mismatches continue to use existing `ToolkitStepUx` error path (`TryInstantiatePart`, `TemplateLoadFailedMessage`, required-slot logging).
- Migration acceptance must include a pass for protected `name` anchors to prevent null bindings at runtime.
- If a specific task template cannot be safely migrated in one step, fallback is to keep current fixture for that section temporarily and track it explicitly until migrated.

### Security
N/A.

### Performance
- Runtime performance should remain neutral: dynamic children are still rebuilt from parts as before.
- Minor editor-time benefit: reduced maintenance overhead from single-source component definitions.
- No additional runtime allocations beyond current instantiate flow expectations.

---

## Validated Assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| UI Toolkit task templates can reliably reference/instance part assets in UI Builder without breaking runtime loading. | ✅ Validated | If one template hits a tooling edge case, use a minimal temporary inline fixture only for that template section and schedule immediate cleanup in the same migration track. |
| Existing part root names (`*-part`) and required anchors are sufficient for migrated templates. | ✅ Validated | If an anchor mismatch appears, apply only minimal non-breaking anchor alignment and keep binder expectations unchanged. |
| The team accepts manual preview sample counts per template (not auto-generated from JSON). | ✅ Validated | If expectation changes later, evaluate separate editor tooling initiative. |

---

## Identified Risks
| Risk | Mitigation |
|------|------------|
| Anchor/name mismatch during migration breaks runtime `QueryRequired` / bind flow. | Introduce per-template migration checklist for protected names and run runtime smoke tests per task type. |
| Part edited with task-specific overrides causes unintended global visual changes. | Enforce style ownership guidelines (`lg-*` classes, part-level USS) and review shared-part impact in PR. |
| Some templates may need nested composition that is awkward with pure part instances. | Allow minimal template-level composition wrappers while keeping recurring atomic components in parts. |
| Mixed migrated/non-migrated templates increase temporary inconsistency. | Sequence migration by task type and track completion explicitly in planning/implementation checklist. |

---

## Success Criteria
- [ ] Every recurring task UI component has one canonical structure in `Templates/Parts/*.uxml`.
- [ ] A UI author can inspect full task composition in UI Builder without relying on duplicated inline component trees.
- [ ] Runtime binding for all migrated task types still succeeds with unchanged player-visible behavior.
- [ ] Styling changes to a part are reflected consistently in both preview and runtime output for migrated templates.

---

## Implementation Areas (for planning mode)
1. Inventory recurring inline fixtures per task template and map each to canonical part assets.
2. Migrate task templates to part references/instances while preserving required anchors and composition semantics.
3. Run Unity-side validation passes (UI Builder preview parity + runtime binding smoke tests per task type).
4. Clean up residual duplicated fixture structures and align USS ownership conventions.
