# Chapter 05 (Bologna, Lezione 5) — implementation overview

**Purpose:** High-level screen map for review before JSON authoring. Source: `docs/content_raw/chapter-5.md`.  
**Not in scope here:** Final hub-title polish, final reward tuning, chapter-06 bridge copy. **Draft scoring** below is a starting point for JSON.

**Next implementation phase:** Delete legacy placeholder tree → **`scripts/generate-chapter-05-catalog.mjs`** → commit `lib/content/chapters/chapter-05/` → asset placeholders under `public/content-assets/chapters/05/`.

**Authoring rules (story copy, NPC layout):** Reuse [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md) §1. Chapter-specific skips and transitions: [chapter-05-implementation-plan.md](./chapter-05-implementation-plan.md).

**Conventions**

| Source | Catalog |
| ------ | ------- |
| Akt (5.0, 5.1, …) | One **main** quest folder (`quest-01` …) |
| Bonus block at end | `quest-01-bonus` (`kind: "bonus"`) |
| `[Narratore]` | `story` + `info` — **one beat per scene**; `content.text` = narrator body only |
| `[Info di gioco]` / `[Spielinfo]` | `story` + `info` — hint copy body-only |
| `[Chat — Sara]` / `[Sara]` | `story` + `info` — `Sara` + `\n` + dialogue |
| `[Chat — Tu]` / `[Monologo interiore]` | `story` + `info` — `Tu` + `\n` + text |
| Lettera / offerta (S. 104–105) | `referenceDocument` on **MC task** (documento) |
| Mail modello (S. 106) | `referenceDocument.body` on **formal-mail cloze** (optional; gaps carry answers) |

**Web progression (today):** Quests unlock **in chapter order** (`requiresQuestId`). Learner uses **chapter mission list** between quests. No `autoStartQuestId`.

---

## Spiellogik (kurz, Stand Codebase)

