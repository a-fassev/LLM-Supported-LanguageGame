# Chapter 03 (Bologna, Lezione 3) — implementation overview

**Purpose:** High-level screen map for review before JSON authoring. Source: `docs/content_raw/chapter-3.md`.  
**Not in scope here:** Final hub-title polish, LLM rubrics (none in this chapter), final reward tuning. **Draft scoring** below is a starting point for JSON.

**Next implementation phase (planned):** Delete legacy placeholder tree → **JSON skeleton** (catalog + `background` keys) → content pass → art pass. Mirror chapter 02: adapt [scripts/generate-chapter-02-catalog.mjs](../scripts/generate-chapter-02-catalog.mjs) as `generate-chapter-03-catalog.mjs`.

**Authoring rules (story copy, NPC layout):** Reuse [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md) §1 (same `content.text` conventions). Chapter-specific skips: [chapter-03-implementation-plan.md](./chapter-03-implementation-plan.md) (create with Phase 0 if missing).

**Conventions**

| Source | Catalog |
| ------ | ------- |
| Akt (3.0, 3.1, …) | One **main** quest folder (`quest-01` …) |
| Bonus block at end | `quest-01-bonus` (`kind: "bonus"`) |
| `[Narratore]` | `story` + `info` — **one beat per scene**; `content.text` = narrator body only |
| `[Info di gioco]` / `[Spielinfo]` | `story` + `info` — hint copy body-only |
| NPC dialogue (`[Valentina]`, `[Lorenzo Conti]`) | `story` + `info` — line 1: name, line 2: dialogue (`\n`) |
| `[Monologo interiore]` / `[Risposta del giocatore]` | `story` + `info` — `Tu` + `\n` + text |
| Exercise | `task` + implemented `screen_type` only |
| Volantino / rivista / long reading | `referenceDocument` on **task** scenes (documento); **no** duplicate full-text story scene |

**Web progression (today):** Quests unlock **in chapter order** (`requiresQuestId`). No in-chapter map — learner uses **chapter mission list** between quests.

---

## Spiellogik (kurz, Stand Codebase)

