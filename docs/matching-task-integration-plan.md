# Matching task integration — implementation plan

**Status:** Agreed baseline (2026-06-03) — updated with final implementation confirmations.  
**Scope (this pass):** Matching — data contract, **three fixture scenes at the end of chapter-01 / quest-01** (after MC), web UI with **connector lines + rubber-band drag** (Unity parity), play-page attempt flow, delivered in one implementation step.  
**Out of scope (later):** `poolPairs` + server-side sampling (bonus quest track), option **images** (`assetId` / `imageUrl`), drag-and-drop, cloze, error spotting, freetext/LLM, bonus screens.

**Related:** `docs/multiple-choice-task-integration-plan.md`, `docs/quest-scene-content-format.md`, `docs/web-game-ui-architecture.md`, `.cursor/plans/chapter-01-bonus-matching-foundation.md`, `AGENTS.md`, `.cursor/skills/web-task-type-ui/SKILL.md`.

---

## 1. Goals

| Goal | Notes |
| ---- | ----- |
| Render real matching UI in the quest task area | Below shell `instruction` (`TaskChrome`), inside `TaskPanel` — not a placeholder. |
| Authoring-friendly JSON | Strict contract; **three matching fixture scenes** appended to **quest-01** (after MC 04/05) for maximal layout variance. |
| Unity-grade pairing UX | Two columns, **committed connector lines**, **rubber-band while dragging**, tap-to-pair, unpair **×**, right-column shuffle. |
| Clean task-type architecture | Mirror multiple-choice rollout: dispatcher, type folder, pure helpers, draft sync on `/play`. |
| Server remains authoritative | Scoring and correctness only on server (`evaluateMatching`); client never reads `correctPairs` for UX logic. |

---

## 2. Locked product / tech decisions

| Topic | Decision |
| ----- | -------- |
| **Fixture placement** | **chapter-01 → quest-01** (`Arrivo`), **after** existing MC fixtures. New files **`scenes/06.json`**, **`07.json`**, **`08.json`**. Full quest flow: `info` ×3 → `multiple_choice` ×2 → **`matching` ×3**. |
| **Fixture count & variance** | **Three** scenes (minimal / medium / rich) — same pattern as MC (04 minimal, 05 rich) but with an extra middle step for pair-count and copy length gradients. |
| **Item label field** | Authoring uses **`label`**. Zod + normalizer accepts legacy **`text`** as `label ?? text` (same pattern as MC). |
| **v1 UI media** | **Text-only** cards (`label`). Ignore `assetId` / `imageUrl` in UI until a later phase. |
| **Interaction (v1 — full Unity set)** | **(1) Tap left → tap right** to pair. **(2) Pointer down on left → drag** with **rubber-band line** to cursor; release on right card to pair (Unity `DragThresholdPx` ≈ 10px). Both paths call the same `tryPair(leftId, rightId)` logic. |
| **Connector lines (v1 — required)** | SVG (or canvas) **line layer** over the pairing area: draw a **committed segment** for each paired left→right (Unity `MatchingLineLayer`). Lines reconnect on scroll/resize (`ResizeObserver` + `requestAnimationFrame` debounce). Use Unity-near style: stroke **5px**, rounded caps, color close to Unity (`rgba(71,107,235,0.9)`). |
| **Unpair** | Small **×** on each left row when paired (Unity `matching-unpair`); tap clears assignment and removes line. |
| **Re-pairing rules** | If a right item is already used, assigning it to a new left **steals** it from the previous left (Unity `TryPair`). Tapping/dropping the same left+right again **toggles off** the pair. |
| **Column order** | Left = **`leftItems` authoring order**. Right = shuffled when `presentation.shuffleRightOrder !== false` (default **shuffle on**); stable order per scene mount (seed from `scene.id`). |
| **Column headers** | Optional `presentation.leftLabel` / `presentation.rightLabel`. Defaults: **Italiano** / **Traduzione**. |
| **Input modes on mobile + desktop** | Both input modes are required everywhere: **tap-only pairing** and **drag with rubber-band**. Drag is additive, not a replacement for tap. |
| **Drag threshold** | Fixed to **10px** (Unity-near default) for first pass; tune only if QA reveals touch issues. |
| **Copy hierarchy (web)** | `content.title` → header. `content.instruction` → **`TaskChrome`**. `content.task.prompt` → **`TaskBodyLayout`**. Optional one-line hint in **`beforeScroll`**: *Trascina una linea o tocca due carte.* (Unity subtitle equivalent — `text-xs` muted). **No separate `subtitle` field in v1.** |
| **Multi-step** | **None.** All pairs on one screen. Shell footer: **Indietro** / **Controlla**. |
| **Submit validation UX** | On **Controlla**, if any left unpaired: inline error under prompt (*Completa ogni abbinamento.*). No client-side correctness check — server → `SuccessOverlay` retry. |
| **Catalog validation** | `parseMatchingContent` when `screen_type === "matching"` — **fail catalog load** on invalid payloads. |
| **poolPairs authoring** | Schema allows `poolPairs` + `sampleSize`; **not materialized in v1** (bonus track). |
| **quest-02 matching** | **Primary smoke/QA fixtures** are quest-01 scenes 06–08. Existing `quest-02/scenes/02.json` may stay, and can be opportunistically aligned in the same pass if low-risk. |
| **Delivery mode** | Ship all scoped work in **one implementation step** (single end-to-end pass), not split across separate implementation rounds. |

