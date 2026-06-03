# Error spotting task integration — implementation plan

**Status:** Agreed baseline (2026-06-03) — product decisions locked in §2; **implementation not started** until explicitly requested.  
**Scope:** `screen_type: "error_spotting"` — content contract, **server scoring adjustment** (false-positive rule), fixtures in **chapter-01 + chapter-03**, web UI (inline chips + correction fields + **Ripristina**), play-page attempt flow, catalog validation, sanitizer, docs.  
**Out of scope (this pass):** SpecialScreen nested `error_spotting` blocks, segment **images/audio**, bonus-only authoring tools.

**Related:** `docs/multiple-choice-task-integration-plan.md`, `docs/matching-task-integration-plan.md`, `docs/drag-drop-task-integration-plan.md`, `docs/quest-scene-content-format.md`, `docs/web-game-ui-architecture.md`, `AGENTS.md`, `.cursor/skills/web-task-type-ui/SKILL.md`.

**Branch:** `web-based-implementation`.

---

## 1. Goals

| Goal | Notes |
| ---- | ----- |
| Replace `TaskPlaceholder` for `error_spotting` | Flowing passage of tappable word/phrase chips; marked segments become inline correction inputs. |
| Clear learner interaction | Tap segment → toggle mark → inline field; unmark on second tap; **Ripristina** reset; error-count hint. |
| Authoring-friendly JSON | Strict Zod + catalog fail-at-load; **two** fixture scenes (minimal + rich). |
| Clean task-type architecture | Mirror MC / matching / drag-drop: `TaskPanel` dispatch, `lib/game/tasks/error-spotting/*`, draft sync on `/play`. |
| Server remains authoritative | Scoring via `evaluateErrorSpotting` (with **updated** false-positive rule); client **never** reads `acceptedCorrections`. |

---

## 2. Locked product / tech decisions

| Topic | Decision |
| ----- | -------- |
| **Fixture — minimal (chapter-03)** | **chapter-03 → quest-01 → `scenes/02.json`** — fill existing placeholder: **1 error**, short passage, **`flat`** pizza. |
| **Fixture — rich (chapter-01)** | **chapter-01 → quest-01 → `scenes/13.json`** (new file after freetext scene 12): **5 errors**, multi-sentence passage, **`scored`** + `minRatioToComplete: 1` for retry-overlay QA. Quest-01 becomes **13 scenes** total. |
| **Segment granularity** | **Word/phrase chips** in reading order inside one wrapping row. Preserve authored spacing in each `segments[i].text`. |
| **Interaction (v1)** | **(1) Tap chip** → mark → **inline text input**. **(2) Tap again** → unmark. **(3) «Ripristina»** (required) clears all marks + correction drafts. |
| **Copy hierarchy (web shell)** | `content.title` → header. `content.instruction` → **`TaskChrome` only**. `content.task.prompt` → **`TaskBodyLayout`**. No duplicate instruction in the exercise body. |
| **Error-count caption** | **`beforeScroll`** (`text-xs` muted): auto Italian from true error count, or authored **`counterCaption`** with `{count}`, `{min}`, `{max}` tokens. |
| **`expectedErrorRange`** | **Optional in JSON** (see §2.2). Omit in simple fixtures; normalizer derives caption from segment error count. When present, must satisfy `min ≤ errorCount ≤ max`. |
| **Segment `hint`** | Optional tooltip / `title` on chip and inline field. |
| **Correction field** | Max **128** chars; width scales from segment text (clamp ~48–280px). |
| **Pre-submit validation (v1)** | Block **Controlla** only when a **marked** segment has an **empty** correction. Do **not** require all true errors marked. Do **not** client-check against `acceptedCorrections`. |
| **False-positive marking** | **Allowed; no instant fail.** Wrong marks are **ignored for scoring** (see §2.1). Learner can still pass if all true errors are fixed; extra marks do not zero the ratio. |
| **Multi-step** | **None.** Footer: **Indietro** / **Controlla** only. |
| **Catalog validation** | Tightened `parseErrorSpottingContent` at load — fail on invalid payloads. |
| **Sanitizer** | Strip `acceptedCorrections` from snapshots; client normalizer + `errorSpottingClientContentSchema`. |
| **Delivery mode** | Phases 1→3 in one implementation pass (data + scoring fix → UI → play). |

