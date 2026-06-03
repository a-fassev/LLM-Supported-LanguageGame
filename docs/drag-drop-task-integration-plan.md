# Drag & drop task integration — implementation plan

**Status:** Agreed baseline (2026-06-03) — product sign-off on §2; **implementation not started** until explicitly requested.  
**Scope:** `screen_type: "drag_drop"` — strict content contract, **three QA fixture scenes** on **chapter-01 / quest-01** (09–11, **11 scenes total in quest-01 by design**), **minimal stubs** for legacy empty `drag_drop` scenes elsewhere, web UI for **`presentation.targetMode: "blocks"`** only, play-page attempt flow, catalog validation.  
**Out of scope (this pass):** **`lines`** mode UI (server returns `501` today), item/target **images** (`assetId` / `imageUrl`), bonus `pool*` authoring.

**Related:** `docs/matching-task-integration-plan.md`, `docs/multiple-choice-task-integration-plan.md`, `docs/quest-scene-content-format.md`, `docs/web-game-ui-architecture.md`, `AGENTS.md`, `.cursor/skills/web-task-type-ui/SKILL.md`.

---

## 1. Goals

| Goal | Notes |
| ---- | ----- |
| Replace `TaskPlaceholder` for `drag_drop` | Item bank + category drop zones inside `TaskBodyLayout` scroll region. |
| Authoring-friendly JSON | Strict Zod + catalog fail-at-load; three fixtures with layout variance. |
| Clear learner interaction | Draggable tiles, tap fallback for touch, drop-zone hints, return tiles to bank. |
| Clean task-type architecture | Mirror MC / matching: `TaskPanel` dispatch, `lib/game/tasks/drag-drop/*`, draft sync on `/play`. |
| Server remains authoritative | Scoring via `evaluateDragDrop`; client **never** uses `correctItemIds` for UX or pre-submit correctness. |

---

## 2. Locked product / tech decisions

| Topic | Decision |
| ----- | -------- |
| **Fixture placement** | **chapter-01 → quest-01** (`Arrivo`), **after** matching fixtures. New files **`scenes/09.json`**, **`10.json`**, **`11.json`**. Target flow: `info` ×3 → `multiple_choice` ×2 → `matching` ×3 → **`drag_drop` ×3** → **11 scenes in quest-01 total** (intentional smoke/QA chain; no separate mini-quest). |
| **Fixture count & variance** | **Three** scenes: (09) minimal `matchMode: "one"`, (10) medium + `referenceDocument`, (11) one bucket `matchMode: "all"`. |
| **Presentation mode (v1)** | **`blocks` only** (`presentation.targetMode: "blocks"` or omitted). **`lines`** deferred until server implements `evaluateDragDrop` for lines (today: `unsupported_dragdrop_mode`). |
| **Item label field** | Authoring uses **`label`**. Normalizer accepts legacy **`text`** as `label ?? text` (MC/matching pattern). |
| **v1 UI media** | **Text-only** tiles. Ignore `assetId` / `imageUrl` until a later phase. |
| **Interaction (v1)** | **(1) Pointer drag** tile from bank → target drop zone; active tile follows pointer above scroll content. **(2) Tap-select tile** → tap target to place (mobile-friendly). **(3) Return to bank** — drop outside zones, tap empty area, or **×** on each placed tile (**required**, matching-style unpair). |
| **Unpair control** | Small **×** on tiles in drop zones when placed; tap returns tile to bank and clears that assignment. |
| **Placement rules** | Each item in **at most one** target at a time. **`matchMode: "one"`** (default): UI **appends** tiles in the same zone (evicts from other zones only); scoring needs **exactly one** correct tile per target at Controlla. **`matchMode: "all"`**: multiple tiles per target (bucket); chips wrap inside drop zone. |
| **Drop zone hint** | Empty zone shows muted *Trascina qui*; hide when at least one tile present. |
| **Bank / target captions** | Optional `presentation.sourceLabel` / `presentation.targetLabel`. Defaults: *Parole da spostare* / *Trascina qui sotto nella categoria giusta*. |
| **Subtitle / hint** | `content.task.subtitle` optional. If empty, show default in **`beforeScroll`** (`text-xs` muted): *Tocca una carta e trascinala nella zona della categoria corretta. Puoi spostarle di nuovo se sbagli.* Do **not** duplicate `content.instruction` (`TaskChrome`). |
| **Shuffle** | `shuffleItemOrder !== false` → shuffle bank order once per scene mount (seed from `scene.id`). |
| **`requireBankEmpty`** | **Legacy** JSON flag (ignored on web). Do not block Controlla on bank or empty zones. |
| **Pre-submit validation** | **`validateDragDropDraft` is a no-op** — always POST attempt. No `correctItemIds` on client. Wrong/empty → server ratio + `SuccessOverlay` retry. |
| **Copy hierarchy** | `content.title` → header. `content.instruction` → **`TaskChrome`**. `content.task.prompt` → **`TaskBodyLayout`**. |
| **Multi-step** | **None.** Shell footer: **Indietro** / **Controlla** only. |
| **Catalog validation** | `parseDragDropContent` when `screen_type === "drag_drop"` — fail catalog load on invalid payloads; require `items`, `targets`, each target with `correctItemIds` (authoring integrity, not shown to player). |
| **Legacy catalog scenes** | **Fill with minimal valid `task` payloads** in the same implementation pass (not excluded from catalog). **Primary QA** remains quest-01 **09–11**; stubs elsewhere only need to pass Zod + loader. |
| **Legacy stub files (today)** | `chapter-02/quests/quest-02/scenes/02.json`, `chapter-04/…/02.json`, `chapter-05/…/02.json`, `chapter-06/…/02.json` — each currently `task: {}`. |
| **Delivery mode** | Single end-to-end implementation pass (phases 1→3 internally), same as matching rollout. |