---

## 3. Unity reference (`unity-implementation` branch)

Use Unity as the **interaction spec**, not a code dependency.

### 3.1 What Unity implements

| Area | Unity location | Behavior |
| ---- | -------------- | -------- |
| Step presenter | `MatchingToolkitStep.cs` | Pairing map, line layer, tap + drag, shell submit. |
| Line layer | `MatchingLineLayer` (inner class) | Committed segments + rubber-band; `lineWidth = 5f`; stroke ~`(0.28, 0.42, 0.92)`. |
| Template | `MatchingTaskTemplate.uxml` | Prompt, subtitle hint, scroll pairing area, absolute line host between columns. |
| Parts | `MatchingCardPart`, `MatchingLeftRowPart`, `MatchingColumnHeaderPart` | Cards, unpair **×**, headers. |
| Geometry | `GeometryChangedEvent` on pairing area | Refreshes line endpoints after layout/scroll. |
| Connector points | `GetConnectorPoint(leftEl, column, fromLeft)` | Line anchors on **inner edge** of cards (right edge of left column, left edge of right column), vertically centered on row. |

### 3.2 Interaction model (Unity → web v1)

| Unity | Web v1 |
| ----- | ------ |
| Tap left, tap right | ✅ |
| Drag line left → right (threshold 10px) | ✅ Pointer events on left cards + capture on pairing root |
| Rubber-band while dragging | ✅ Live SVG line from left anchor to pointer |
| Committed lines for pairs | ✅ SVG segments, updated on pair/unpair/scroll/resize |
| × unpair on left row | ✅ |
| Right column shuffle | ✅ |
| Local correctness before submit | ❌ Server scores only |
| Server attempt on Controlla | ✅ |

### 3.3 Line layer — web implementation sketch

```text
matching-pairing-area (position: relative)
├── matching-line-layer (SVG, absolute inset 0, pointer-events: none, z-index below cards)
│   ├── <line> per committed pair (leftAnchor → rightAnchor)
│   └── <line> rubber-band (optional, while dragging)
└── matching-columns-row (flex/grid, gap ≥ 32px)
    ├── left column (+ ref per card for anchor)
    └── right column (+ ref per card for anchor)
```

| Concern | Approach |
| ------- | -------- |
| Anchor math | `getBoundingClientRect()` on card + pairing area; anchor X at column inner edge, Y at row vertical center. |
| Scroll | Line layer lives **inside** `TaskBodyLayout` scroll child so lines share scroll container with cards; recompute on scroll (`scroll` listener, passive). |
| Resize | `ResizeObserver` on pairing area + columns. |
| Performance | Batch DOM reads in one `requestAnimationFrame`; avoid React re-render per pointermove (ref + direct SVG attr update). |
| Styling | CSS variable e.g. `--matching-line-color`, `--matching-line-width: 5px`; rounded caps optional. |
| Hit testing | Drag release: `document.elementFromPoint` or pointer target walk to find right card id under cursor (Unity `FindRightIdUnder`). |