### 2.1 Server scoring rules (v1 — includes planned change)

**Current code** (`evaluateErrorSpotting`): any selected id that is not a true error → **`ratio: 0`**.  
**Agreed v1 behavior:** remove that early exit. False positives are **ignored**; they neither add to `fixed` nor change the denominator.

| Rule | Behavior |
| ---- | -------- |
| No authored errors | `502` / `payload_invalid` |
| Selected ids that are **not** true errors | **Ignored** (no ratio penalty, no instant zero) |
| Score | `ratio = fixedCount / trueErrorCount` where **fixed** = true error id that is **selected** and correction matches any `acceptedCorrections` (trim, collapse whitespace, case-insensitive) |
| Unselected or wrong correction on true errors | Lower ratio (partial credit) |
| Corrections on unselected true errors | Do not count (must mark + type fix) |

**Implementation note (Phase 1):** Update `evaluateErrorSpotting`, `taskScoring.test.ts` (replace “false positive → ratio 0” case), and any service tests that assumed the old rule.

Pre-Controlla client checks remain **UX-only** (empty correction on marked segments).

### 2.2 `expectedErrorRange` — optional (agent decision)

| Case | Catalog | Caption |
| ---- | ------- | ------- |
| **Omitted** | Valid if ≥1 error segment; no range check | Normalizer sets effective `{ min, max } = { count, count }`; default IT caption from count |
| **Present** | `min ≥ 1`, `max ≥ min`, `min ≤ errorCount ≤ max` | `counterCaption` tokens use authored min/max; default caption still uses actual `count` |

**Rationale:** Avoids duplicating the error count in every scene file; authors of simple tasks only maintain `segments`. Power authors can still set range + custom `counterCaption` when copy needs a band (e.g. “at least 2 errors”).

---

## 3. Current repository state (audit)

### 3.1 Already implemented (server / lib)

| Area | Location | State |
| ---- | -------- | ----- |
| Zod schema (loose) | `lib/game/schemas/errorSpottingContentSchema.ts` | Tighten in Phase 1 |
| Scoring | `evaluateErrorSpotting` | ✅ Exists — **change false-positive rule in Phase 1** |
| Attempt API | `errorSpottingAttemptSchema` | ✅ Ready |
| Step validation | `stepContentValidation.ts` | ✅ Registered |
| Service mapping | `game-progress-service.ts` | ✅ `error_spotting` → `ErrorSpotting` |
| Tests | `taskScoring.test.ts` | Update after scoring change |
| Play stub | `play/page.tsx` | Empty placeholder draft only |

### 3.2 Not implemented (web UI / catalog)

| Area | State |
| ---- | ----- |
| Catalog validation | Missing in `catalog-loader.ts` |
| Fixtures | `chapter-03/…/02.json` empty; `chapter-01/…/13.json` missing |
| Task renderer | `TaskPlaceholder` |
| Play flow | No draft sync / `buildErrorSpottingAttempt` / validation |
| Sanitizer | `acceptedCorrections` not stripped |
| Client helpers + UI | Missing |
| Format doc | No `error_spotting` subsection |

---

## 4. UI placement (web shell)

```
TaskBodyLayout
├── prompt (fixed)
├── beforeScroll
│   ├── caption (error count / counterCaption)
│   ├── Ripristina button
│   └── validation error (inline)
└── scroll area
    └── ErrorSpottingTask
        └── chips row (flex flex-wrap)
            ├── ErrorSpottingChip (unmarked)
            └── ErrorSpottingInlineField (marked)
```

