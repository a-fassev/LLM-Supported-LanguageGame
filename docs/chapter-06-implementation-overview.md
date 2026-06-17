# Chapter 06 (Bologna, Lezione 6) — implementation overview

**Purpose:** High-level screen map for review before JSON authoring. Source: `docs/content_raw/chapter-6.md`.  
**Not in scope here:** Final hub-title polish, final reward tuning.

**Next implementation phase:** Delete legacy placeholder tree → **`scripts/generate-chapter-06-catalog.mjs`** → commit `lib/content/chapters/chapter-06/` → asset placeholders under `public/content-assets/chapters/06/`.

**Authoring rules (story copy, NPC layout):** Reuse [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md) §1. Chapter-specific skips and transitions: [chapter-06-implementation-plan.md](./chapter-06-implementation-plan.md).

**Conventions**

| Source | Catalog |
| ------ | ------- |
| Atto (6.0, 6.1, …) | One **main** quest folder (`quest-01` …) |
| Bonus block at end | `quest-01-bonus` (`kind: "bonus"`) |
| `[Narratore]` | `story` + `info` — **one beat per scene**; `content.text` = narrator body only |
| `[Monologo interiore]` | `story` + `info` — `Tu` + `\n` + text |
| `[Signora]` | `story` + `info` — `Signora` + `\n` + dialogue |
| `[Info di gioco]` | `story` + `info` — hint copy body-only |
| Testo S. 112–113 / intervista S. 114 | `referenceDocument` on **task** scenes (documento) |
| Sicilia S. 122–123 | `referenceDocument` with `figures[]` (luoghi) on **cloze** task |