---

## 4. Current repository state (audit)

### Already implemented (server / lib)

| Area | Location | State |
| ---- | -------- | ----- |
| Matching Zod schema | `lib/game/schemas/matchingContentSchema.ts` | Exists; tighten in Phase 1. |
| Scoring | `evaluateTaskAttempt.ts` | `evaluateMatching` ready. |
| Attempt API | `matchingAttemptSchema` | `{ pairs: Record<string, string> }`. |
| Step validation | `stepContentValidation.ts` | Registered. |
| MC fixtures | `quest-01/scenes/04.json`, `05.json` | Implemented. |
| quest-02 matching | `quest-02/scenes/02.json` | Legacy single-pair scene (narrative); not primary QA path. |

### Not implemented (web UI / catalog)

| Area | State |
| ---- | ----- |
| Catalog validation for matching | Missing in `catalog-loader.ts`. |
| `quest-01/scenes/06–08.json` | **To add.** |
| Task renderer + line layer | Placeholder only. |
| Play draft / real attempt | Placeholder auto-submit. |

---

## 5. UI placement (web shell)

Unchanged shell frame; matching body adds **line layer inside scroll region**.

```
TaskBodyLayout
├── prompt (fixed)
├── beforeScroll (validation error + drag hint)
└── scroll area
    └── MatchingTask
        ├── MatchingLineLayer (SVG)
        └── two columns of cards
```

---

## 6. Data contract — `content.task` for `screen_type: "matching"`

(Same canonical JSON as before — see §6.1–6.5 in prior revision; rules unchanged.)

### 6.1 Attempt payload

```json
{
  "taskType": "Matching",
  "matching": {
    "pairs": { "left-id": "right-id" }
  }
}
```

### 6.2 Client validation (pre-Controlla)

| Condition | Copy |
| --------- | ---- |
| Invalid content | *Contenuto abbinamento non valido.* |
| Any left unpaired | *Completa ogni abbinamento.* |

---

## 7. Example content — quest-01 fixtures (after MC)

All three scenes are **smoke/QA tasks** appended after MC scenes 04 and 05. Italian learner copy; scored so Controlla, retry overlay, and pizza paths are exercisable.

### 7.1 Quest flow (target)

| # | File | Scene id | `screen_type` | Role |
| - | ---- | -------- | ------------- | ---- |
| 1–3 | `01–03.json` | … | `info` | Story previews (unchanged) |
| 4 | `04.json` | `…-scene-04` | `multiple_choice` | MC minimal (unchanged) |
| 5 | `05.json` | `…-scene-05` | `multiple_choice` | MC rich (unchanged) |
| 6 | `06.json` | `chapter-01-quest-01-scene-06` | `matching` | **Minimal matching** |
| 7 | `07.json` | `chapter-01-quest-01-scene-07` | `matching` | **Medium matching** |
| 8 | `08.json` | `chapter-01-quest-01-scene-08` | `matching` | **Rich matching** |

### 7.2 Scene profiles

| File | Pairs | Right items (incl. distractors) | Copy | Other |
| ---- | ----- | ------------------------------- | ---- | ----- |
| **06 — minimal** | **3** | 4 (1 decoy) | Short `title`, `instruction`, `prompt`; short card labels (1–2 words). | `shuffleRightOrder: true`; `minRatioToComplete: 0.6`. |
| **07 — medium** | **6** | 8 (2 decoys) | Medium `instruction`; mixed label lengths (short + one wrapping line). | Column labels set; `minRatioToComplete: 0.67`. |
| **08 — rich** | **10** | 14 (4 decoys) | Long `title` / `instruction` / `prompt` (MC-style stress text); several **long wrapping** card labels. | `referenceDocument` with long body; scroll + line redraw stress test; `minRatioToComplete: 1`. |

