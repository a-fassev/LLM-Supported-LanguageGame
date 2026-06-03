---
name: chapter-content-authoring
description: >-
  Authors learner chapters from docs/content_raw into lib/content/chapters JSON
  (quests, scenes, backgrounds, bonus Extra titles, scoring). Use when creating
  or rebuilding chapter-02+, mapping raw markdown to catalog, writing quest.json
  or scene files, or following the Bologna (chapter-01) rollout methodology.
---

# Chapter content authoring (web catalog)

Branch: **`web-based-implementation`**. Contracts: **`docs/quest-scene-content-format.md`**, **`AGENTS.md`** (game domain). Learner UX: **`.cursor/skills/product/SKILL.md`**. New **task types** or play UI: **`.cursor/skills/web-task-type-ui/SKILL.md`** (fixtures stay in **`chapter-00`**).

**Reference rollout:** `docs/content_raw/chapter-1.md` → `lib/content/chapters/chapter-01/` — overview [docs/chapter-01-implementation-overview.md](../../../docs/chapter-01-implementation-overview.md), rules [docs/chapter-01-implementation-plan.md](../../../docs/chapter-01-implementation-plan.md), generator [scripts/generate-chapter-01-catalog.mjs](../../../scripts/generate-chapter-01-catalog.mjs), test `lib/game/content/chapter-01-catalog.test.ts`.

---

## Methodology (always)

Follow **`AGENTS.md` → UNDERSTAND → CLARIFY → CODE**:

1. **Understand** — Read the raw chapter (`docs/content_raw/chapter-N.md`), existing catalog (if any), and quest-scene spec. List acts → quests → scenes; note task types and bonus block.
2. **Clarify** — Confirm quest split, scenes to **skip** (e.g. duplicate brochure beat), new transition copy vs verbatim raw, `chapter.order`, pilot `locked`. **No bulk JSON until confirmed** unless the user explicitly asks to execute the full pipeline.
3. **Implement** — Phased steps below; run `npm test`, `npm run lint`, `npm run build`. Do not edit Cursor plan files unless asked.

---

## Phased pipeline (repeat per chapter)

Copy progress in chat when useful:

```
Chapter NN authoring:
- [ ] 0. Overview + quest map (from raw)
- [ ] 1. Catalog cleanup (delete stale tree if rebuilding)
- [ ] 2. Asset key plan (public/content-assets/chapters/NN/…)
- [ ] 3. Skeleton JSON (chapter.json, quest.json, all scenes minimal-valid)
- [ ] 4. Story scenes (verbatim raw + new transitions)
- [ ] 5. Task scenes (payloads + referenceDocument)
- [ ] 6. Scoring (pizza + backpack on tasks)
- [ ] 7. Tests + catalog load
```

| Phase | Output |
| ----- | ------ |
| **0. Overview** | Short doc or section: quest ids, scene counts, task types, unlock chain, bonus `requiresQuestId`. Mirror [chapter-01-implementation-overview.md](../../../docs/chapter-01-implementation-overview.md). |
| **1. Cleanup** | If replacing placeholders: **delete** `lib/content/chapters/chapter-NN/` entirely — do not patch legacy fixture quests. |
| **2. Assets** | Stable `background` keys on **chapter.json**, every **quest.json**, every **scene**; PNGs can follow ([public/content-assets/README.md](../../../public/content-assets/README.md)). |
| **3. Skeleton** | Valid envelope per scene (`id`, `scene_type`, `screen_type`, `background`, `content`, `scoring` on tasks only). Prefer a generator script under `scripts/` for large chapters (copy/adapt `generate-chapter-01-catalog.mjs`). |
| **4–5. Content** | Story §1 rules; tasks per spec + existing validators. Italian from raw **verbatim** unless user approves new bridge scenes. |
| **6. Scoring** | Task scenes: `scoring.pizza` + `scoring.backpack`; story scenes have **no** scoring. Start from overview draft bands; team may rebalance later. |
| **7. QA** | Add `lib/game/content/chapter-NN-catalog.test.ts` (quest list, scene counts, bonus wiring). `loadContentCatalog({ bypassCache: true })` must pass. |