---

## 3. Interaction & layout (blocks v1)

### 3.1 Presentation modes

| `presentation.targetMode` | Web v1 | Attempt shape per target |
| ------------------------- | ------ | ------------------------ |
| **`blocks`** (default) | Bank + stacked target blocks (title + drop zone) | `assignments[targetId] = ["id1", …]` |
| **`lines`** | **Not implemented** (server `501`) | `assignments[targetId] = "id"` (documented for later) |

### 3.2 Layout sketch

```text
TaskBodyLayout
├── prompt (fixed)
├── beforeScroll (subtitle hint + validation error)
└── scroll area
    └── DragDropTask
        ├── source caption (optional)
        ├── item bank (flex wrap, draggable tiles)
        ├── target caption (optional)
        └── targets list (stacked blocks)
            └── per target: title + drop zone (min-height ~100px, inner flex wrap)
```

| Concern | Approach |
| ------- | -------- |
| Active drag | Float layer or fixed-position tile above bank/targets; restore on drop/cancel |
| Hit testing | `elementFromPoint` or pointer target on drop inner hosts; smallest zone wins on overlap |
| Scroll | Bank + targets inside `TaskBodyLayout` scroll child |
| Touch | Tap-select + tap-target; optional ~10px drag threshold before float drag starts |
| Spacing | Tile gap 8px, target block margin 10px, min tile height 44px (align with existing task tokens) |

### 3.3 Lines mode (later)

Authoring shape (for format doc; **not** in web v1):

```jsonc
{
  "presentation": { "targetMode": "lines" },
  "items": [{ "id": "w1", "label": "gatto" }],
  "targets": [{ "id": "slot-a", "correctItemIds": ["w1"] }],
  "lines": [{
    "segments": [
      { "kind": "text", "text": "Il " },
      { "kind": "slot", "targetId": "slot-a" },
      { "kind": "text", "text": " è nel giardino." }
    ]
  }]
}
```

Requires server scoring for lines before UI ships.

---

## 4. Current repository state (audit)

### Already implemented (server / lib)