**Web progression (today):** Quests unlock **in chapter order** (`requiresQuestId`). Learner uses **chapter mission list** between quests. No `autoStartQuestId`. Raw „6.1 e 6.2 in ordine libero“ → **hub-linear** approximation (see [Settled decisions](#settled-decisions)).

---

## Spiellogik (kurz, Stand Codebase)

- **Katalog:** `lib/content/chapters/chapter-06/` — replace **entire** current placeholder tree before ship ([§ Catalog cleanup](#catalog-cleanup-before-json)). Today: stub **`Milano`** title, two quests with wrong copy — **not** learner content.
- **Chapter metadata:** `order: 6` (after `chapter-05`). **`locked: false`** (playable on hub with ch.03–05).
- **Hub title (draft):** **`«Bologna — sesto giorno»`** — replaces placeholder `Milano`.
- **Task types used:** `matching` (×3 incl. bonus pool), `cloze` (×2), `multiple_choice` (×1 scene, 16 questions). **No** `free_text` / LLM, **no** `drag_drop` (raw „blocchi“ → deterministic **`cloze`**).
- **Progression:** Five quests (four main + bonus); bonus does not block next chapter (none after ch.6 in catalog today).

---

## Chapter structure (proposed)

| Quest ID | Source act | Working title (IT, draft) | Main tasks | Notes |
| -------- | ---------- | ------------------------- | ---------- | ----- |
| `quest-01` | 6.0 Camera | Ultimo percorso | 0 | Conferma prof; due tappe (narrative) |
| `quest-02` | 6.1 Ristorante | Al ristorante | 3 | Letteratura: righe + intervista + discorso indiretto |
| `quest-03` | 6.2 Parco | Incontro in Sicilia | 1 | Messa in rilievo (cloze ×5) |
| `quest-04` | 6.3 Piazza | Quiz in piazza | 1 | MC ×16 (p. 125) |
| `quest-01-bonus` | Fine Atto 6 | Extra: parole Lezione 6 | 1 + **finale** | `matching` + `poolPairs` / `sampleSize: 10`; story **05–07** = schermata finale |

**Target `chapter.json` quest order:**

`["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"]`

**Unlock chain (settled):** each main `requiresQuestId` = previous main (`quest-01` → `null`, …). Bonus `requiresQuestId: "quest-04"`. **Hub order:** ristorante → parco → piazza (raw parallel map **not** modeled — see settled).

---

## Catalog cleanup (before JSON)

**Remove** today’s stub tree completely (`title: "Milano"`, generic cloze). **Do not** patch placeholders.

Rebuild:

- `chapter.json` with five quest ids, **`title`: «Bologna — sesto giorno»**, **`locked: true`**, `background`
- Per quest: `quest.json` + `scenes/01.json` … per tables below

---

## JSON skeleton & background assets

Keys under `chapters/06/chapter/`, `chapters/06/quests/{01|02|03|04|bonus}/`.

| File | Draft `background` key |
| ---- | ---------------------- |
| `chapter.json` | `chapters/06/chapter/bg-missions` |
| `quests/quest-01/quest.json` | `chapters/06/quests/01/bg-overview` |
| `quests/quest-02/quest.json` | `chapters/06/quests/02/bg-overview` |
| `quests/quest-03/quest.json` | `chapters/06/quests/03/bg-overview` |
| `quests/quest-04/quest.json` | `chapters/06/quests/04/bg-overview` |
| `quests/quest-01-bonus/quest.json` | `chapters/06/quests/bonus/bg-overview` |

**Scene key hints (draft):**

| Quest | Location art |
| ----- | ------------- |
| quest-01 | `bg-room-morning` (camera Ferrari, mattina) |
| quest-02 | `bg-ristorante` (turno in centro) |
| quest-03 | `bg-parco-caffe` (parco / caffè tranquillo) |
| quest-04 | `bg-piazza-maggiore` (Festa della Repubblica) |
| bonus | `bg-neutral` |

**Documento figure keys (quest-03 task):** `chapters/06/quests/03/ref-sicilia-{01..07}` (PNG checklist in `ASSET_KEYS.txt`; task uses text + figures for luoghi S. 122).

Placeholders: `public/content-assets/chapters/06/**` + `ASSET_KEYS.txt` from generator.

---

## Quest `quest-01` — Atto 6.0 (Bridge)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: conferma professoressa; ultima parte del percorso |
| 02 | story | info | Tu — due tappe: ristorante + parco |
| 03 | story | info | Narrator: due pin sulla mappa (hub copy; no map UI in JSON) |

**Omit:** Map UI / auto-unlock of parallel nodes — mission list only.

---

## Quest `quest-02` — Atto 6.1 (Ristorante, 3 compiti)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: libro *Bianca come il latte…* |
| 02 | story | info | Tu — leggo un momento… |
| 03 | task | **matching** | Compito 1 S. 112 — 5 affermazioni ↔ **riga** (documento = testo righe 1–32) |
| 04 | task | **matching** | Compito 2 S. 114 — 8 domande ↔ 8 risposte (stesso testo intervista in documento) |
| 05 | task | **cloze** | Compito 3 S. 114–115 — discorso indiretto presente (**10 gaps**, 5 frasi) |
| 06 | story | info | Narrator: chiudi il libro… (verbatim raw) |

### Compito 1 — righe (scene 03)

- **`matching`:** left = 5 affermazioni; right = etichette riga (`8–9`, `15–16`, `23`, `24`, `31–32`).
- **`referenceDocument`:** testo numerato S. 112/113 (righe 1–32 verbatim raw).
- **Keys:** stmt1→24; stmt2→23; stmt3→15–16; stmt4→8–9; stmt5→31–32.
- **Instruction:** *Trova nel testo le frasi giuste e indica la riga.*

### Compito 2 — intervista (scene 04)

- **`matching`:** 8× domanda ↔ risposta (testo risposte = blocchi numerati raw).
- **`referenceDocument`:** stesso blocco intervista D’Avenia (S. 114).
- **Instruction:** *Associa le risposte alle domande corrette e ordina la sequenza dell’intervista.* (ordine = id domande 1–8; matching non richiede sort drag).

### Compito 3 — discorso indiretto (scene 05)

- **`cloze`**, not `drag_drop` / LLM — raw „Lückentext deterministico“.
- 5 `lines[]`, **10 gaps** total; `correctAnswers` from raw solution list (accettare varianti minime di punteggiatura in generator).
- **`referenceDocument`:** intervista S. 114 come contesto (opzionale ma raccomandato).

---

## Quest `quest-03` — Atto 6.2 (Sicilia)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: foto Sicilia sul tablet |
| 02 | story | info | Signora — *Non basta dire mi piace…* |
| 03 | task | **cloze** | S. 123 — 5 frasi, messa in rilievo (1 gap/frase) |
| 04 | story | info | Narrator: *Perfetto, adesso è chiarissimo.* |

### Cloze (scene 03)

- Starters verbatim raw (Trapani, saline, Monreale, Piazza Armerina, Palermo).
- **Solutions:** 1) `la città barocca`; 2) `le saline`; 3) `la Cattedrale di Santa Maria Nuova`; 4) `i mosaici`; 5) `il Palazzo della Giustizia`.
- **`referenceDocument`:** elenco luoghi S. 122 + `figures[]` per immagini (p. 122); motivazioni restano nel testo frase.