**Scoring (all three):** `mode: "scored"` with fixed thresholds: **06 → 0.6**, **07 → 0.67**, **08 → 1.0**. Backpack optional on one scene.

**Manual QA path:** Login → chapter 01 → quest **Arrivo** → advance through 01–05 (story + MC) → **06** (few pairs, lines on short layout) → **07** (medium) → **08** (many pairs, scroll, long copy, Documento).

**Line/drag QA checklist (every matching scene):**

- [ ] Tap-pair draws committed line; unpair removes it.
- [ ] Drag from left shows rubber-band; drop on right commits pair + line.
- [ ] Drag below threshold still counts as tap-select.
- [ ] Steal right from another left updates both lines.
- [ ] Scroll inside task body keeps lines aligned with cards.
- [ ] Resize / mobile viewport refreshes anchors without drift.

---

## 8. Client architecture

### 8.1 Directory layout

```text
components/game/tasks/types/matching/
├── MatchingTask.tsx              # layout, gesture state, refs for anchors
├── MatchingLineLayer.tsx         # SVG lines + rubber-band (pointer-driven)
├── MatchingColumn.tsx
├── MatchingCard.tsx
└── MatchingLeftRow.tsx             # card + unpair ×

lib/game/tasks/matching/
├── normalize-matching-content.ts
├── matching-display-order.ts
├── matching-line-geometry.ts     # pure anchor math (unit-testable)
├── validate-matching-draft.ts
├── build-matching-attempt.ts
└── matching-types.ts
```

### 8.2 Gesture state (`MatchingTask`)

| State | Purpose |
| ----- | ------- |
| `pairs: Record<leftId, rightId \| null>` | Draft from `/play` |
| `selectedLeftId` | Tap mode highlight |
| `dragLeftId` + pointer position | Rubber-band source |
| `draggingLine: boolean` | After 10px movement from pointer down |
| Card refs `Map<id, HTMLElement>` | Anchor lookup for line layer |

Shared **`tryPair(leftId, rightId)`** used by tap and drag-release (Unity parity).

### 8.3 Presentation

| Topic | Choice |
| ----- | ------ |
| Column gap | ≥ 32px (Unity `lg-matching-center-gap`) |
| Selected left | Left border accent (Unity 3px) |
| Paired cards | Subtle linked styling + committed line |
| Line layer | `pointer-events: none`; z-index under interactive cards |
| Hint | `beforeScroll`: *Trascina una linea o tocca due carte.* |
| Scroll | `TaskBodyLayout` children only |

---

## 9. Play page integration

Same as MC pattern: `matchingPairs` draft, `syncMatchingDraftForScene`, `buildMatchingAttempt`, remove matching from `buildPlaceholderAttempt`. No `SceneRouter` nav changes.

---

## 10. Schema & catalog (Phase 1)

| Step | Action |
| ---- | ------ |
| 1 | Tighten `matchingContentSchema` (strict objects, `label ?? text`, pair integrity). |
| 2 | `catalog-loader`: validate matching tasks at load. |
| 3 | Add **`quest-01/scenes/06.json`**, **`07.json`**, **`08.json`**. |
| 4 | Update `chapter-01-smoke-content.test.ts`: expect 8 scenes; assert matching payloads on 06–08. |
| 5 | Document matching in `docs/quest-scene-content-format.md`. |

---

## 11. Phased checklist

### Phase 0 — Plan ✅

- [x] Fixtures at **end of quest-01** (06 minimal, 07 medium, 08 rich).
- [x] Three variance levels (pair count, copy length, distractors).
- [x] Connector lines + rubber-band drag **in v1** (not deferred).
- [x] Tap-pair, unpair, shuffle, web copy hierarchy.
- [x] poolPairs deferred.

### Phase 1 — Data & fixtures

- [ ] Tighten Zod + catalog validation.
- [ ] Add `scenes/06.json`, `07.json`, `08.json`.
- [ ] Update smoke tests (8-scene quest-01 flow).
- [ ] Quest-scene format doc subsection.

### Phase 2 — UI (columns + lines + gestures)