| Area | Location | State |
| ---- | -------- | ----- |
| Zod schema | `lib/game/schemas/dragDropContentSchema.ts` | Exists; **loose** (`.passthrough()`) — tighten in Phase 1. |
| Scoring | `lib/game/scoring/evaluateTaskAttempt.ts` → `evaluateDragDrop` | **Blocks** targets only; `lines` → `501` |
| Attempt API | `dragAttemptSchema` | `{ assignments: Record<string, string \| string[]> }` |
| Step validation | `lib/game/stepContentValidation.ts` | `task_type: "DragDrop"` registered |
| Service mapping | `game-progress-service.ts` | `drag_drop` → `DragDrop` |
| Tests | `lib/game/scoring/taskScoring.test.ts` | `one` / `all` / OR `correctItemIds` / multi-item penalty on `one` |

### Not implemented (web UI / catalog)

| Area | State |
| ---- | ----- |
| Catalog validation | No `parseDragDropContent` in `catalog-loader.ts` |
| `quest-01/scenes/09–11.json` | **To add** |
| Task renderer | `TaskPlaceholder` |
| Play draft / real attempt | `buildPlaceholderAttempt` fake-assigns first item to all targets |
| `docs/quest-scene-content-format.md` | No drag_drop payload subsection yet |
| `components/game/tasks/types/drag-drop/` | Missing |

### Legacy `drag_drop` scenes (empty `task` today)

Four scenes use `screen_type: "drag_drop"` with **`task: {}`**. **Decision:** replace with **minimal blocks** payloads in Phase 1 so strict catalog validation does not break `loadContentCatalog()` / dev.

| File | Action |
| ---- | ------ |
| `lib/content/chapters/chapter-02/quests/quest-02/scenes/02.json` | Minimal stub (§6.4) |
| `lib/content/chapters/chapter-04/quests/quest-02/scenes/02.json` | Minimal stub |
| `lib/content/chapters/chapter-05/quests/quest-02/scenes/02.json` | Minimal stub |
| `lib/content/chapters/chapter-06/quests/quest-02/scenes/02.json` | Minimal stub |

Stubs are **not** learner-facing QA targets; keep copy short and scoring simple (e.g. flat pizza or low `minRatioToComplete`) so authors can replace later without blocking the web rollout.

---

## 5. Data contract — `content.task` for `screen_type: "drag_drop"`

Payload is stored under scene `content.task` (see `getTaskPayload`).

### 5.1 Top-level fields (blocks v1)

| Field | Required | Description |
| ----- | -------- | ----------- |
| `prompt` | recommended | `TaskBodyLayout` prompt |
| `subtitle` | no | Learner hint; defaults per §2 if omitted |
| `items` | yes | Bank tiles `{ id, label?, assetId?, imageUrl? }` |
| `targets` | yes (blocks) | `{ id, title?, matchMode?: "one" \| "all", correctItemIds? }` — required for catalog/scoring, **not read in UI** |
| `presentation` | no | `{ targetMode?: "blocks" \| "lines", sourceLabel?, targetLabel? }` |
| `shuffleItemOrder` | no | default shuffle on |
| `requireBankEmpty` | no | **Legacy** — ignored on web (do not block Controlla) |
| `lines` | no | lines mode only — not in web v1 |
| `referenceDocument` | no | Documento (may also live on `content.referenceDocument`) |

### 5.2 Scoring semantics (server — blocks)

| `target.matchMode` | Player places | Correct when |
| ------------------ | ------------- | ------------ |
| **`one`** (default) | Exactly **one** item id in attempt for that target | Placed id ∈ `correctItemIds` (OR list) |
| **`all`** | **All** listed ids in target (array) | Placed set **equals** `correctItemIds` set |