| Concern | Approach |
| ------- | -------- |
| Reading flow | Inline tappable chips, `flex-wrap` |
| Marked state | Border/ring accent |
| Scroll | Passage in `TaskBodyLayout` scroll region only |
| Ripristina | Secondary button in `beforeScroll`; clears draft |
| Disabled during submit | Chips, fields, Ripristina, Controlla |

---

## 5. Data contract — `content.task`

### 5.1 Top-level fields

| Field | Required | Client | Description |
| ----- | -------- | ------ | ----------- |
| `prompt` | recommended | ✅ | `TaskBodyLayout` prompt |
| `segments` | **yes** | ✅ | Ordered passage (§5.2) |
| `expectedErrorRange` | no | ✅ meta | Optional; validated when present |
| `counterCaption` | no | ✅ | Optional; `{count}`, `{min}`, `{max}` |
| `instruction` | no | ❌ | Use scene `content.instruction` → `TaskChrome` |
| `referenceDocument` | no | ✅ | Scene-level documento |

### 5.2 Segment object

| Field | Required | Client | Server |
| ----- | -------- | ------ | ------ |
| `id` | yes | ✅ | ✅ |
| `text` | yes | ✅ | — |
| `isError` | no (default false) | ✅ | ✅ |
| `acceptedCorrections` | when `isError` | ❌ strip | ✅ |
| `hint` | no | ✅ tooltip | — |

**Catalog rules:** unique non-empty ids; ≥1 error segment with non-empty `acceptedCorrections`; non-error segments must not carry `acceptedCorrections`.

### 5.3 Attempt payload

```json
{
  "taskType": "ErrorSpotting",
  "errorSpotting": {
    "selectedSegmentIds": ["b", "noise"],
    "corrections": { "b": "va", "noise": "x" }
  }
}
```

Server ignores `"noise"` if not a true error; scores only `"b"` if correction matches.

### 5.4 Client validation (pre-Controlla)

| Condition | Copy |
| --------- | ---- |
| Invalid content | *Contenuto dell'esercizio non valido.* |
| Marked + empty correction | *Scrivi la correzione per ogni errore selezionato.* |

Wrong corrections and false positives → server ratio + **SuccessOverlay** retry (no toast).

---

## 6. Fixtures

### 6.1 Quest flow (target)

| Chapter | File | Scene id | Errors | Scoring | Role |
| ------- | ---- | -------- | ------ | ------- | ---- |
| **03** | `quest-01/scenes/02.json` | `chapter-03-quest-01-scene-02` | 1 | `flat` | Minimal smoke |
| **01** | `quest-01/scenes/13.json` | `chapter-01-quest-01-scene-13` | 5 | `scored`, `minRatioToComplete: 1` | Rich QA, scroll, retry |

**Chapter-01 quest-01 after ship:** `info` ×3 → `multiple_choice` ×2 → `matching` ×3 → `drag_drop` ×3 → `free_text` ×1 → **`error_spotting` ×1** (13 scenes).

### 6.2 Minimal payload (chapter-03 scene-02)

```jsonc
{
  "prompt": "Trova l'errore nel testo.",
  "segments": [
    { "id": "a", "text": "Maria ", "isError": false },
    { "id": "b", "text": "vai ", "isError": true, "acceptedCorrections": ["va"] },
    { "id": "c", "text": "a scuola ogni giorno.", "isError": false }
  ]
}
```

No `expectedErrorRange` — caption auto: *Nel testo c'è 1 errore…*

### 6.3 Rich payload (chapter-01 scene-13)

Multi-sentence Italian passage; five error segments (spelling / agreement / grammar). Optional `referenceDocument` on scene envelope if useful for QA. `expectedErrorRange` may be omitted (count = 5) or set `{ "min": 5, "max": 5 }` for explicit lint.