---

## Quest `quest-04` — Atto 6.3 (Finale)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: Festa della Repubblica, quiz in piazza |
| 02 | story | info | Tu — ultima prova |
| 03 | task | **multiple_choice** | Quiz p. 125 — **16 questions**, 1 scene, shell Avanti → Controlla |
| 04 | story | info | Narrator: fine quiz; ripasso vocaboli → bridge bonus (verbatim raw) |

### MC (scene 03)

- Options **verbatim** raw (a/b/c per domanda).
- **Keys:** 1c, 2c, 3b, 4c, 5c, 6b, 7c, 8b, 9c, 10b, 11c, 12b, 13b, 14a, 15a, 16a.
- **Instruction:** *Risolvi le 16 domande del quiz.*

---

## Quest `quest-01-bonus` — Chapter close + vocabulary + game end

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: capitolo 6 completato; collezione sei lezioni |
| 02 | story | info | Narrator: mettiti alla prova |
| 03 | story | info | Spielinfo — bonus pizza |
| 04 | task | **matching** | IT ↔ EN; `poolPairs` = all Lezione 6 vocab tables in raw; `sampleSize: 10` |
| 05 | story | info | Narrator: vocaboli superati (`bg-finale`) |
| 06 | story | info | Narrator: percorso completo + arredo finale |
| 07 | story | info | Tu — chiusura emotiva → overlay «Percorso completato!» → **Torna al menu** |

**Title:** `Extra: parole della lezione 6` (**`Extra: `** prefix required).

**Unlock:** `requiresQuestId: "quest-04"`.

**Web finale:** `gameFinale: true` on `chapter.json`; snapshot sets `run.isGameFinaleQuest`; overlay via `lib/game/game-finale.ts`, primary **Torna al menu**.

**Omit:** Neutral screen / no avatar tech notes — `bg-neutral` for intro; `bg-finale` for scenes 05–07.

---

## Task-type mapping summary

| Source exercise | `screen_type` | Notes |
| ----------------- | --------------- | ----- |
| Comprensione righe S. 112 | `matching` | Affermazione ↔ riga; documento numerato |
| Intervista 8 domande S. 114 | `matching` | Domanda ↔ risposta |
| Discorso indiretto S. 114–115 | `cloze` | 10 gaps; **not** `free_text` |
| Sicilia messa in rilievo S. 123 | `cloze` | 5 gaps; documento luoghi |
| Quiz ripasso S. 125 ×16 | `multiple_choice` | 1 scene, 16 `questions[]` |
| Bonus vocab | `matching` | `poolPairs` + `sampleSize: 10` |

