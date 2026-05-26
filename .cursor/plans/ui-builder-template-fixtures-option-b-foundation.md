# UI Builder Template Fixtures (Option B) — Requirements Foundation

> **Purpose**: Enable designers to style every quest step directly in production UXML by keeping full example trees in templates while runtime binding reliably clears host fixtures and rebuilds the same DOM structure from live `contentJson`.

## Problem Statement
Today, designers often need to imagine runtime structure because production templates can be sparse or rely on separate preview files. This slows visual iteration and increases mismatch risk between what is styled in UI Builder and what learners see in Play Mode.

The required outcome is a single visual truth: each production template shows realistic sample content in UI Builder (options, bubbles, cards, rows, placeholders), and runtime bind replaces those fixtures with real API data without leaving sample artifacts.

---

## Confirmed Decisions
| Question | Decision |
|----------|----------|
| Preview strategy | Use Option B: fixtures live in production UXML by default; separate `*Preview.uxml` is not the standard path. |
| Fixture location | Dynamic fixture children must exist only inside named host elements that runtime clears before build. |
| Runtime cleanup model | Every bind starts with `host.Clear()` (or `ToolkitStepUx.ClearHost`); no mandatory global preview stripping when fixture-placement rule is followed. |
| Marker classes | `lg-preview-sample` is optional for editor orientation only; `lg-preview-only` + runtime stripping is reserved for rare fixtures outside hosts. |
| Structure parity | Runtime must create the same element types, USS classes, and DOM structure as fixture markup; shared repeating nodes move to `Templates/Parts/`. |
| Protected slot names | Existing queried `name` anchors remain stable; C# `QueryRequired/QueryOptional` contracts are preserved. |
| Quest shell chrome ownership | Step templates do not add shell primary button or duplicate shell chrome; `QuestShellScreen` remains authoritative. |
| Data contract scope | No API or `contentJson` schema changes are included in this work. |

---

## User Experience

### User Flows
1. A designer opens a production template in UI Builder and immediately sees a full, realistic sample tree under dynamic hosts.
2. The designer styles visible sample nodes directly using existing `lg-*` USS classes and theme setup.
3. During Play Mode, step bind clears host children, parses live `contentJson`, and rebuilds the same structure with real content.
4. Learners see only runtime data; no fixture labels or sample cards remain after bind.
5. Designers can leave fixture children in hosts after styling without breaking runtime behavior.

### Empty / Loading / Error States
- Empty host in runtime data: host remains empty after clear/build with no leftover fixture children.
- Invalid or missing step payload: existing per-step validation/error handling remains unchanged; this foundation does not alter API failure UX.
- Rebind/teardown cycles: step stays stable and idempotent, without duplicate handlers or duplicated visual nodes.

### User Expectations
- UI Builder should show exactly what needs styling, not empty containers.
- Runtime should always replace samples with real data on first bind.
- Styled fixture structure should match runtime output shape so visual regressions are predictable.

---

## Scope

### In Scope
- Add and standardize fixture trees in production templates for:
  - Tasks (`Templates/Tasks/`): `MultipleChoice`, `ClozeText`, `ErrorSpotting`, `FreitextLlm`, `DragDrop`, `Matching`
  - Cutscene beats (`Templates/Cutscenes/`): `narrator`, `npcDialog`, `innerMonologue`, `gameInfo`, plus host fixture embedding
  - Special screens (`Templates/SpecialScreens/` and host): messenger/WhatsApp, mail, reader, photo, host sample block
- Ensure fixtures live under named runtime-cleared hosts for all dynamic families.
- Create/expand shared part templates in `Templates/Parts/` (for repeated row/card/bubble/cell structures) and wire path constants.
- Extend `ToolkitStepUx` with:
  - `ClearHost(VisualElement host)`
  - `InstantiatePart(string resourcesPath, string rootName)` (wrapper around existing instantiate behavior)
  - Optional `RemovePreviewSamples(VisualElement root)` for exceptional non-host fixtures only
- Refactor affected `*ToolkitStep.cs` binds so host clear is first and runtime children are created via part templates or structure-identical markup.
- Keep fixture text as Italian learning-game placeholders (no real student data).
- Preserve existing shell flow/scoring/factory behavior unless strictly required for fixture parity.

### Out of Scope
- Separate `*Preview.uxml` as default workflow (allowed only as optional exception for extreme visual variants, such as photo grid/slideshow tension).
- Backend/API/schema changes for `contentJson`.
- uGUI migration or non-UI Toolkit authoring tooling.
- New gameplay mechanics unrelated to template-fixture parity.

---

## Engineering Design

### Unity
- **Template-first enforcement**: `ToolkitStepUx.TryMount` continues to mount production UXML; static chrome stays in UXML and dynamic children are built inside queried hosts only.
- **Task templates**:
  - `MultipleChoiceTaskTemplate.uxml`: prompt/subtitle, stem sample in `mc-stem-host`, 4 options in `mc-options-host`, sample progress label.
  - `ClozeTextTaskTemplate.uxml`: 2-3 sample rows in `cloze-lines-host`.
  - `ErrorSpottingTaskTemplate.uxml`: passage plus 4-6 chips in chip host.
  - `FreitextLlmTaskTemplate.uxml`: prompt, filled sample text field, hidden/empty feedback area.
  - `DragDropTaskTemplate.uxml`: bank cards, category drop zones, slot segment samples in dedicated hosts.
  - `MatchingTaskTemplate.uxml`: headers plus left/right sample cards in column hosts.