- Ratio = (# targets correct) / (# targets with non-empty `correctItemIds`).
- More than one item on a **`one`** target → that target scores **incorrect** (existing test).

### 5.3 Attempt payload

```json
{
  "taskType": "DragDrop",
  "dragDrop": {
    "assignments": {
      "target-frutta": ["item-mela"],
      "city-torino": ["prod-gianduiotto", "prod-fiat", "prod-pinguino"]
    }
  }
}
```

- **`one` targets:** send a **single** string or one-element array (normalizer accepts both).
- **`all` targets:** send **array** of all placed item ids (order not scored; sort for stable tests).

### 5.4 Client validation (pre-Controlla)

| Condition | Behavior |
| --------- | -------- |
| Invalid / failed normalize | Inline *Contenuto drag-and-drop non valido.* (no submit) |
| Partial layout (empty zones, bank tiles) | **Allowed** — Controlla POSTs; server scores |
| Wrong placements | **`SuccessOverlay`** + `taskOutcome` retry — not Sonner, not pre-submit block |

Post-**Controlla** feedback: **`SuccessOverlay`** + `taskOutcome` (retry), not Sonner.

---

## 6. Example content — quest-01 fixtures (after matching)

### 6.1 Quest flow (target)

| # | File | `screen_type` | Role |
| - | ---- | ------------- | ---- |
| 1–3 | `01–03.json` | `info` | Story (unchanged) |
| 4–5 | `04–05.json` | `multiple_choice` | MC fixtures (unchanged) |
| 6–8 | `06–08.json` | `matching` | Matching fixtures (unchanged) |
| 9 | `09.json` | `drag_drop` | **Minimal blocks** — 3 items, 3 targets, `one` |
| 10 | `10.json` | `drag_drop` | **Medium** — 6 items, 6 targets (`one`), `referenceDocument` |
| 11 | `11.json` | `drag_drop` | **Bucket** — 1 target `matchMode: "all"`, 3+ items |

### 6.2 Scene profiles

| File | Items | Targets | Flags | Scoring notes |
| ---- | ----- | ------- | ----- | ------------- |
| **09 — minimal** | 3 | 3 (`one`) | `shuffleItemOrder: true` | `minRatioToComplete: 0.67` |
| **10 — medium** | 6 | 6 (`one`) | `referenceDocument`, long labels | `minRatioToComplete: 0.75` |
| **11 — bucket** | 3 products | 1 (`all`) | bucket demo | `minRatioToComplete: 1` |

### 6.3 Minimal JSON sketch (scene 09)

```jsonc
{
  "id": "chapter-01-quest-01-scene-09",
  "scene_type": "task",
  "screen_type": "drag_drop",
  "background": "chapters/01/quests/01/bg-task-01",
  "content": {
    "title": "Metti le parole al posto giusto",
    "instruction": "Trascina ogni parola nella categoria corretta.",
    "task": {
      "prompt": "Dove va ogni parola?",
      "presentation": { "targetMode": "blocks" },
      "shuffleItemOrder": true,
      "items": [
        { "id": "item-mela", "label": "mela" },
        { "id": "item-cane", "label": "cane" },
        { "id": "item-libro", "label": "libro" }
      ],
      "targets": [
        { "id": "cat-frutta", "title": "Frutta", "correctItemIds": ["item-mela"] },
        { "id": "cat-animali", "title": "Animali", "correctItemIds": ["item-cane"] },
        { "id": "cat-cose", "title": "Cose", "correctItemIds": ["item-libro"] }
      ]
    }
  },
  "scoring": {
    "backpack": { "pieces": 1 },
    "pizza": {
      "mode": "scored",
      "maxSlices": 3,
      "minRatioToComplete": 0.67,
      "mapping": { "kind": "linear" }
    }
  }
}
```

### 6.4 Minimal stub template (legacy chapters)

Use the **smallest** valid blocks payload: **one item**, **one target**, `matchMode: "one"`. Preserve each file’s existing `id`, `title`, `instruction`, `background`, and `scoring` envelope where present; only replace `content.task`.

```jsonc
"task": {
  "prompt": "Metti la parola nella casella.",
  "presentation": { "targetMode": "blocks" },
  "shuffleItemOrder": false,
  "items": [{ "id": "stub-item", "label": "parola" }],
  "targets": [{
    "id": "stub-target",
    "title": "Casella",
    "correctItemIds": ["stub-item"]
  }]
}
```

Use **unique** `stub-item` / `stub-target` ids per file if multiple stubs could be cross-validated in tests (prefix with chapter/quest, e.g. `ch02-q02-stub-item`).

**Manual QA path:** Login → chapter 01 → quest **Arrivo** → advance through **all 11 scenes** (01–08 story/MC/matching, then **09–11** drag_drop). Long quest chain is **intentional** for end-to-end shell QA.

**Interaction QA checklist (quest-01 scenes 09–11; × required):**

- [ ] Drag tile bank → zone; tile returns on miss.
- [ ] Tap-select tile → tap zone places tile.
- [ ] **×** on placed tile returns it to bank.
- [ ] `one` target: second tile replaces first (previous returns to bank).
- [ ] `all` target: multiple tiles stay in same zone.
- [ ] Empty zone shows *Trascina qui*; hint hides when filled.
- [ ] Controlla with empty zone → inline error (no toast).
- [ ] Wrong assignment → retry overlay.
- [ ] Scroll long target list; drag still tracks pointer.

---

## 7. Client architecture

### 7.1 Directory layout

```text
components/game/tasks/types/drag-drop/
├── DragDropTask.tsx
├── DragDropItemBank.tsx
├── DragDropTargetBlock.tsx
├── DragDropTile.tsx              # bank + zone tile; × unpair when placed in zone
└── DragDropDropZone.tsx

lib/game/tasks/drag-drop/
├── normalize-drag-drop-content.ts
├── drag-drop-display-order.ts
├── validate-drag-drop-draft.ts
├── build-drag-drop-attempt.ts
└── drag-drop-types.ts
```

### 7.2 Draft state (`/play`)

| State | Type | Purpose |
| ----- | ---- | ------- |
| `dragDropAssignments` | `Record<targetId, string[]>` | item ids per target |
| `dragDropSelectedItemId` | `string \| null` | tap mode |
| `dragDropValidationError` | `string \| null` | inline under prompt |

`syncDragDropDraftForScene` resets on scene change (snapshot / advance / retreat / attempt), same pattern as matching.

Remove `drag_drop` branch from `buildPlaceholderAttempt` once real builder ships.

### 7.3 Shared helpers

| Helper | Role |
| ------ | ---- |
| `normalizeDragDropContentResult` | Parse via Zod + defaults for labels/captions |
| `buildDragDropAttempt(targets, assignments)` | Emit API attempt; arrays for `all`, string or `[id]` for `one` |
| `validateDragDropDraft` | Structural rules §5.4 |

---

## 8. Play page integration

| Change | File |
| ------ | ---- |
| Draft state + sync | `app/(game)/play/page.tsx` |
| Submit branch | `handleControlla` → `buildDragDropAttempt` when `screen_type === "drag_drop"` |
| Props | `SceneRouter` → `TaskPanel`: assignments + validation error |

No `SceneRouter` primary-button changes (no multi-step).

---

## 9. Schema & catalog (Phase 1)

| Step | Action |
| ---- | ------ |
| 1 | Tighten `dragDropContentSchema` (strict objects, `label ?? text`, unique ids, `correctItemIds` reference known `items`; catalog rejects `targetMode: "lines"` until server ready). |
| 2 | `catalog-loader.ts`: `parseDragDropContent` for `drag_drop` tasks. |
| 3 | Add `quest-01/scenes/09.json`, `10.json`, `11.json`. |
| 4 | Update `chapter-01-smoke-content.test.ts`: expect **11** scenes; assert drag_drop on 09–11. |
| 5 | **Minimal stubs** in four legacy `drag_drop` scenes (§6.4). |
| 6 | Add drag_drop subsection to `docs/quest-scene-content-format.md`. |

---

## 10. Phased checklist

### Phase 0 — Plan

- [x] Integration plan drafted.
- [x] Proposed fixtures **09–11** on quest-01.
- [x] Blocks-only v1; lines deferred.
- [x] Product sign-off on §2 (2026-06-03): minimal legacy stubs, **×** unpair required, quest-01 **11 scenes** intentional.

### Phase 1 — Data & fixtures

- [ ] Tighten Zod + catalog validation.
- [ ] Add `scenes/09.json`, `10.json`, `11.json`.
- [ ] Minimal stubs in legacy `drag_drop` scenes (§6.4, four files).
- [ ] Smoke tests (11-scene quest-01; catalog loads all `drag_drop` tasks).
- [ ] Quest-scene format doc subsection.

### Phase 2 — UI (blocks)

- [ ] Pure helpers + unit tests.
- [ ] `DragDropTask` + components (incl. **×** unpair on zone tiles).
- [ ] `TaskPanel` dispatch.
- [ ] Optional CSS tokens in `app/globals.css`.

### Phase 3 — Play

- [ ] Draft sync + attempt builder + client validation.
- [ ] Wire `/play`; remove placeholder attempt.
- [ ] Manual QA 01→11.

### Phase 4 — Polish (optional)

- [ ] Keyboard: focus tile → activate zone.
- [ ] `prefers-reduced-motion`: reduce drag animation only.

### Later

- [ ] **Lines mode** UI + server scoring.
- [ ] Tile images via `resolveAssetUrl` + `assetId`.

---

## 11. Testing

| Layer | Focus |
| ----- | ----- |
| Catalog / Zod | Quest-01 scenes 09–11 + four legacy stubs load; invalid `drag_drop` fails at load. |
| `build-drag-drop-attempt` | `one` vs `all` encoding; empty zones rejected client-side. |
| Scoring | Existing `evaluateDragDrop` tests. |
| Manual | 09→10→11; bank empty; bucket; retry overlay. |

---

## 12. Code references

| Topic | Path |
| ----- | ---- |
| Drag-drop schema | `lib/game/schemas/dragDropContentSchema.ts` |
| Scoring | `lib/game/scoring/evaluateTaskAttempt.ts` (`evaluateDragDrop`) |
| MC / matching pattern | `docs/multiple-choice-task-integration-plan.md`, `docs/matching-task-integration-plan.md` |
| Matching fixtures (predecessor) | `lib/content/chapters/chapter-01/quests/quest-01/scenes/06–08.json` |
| Planned fixtures | `lib/content/chapters/chapter-01/quests/quest-01/scenes/09–11.json` |
| Legacy stubs | `chapter-02/04/05/06` → `quests/quest-02/scenes/02.json` (see §6.4) |
| Smoke tests | `lib/game/content/chapter-01-smoke-content.test.ts` |

---

## 13. Detailed implementation plan

### 13.1 Work order

1. Data + fixtures (09–11) + legacy minimal stubs  
2. Pure helpers + tests  
3. UI: bank, targets, drag + tap  
4. Play-page draft + submit  
5. Docs + smoke tests  
6. Manual QA 01→11  

### 13.2 Minimal file touch list

- `lib/game/schemas/dragDropContentSchema.ts` (+ tests)
- `lib/game/content/catalog-loader.ts`
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/09–11.json` (new)
- `lib/content/chapters/chapter-{02,04,05,06}/quests/quest-02/scenes/02.json` (minimal `task` stubs)
- `lib/game/content/chapter-01-smoke-content.test.ts`
- `lib/game/tasks/drag-drop/*` (new)
- `components/game/tasks/types/drag-drop/*` (new)
- `components/game/tasks/TaskPanel.tsx`
- `components/game/shell/SceneRouter.tsx` (props)
- `app/(game)/play/page.tsx`
- `app/globals.css` (optional)
- `docs/quest-scene-content-format.md`

### 13.3 Execution notes

- **Do not** read `correctItemIds` in React for placement feedback before submit.
- Enforce **one tile per `one` target** in UI (server treats multiple as wrong).
- Bucket scene **11** must post an attempt array matching server set equality.
- Keep drag performant: avoid full tree re-render on `pointermove`.
- **×** unpair is required in v1, not optional polish.

---

## Changelog

| Date | Change |
| ---- | ------ |
| 2026-06-03 | Initial plan: web blocks v1; quest-01 fixtures 09–11; structural-only client validation; lines deferred. |
| 2026-06-03 | Removed legacy Unity references; web-first interaction spec in §3. |
| 2026-06-03 | Product sign-off: §2 locked; minimal stubs for four legacy `drag_drop` scenes (§6.4); **×** unpair required; quest-01 **11 scenes** confirmed intentional; implementation explicitly deferred until requested. |
