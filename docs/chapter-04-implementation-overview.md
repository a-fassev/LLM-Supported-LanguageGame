# Chapter 04 (Bologna, Lezione 4) — implementation overview

**Purpose:** High-level screen map for review before JSON authoring. Source: `docs/content_raw/chapter-4.md`.  
**Not in scope here:** Final hub-title polish, LLM rubric tuning for freetext, final reward tuning, Sicily photo art. **Draft scoring** below is a starting point for JSON.

**Next implementation phase (planned):** Delete legacy placeholder tree → **`scripts/generate-chapter-04-catalog.mjs`** → commit `lib/content/chapters/chapter-04/` → asset placeholders under `public/content-assets/chapters/04/`.

**Authoring rules (story copy, NPC layout):** Reuse [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md) §1. Chapter-specific skips and transitions: [chapter-04-implementation-plan.md](./chapter-04-implementation-plan.md).

**Conventions**

| Source | Catalog |
| ------ | ------- |
| Akt (4.0, 4.1, …) | One **main** quest folder (`quest-01` …) |
| Bonus block at end | `quest-01-bonus` (`kind: "bonus"`) |
| `[Narratore]` | `story` + `info` — **one beat per scene**; `content.text` = narrator body only |
| `[Info di gioco]` / `[Spielinfo]` | `story` + `info` — hint copy body-only |
| NPC (`[Sara]`, `[Sara — messaggio vocale]`) | `story` + `info` — line 1: `Sara`, line 2: dialogue (`\n`) |
| `[Monologo interiore]` / `[Risposta del giocatore]` | `story` + `info` — `Tu` + `\n` + text |
| Exercise | `task` + implemented `screen_type` only |
| Einladung / deutscher Artikel / Foto-Galerie | `referenceDocument` on **task** scenes (documento); **no** duplicate full-text story read-through |

**Web progression (today):** Quests unlock **in chapter order** (`requiresQuestId`). Learner uses **chapter mission list** between quests. No `autoStartQuestId`.

---

## Spiellogik (kurz, Stand Codebase)