- **Katalog:** `lib/content/chapters/chapter-03/` — replace **entire** current placeholder tree before ship ([§ Catalog cleanup](#catalog-cleanup-before-json)). Today: stub **`Roma`** title, only `quest-01` / `quest-02` / bonus partial scenes — **not** learner content.
- **Chapter metadata:** `order: 3` (after `chapter-02`). **`locked: false`** (playable on hub; chapters 4–6 remain pilot-locked unless changed in their `chapter.json`).
- **Hub title:** **`«Bologna — terzo giorno»`** — replaces placeholder `Roma`.
- **Task types used:** `multiple_choice`, `cloze`, `matching`, `drag_drop`, `matching` (bonus pool). **No** `free_text` / LLM in this chapter.
- **Progression:** Five quests (four main + bonus); bonus does not block chapter 04.

---

## Chapter structure (proposed)

| Quest ID | Source act | Working title (IT, TBD) | Main tasks | Notes |
| -------- | ---------- | ------------------------- | ---------- | ----- |
| `quest-01` | 3.0 Camera | La mattina a casa | 0 | Morning bridge → museum |
| `quest-02` | 3.1 Museo | Il Museo della Storia | 1 | MC ×6 on volantino (`referenceDocument`) |
| `quest-03` | 3.2 Valentina | La guida al museo | 3 | Congiuntivo cloze + matching + suffix cloze |
| `quest-04` | 3.3 Cioccoshow | La Cioccoshow | 3 | Lorenzo MC ×4 + si impersonale cloze + drag-drop Made in Italy |
| `quest-01-bonus` | Fine Akt 3 | Extra: parole Lezione 3 | 1 | `matching` + `poolPairs` / `sampleSize: 10` |

**Target `chapter.json` quest order:**

`["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"]`

**Unlock chain (settled):** each main `requiresQuestId` = previous main (`quest-01` → `null`, …). Bonus `requiresQuestId: "quest-04"`. No `autoStartQuestId`.

---

## Catalog cleanup (before JSON)

**Remove** today’s stub tree completely (`title: "Roma"`, wrong scene copy, incomplete quest list). **Do not** patch placeholders.

Rebuild:

- `chapter.json` with five quest ids, **`title`: «Bologna — terzo giorno»**, **`locked: true`**, `background`
- Per quest: `quest.json` + `scenes/01.json` … per tables below

---

## JSON skeleton & background assets

Same convention as chapters 01–02: keys under `chapters/03/chapter/`, `chapters/03/quests/{01|02|03|04|bonus}/`.

| File | Draft `background` key |
| ---- | ---------------------- |
| `chapter.json` | `chapters/03/chapter/bg-missions` |
| `quests/quest-01/quest.json` | `chapters/03/quests/01/bg-overview` |
| `quests/quest-02/quest.json` | `chapters/03/quests/02/bg-overview` |
| `quests/quest-03/quest.json` | `chapters/03/quests/03/bg-overview` |
| `quests/quest-04/quest.json` | `chapters/03/quests/04/bg-overview` |
| `quests/quest-01-bonus/quest.json` | `chapters/03/quests/bonus/bg-overview` |

**Scene key hints (draft):**

| Quest | Location art |
| ----- | ------------- |
| quest-01 | `bg-room-morning` (Ferrari room; fuller than ch2 morning) |
| quest-02 | `bg-museum-hall` (maps, towers, warm light) |
| quest-03 | `bg-museum-side` (Cioccoshow poster / small group) |
| quest-04 | `bg-piazza-cioccoshow` (stands, San Petronio) |
| bonus | `bg-neutral` or reuse `bg-room-morning` |

Placeholders: `public/content-assets/chapters/03/**/.gitkeep`.

---

## Quest `quest-01` — Akt 3.0 (Morning bridge)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: new day, light, books, backpack |
| 02 | story | info | Tu — no homework; signora Ferrari; Museo della Storia |
| 03 | story | info | Narrator: **short bridge** to museum (new copy; raw only has `→ Übergang`) |

**Omit:** Avatar-customization / inventory tech notes from raw (no JSON fields).

---

## Quest `quest-02` — Akt 3.1 (Museo / volantino quiz)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: enter museum, vetrine |
| 02 | story | info | Tu — discover; volantino at entrance |
| 03 | story | info | Narrator: pick flyer — cover line *Bologna — duemila anni di storia* |
| 04 | story | info | Tu — quiz at end of exhibit |
| 05 | task | **multiple_choice** | Esercizio 1 — **6 questions** (`questions[]`); `referenceDocument` = full volantino (B1 body, verbatim) |
| 06 | story | info | Tu — done; city special |
| 07 | story | info | Narrator: group + Valentina; approach |

**`referenceDocument` (settled):**

- Scene **05** only for flyer text (`title` e.g. *Bologna — duemila anni di storia*; `body` = raw § *Il volantino* verbatim).
- **Do not** add a story scene that repeats the full flyer — documento button during quiz.

**MC pacing (settled):** **One** task scene with `questions.length === 6` (shell **Avanti** / **Indietro** between items; **Controlla** on last). Same documento on the single scene. Alternatives (6 separate scenes) rejected — same source text for all items.

**MC solutions (raw):** 1-b, 2-b, 3-b, 4-c, 5-b, 6-c.

---

## Quest `quest-03` — Akt 3.2 (Valentina)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: side room, Valentina, Cioccoshow vetrina |
| 02 | story | info | Valentina — debba andare alla Cioccoshow |
| 03 | story | info | Tu — never heard of it |
| 04 | story | info | Valentina — welcome, explain fair |
| 05 | story | info | Tu — *Raccontami di più!* |
| 06 | story | info | Valentina — bancarelle, maestri, visitatori |
| 07 | story | info | Tu — *credo che* / congiuntivo |
| 08 | story | info | Valentina — *Due chiacchiere* exercise |
| 09 | task | **cloze** | Esercizio 1 — congiuntivo presente/passato (verbatim dialogue; verb hints in parentheses as **literal** segments) |
| 10 | story | info | Valentina — bravo/a, introduce suffix exercise |
| 11 | story | info | Narrator — Valentina at lavagna (one beat; not merged with 10) |
| 12 | story | info | Valentina — accrescitivi / diminutivi |
| 13 | story | info | Tu — suffix rules |
| 14 | task | **matching** | Esercizio 2 **Teil A** — 8 pairs (lemma → derived form); `shuffleRightOrder: true` |
| 15 | task | **cloze** | Esercizio 2 **Teil B** — 6 Cioccoshow sentences; suffix from parenthesis |
| 16 | story | info | Valentina — goodbye, piazza Maggiore |
| 17 | story | info | Tu — Cioccoshow this afternoon |

**Congiuntivo cloze (scene 09):** Deterministic **`cloze`** only — **not** `free_text` / LLM. In raw authoring, „Freitext-Eingabe mit Auto-Check“ means typed gaps checked against a fixed answer key (same as Kap. 01 SMS/classroom cloze), not open production judged by the LLM. Solutions in order: `sia venuta`, `abbia preso`, `abbia`, `venga`, `riesca`, `ti sia divertito`, `abbia ballato`, `manci`, `voglia`.

**Teil B gap 6:** `libretto` **or** `librone` — both in `correctAnswers` (raw allows either).

**Matching pairs (Teil A):** pizza→pizzetta, cioccolato→cioccolatino, palazzo→palazzone, goloso→golosone, libro→librone, casa→casetta, ragazzo→ragazzaccio, tavolo→tavolino.

---

## Quest `quest-04` — Akt 3.3 (Cioccoshow / Lorenzo)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: piazza, stands, chocolate smell |
| 02 | story | info | Tu — Valentina was right |
| 03 | story | info | Narrator: Lorenzo at fondente stand |
| 04 | story | info | Lorenzo — gianduiotto offer |
| 05 | story | info | Tu — thanks; expert |
| 06 | story | info | Lorenzo — from Torino, inventions |
| 07 | story | info | Tu — torinese |
| 08 | task | **multiple_choice** | Esercizio 1 — **4 questions**; `referenceDocument` = Lorenzo story (verbatim B2 text) |
| 09 | story | info | Lorenzo — si impersonale intro |
| 10 | story | info | Tu — si impersonale |
| 11 | task | **cloze** | Esercizio 2 — *Scoprire una nuova città* (si + 3rd person; word bank in instruction / literal hints) |
| 12 | story | info | Lorenzo — *Made in Italy* magazine |
| 13 | story | info | Narrator: hands over rivista |
| 14 | story | info | Lorenzo — map challenge |
| 15 | task | **drag_drop** | Esercizio 3 — products → cities + **Non italiano** zone |
| 16 | story | info | Lorenzo — bravo, keep magazine, visit Torino |
| 17 | story | info | Tu — recap day |
| 18 | story | info | Narrator: leave piazza; rivista in zaino |

**`referenceDocument`:**

| Document | Scene(s) | Content |
| -------- | -------- | ------- |
| Lorenzo story | **08** | `body` = raw *Lorenzo Conti racconta* (si impersonale passage, verbatim) |
| Rivista *Made in Italy* | **15** | `body` = raw rivista sections (Torino, Bologna, Alba, Napoli, Parma, ⚠ non italiani) |

**Omit:** Full rivista read-through story scene — rivista on task **15** only.

**MC solutions:** 1-a, 2-b, 3-b, 4-c.

**Drag & drop (scene 15) — zones (settled):**

| Target id (draft) | Label (IT) | Products |
| ----------------- | ---------- | -------- |
| `torino` | Torino | gianduiotto, FIAT 500, Pinguino |
| `bologna` | Bologna | tortellini, ragù alla bolognese, mortadella |
| `alba` | Alba | Nutella |
| `napoli` | Napoli | pizza Margherita |
| `parma` | Parma | parmigiano reggiano, prosciutto di Parma |
| `non-italiano` | Non italiano | spaghetti bolognese, Caesar Salad, pizza hawaiana |

Author **one draggable card per product** (13 items). Distractors must land on `non-italiano` only.

**Si impersonale cloze:** Long passage — many gaps; include `buona` / `buoni` / `buone` as **literal** or separate short gaps per raw spacing; solutions per raw ordering table.

---

## Quest `quest-01-bonus` — Chapter close + vocabulary

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: chapter 3 recap (verbatim raw *Fine Akt 3*) |
| 02 | story | info | Narrator: test yourself |
| 03 | story | info | Spielinfo — bonus pizza |
| 04 | task | **matching** | IT ↔ EN; `poolPairs` = all Lezione 3 vocab tables in raw (Ingresso, A1, A, A2, B1, B2, B, Autocontrollo); `sampleSize: 10`; `shuffleRightOrder: true` |

**Title:** `Extra: parole della lezione 3` (or similar — **`Extra: `** prefix required).

**Unlock:** `requiresQuestId: "quest-04"`.

---

## Task-type mapping summary

| Source exercise | `screen_type` | Notes |
| ----------------- | --------------- | ----- |
| Museo quiz (6×) | `multiple_choice` | 1 scene, `questions[]` ×6; volantino `referenceDocument` |
| Due chiacchiere | `cloze` | Congiuntivo; no LLM |
| Accrescitivi Teil A | `matching` | 8 pairs |
| Accrescitivi Teil B | `cloze` | 6 suffix gaps |
| Lorenzo comprensione (4×) | `multiple_choice` | 1 scene, `questions[]` ×4; story in `referenceDocument` |
| Si impersonale | `cloze` | Word bank; many gaps |
| Made in Italy map | `drag_drop` | 6 city targets + non-italiano |
| Bonus vocab | `matching` | `poolPairs` + `sampleSize: 10` |

**Not used:** `free_text`, `error_spotting`, `screen_type: "bonus"`, map UI, NPC sprites in JSON.

---

## Draft scoring (placeholder for JSON)

Pattern: chapters 01–02 / `docs/quest-scene-content-format.md` §6. Task scenes: `"backpack": { "pieces": 1 }`. Story: **no** `scoring`.

| Scene (draft) | Quest | Task | Pizza (draft) | Rationale |
| ------------- | ----- | ---- | ------------- | --------- |
| 05 | quest-02 | MC ×6 | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.67`, `linear`, `floor` | ~4/6 to pass |
| 09 | quest-03 | cloze (9 gaps) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.78`, `linear`, `floor` | ~7/9 |
| 13 | quest-03 | matching (8 pairs) | `scored`, `maxSlices: 2`, `minRatioToComplete: 0.75`, `linear`, `floor` | 6/8 |
| 14 | quest-03 | cloze (6 gaps) | `scored`, `maxSlices: 2`, `minRatioToComplete: 0.83`, `linear`, `floor` | 5/6 |
| 08 | quest-04 | MC ×4 | `scored`, `maxSlices: 2`, `minRatioToComplete: 0.75`, `linear`, `floor` | 3/4 |
| 11 | quest-04 | cloze (long) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.85`, `linear`, `floor` | Dense si impersonale |
| 15 | quest-04 | drag_drop (13 items) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.69`, `linear`, `floor` | ~9/13 |
| 04 | quest-01-bonus | matching pool ×10 | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.6`, `linear`, `floor` | Bonus plan |

**Chapter pizza (rough):** ~18–22 slices from main tasks (+ bonus). Team rebalance later.

---

## Settled decisions

| Topic | Decision |
| ----- | -------- |
| Hub `title` | **`«Bologna — terzo giorno»`** (replaces `Roma`) |
| `locked` | **`false`** (chapter 03 playable) |
| Old `chapter-03` stub | **Delete** full tree; rebuild from this overview |
| Map / pin / auto-transition copy | **Omit** raw map UI; no `autoStartQuestId` |
| Flyer / rivista full text | **`referenceDocument` on tasks**, not story read-through |
| Museo MC | **1 scene**, 6 `questions[]` |
| Lorenzo MC | **1 scene**, 4 `questions[]` |
| Valentina congiuntivo | **`cloze`**, not LLM |
| Accrescitivi | **2 task scenes** (matching + cloze) |
| Bonus | `kind: "bonus"` + `Extra: ` title + `matching` pool from raw vocab tables |
| Sprites / sounds | **Out of JSON** (background keys only) |

---

## Open decisions

_None — catalog JSON shipped via `scripts/generate-chapter-03-catalog.mjs`._

---

## Scene count estimate (for JSON planning)

| Quest | Story (`info`) | Task | Total ≈ |
| ----- | -------------- | ---- | ------- |
| quest-01 | 3 | 0 | 3 |
| quest-02 | 6 | 1 | 7 |
| quest-03 | 14 | 3 | 17 |
| quest-04 | 15 | 3 | 18 |
| quest-01-bonus | 3 | 1 | 4 |
| **Chapter total** | **~41** | **~8** | **~49** |

---

## Catalog authoring

- **Source of truth:** `scripts/generate-chapter-03-catalog.mjs` (re-run after edits; **wipes** `lib/content/chapters/chapter-03/`).
- **Do not** hand-edit generated scene JSON.

---

## Next steps (ship readiness)

1. **Art:** PNGs under `public/content-assets/chapters/03/**` (keys in JSON; gradient fallback until uploaded).
2. **Manual playtest** (`npm run dev`, chapter unlocked when `locked: false`):
   - quest-02 scene **05** — MC ×6 + volantino documento (Avanti → Controlla).
   - quest-03 scene **09** — congiuntivo cloze; **14** matching; **15** suffix cloze.
   - quest-04 scene **08** — Lorenzo MC ×4; **11** si impersonale (18 gaps); **15** drag-drop (all items per city zone).
   - quest-01-bonus scene **04** — matching pool ×10.
3. **Pilot:** chapter **03** is `"locked": false`; lock later in `chapter.json` + generator if needed.
4. **CI:** `npm test` (includes `chapter-03-catalog.test.ts`, `chapter-03-task-scoring.test.ts`).

---

## Document history

- 2026-06-03 — Catalog generated; quest-03 scene 10/11 split; scoring tests; playtest checklist.
- 2026-06-03 — Phase 0 overview from `docs/content_raw/chapter-3.md` (implementation planning only).