- **Cutscene templates**:
  - Beat templates each contain meaningful Italian sample content.
  - `CutsceneHost.uxml` includes a sample beat instance under beat host for builder orientation.
  - `CutsceneToolkitStep` keeps runtime instantiate flow and replaces host sample via clear + real beat instantiate.
- **Special screens**:
  - Messenger host includes incoming/outgoing samples, including mechanic placeholder row.
  - Mail host includes filled header rows and sample embedded block slot.
  - Reader host includes image placeholder and multi-column sample body.
  - Photo host includes sample grid4 or slideshow structure in content host.
  - `SpecialScreenHost.uxml` includes paging row and sample embedded block host.
  - `SpecialScreenToolkitStep` clears runtime chat/grid/content hosts before real build; mounted chrome remains unchanged.
- **Shared parts**:
  - Add/reuse part templates for option rows, cloze rows/gaps, chips, drag cards/categories, matching cards, messenger bubbles, photo cells, and similar repeated structures.
  - `ToolkitStepTemplatePaths` is extended with part paths used by task/cutscene/special-screen builders.
- **Runtime parity requirement**:
  - Runtime-generated nodes must use the same USS classes and equivalent hierarchy as fixture parts.
  - Avoid ad-hoc `new VisualElement()` trees that diverge from styled fixture structure.

### Next.js app
N/A (no route, schema, validator, or API contract changes).

### Integration
N/A (Unity continues consuming existing step payloads; no transport/contract changes).

### Data & persistence
N/A (no new persisted fields; fixture content is authoring-only and replaced at runtime).

### Error Handling
- Bind starts by clearing relevant hosts so sample artifacts cannot leak into runtime.
- Existing payload parse/validation paths in each step remain authoritative.
- Teardown/rebind logic remains idempotent (no duplicate event handlers, no duplicate children after repeated binds).

### Security
- Fixture text uses synthetic Italian placeholder copy only; no student-identifiable content in templates.

### Performance
- Host `Clear()` + controlled rebuild keeps per-bind cost predictable and small for current node counts.
- Reusable part instantiation reduces divergent construction logic and avoids expensive corrective DOM operations.

---

## Validated Assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| Existing named hosts are sufficient to contain all dynamic fixture children across step families | ✅ Validated | Introduce additional named hosts while preserving existing queried slots. |
| Designers can work directly in production UXML without mandatory separate preview files | ✅ Validated | Allow narrowly scoped optional preview helper only for extreme dual-variant layouts. |
| Current factory/scoring/cutscene navigation can remain unchanged while refactoring bind structure | ✅ Validated | If a regression appears, isolate to step bind implementation and keep server flow untouched. |
| Optional `lg-preview-only` stripping is only needed for rare out-of-host samples | ⚠️ Needs check during implementation | Add `ToolkitStepUx.RemovePreviewSamples(root)` and apply only in affected steps. |

---

## Identified Risks
| Risk | Mitigation |
|------|------------|
| Fixture markup diverges from runtime-generated markup over time | Centralize repeated structures in `Templates/Parts/` and instantiate those parts in runtime bind. |
| Designer accidentally places fixtures outside clearable hosts | Enforce host-only rule and reserve `lg-preview-only` cleanup path for explicit exceptions. |
| Rebind creates duplicate listeners or duplicate nodes | Keep bind/teardown idempotent and clear hosts before rebuilding every time. |
| Renamed UXML `name` anchors break C# queries | Treat protected slots as stable contracts and document any new slots in UXML comments. |

---

## Success Criteria
- [ ] Every in-scope task, cutscene mode, and special-screen variant shows a full example tree in UI Builder (no empty core hosts).
- [ ] Play Mode with real `contentJson` shows no fixture labels/elements after bind.
- [ ] Bind/teardown is idempotent and does not create duplicate click handlers.
- [ ] Protected `name` anchors remain compatible with existing `QueryRequired/QueryOptional` usage.
- [ ] Runtime DOM shape/classes match fixture styling structure through part clones or equivalent markup.
- [ ] Required template and special-screen assets are present and committed.

---

## Implementation Areas (for planning mode)
1. `Templates/Parts/` expansion + `ToolkitStepUx` utilities (`ClearHost`, `InstantiatePart`, optional sample stripping helper).
2. Task templates and bind refactors in order: MultipleChoice → ClozeText → ErrorSpotting → FreitextLlm → DragDrop → Matching.
3. Cutscene beat templates + cutscene host fixture embedding + `CutsceneToolkitStep` host replacement behavior.
4. Special-screen chrome/template fixture coverage in order: Messenger → Mail → Reader → Photo → Host.
5. Runtime C# updates to instantiate part templates or enforce structure-equivalent creation across all touched step types.
6. Manual Play Mode smoke pass per family (tasks, cutscenes, special screens) focused on fixture removal and bind idempotency.