- **Katalog:** `lib/content/chapters/chapter-04/` — replace **entire** current placeholder tree before ship ([§ Catalog cleanup](#catalog-cleanup-before-json)). Today: stub **`Venezia`** title, `quest-01` / `quest-02` only, wrong Italian copy, `drag_drop` stub — **not** learner content.
- **Chapter metadata:** `order: 4` (after `chapter-03`). **`locked: false`** (playable on hub; chapters **5–6** remain pilot-locked).
- **Hub title (draft):** **`«Bologna — quarto giorno»`** — replaces placeholder `Venezia`.
- **Task types used:** `free_text` (LLM ×2), `cloze` (×2), `error_spotting` (×1), `multiple_choice` (×1), `matching` (bonus pool). **First learner chapter** in the rollout with both **LLM freetext** and **error_spotting** in main quests.
- **Progression:** Five quests (four main + bonus); bonus does not block chapter 05.

---

## Chapter structure (proposed)

| Quest ID | Source act | Working title (IT, draft) | Main tasks | Notes |
| -------- | ---------- | ------------------------- | ---------- | ----- |
| `quest-01` | 4.0 Camera | La mattina a casa | 0 | Souvenirs bridge → Giardini |
| `quest-02` | 4.1 Giardini | Sara ai Giardini Margherita | 3 | Foto freetext + congiuntivo cloze + error spotting |
| `quest-03` | 4.2 Mail | Una mail per Sara | 1 | Mediation DE→IT freetext (LLM) |
| `quest-04` | 4.3 Invito | L'invito a Comacchio | 2 | MC ×4 on invito + SMS cloze ×8 |
| `quest-01-bonus` | Fine Akt 4 | Extra: parole Lezione 4 | 1 | `matching` + `poolPairs` / `sampleSize: 10` |

**Target `chapter.json` quest order:**

`["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"]`

**Unlock chain (settled):** each main `requiresQuestId` = previous main (`quest-01` → `null`, …). Bonus `requiresQuestId: "quest-04"`. No `autoStartQuestId`.

---

## Catalog cleanup (before JSON)

**Remove** today’s stub tree completely (`title: "Venezia"`, Venice copy, incomplete quests, `drag_drop` stub). **Do not** patch placeholders.

Rebuild:

- `chapter.json` with five quest ids, **`title`: «Bologna — quarto giorno»**, **`locked: true`** (until pilot), `background`
- Per quest: `quest.json` + `scenes/01.json` … per tables below

---

## JSON skeleton & background assets

Same convention as chapters 01–03: keys under `chapters/04/chapter/`, `chapters/04/quests/{01|02|03|04|bonus}/`.

| File | Draft `background` key |
| ---- | ---------------------- |
| `chapter.json` | `chapters/04/chapter/bg-missions` |
| `quests/quest-01/quest.json` | `chapters/04/quests/01/bg-overview` |
| `quests/quest-02/quest.json` | `chapters/04/quests/02/bg-overview` |
| `quests/quest-03/quest.json` | `chapters/04/quests/03/bg-overview` |
| `quests/quest-04/quest.json` | `chapters/04/quests/04/bg-overview` |
| `quests/quest-01-bonus/quest.json` | `chapters/04/quests/bonus/bg-overview` |

**Scene key hints (draft):**

| Quest | Location art |
| ----- | ------------- |
| quest-01 | `bg-room-morning` (Ferrari room; souvenirs from ch.2–3) |
| quest-02 | `bg-giardini-margherita` (park, bench, pond, summer) |
| quest-03 | `bg-room-evening` (desk, laptop, lamp) |
| quest-04 | `bg-room-morning-phone` (room + smartphone) |
| bonus | `bg-neutral` or reuse `bg-room-morning` |

**Figure assets (draft, quest-02 foto task):**

| Key | Role |
| --- | ---- |
| `chapters/04/quests/02/ref-foto-acqua-verde` | Foto A |
| `chapters/04/quests/02/ref-foto-mercato-palermo` | Foto B |
| `chapters/04/quests/02/ref-foto-vucciria` | Foto C |
| `chapters/04/quests/02/ref-foto-cattedrale` | Foto D (learner describes) |

Placeholders: `public/content-assets/chapters/04/**/.gitkeep`.

---

## Quest `quest-01` — Akt 4.0 (Morning bridge)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: new day, sun, desk souvenirs (rivista Made in Italy, volantino museo) |
| 02 | story | info | Tu — Saturday, no school; signora Ferrari; Giardini Margherita |
| 03 | story | info | Narrator: **short bridge** to park (new copy; raw only has `→ Giardini`) |

**Omit:** Avatar-customization / inventory tech notes from raw.

---

## Quest `quest-02` — Akt 4.1 (Sara / Giardini)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: walk Giardini, recognize Sara on bench |
| 02 | story | info | Tu — classmate from Liceo, seems sad |
| 03 | story | info | Tu — *Ciao Sara! Tutto bene?…* (player greeting) |
| 04 | story | info | Sara — sit, down after Palermo / Marco |
| 05 | story | info | Narrator: Sara shows four phone photos |
| 06 | story | info | Sara — help describe last photo |
| 07 | task | **free_text** | Esercizio 1 — describe **Foto D** (2–3 sentences); `referenceDocument` = gallery A–C with given descriptions + D figure |
| 08 | story | info | Sara — thanks, wants to vent |
| 09 | story | info | Tu — *Certo, dimmi pure…* |
| 10 | story | info | Sara — Marco left her (message) |
| 11 | story | info | Sara — doesn’t want school / Laura |
| 12 | story | info | Tu — help her sort thoughts |
| 13 | story | info | Sara — complete my sentences (Esercizio 2 intro) |
| 14 | task | **cloze** | Esercizio 2 — *Sara rivuole Marco?* (S. 75 verbatim); word bank in instruction |
| 15 | story | info | Sara — are my sentences right? (Esercizio 3 intro) |
| 16 | task | **error_spotting** | Esercizio 3 — 5 Sara lines; 4 errors + **1 trap** (sentence 3 correct) |
| 17 | story | info | Sara — thanks, diary, write later |
| 18 | story | info | Tu — *Certo, Sara. Ci sentiamo…* |
| 19 | story | info | Tu — will write email tonight |
| 20 | story | info | Narrator: hug goodbye → evening |

### Esercizio 1 — Foto (scene 07)

- **`free_text`** (LLM), **not** four separate scenes.
- **`referenceDocument`:** `title` e.g. *Le foto di Sara in Sicilia*; `body` = task intro (Italian); `figures[]` ×4 — captions for A–C include Sara’s given descriptions (verbatim raw); D caption *La cattedrale di Palermo — da descrivere*.
- **`task`:** `minWords` ~8–12, `maxWords` ~80; `evaluationCriteria` from raw (varied vocab, B1 description, cathedral/horse/sun); example answer in rubric only (not shown to learner).
- **Avatar gender:** LLM prompt uses session profile (existing `freitextLlmEvaluationService` pattern).

### Esercizio 2 — Cloze (scene 14)

- **`cloze`** only — raw „Freitext-Eingabe mit Auto-Check“ = typed gaps + `correctAnswers` (**not** `free_text` / LLM).
- Dialogue: `Sara:` / `Tu:` lines as `lines[]` with `literal` + `gap` segments; verbs in parentheses stay **literal**.
- **`instruction`:** word bank *che — cui — mi — più — proprio* + congiuntivo/infinito rule (Italian).
- **Player voice:** raw „Federica“ → lines labeled **`Tu:`** in catalog (learner is confidant, not Federica by name).
- **Solutions (order):** `io conosca`, `tu mi aiuti`, `proprio`, `più`, `che tu non sappia`, `che io vada`, `al`, `che`, `di`, `Mi accompagni`, `che tu guardi`, `di non pensare`, `a`, `che Marco e Laura vadano`, `cui`, `di avere` — normalize apostrophe/accents in `correctAnswers`; accept reasonable variants where raw allows (e.g. `Mi accompagni` / `mi accompagni`).

### Esercizio 3 — Error spotting (scene 16)

- **`error_spotting`:** five numbered Sara quotes in one task; each error = one `isError: true` segment (marked verb phrase) + `acceptedCorrections`.
- **Trap (sentence 3):** *Penso di essere stata troppo gelosa…* — **no** error segment; if learner marks a false positive, scoring **ignores** it (platform rule). **Desired** UX copy *«Questa frase è giusta!»* on trap click → [open decision](#open-decisions) (may ship v1 without dedicated trap message).
- **Corrections (draft):** 1 → `dimenticare`; 2 → `che Marco mi chiami`; 4 → `che io non veda`; 5 → `che tu sei` (and alt. `di essere una buona amica` if authored).
- **`expectedErrorRange`:** `{ "min": 4, "max": 4 }` (four fixable errors).

**Omit:** Sara sprite / sound / SMS UI notes from raw.

---

## Quest `quest-03` — Akt 4.2 (Consolation email)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: evening room (*Sei tornato/a…* — keep raw slash until product neutralizes) |
| 02 | story | info | Tu — Sara, German article, write mail |
| 03 | story | info | Narrator: article on laptop, empty mail to Sara |
| 04 | task | **free_text** | Esercizio 1 — mail 80–120 words; `referenceDocument` = **German article verbatim** (title *Wie tröste ich jemanden bei Liebeskummer?* + body + source line) |
| 05 | story | info | Tu — save, send, hope it helps |
| 06 | story | info | Narrator: close laptop, sleep |

### Mediation freetext (scene 04)

- **`referenceDocument.body`:** German source **1:1** from raw (mediation source text stays DE).
- **`task.prompt` / `instruction`:** Italian assignment + bullet *Suggerimenti* from raw.
- **`evaluationCriteria`:** content transfer (≥3 of 5 tips), Sara adaptation, congiuntivo/infinito, informal saluto/chiusura, B1 + empathetic tone (mirror raw LLM criteria in English for judge).
- **`registerTarget`:** `informal`; `minWords` ~50, `maxWords` ~150.

**Omit:** Separate „Articolo originale“ button — **documento** overlay is the article (same as other chapters).

---

## Quest `quest-04` — Akt 4.3 (Comacchio invite)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: morning, Sara voice message |
| 02 | story | info | Sara — mail helped; forwards Giulia’s invite |
| 03 | story | info | Tu — Comacchio, canals |
| 04 | story | info | Narrator: forwarded *INVITO* message |
| 05 | task | **multiple_choice** | Esercizio 1 — **4 questions**; `referenceDocument` = full invito + programma A–E (verbatim S. 82–83) |
| 06 | story | info | Sara — come too? write to Mamma |
| 07 | story | info | Tu — want to go; must text mother |
| 08 | story | info | Tu — will write to Mamma about the invite |
| 09 | task | **cloze** | Esercizio 2 — **8 SMS** completions to German *Mamma* (S. 84 verbatim stems) |
| 10 | story | info | Sara — see you in Comacchio |
| 11 | story | info | Tu — mother agreed; weekend; ripasso vocab |
| 12 | story | info | Narrator: phone away, textbook open → bonus bridge |

### MC (scene 05)

- **One** task scene, `questions.length === 4` (shell Avanti → Controlla).
- **Solutions:** 1-b, 2-b, 3-a, 4-b.

### SMS cloze (scene 09)

- **`cloze`:** one scene; `lines[]` with timestamp literals `[16:03]` … `[16:21]`; 8 gaps.
- **`instruction`:** use invito information; conjunctions II where natural.
- **Multiple acceptable answers** per gap where raw lists variants (e.g. gap 1 weekend phrasing) — duplicate in `correctAnswers[]`.
- Invito stays on **`referenceDocument`** on same scene (and MC scene 05).

**Omit:** „Vedi l'invito“ as separate UI — documento button only.

---

## Quest `quest-01-bonus` — Chapter close + vocabulary

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: chapter 4 recap (verbatim raw *Fine Akt 4*) |
| 02 | story | info | Narrator: test yourself |
| 03 | story | info | Spielinfo — bonus pizza |
| 04 | task | **matching** | IT ↔ EN; `poolPairs` = all Lezione 4 vocab tables in raw (Ingresso, A1, A, B/B1, B/B2, Autocontrollo); `sampleSize: 10`; `shuffleRightOrder: true` |

**Title:** `Extra: parole della lezione 4` (**`Extra: `** prefix required).

**Unlock:** `requiresQuestId: "quest-04"`.

---

## Task-type mapping summary

| Source exercise | `screen_type` | Notes |
| ----------------- | --------------- | ----- |
| Foto D description | `free_text` | LLM; 4-figure `referenceDocument` |
| Sara rivuole Marco? | `cloze` | 16 gaps; word bank; no LLM |
| Trova gli errori | `error_spotting` | 4 errors + 1 trap line |
| Mail consolazione | `free_text` | LLM; DE `referenceDocument` |
| Invito MC (4×) | `multiple_choice` | 1 scene; invito documento |
| SMS alla mamma (8×) | `cloze` | Multi-answer gaps |
| Bonus vocab | `matching` | `poolPairs` + `sampleSize: 10` |

**Not used:** `drag_drop`, `screen_type: "bonus"`, map UI, NPC sprites in JSON.

---

## Draft scoring (placeholder for JSON)

Pattern: chapters 01–03 / `docs/quest-scene-content-format.md` §6. Task scenes: `"backpack": { "pieces": 1 }`. Story: **no** `scoring`.

| Scene (draft) | Quest | Task | Pizza (draft) | Rationale |
| ------------- | ----- | ---- | ------------- | --------- |
| 07 | quest-02 | free_text (foto) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.65`, `linear`, `floor` | LLM threshold |
| 14 | quest-02 | cloze (16 gaps) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.81`, `linear`, `floor` | ~13/16 |
| 16 | quest-02 | error_spotting (4 errors) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.75`, `linear`, `floor` | 3/4 fixes |
| 04 | quest-03 | free_text (mail) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.65`, `linear`, `floor` | LLM mediation |
| 05 | quest-04 | MC ×4 | `scored`, `maxSlices: 2`, `minRatioToComplete: 0.75`, `linear`, `floor` | 3/4 |
| 08 | quest-04 | cloze (8 SMS) | `scored`, `maxSlices: 3`, `minRatioToComplete: 0.75`, `linear`, `floor` | 6/8 |
| 04 | quest-01-bonus | matching pool ×10 | `scored`, `maxSlices: 2`, `minRatioToComplete: 0.6`, `linear`, `floor` | Bonus |

**Chapter pizza (rough):** ~17–19 slices from main tasks (+ bonus). Team rebalance after playtest.

**LLM dev:** Use fast model in `.env.local`; optional `GAME_SMOKE_AUTO_PASS=true` for routing QA only.

---

## Settled decisions

| Topic | Decision |
| ----- | -------- |
| Hub `title` | **`«Bologna — quarto giorno»`** (replaces `Venezia`) |
| `locked` | **`false`** (shipped playable) |
| Old `chapter-04` stub | **Delete** full tree; rebuild from this overview |
| Map / auto-transition / neutral bonus screen | **Omit** raw map UI; bonus uses normal quest backgrounds |
| Foto A–C text | In **`referenceDocument` figures** (captions), not separate story scenes |
| Museo-style MC | **1 scene**, 4 `questions[]` for invito |
| Sara cloze | **`cloze`**, not LLM |
| SMS | **1 cloze scene**, 8 gaps |
| German article | **`referenceDocument`** on freetext task; body stays German |
| Bonus | `kind: "bonus"` + `Extra: ` + `matching` pool from raw vocab tables |
| Sprites / sounds | **Out of JSON** (background + figure keys only) |

---

## Open decisions

| Topic | Options | Recommendation |
| ----- | ------- | -------------- |
| Trap sentence UX (Esercizio 3) | Dedicated *«Questa frase è giusta!»* vs generic retry only | **Deferred** — false positives ignored for scoring (no extra trap UI) |
| Narrator *tornato/a* (quest-03 scene 01) | Keep slash / pick one / gender-neutral rewrite | **Keep raw** until avatar gender drives copy |
| Sicily photo + scene backgrounds | Placeholder PNGs vs gradients only | **`generate-chapter-04-catalog.mjs`** syncs dirs + `chapters/04/ASSET_KEYS.txt`; gradient until PNGs dropped in |

---

## Scene count estimate (for JSON planning)

| Quest | Story (`info`) | Task | Total ≈ |
| ----- | -------------- | ---- | ------- |
| quest-01 | 3 | 0 | 3 |
| quest-02 | 17 | 3 | 20 |
| quest-03 | 5 | 1 | 6 |
| quest-04 | 10 | 2 | 12 |
| quest-01-bonus | 3 | 1 | 4 |
| **Chapter total** | **~38** | **~7** | **~45** |

---

## Catalog authoring

- **Source of truth (planned):** `scripts/generate-chapter-04-catalog.mjs` (re-run after edits; **wipes** `lib/content/chapters/chapter-04/`).
- **Do not** hand-edit generated scene JSON once the generator exists.

---

## Next steps (ship readiness)

1. **Phase 0 ✓** — this overview + [implementation plan](./chapter-04-implementation-plan.md).
2. **Generator + JSON** — `node scripts/generate-chapter-04-catalog.mjs` (also writes asset dirs + `public/content-assets/chapters/04/ASSET_KEYS.txt`).
3. **Art:** Drop PNGs at paths listed in `ASSET_KEYS.txt` (backgrounds + 4 foto refs).
4. **Manual playtest** (`locked: false` when ready):
   - quest-02 — foto LLM + cloze + error spotting (trap line).
   - quest-03 — DE documento + mail LLM.
   - quest-04 — MC + SMS cloze with invito documento.
   - bonus — matching ×10.
5. **CI:** `npm test`, `npm run lint`, `npm run build`.

---

## Document history

- 2026-06-03 — Phase 0 overview from `docs/content_raw/chapter-4.md` (implementation planning only).