- **Katalog:** `lib/content/chapters/chapter-05/` — replace **entire** current placeholder tree before ship ([§ Catalog cleanup](#catalog-cleanup-before-json)). Today: stub **`Napoli`** title, only `quest-01` / `quest-02` with wrong copy — **not** learner content.
- **Chapter metadata:** `order: 5` (after `chapter-04`). **`locked: false`** (playable on hub; chapter **06** remains pilot-locked).
- **Hub title (draft):** **`«Bologna — quinto giorno»`** — replaces placeholder `Napoli`.
- **Task types used:** `multiple_choice`, `drag_drop`, `cloze` (×2), `matching` (main + bonus pool). **No** `free_text` / LLM in this chapter.
- **Progression:** Five quests (four main + bonus); bonus does not block chapter 06.

---

## Chapter structure (proposed)

| Quest ID | Source act | Working title (IT, draft) | Main tasks | Notes |
| -------- | ---------- | ------------------------- | ---------- | ----- |
| `quest-01` | 5.0 Camera | Dopo Comacchio | 0 | Sara chat → planning at desk |
| `quest-02` | 5.1 Casa | Pianificare la gita | 1 | MC ×5 on lettera + offerta (documento) |
| `quest-03` | 5.2 Caffè | Discussione al caffè | 2 | Pro/contro drag + aggettivo cloze |
| `quest-04` | 5.3 Scrivania | Mail alla professoressa | 2 | Formal mail cloze + imperativo matching |
| `quest-01-bonus` | Fine Akt 5 | Extra: parole Lezione 5 | 1 | `matching` + `poolPairs` / `sampleSize: 10` |

**Target `chapter.json` quest order:**

`["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"]`

**Unlock chain (settled):** each main `requiresQuestId` = previous main (`quest-01` → `null`, …). Bonus `requiresQuestId: "quest-04"`. No `autoStartQuestId`.

---

## Catalog cleanup (before JSON)

**Remove** today’s stub tree completely (`title: "Napoli"`, port copy, incomplete quests). **Do not** patch placeholders.

Rebuild:

- `chapter.json` with five quest ids, **`title`: «Bologna — quinto giorno»**, **`locked: false`**, `background`
- Per quest: `quest.json` + `scenes/01.json` … per tables below

---

## JSON skeleton & background assets

Keys under `chapters/05/chapter/`, `chapters/05/quests/{01|02|03|04|bonus}/`.

| File | Draft `background` key |
| ---- | ---------------------- |
| `chapter.json` | `chapters/05/chapter/bg-missions` |
| `quests/quest-01/quest.json` | `chapters/05/quests/01/bg-overview` |
| `quests/quest-02/quest.json` | `chapters/05/quests/02/bg-overview` |
| `quests/quest-03/quest.json` | `chapters/05/quests/03/bg-overview` |
| `quests/quest-04/quest.json` | `chapters/05/quests/04/bg-overview` |
| `quests/quest-01-bonus/quest.json` | `chapters/05/quests/bonus/bg-overview` |

**Scene key hints (draft):**

| Quest | Location art |
| ----- | ------------- |
| quest-01 | `bg-room-afternoon` (Ferrari room, desk, phone) |
| quest-02 | `bg-room-desk` (lettere e stampe sul tavolo) |
| quest-03 | `bg-caffe-giardini` (Caffè ai Giardini Margherita) |
| quest-04 | `bg-room-evening` (scrivania, portatile, sera) |
| bonus | `bg-neutral` |

Placeholders: `public/content-assets/chapters/05/**` + `ASSET_KEYS.txt` from generator.

---

## Quest `quest-01` — Akt 5.0 (Bridge)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: new week after Comacchio; desk; phone vibrates |
| 02 | story | info | Sara — gita più grande; hai tempo? |
| 03 | story | info | Tu — monologo: argomenti → decisione |
| 04 | story | info | Tu — sì, passa da me; piano serio |
| 05 | story | info | Narrator: Sara arrives with stampe |

**Omit:** Camera pan tech notes (window → desk → phone) — backgrounds only.

---

## Quest `quest-02` — Akt 5.1 (Lucca MC)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Sara — capire tutto prima della discussione |
| 02 | story | info | Narrator: lettera Simone + pubblicità pacchetto |
| 03 | story | info | Sara — precisione, poi caffè |
| 04 | task | **multiple_choice** | Esercizio 1 — **5 questions**; `referenceDocument` = Testo A + Testo B (S. 104–105 verbatim) |
| 05 | story | info | Narrator: confrontate risposte |
| 06 | story | info | Sara — perfetto, discussione seria |
| 07 | story | info | Narrator: **bridge** al caffè (new copy; raw → 5.2) |

### MC (scene 04)

- **One** task scene, `questions.length === 5` (shell Avanti → Controlla).
- **`referenceDocument`:** `title` e.g. *Lettera di Simone e offerta per gruppi scolastici*; `body` = Testo A + Testo B from raw (no figures).
- **Solutions (fixed keys):** 1-b, 2-b, 3-b, 4-b, 5-a → `1B, 2B, 3B, 4B, 5A`.
- **Instruction:** Leggi i testi (p. 104/105) e scegli la risposta migliore.

**Omit:** Separate „consulta testo“ button — **documento** overlay only.

---

## Quest `quest-03` — Akt 5.2 (Caffè)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: caffè pieno; appunti e mappe |
| 02 | story | info | Compagno — Lucca vs Firenze calcio storico |
| 03 | story | info | Sara — pro/contro, poi frasi |
| 04 | task | **drag_drop** | Pro/contro — 8 cards → 4 zones (Lucca PRO/CONTRO, Firenze PRO/CONTRO) |
| 05 | task | **cloze** | Posizione aggettivo (S. 101) — **6 lines, 1 full-phrase gap each** |
| 06 | story | info | Narrator: decisione Lucca; mail formale (verbatim raw, after cloze) |
| 07 | story | info | Narrator: torno a casa → sera / mail |

### Drag & drop (scene 04)

- **8 items** (cards 1–8 verbatim raw).
- **4 targets:** `lucca-pro`, `lucca-contro`, `firenze-pro`, `firenze-contro`.
- **Solutions:** Lucca PRO = 1,2,3; Lucca CONTRO = 4,5; Firenze PRO = 6,7; Firenze CONTRO = 8.
- **Omit:** Ferrara / Notte Rosa as destinations (raw: focus Lucca/Firenze only).

### Aggettivo cloze (scene 05)

- Raw A/B positions → web: **one `gap` per line** with **full phrase** (`un solo studente`, `una povera ragazza`, …); lines 5–6 accept two word-order variants (`un evento caro` / `un caro evento`, `un vecchio amico` / `un amico vecchio`).
- **Scene order:** cloze **before** narrator *La decisione è presa* (scene 06) — matches raw.
- **`cloze`**, not `free_text` / LLM.

---

## Quest `quest-04` — Akt 5.3 (Mail + matching)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: sera, portatile, lista argomenti |
| 02 | story | info | Tu — tono formale, saluto e chiusura |
| 03 | story | info | Narrator: **bridge** to mail task (raw has no extra beat) |
| 04 | task | **cloze** | Mail formale — pronomi + imperativo cortesia; optional `referenceDocument` with prof reply (S. 106) |
| 05 | task | **matching** | Imperativi irregolari (8×) |
| 06 | story | info | Narrator: Invia; conferma |
| 07 | story | info | Tu — ripasso vocaboli → bonus bridge |

### Mail cloze (scene 04)

- **`cloze`:** gaps for saluto, `Le`, `ci`, `legga`, `pensi`, `Si ricordi`, `ci proibisca`, `ci risponda`, ringraziamento, chiusura — `correctAnswers` from raw bank (accept punctuation variants).
- **`referenceDocument` (optional):** Anna-Viviana reply letter (S. 106) as context — not duplicated in story scenes.

### Matching (scene 05)

- **8 pairs:** essere→sia, avere→abbia, andare→vada, dare→dia, dire→dica, fare→faccia, stare→stia, sapere→sappia.
- Standard `leftItems` / `rightItems` + `correctPairs`.

---

## Quest `quest-01-bonus` — Chapter close + vocabulary

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: chapter 5 recap (verbatim raw *Fine Atto 5*) |
| 02 | story | info | Narrator: test yourself |
| 03 | story | info | Spielinfo — bonus pizza |
| 04 | task | **matching** | IT ↔ EN; `poolPairs` = all Lezione 5 vocab tables in raw; `sampleSize: 10`; `shuffleRightOrder: true` |

**Title:** `Extra: parole della lezione 5` (**`Extra: `** prefix required).

**Unlock:** `requiresQuestId: "quest-04"`.

**Omit:** Neutral screen / no background / avatar tech notes — normal quest backgrounds.

---

## Task-type mapping summary

| Source exercise | `screen_type` | Notes |
| ----------------- | --------------- | ----- |
| Perché Lucca? MC ×5 | `multiple_choice` | 1 scene; documento Testo A+B |
| Pro/contro Lucca/Firenze | `drag_drop` | 4 zones, 8 cards |
| Posizione aggettivo ×6 | `cloze` | 1 gap per line (A/B choice → correct slot) |
| Mail formale | `cloze` | Formula bank |
| Imperativi cortesia | `matching` | 8 pairs |
| Bonus vocab | `matching` | `poolPairs` + `sampleSize: 10` |

**Not used:** `free_text`, `error_spotting`, `screen_type: "bonus"`, LLM.

---

## Draft scoring (placeholder for JSON)

Pattern: chapters 01–04 / `docs/quest-scene-content-format.md` §6. Task scenes: `"backpack": { "pieces": 1 }`. Story: **no** `scoring`.

| Scene (draft) | Quest | Task | Pizza (draft) | Rationale |
| ------------- | ----- | ---- | ------------- | --------- |
| 04 | quest-02 | MC ×5 | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.8`, `linear`, `floor` | 4/5 |
| 04 | quest-03 | drag_drop (8) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.75`, `linear`, `floor` | 6/8 |
| 05 | quest-03 | cloze (6 gaps) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.83`, `linear`, `floor` | 5/6 |
| 04 | quest-04 | cloze mail (~11 gaps) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.82`, `linear`, `floor` | ~9/11 |
| 05 | quest-04 | matching ×8 | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.75`, `linear`, `floor` | 6/8 |
| 04 | quest-01-bonus | matching pool ×10 | `scored`, `maxSlices: 2`, `minRatioToComplete: 0.6`, `linear`, `floor` | Bonus |

**Chapter pizza (rough):** ~14–16 slices from main tasks (+ bonus). Team rebalance after playtest.

---

## Settled decisions

| Topic | Decision |
| ----- | -------- |
| Hub `title` | **`«Bologna — quinto giorno»`** (replaces `Napoli`) |
| `locked` | **`false`** (shipped playable) |
| Old `chapter-05` stub | **Delete** full tree; rebuild from this overview |
| MC Lucca | **1 scene**, 5 `questions[]`; documento = Testo A + B |
| Aggettivo S. 101 | **`cloze`**, 1 full-phrase gap/line; cloze scene **before** *decisione* narrator |
| Third destination (Ferrara) | **Omit** from drag_drop |
| Bonus | `kind: "bonus"` + `Extra: ` + `matching` pool from raw vocab tables |
| Sprites / sounds / map UI | **Out of JSON** |

---

## Open decisions

| Topic | Options | Recommendation |
| ----- | ------- | -------------- |
| Mail `referenceDocument` | Full prof letter vs gaps only | **Include** S. 106 reply in documento on cloze scene (settled) |
---

## Scene count estimate (for JSON planning)

| Quest | Story (`info`) | Task | Total ≈ |
| ----- | -------------- | ---- | ------- |
| quest-01 | 5 | 0 | 5 |
| quest-02 | 6 | 1 | 7 |
| quest-03 | 5 | 2 | 7 |
| quest-04 | 5 | 2 | 7 |
| quest-01-bonus | 3 | 1 | 4 |
| **Chapter total** | **~24** | **~6** | **~30** |

---

## Catalog authoring

- **Source of truth:** `scripts/generate-chapter-05-catalog.mjs` (re-run after edits; **wipes** `lib/content/chapters/chapter-05/`).
- **Do not** hand-edit generated scene JSON once the generator exists.

---

## Next steps (ship readiness)

1. **Phase 0 ✓** — this overview + [implementation plan](./chapter-05-implementation-plan.md).
2. **Generator + JSON ✓** — `node scripts/generate-chapter-05-catalog.mjs`.
3. **Art:** Drop PNGs at listed keys in `public/content-assets/chapters/05/ASSET_KEYS.txt`.
4. **Manual playtest** (`locked: false`): quest-02 MC + documento; quest-03 drag + cloze; quest-04 mail + matching; bonus.
5. **CI:** `npm test`, `npm run lint`, `npm run build`.

---

## Document history

- 2026-06-03 — Phase 0 overview from `docs/content_raw/chapter-5.md`.