**Not used:** `free_text`, `error_spotting`, `drag_drop`, `screen_type: "bonus"`, LLM.

---

## Draft scoring (placeholder for JSON)

Pattern: chapters 01–05 / `docs/quest-scene-content-format.md` §6. Task scenes: `"backpack": { "pieces": 1 }`. Story: **no** `scoring`.

| Scene (draft) | Quest | Task | Pizza (draft) | Rationale |
| ------------- | ----- | ---- | ------------- | --------- |
| 03 | quest-02 | matching righe ×5 | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 04 | quest-02 | matching intervista ×8 | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 05 | quest-02 | cloze ×10 | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 03 | quest-03 | cloze ×5 | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 03 | quest-04 | MC ×16 | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| 04 | quest-01-bonus | matching pool ×10 | `scored`, `maxSlices: 2`, `linear`, `floor` | Bonus |

**Chapter pizza (rough):** ~14–16 slices from main tasks (+ bonus). Team rebalance after playtest.

---

## Settled decisions

| Topic | Decision |
| ----- | -------- |
| Hub `title` | **`«Bologna — sesto giorno»`** (replaces `Milano`) |
| `locked` | **`false`** (shipped playable with ch.03–05) |
| Old `chapter-06` stub | **Delete** full tree; rebuild from this overview |
| Raw parallel 6.1 / 6.2 | **Linear hub:** `quest-02` → `quest-03` → `quest-04`; narrative in `quest-01` keeps „due tappe“ |
| Compito 3 „blocchi“ | **`cloze`** with phrase `correctAnswers` (deterministic) |
| Compito 1 righe | **`matching`** (not MC, not free text) |
| Quiz ×16 | **One** MC scene; `SceneRouter` Avanti/Controlla |
| Bonus | `kind: "bonus"` + `Extra: ` + `matching` pool from raw vocab tables |
| Map UI | **Out of JSON** (hub only) |
| Game end after bonus | Story **05–07** + play overlay **Percorso completato!** → `/menu` |

---

## Open decisions

| Topic | Options | Recommendation |
| ----- | ------- | -------------- |
| `locked` flip for classroom pilot | `true` to withhold chapter on hub | **`false`** today — flip in generator when needed |
| Sicily `figures[]` | 7 figure keys vs text-only documento | **Figures** for luoghi (raw: immagini p. 122); PNGs can land later |
| MC 16 in one session | Split 8+8 vs single scene | **Single scene** (raw: one quiz block) |

---

## Scene count estimate (for JSON planning)

| Quest | Story (`info`) | Task | Total ≈ |
| ----- | -------------- | ---- | ------- |
| quest-01 | 3 | 0 | 3 |
| quest-02 | 3 | 3 | 6 |
| quest-03 | 3 | 1 | 4 |
| quest-04 | 3 | 1 | 4 |
| quest-01-bonus | 6 | 1 | 7 |
| **Chapter total** | **~18** | **~6** | **~24** |

---

## Catalog authoring

- **Source of truth:** `scripts/generate-chapter-06-catalog.mjs` (re-run after edits; **wipes** `lib/content/chapters/chapter-06/`).
- **Do not** hand-edit generated scene JSON once the generator exists.

---

## Next steps (ship readiness)

1. **Phase 0 ✓** — this overview + [implementation plan](./chapter-06-implementation-plan.md).
2. **Generator + JSON** — `node scripts/generate-chapter-06-catalog.mjs`.
3. **Tests** — `chapter-06-catalog.test.ts`, `chapter-06-task-scoring.test.ts`.
4. **Art:** Drop PNGs at `public/content-assets/chapters/06/ASSET_KEYS.txt`.
5. **Pilot:** flip `locked: false` when ready; manual playtest all task types.
6. **CI:** `npm test`, `npm run lint`, `npm run build`.

---

## Document history

- 2026-06-03 — Phase 0 overview from `docs/content_raw/chapter-6.md`.