---

## Locked decisions (all chapters)

### Catalog & ids

- Folder: `lib/content/chapters/chapter-NN/` (`NN` = `01`, `02`, …).
- Scene files: `scenes/01.json`, `02.json`, … — order = numeric prefix.
- Scene `id`: `{chapterId}-{questId}-scene-{NN}` (must match filename).
- `chapter.json`: `order` **0-based contiguous** across the whole catalog; progression chapters `chapter-01+`; **`chapter-00`** = team sandbox only (`reference: true`) — not learner narrative.
- Quest order in `chapter.json` `quests[]` = play order; main quests gate chapter unlock; **bonus** does not block next chapter.

### Quest metadata

| Field | Rule |
| ----- | ---- |
| `kind` | `main` or `bonus` — bonus is **not** a `screen_type`. |
| `requiresQuestId` | Previous **main** in chapter (`null` for first); bonus → last required main (e.g. `quest-04`). |
| `title` | Short Italian hub label. **`kind: "bonus"`** → prefix **`Extra: `** (e.g. `Extra: sfida vocabolario`). |
| `background` | **Required** on chapter + each quest. |
| ~~`autoStartQuestId`~~ | **Removed** — after any quest, learner returns to `/chapters/[chapterId]` and picks the next mission on the list. |

### Story (`story` + `info`)

- **One raw beat → one scene file** — no multi-beat scenes.
- `content.text` formatting — see [references/raw-mapping.md](references/raw-mapping.md).
- Use `\n` between speaker line and dialogue; web uses `StoryPanel` `whitespace-pre-line`.
- Do **not** put `[Narratore]` bracket tags in visible text unless product asks.

### Tasks

- Only implemented `screen_type` values (`multiple_choice`, `matching`, `drag_drop`, `cloze`, `error_spotting`, `free_text`, …).
- **`content.title`** → play header; **`content.instruction`** → TaskChrome; **`content` task prompt** → TaskBodyLayout — do not merge.
- Long shared reading → **`referenceDocument`** on **task** scenes (documento), not on `quest.json`.
- Bonus exercise: **`matching`** + optional `poolPairs` / `sampleSize` (server materializes per run).

### Progression & product (do not re-litigate in content PRs)

- Completed missions: hub **Completata**, not replayable; server `quest_already_completed`.
- **Indietro** (retreat): no wallet rollback; scene rewards once per `(run_id, scene_id)`.
- Manual **`locked: true`** on `chapter.json` for classroom pilots (chapters 3–6 today).

---

## Common mistakes (avoid)

| Mistake | Instead |
| ------- | ------- |
| Patching old placeholder `chapter-NN` files | Delete tree; rebuild from overview |
| Reusing `chapter-00` for learner story | Author in `chapter-01+`; fixtures in `chapter-00` |
| Bonus without `Extra: ` title | `Extra: …` in `quest.json` `title` |
| `screen_type: "bonus"` | `kind: "bonus"` + real task type |
| `autoStartQuestId` / auto chain on `/play` | List unlock only via `requiresQuestId` |
| Gap in `chapter.order` | Renumber all chapters `0 … n−1` |
| Story scene with `scoring` | Omit scoring on `story` |
| Wrong scene `id` vs filename | `scene-03` ↔ `03.json` |
| Inventing unlock/completion in client | Bootstrap + `unlock-display.ts` only |
| New task type without web stack | Follow **web-task-type-ui** + `chapter-00` fixtures first |

---

## When to add chapter-specific docs

For large chapters, add under `docs/`:

- `chapter-NN-implementation-overview.md` — screen map, counts, draft scoring
- `chapter-NN-implementation-plan.md` — story text rules, settled skips, transitions

Keep **timeless rules** in this skill + `quest-scene-content-format.md`; keep **chapter-specific tables** in those docs.

---

## Checklist

Full per-scene checklist: [references/checklist.md](references/checklist.md).

---

## After shipping

- Update `AGENTS.md` / product skill only if **behavior or contracts** change (dual-doc rule).
- Do not commit `docs/content_raw/` changes unless the user provides new source copy.
