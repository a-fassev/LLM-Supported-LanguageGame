---
name: chapter-content-authoring
description: >-
  Authors learner chapters from docs/content_raw into lib/content/chapters JSON
  (quests, scenes, backgrounds, bonus Extra titles, scoring). Use when creating
  or rebuilding chapter-02+, mapping raw markdown to catalog, writing quest.json
  or scene files, or following the Bologna (chapter-01) rollout methodology.
---

# Chapter content authoring (web catalog)

Branch: **`web-based-implementation`**. Contracts: **`docs/quest-scene-content-format.md`**, **`AGENTS.md`** (game domain). Learner UX: **`.cursor/skills/product/SKILL.md`**. New **task types** or play UI: **`.cursor/skills/web-task-type-ui/SKILL.md`** (minimal tutorial in **`chapter-00`**; rich fixtures in **`chapter-02+`**).

**Reference rollouts:** `chapter-01` … `chapter-06` each have `docs/chapter-NN-implementation-overview.md`, optional `chapter-NN-implementation-plan.md`, `scripts/generate-chapter-NN-catalog.mjs`, and `lib/game/content/chapter-NN-catalog.test.ts` (optional `chapter-NN-task-scoring.test.ts` for answer keys). Start from [chapter-01-implementation-overview.md](../../../docs/chapter-01-implementation-overview.md) for the template.

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
- [ ] 3. Generator or skeleton JSON (commit `lib/content/chapters/chapter-NN/`)
- [ ] 4–5. Story + tasks (in generator or scene files)
- [ ] 6. Scoring (pizza + backpack on tasks)
- [ ] 7. Tests + `loadContentCatalog`
```

| Phase | Output |
| ----- | ------ |
| **0. Overview** | Short doc or section: quest ids, scene counts, task types, unlock chain, bonus `requiresQuestId`. Mirror [chapter-01-implementation-overview.md](../../../docs/chapter-01-implementation-overview.md). |
| **1. Cleanup** | If replacing placeholders: **delete** `lib/content/chapters/chapter-NN/` entirely — do not patch legacy fixture quests. |
| **2. Assets** | Stable `background` keys on **chapter.json**, every **quest.json**, every **scene**; `referenceDocument.figures[].image` for documento galleries. PNGs can follow ([public/content-assets/README.md](../../../public/content-assets/README.md)). **Scene `background`** = full-viewport play; **`figures[]`** = documento overlay only (not the scene background). |
| **3. Skeleton + content** | For large chapters: implement in `scripts/generate-chapter-NN-catalog.mjs` (copy `generate-chapter-01-catalog.mjs`), run `node scripts/generate-chapter-NN-catalog.mjs`, **commit** output under `lib/content/chapters/chapter-NN/`. The script **wipes** that folder on each run — do not hand-edit scene JSON if the generator stays canonical. **Chapter 04+ pattern:** generator also ensures `public/content-assets/…` dirs for each key and writes `public/content-assets/chapters/NN/ASSET_KEYS.txt` (drop-in PNG checklist). Smaller deltas: edit JSON directly (no generator). |
| **4–5. Story + tasks** | Same phase when using a generator (strings/constants in the `.mjs`). Story §1 rules; tasks per spec + validators. Italian from raw **verbatim** unless user approves new bridge scenes. |
| **6. Scoring** | Task scenes: `scoring.pizza` + `scoring.backpack`; story scenes have **no** scoring. Start from overview draft bands; team may rebalance later. |
| **7. QA** | `chapter-NN-catalog.test.ts` + optional `chapter-NN-task-scoring.test.ts`; `loadContentCatalog({ bypassCache: true })` must pass. For cloze gaps with multiple `correctAnswers`, test **every** variant in task-scoring tests (not only the first). When story/task order is easy to regress, assert `screen_type` / key `content.text` on critical scene indices in catalog tests. `npm run build` does **not** regenerate catalogs. |

### Generator vs runtime loader

| Step | What |
| ---- | ---- |
| **Authoring** | Edit `scripts/generate-chapter-NN-catalog.mjs` (or scene JSON if no generator). Re-run generator → fresh `chapter.json`, `quest.json`, `scenes/*.json`. |
| **Git / deploy** | Commit generated JSON; assets separately under `public/content-assets/chapters/NN/` (paths listed in `ASSET_KEYS.txt` when the generator writes it). |
| **Runtime** | `loadContentCatalog()` in `lib/game/content/catalog-loader.ts` reads + Zod-validates only — no content invention at request time. |

---

## Locked decisions (all chapters)

### Catalog & ids

- Folder: `lib/content/chapters/chapter-NN/` (`NN` = `01`, `02`, …).
- Scene files: `scenes/01.json`, `02.json`, … — order = numeric prefix.
- Scene `id`: `{chapterId}-{questId}-scene-{NN}` (must match filename).
- `chapter.json`: `order` **0-based contiguous** across the whole catalog; **`chapter-00`** = learner tutorial (gates `chapter-01`); narrative chapters `chapter-01+`.
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
- **Preserve raw order** when interleaving story and task scenes in a quest (filename order = play order). Do not place a narrator beat that summarizes task outcomes **before** the tasks it refers to unless product approves a rewrite.
- `content.text` formatting — see [references/raw-mapping.md](references/raw-mapping.md).
- Use `\n` between speaker line and dialogue; web uses `StoryPanel` `whitespace-pre-line`.
- Do **not** put `[Narratore]` bracket tags in visible text unless product asks.

### Tasks

- Only implemented `screen_type` values (`multiple_choice`, `matching`, `drag_drop`, `cloze`, `error_spotting`, `free_text`, …).
- **`content.title`** → play header; **`content.instruction`** → TaskChrome; **`content` task prompt** → TaskBodyLayout — do not merge.
- Long shared reading → **`referenceDocument`** on **task** scenes (documento), not on `quest.json`.
- Bonus exercise: **`matching`** + optional `poolPairs` / `sampleSize` (server materializes per run).

**Raw German notes → web `screen_type`:**

| Raw / tech note (often in `docs/content_raw/`) | Web catalog | Scoring |
| ---------------------------------------------- | ----------- | ------- |
| Lückentext; „Freitext-Eingabe“ **mit Auto-Check**; Buchübung with fixed solution list | **`cloze`** | `evaluateCloze` + `correctAnswers` per gap |
| Offene Produktion (describe …, rubric, che/cui/dove essay) | **`free_text`** | `evaluateFreitextLlmScene` (LLM) |
| Multiple choice / Leseverstehen with options | **`multiple_choice`** | `evaluateMultipleChoice` |

„Freitext“ in raw **does not** mean `free_text` when „Auto-Check“ or a printed solution key is present — that is **typed cloze**. Example: chapter-03 congiuntivo / *si impersonale* ([overview](../../../docs/chapter-03-implementation-overview.md)).

**Cloze — raw „fill one of two positions“ (A/B):** Web ships **one scored `gap` per line** with the **complete phrase** (`un solo studente`, not `un solo` + literal `studente`). List two `correctAnswers` only when both are full phrases (`un evento caro` / `un caro evento`). Reference: chapter-05 aggettivo ([overview](../../../docs/chapter-05-implementation-overview.md)).

### Progression & product (do not re-litigate in content PRs)

- Completed missions: hub **Completata**, not replayable; server `quest_already_completed`.
- **Indietro** (retreat): no wallet rollback; scene rewards once per `(run_id, scene_id)`.
- Manual **`locked: true`** on `chapter.json` for classroom pilots (today: **chapter-03–06** unlocked — flip in generator/`chapter.json` when ready).
- **Raw parallel acts** (e.g. “6.1 and 6.2 in any order”): web hub is **linear** — set `requiresQuestId` chain in play order; do **not** model AND-gates or free-order unlock in JSON. Document the approximation in `docs/chapter-NN-implementation-overview.md`; keep parallel hints in story only (e.g. “due pin sulla mappa”).
- **Game end (`gameFinale`):** on the closing chapter set `"gameFinale": true` in `chapter.json`; last entry in `quests[]` must be the finale quest (typically bonus). Add **story scenes after the bonus task**; `/play` overlay + menu routing is automatic via `lib/game/game-finale.ts` — do not hardcode chapter ids in the client.

---

## Common mistakes (avoid)

| Mistake | Instead |
| ------- | ------- |
| Patching old placeholder `chapter-NN` files | Delete tree; rebuild from overview |
| Putting full chapter story in `chapter-00` | Tutorial only in `chapter-00`; narrative in `chapter-01+` |
| Bonus without `Extra: ` title | `Extra: …` in `quest.json` `title` |
| `screen_type: "bonus"` | `kind: "bonus"` + real task type |
| `autoStartQuestId` / auto chain on `/play` | List unlock only via `requiresQuestId` |
| Gap in `chapter.order` | Renumber all chapters `0 … n−1` |
| Story scene with `scoring` | Omit scoring on `story` |
| Wrong scene `id` vs filename | `scene-03` ↔ `03.json` |
| Inventing unlock/completion in client | Bootstrap + `unlock-display.ts` only |
| New task type without web stack | Follow **web-task-type-ui** + tutorial `chapter-00` or `chapter-02+` fixtures |
| Raw „Freitext mit Auto-Check“ → `free_text` / LLM | **`cloze`** with `correctAnswers` |
| Hand-edit `chapter-NN/scenes/*.json` while generator is canonical | Edit `generate-chapter-NN-catalog.mjs` and re-run (script deletes tree) |
| German raw labels in `content.instruction` (*Wortbank*, …) | Italian learner copy (*Parole disponibili*, …); German stays in `docs/content_raw/` only |
| Cloze tests that only check `correctAnswers[0]` | Test every listed alternate per gap in `chapter-NN-task-scoring.test.ts` |
| Partial cloze answer + literal noun (`un solo` + `studente`) | One **full-phrase** gap per line; see Tasks § cloze A/B |
| Story/task scene order swapped vs raw act | Match raw beat order; add `chapter-NN-catalog.test.ts` scene-order checks when fragile |
| Parallel raw branches → multiple `requiresQuestId` or hub forks | **Linear** `quests[]` order + story copy; note in overview § settled |
| Expecting client game-end without `gameFinale` | Set `gameFinale: true` + finale story after bonus; see `docs/quest-scene-content-format.md` |

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