**Manual QA — minimal:** Ch. 03 → quest 01 → scene 02 → mark *vai* → *va* → Controlla.

**Manual QA — rich:** Ch. 01 → quest Arrivo → advance to scene 13 → fix all five errors → Controlla; also test **false positive** still allows pass when true errors are correct (after scoring change).

---

## 7. Client architecture

```text
components/game/tasks/types/error-spotting/
├── ErrorSpottingTask.tsx
├── ErrorSpottingChip.tsx
└── ErrorSpottingInlineField.tsx

lib/game/tasks/error-spotting/
├── normalize-error-spotting-content.ts
├── format-error-spotting-caption.ts
├── validate-error-spotting-draft.ts
├── build-error-spotting-attempt.ts
└── error-spotting-types.ts

lib/game/schemas/errorSpottingClientContentSchema.ts
```

**Draft:** `{ selectedSegmentIds: string[]; corrections: Record<string, string> }` — sync on scene change; Ripristina clears all.

---

## 8. Play page integration

Same pattern as matching / freetext: draft state, `syncErrorSpottingDraftForScene`, `validateErrorSpottingDraft` → `buildErrorSpottingAttempt` → `attemptRun`; remove placeholder branch; wire `SceneRouter` → `TaskPanel`. No footer nav changes.

---

## 9. Phase 1 — data, scoring, fixtures

| Step | Action |
| ---- | ------ |
| 1 | **Update `evaluateErrorSpotting`** — ignore false positives (§2.1). |
| 2 | Tighten `errorSpottingContentSchema.ts`; optional `expectedErrorRange` refinement. |
| 3 | Client schema + sanitizer (`acceptedCorrections`). |
| 4 | `catalog-loader.ts` validation for `error_spotting`. |
| 5 | Fill **chapter-03/quest-01/scenes/02.json** + add **chapter-01/quest-01/scenes/13.json**. |
| 6 | Update smoke tests (quest-01 → 13 scenes; error_spotting payloads). |
| 7 | Scoring tests for new false-positive behavior. |
| 8 | `docs/quest-scene-content-format.md` subsection. |

---

## 10. Phased checklist

### Phase 0 — Plan ✅

- [x] Web repo audit.
- [x] Product sign-off: fixtures (ch.01 + ch.03), Ripristina, relaxed false positives, optional `expectedErrorRange`.

### Phase 1 — Data, scoring, fixtures

- [ ] Scoring rule change + tests.
- [ ] Zod + catalog + sanitizer.
- [ ] Fixtures 03-02 + 01-13.
- [ ] Format doc + smoke tests.

### Phase 2 — UI

- [ ] Helpers + `ErrorSpottingTask` (+ chip, inline field, Ripristina).
- [ ] `TaskPanel` dispatch.

### Phase 3 — Play

- [ ] Draft sync + attempt + validation on `/play`.
- [ ] Manual QA both fixtures.

### Phase 4 — Polish (optional)

- [ ] Keyboard focus on inline fields.
- [ ] Token pass on chip styling.

---

## 11. QA checklist

- [ ] Instruction in `TaskChrome` only; prompt in `TaskBodyLayout`.
- [ ] Auto caption (or `counterCaption`) correct.
- [ ] Tap mark/unmark; Ripristina clears all.
- [ ] Controlla blocked on empty correction for marked segment.
- [ ] **False positive + all true errors fixed → pass** on scored scene 13 (not ratio 0).
- [ ] Partial/wrong corrections → retry overlay.
- [ ] Snapshots omit `acceptedCorrections`.
- [ ] `npm test` + `npm run lint`.

---

*Changelog:*

- 2026-06-03 — Initial draft (web audit + server scoring contract).
- 2026-06-03 — Web-first plan; removed legacy client references.
- 2026-06-03 — **Locked:** ch.01 scene-13 + ch.03 scene-02; Ripristina required; false positives ignored for scoring; `expectedErrorRange` optional with auto caption.