- [ ] Pure helpers including `matching-line-geometry.ts`.
- [ ] `MatchingLineLayer` (committed + rubber-band).
- [ ] `MatchingTask` with tap + drag (`tryPair` shared).
- [ ] Column/card/left-row components.
- [ ] `TaskPanel` dispatch.
- [ ] Scroll/resize line refresh.

### Phase 3 — Play

- [ ] Draft sync + attempt builder + client validation.
- [ ] Wire `/play`; remove placeholder attempt.
- [ ] Manual QA path 01→08 including line/drag checklist.

### Phase 4 — Polish (optional)

- [ ] Keyboard pairing (focus left → activate right).
- [ ] Fine-tune line color/width against fixtures on light/dark backgrounds.
- [ ] Reduced-motion: hide rubber-band animation only (lines stay).

### Later — pool / bonus

- [ ] Server materialize `poolPairs` per run.
- [ ] Bonus quest wiring.

---

## 12. Testing

| Layer | Focus |
| ----- | ----- |
| Catalog / Zod | Quest-01 scenes 06–08 load; invalid matching fails. |
| `matching-line-geometry` | Anchor points from mock rects; scroll offset included. |
| Draft / attempt | All left ids in payload; validate incomplete draft. |
| Scoring | Existing `evaluateMatching` tests. |
| Manual | Full 06→07→08 path; tap, drag, unpair, scroll line sync, Controlla retry. |

---

## 13. Code references

| Topic | Path |
| ----- | ---- |
| Matching schema | `lib/game/schemas/matchingContentSchema.ts` |
| MC fixtures (predecessor) | `quest-01/scenes/04.json`, `05.json` |
| Matching fixtures (planned) | `quest-01/scenes/06.json`, `07.json`, `08.json` |
| Smoke tests | `lib/game/content/chapter-01-smoke-content.test.ts` |
| Unity reference | `unity-implementation`: `MatchingToolkitStep.cs`, `MatchingTaskTemplate.uxml` |
| MC rollout pattern | `docs/multiple-choice-task-integration-plan.md` |

---

## 14. Detailed implementation plan

### 14.1 Work order

1. Data + fixtures (06–08)  
2. Pure helpers + line geometry tests  
3. UI: columns, cards, **line layer**, tap + drag  
4. Play-page draft + submit  
5. Docs + smoke tests  
6. Manual QA 01→08  

**Execution mode:** one end-to-end implementation step (single pass), with internal subphases above for sequencing.

### 14.2 Minimal file touch list

- `lib/game/schemas/matchingContentSchema.ts`
- `lib/game/content/catalog-loader.ts`
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/06.json` (new)
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/07.json` (new)
- `lib/content/chapters/chapter-01/quests/quest-01/scenes/08.json` (new)
- `lib/game/content/chapter-01-smoke-content.test.ts`
- `lib/game/tasks/matching/*` (new, incl. `matching-line-geometry.ts`)
- `components/game/tasks/types/matching/*` (new, incl. `MatchingLineLayer.tsx`)
- `components/game/tasks/TaskPanel.tsx`
- `app/(game)/play/page.tsx`
- `app/globals.css` (optional `--matching-line-*` tokens)
- `docs/quest-scene-content-format.md`

### 14.3 Execution notes

- **Lines and drag are required for “done”** — not a follow-up polish PR.
- Implement line redraw without re-rendering the full card tree on every `pointermove`.
- Test scene **08** specifically for scroll + many segments.
- Do not implement `poolPairs` materialization unless explicitly scoped.

---

## Changelog

| Date | Change |
| ---- | ------ |
| 2026-06-03 | Initial plan: quest-02 fixtures, tap-only v1, lines deferred. |
| 2026-06-03 | **Feedback:** Fixtures moved to **quest-01 scenes 06–08** (after MC); **three** variance levels; **connector lines + rubber-band drag in v1**; line layer architecture; QA checklist for line sync on scroll. |
| 2026-06-03 | **Final confirmation:** fixed scoring thresholds (`0.6 / 0.67 / 1.0`), Unity-near line styling, fixed drag threshold (`10px`), both input modes on mobile+desktop, one-step implementation delivery. |
