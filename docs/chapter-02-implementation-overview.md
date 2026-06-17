# Chapter 02 (Bologna, Lezione 2) — implementation overview

**Purpose:** High-level screen map for review before JSON authoring. Source: `docs/content_raw/chapter-2.md`.  
**Not in scope here:** Final hub title Italian polish, full task payloads, LLM rubric fine-tuning, final reward tuning. **Draft scoring** below is a starting point for JSON.

**Next implementation phase (planned):** Delete legacy placeholder tree → **JSON skeleton** (catalog + `background` keys) → content pass → art pass. Mirror chapter 01: [scripts/generate-chapter-01-catalog.mjs](../scripts/generate-chapter-01-catalog.mjs) → adapt as `generate-chapter-02-catalog.mjs`.

**Authoring rules (story copy, NPC layout):** Reuse [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md) §1 (same `content.text` conventions). Chapter-specific skips: [chapter-02-implementation-plan.md](./chapter-02-implementation-plan.md).

**Conventions**

| Source | Catalog |
| ------ | ------- |
| Akt (2.0, 2.1, …) | One **main** quest folder (`quest-01` …) |
| Bonus block at end | `quest-01-bonus` (`kind: "bonus"`) |
| `[Narratore]` | `story` + `info` — **one beat per scene**; `content.text` = narrator body only |
| `[Spielinfo]` / `[Info di gioco]` | `story` + `info` — hint copy body-only in `content.text` |
| NPC dialogue | `story` + `info` — line 1: name, line 2: dialogue (`\n`) |
| `[Monologo interiore]` / `[Risposta del giocatore]` | `story` + `info` — `Tu` + `\n` + text |
| Exercise | `task` + implemented `screen_type` only |
| Long reading (3 profili, menù hints) | `referenceDocument` on **task** scenes (documento); not a separate “card overlay” screen type |

**Web progression (today):** Quests unlock **in chapter order** (`requiresQuestId`). No in-chapter map — learner uses **chapter mission list** between quests (same as chapter 01). Raw “three pins / frei wählbar” → **hub list order**, not a map UI.

---

## Spiellogik (kurz, Stand Codebase)

- **Katalog:** `lib/content/chapters/chapter-02/` — replace **entire** current placeholder tree before ship ([§ Catalog cleanup](#catalog-cleanup-before-json)).
- **Chapter metadata:** `order: 2` (after `chapter-01`). **`locked: false`** (confirmed; chapters 3–6 remain pilot-locked).
- **Hub title:** **`«Bologna — secondo giorno»`** — replaces placeholder catalog `Firenze` (source is still Bologna, Lezione 2).
- **Task types used:** `cloze`, `free_text` (LLM), `multiple_choice`, `drag_drop`, `matching` (bonus pool). No new `screen_type`.
- **Progression:** Five quests (four main + bonus); bonus does not block chapter 03.

---

## Chapter structure (proposed)

| Quest ID | Source act | Working title (IT, TBD) | Main tasks | Notes |
| -------- | ---------- | ------------------------- | ---------- | ----- |
| `quest-01` | 2.0 Bridge | La mattina a casa | 0 | Morning intro; **no map UI** — replace map pin copy |
| `quest-02` | 2.1 Nutelleria | La Nutelleria | 1 + 4 | Cloze + 4× freetext (one per profession) |
| `quest-03` | 2.2 Casa Ferrari | Il progetto di scuola | 1 + 6 | Steckbrief cloze + 6× MC quiz (13 scenes total) |
| `quest-04` | 2.3 Ristorante | La Trattoria da Marini | 1 + 5 | Drag-drop letter + 5× freetext (menù categories) |
| `quest-01-bonus` | Fine Akt 2 | Extra: parole Lezione 2 | 1 | `matching` + `poolPairs` / `sampleSize: 10` |

**Target `chapter.json` quest order:**

`["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"]`

**Unlock chain (settled):** each main `requiresQuestId` = previous main (`quest-01` → `null`, then `quest-02` → `quest-01`, …). Bonus `requiresQuestId: "quest-04"`. Play order: Nutelleria → casa → ristorante. Raw “frei wählbar” on the map is **not** mirrored on the web hub — no parallel unlock after `quest-01`.

---

## Catalog cleanup (before JSON)

**Remove** today’s stub tree completely (`quest-01` “In piazza”, `quest-02` empty tasks, 6 scene files). **Do not** patch placeholders.

Rebuild:

- `chapter.json` with five quest ids, **`title`: «Bologna — secondo giorno»**, **`locked: false`**, `background`
- Per quest: `quest.json` + `scenes/01.json` … per tables below

---

## JSON skeleton & background assets

Same convention as chapter 01 ([overview § JSON skeleton](./chapter-01-implementation-overview.md#json-skeleton--background-assets-next-step)): keys under `chapters/02/chapter/`, `chapters/02/quests/{01|02|03|04|bonus}/`.

| File | Draft `background` key |
| ---- | ---------------------- |
| `chapter.json` | `chapters/02/chapter/bg-missions` |
| `quests/quest-01/quest.json` | `chapters/02/quests/01/bg-overview` |
| `quests/quest-02/quest.json` | `chapters/02/quests/02/bg-overview` |
| `quests/quest-03/quest.json` | `chapters/02/quests/03/bg-overview` |
| `quests/quest-04/quest.json` | `chapters/02/quests/04/bg-overview` |
| `quests/quest-01-bonus/quest.json` | `chapters/02/quests/bonus/bg-overview` |

**Scene key hints (draft):**

| Quest | Location art |
| ----- | ------------- |
| quest-01 | `bg-room-morning` (Ferrari room, morning) |
| quest-02 | `bg-nutelleria` (info + tasks) |
| quest-03 | `bg-desk` (bedroom desk / laptop) |
| quest-04 | `bg-trattoria` (dining room; laptop at table) |
| bonus | `bg-neutral` or reuse `bg-room-morning` |

Placeholders: `public/content-assets/chapters/02/**/.gitkeep` (mirror chapter 01).

---

## Quest `quest-01` — Akt 2.0 (Morning bridge)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: slept well, colazione |
| 02 | story | info | Tu — free time, school project, restaurant job idea |
| 03 | story | info | Narrator: **three missions today** (new copy) — **not** raw map pin / “si illuminano” UI line |

**Omit / replace (settled):** Raw scene “Sulla mappa di Bologna si illuminano tre nuovi posti…” — same rule as chapter 01 map outros ([chapter-01 overview § Settled decisions](./chapter-01-implementation-overview.md#settled-decisions)). Mission list is the hub; narrator may say Nutelleria, casa, ristorante as **places to visit**, without a map screen.

---

## Quest `quest-02` — Akt 2.1 (Nutelleria / Dario)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: portici, enter Nutelleria |
| 02 | story | info | Narrator: recognizes Dario |
| 03 | story | info | Dario — greeting |
| 04 | story | info | Tu — “Cosa è successo?” |
| 05 | story | info | Dario — archeologa / dream |
| 06 | story | info | Tu — monologo (piani realistici?) |
| 07 | task | **cloze** | Esercizio 1 — *Anch'io farò l'archeologo!* (possessivi + futuro + *benissimo/buoni/…* choices) |
| 08 | story | info | Dario — describe professions (che/cui/dove) |
| 09–12 | task | **free_text** | Esercizio 2 — **one scene per profession** (4×); image via `referenceDocument` ([§ Reference document](#reference-document-contract-planned-json--ui)) |
| … | story | info | Dario — bravissimo/a, goodbye |
| … | story | info | Tu — future / compiti |
| … | story | info | Narrator: exit; **two places left** (no map UI) |

**Cloze authoring (Esercizio 1):**

- Verbatim dialogue from raw; verb hints `(fare)` stay in **literal** segments; gaps = futuro / possessivi / chosen adverbio-aggettivo.
- *Benissimo/Buonissimo*, *bene/buoni*, etc.: show options in **literal** text (`*Benissimo/Buonissimo*`); gap `correctAnswers` = accepted form only (same pattern as chapter 01 free-text cloze gaps).
- Source note: Scambio 2 plus S. 35 A5 — player voice = Sara role 1:1.

**Freetext (Esercizio 2):** Four professions with images — LLM rubric: relativi **che/cui/dove**, plausibility, B1 grammar; `evaluationCriteria` + optional `targetStructures`; avatar gender in server prompt (existing freetext service).

---

## Quest `quest-03` — Akt 2.2 (School project)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: home, signora Ferrari, compiti |
| 02 | story | info | Tu — Liceo Galvani identikit + quiz |
| 03 | story | info | Spielinfo — click schede / read three profiles |
| 04 | task | **cloze** | Esercizio 1 — Steckbrief (6 gaps × one chosen personality) |
| 05 | story | info | Tu — quiz next |
| 06–11 | task | **multiple_choice** | Esercizio 2 — **one scene per riddle** (6×); each scene = Schritt A + B via `questions[]` ([§ Quiz](#quiz-chi-sono-io-settled)) |
| 12 | story | info | Tu — fame, ristorante still todo |
| 13 | story | info | Narrator: saved compiti; **last place** ristorante (no map) |

**Reading texts (Saviano, Del Piero, Ferragni):**

- **Do not** author three separate story read-through scenes if `referenceDocument` covers them.
- **`referenceDocument`** on scene **04**: three **text sections** (Saviano verbatim; Del Piero / Ferragni per raw) — see [§ Reference document contract](#reference-document-contract-planned-json--ui).
- Spielinfo scene **03** = short hub hint (“leggi i profili nel documento…”).

**Steckbrief cloze (settled — option A):**

- **One** `cloze` scene (scene **04**); player chooses **one** personality using the documento (`referenceDocument` with all three profiles).
- Instruction: “Scegli **una** persona e completa solo il suo identikit.”
- Each gap’s `correctAnswers` = **union** of the three reference solutions from raw (Saviano / Del Piero / Ferragni).
- **Trade-off:** mixing fields from two profiles fails some gaps (acceptable for v1).

### Quiz „Chi sono io?“ (settled)

**One play scene per book riddle** (6 task scenes: **06** … **11**). Not one mega-scene with 12 sub-questions.

**Per-scene flow** (existing MC multi-question nav in `SceneRouter` / `TaskChrome` — no extra controller):

| Step | UI | Footer |
| ---- | -- | ------ |
| Open scene | `instruction` + `questions[0].prompt` (sentence with blanks / grammar MC) | — |
| Schritt A | Choose relativpronomen + participio (`questions[0]`, single-select options) | **Avanti** |
| Schritt B | Choose person (`questions[1]`, six **name-only** options; photos in documento) | **Controlla** |
| After pass | Success overlay → next scene (story **12** after scene **11**, or next quiz scene) | — |

**`questions[]` length = 2** on every quiz scene. Step B options: Giuseppe Verdi, Cristoforo Colombo, Maria Montessori, Michelangelo Buonarroti, Elena Ferrante, Leonardo da Vinci — `correctOptionIds` per raw solutions table (one person per scene).

**Documento (settled):** **Same** six-person **gallery** `referenceDocument` on **all six** quiz scenes (duplicate JSON is OK for v1; optional shared `documentId` later for authoring tools only).

**Photos:** Foto + Name only on gallery cards (no Steckbrief text). Ferrante → silhouette asset key.

**Between riddles:** Linear scene order only; optional short story beat only where raw already has monologue/narrator (scene **12–13** after last quiz).

---

## Quest `quest-04` — Akt 2.3 (Ristorante / Signor Marini)

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: portici, Trattoria da Marini, cartello |
| 02 | story | info | Tu — summer job |
| 03 | story | info | Narrator: enter, Marini |
| 04 | story | info | Marini — kitchen closed |
| 05 | story | info | Tu — cartello / lavoretto |
| 06 | story | info | Marini — lettera di motivazione? |
| 07 | story | info | Tu — portatile |
| 08 | story | info | Marini — sit, email, menu quiz |
| 09 | story | info | Tu — formule fisse |
| 10 | story | info | Spielinfo — drag formulas |
| 11 | task | **drag_drop** | Esercizio 1 — lettera di motivazione (7 slots, formula bank S. 51) |
| 12 | story | info | Narrator: email sent; Marini reads |
| 13 | story | info | Marini — menu structure challenge |
| 14–18 | task | **free_text** | Esercizio 2 — **one scene per menù category** (5×); image via `referenceDocument` |
| … | story | info | Marini — job offer, coffee |
| … | story | info | Tu — great day |
| … | story | info | Narrator: sunset / end chapter |

**Drag-drop (Esercizio 1):**

- Brief skeleton + **bank** of formulas (four categories in raw); 7 gaps; **multiple valid** phrases per gap where raw allows (e.g. closings).
- No address/date in letter body (per raw).
- Author combined draggable labels; map to `items` / `targets` per [drag_drop spec](../docs/quest-scene-content-format.md).

**Freetext (Esercizio 2):** antipasti, primi, secondi, pizze, dolci — same LLM relativpronomen rubric as quest-02.

---

## Quest `quest-01-bonus` — Chapter close + vocabulary

| # | Type | Screen | Content role |
| - | ---- | ------ | -------------- |
| 01 | story | info | Narrator: chapter 2 recap (raw “Fine Akt 2” Italian) |
| 02 | story | info | Narrator: test yourself |
| 03 | story | info | Spielinfo — bonus pizza |
| 04 | task | **matching** | IT ↔ EN; `poolPairs` = all Lezione 2 tables from raw (six thematic lists); `sampleSize: 10`; `shuffleRightOrder: true` |

**Title:** `Extra: …` per product skill (e.g. `Extra: parole della lezione`).

**Unlock:** `requiresQuestId: "quest-04"`. No auto-start after quest-04 (list only).

---

## Freetext — one scene per item (settled)

| Quest | Freetext scenes | Items |
| ----- | ----------------- | ----- |
| quest-02 | 4 task scenes (after cloze) | architetto, giornalista, medico, giardiniere/a |
| quest-04 | 5 task scenes | antipasti, primi, secondi, pizze, dolci |

Each scene: `task.prompt` = describe this item with *che* / *cui* / *dove*; LLM rubric as in raw. **One Controlla per scene.**

---

## Reference document contract (planned JSON + UI)

**Status:** Spec for chapter 02 + platform work — **not implemented** (no schema/UI/catalog changes until a dedicated pass).

**Today:** `title` + plain `body` / `bodyText` only; overlay = one scrollable `<p>` ([`referenceDocumentSchema.ts`](../lib/game/schemas/referenceDocumentSchema.ts), [`ReferenceDocumentOverlay.tsx`](../components/game/overlays/ReferenceDocumentOverlay.tsx)). Play reads documento from `scene.content.referenceDocument` (or task) on **any** task type including MC.

**Chapter 02 needs three documento patterns:**

| Use | Quest / scenes | Content |
| --- | -------------- | ------- |
| Steckbrief profiles | quest-03 scene **04** | Long **text** — three personalities (sections) |
| Quiz person gallery | quest-03 scenes **06–11** | **6 figures** — image + name caption each |
| Freetext stimulus | quest-02 (×4), quest-04 (×5) | **1 figure** — profession / menù image + short hint body |

---

### Proposed JSON shape (catalog + snapshots)

**Backward compatible:** existing scenes keep `title` + `body` only. New optional fields; loader normalizes `body` → `bodyText` as today.

```jsonc
{
  "documentId": "ch02-quiz-persons",   // optional; same id on all 6 quiz scenes for authoring
  "title": "Italiani famosi",
  "body": "Scegli la persona giusta. Puoi tenere questo documento aperto mentre rispondi.",  // optional intro above figures
  "sections": [                         // optional; Steckbrief only — plain text blocks
    { "title": "Roberto Saviano", "body": "…verbatim…" },
    { "title": "Alessandro Del Piero", "body": "…" },
    { "title": "Chiara Ferragni", "body": "…" }
  ],
  "figures": [                          // optional; 1+ images with captions
    {
      "image": "chapters/02/quests/03/ref-quiz-verdi",
      "caption": "Giuseppe Verdi",
      "alt": "Giuseppe Verdi"            // optional; defaults to caption
    }
  ]
}
```

**Rules (Zod, draft):**

| Field | Rule |
| ----- | ---- |
| `title` | Required (unchanged). |
| `body` / `bodyText` | At least one of: non-empty `body`/`bodyText`, non-empty `sections[]`, or non-empty `figures[]`. |
| `sections` | If present: min 1; each `title` + `body` required. **Mutually exclusive with using only `figures` for primary content** — may combine `body` intro + `sections` OR `body` + `figures`, not duplicate the same copy in both. |
| `figures` | If present: min 1; each `image` = asset key (same rules as `background`); `caption` required (displayed under image). |
| `documentId` | Optional string; no server behavior in v1. |

**Authoring shortcuts (normalized at catalog load):**

- **Freetext single image:** one entry in `figures` + short `body` hint (no separate top-level `image` field — one code path).
- **Quiz gallery:** `figures` length **6**, fixed order: Verdi, Colombo, Montessori, Michelangelo, Ferrante, Leonardo (order matches how teachers expect the “wall of faces”; quiz MC options may shuffle).
- **Steckbrief:** `sections` ×3; no `figures`.

**Example — freetext (quest-02):**

```jsonc
"referenceDocument": {
  "title": "l'architetto",
  "body": "Guarda la foto e scrivi una frase con che, cui o dove.",
  "figures": [{ "image": "chapters/02/quests/02/ref-prof-architetto", "caption": "l'architetto" }]
}
```

**Example — quiz scene (quest-03 scene 06; scenes 07–11 identical `referenceDocument`):**

```jsonc
"referenceDocument": {
  "documentId": "ch02-quiz-persons",
  "title": "Chi sono?",
  "body": "Ecco le sei persone del quiz. Il nome sotto ogni foto ti aiuta a scegliere.",
  "figures": [
    { "image": "chapters/02/quests/03/ref-quiz-verdi", "caption": "Giuseppe Verdi" },
    { "image": "chapters/02/quests/03/ref-quiz-colombo", "caption": "Cristoforo Colombo" },
    { "image": "chapters/02/quests/03/ref-quiz-montessori", "caption": "Maria Montessori" },
    { "image": "chapters/02/quests/03/ref-quiz-michelangelo", "caption": "Michelangelo Buonarroti" },
    { "image": "chapters/02/quests/03/ref-quiz-ferrante", "caption": "Elena Ferrante" },
    { "image": "chapters/02/quests/03/ref-quiz-da-vinci", "caption": "Leonardo da Vinci" }
  ]
}
```

**Example — one quiz task scene (riddle 1):**

```jsonc
{
  "scene_type": "task",
  "screen_type": "multiple_choice",
  "content": {
    "title": "Chi sono io? (1/6)",
    "instruction": "Metti il pronome relativo e il participio, poi scegli la persona.",
    "referenceDocument": { /* gallery as above */ },
    "task": {
      "questions": [
        {
          "id": "q1-grammar",
          "prompt": "Chi è la donna molto famosa ___ ha ___ (fondare) la casa dei bambini nel 1907?",
          "options": [ /* che / ha fondato combinations — authored per B11 */ ],
          "correctOptionIds": ["…"]
        },
        {
          "id": "q1-person",
          "prompt": "A quale persona si riferisce questa frase?",
          "preserveOptionOrder": true,
          "options": [
            { "id": "verdi", "label": "Giuseppe Verdi" },
            { "id": "colombo", "label": "Cristoforo Colombo" }
            /* … six names … */
          ],
          "correctOptionIds": ["montessori"]
        }
      ]
    }
  }
}
```

Update [`docs/quest-scene-content-format.md`](../docs/quest-scene-content-format.md) § `referenceDocument` when implementing (not in this pass).

---

### Design — gallery layout in documento overlay

**Goals:** Readable on classroom tablets; names legible; six faces visible without endless scrolling where possible; consistent with game panel (`game-panel`, existing dialog max-width).

| Breakpoint | Layout |
| ---------- | ------ |
| **Mobile** (`< md`) | **1 column** — stack of cards: image → caption. Scroll inside existing `ScrollArea` (`h-[50vh]`). |
| **`md+`** | **2×3 grid** (`grid-cols-2`, `gap-4`) — same card component. |

**Card anatomy:**

- Rounded border (`border-border`), light padding.
- **Image:** `resolveAssetUrl` → `<img>` with `object-cover`, fixed **aspect ratio 4:3**, `max-h-32` (mobile) / `max-h-36` (md+) so three rows fit in ~50vh with intro `body`.
- **Caption:** `caption` in `TASK_PLAY_SECTION_LABEL_TEXT` or `TASK_PLAY_META_TEXT`, centered under image — **name only**, no biography.
- **Ferrante:** same card; asset = grey silhouette PNG (authoring), not a broken image.

**Intro `body`:** Optional short paragraph above grid (`whitespace-pre-wrap`); keep to 1–2 lines so grid stays visible on first open.

**Accessibility:** `alt` = caption; dialog title = `referenceDocument.title`.

**Rejected for v1:** Horizontal filmstrip only (harder to compare six faces); tiny thumbnails without captions; embedding photos inside MC options **and** documento (duplicate maintenance).

---

### Implementation plan (platform — do not start in content-only PR)

| Layer | Work |
| ----- | ---- |
| **Schema** | Extend `referenceDocumentSchema` with `sections[]`, `figures[]`, `documentId`; catalog + snapshot validation. |
| **Normalize** | `normalizeReferenceDocumentForTask` + `readReference()` on play page: pass structured payload to overlay, not only `body` string. |
| **UI** | `ReferenceDocumentOverlay`: render `body` → optional `sections` (heading + text per block) → optional `figures` grid. Reuse `resolveAssetUrl` + preload optional. |
| **MC** | No change to option rendering for quiz step B (text labels only). |
| **Assets** | `public/content-assets/chapters/02/quests/03/ref-quiz-*.png` (+ quest-02/04 freetext refs). |
| **Tests** | Schema fixtures: text-only (regression), single figure, gallery ×6, sections ×3. |
| **Docs** | `quest-scene-content-format.md` § referenceDocument; AGENTS.md one line if contract is stable. |

**Order:** Platform pass **before** chapter 02 content JSON that uses `figures` / `sections`.

**Alternative rejected:** MC `options[].assetId` for faces — MC UI does not render option images today; would duplicate gallery six times per scene.

---

## Task-type mapping summary

| Source exercise | `screen_type` | Notes |
| ----------------- | --------------- | ----- |
| Dario dialogue Lückentext | `cloze` | Many gaps; literal `*a/b*` + verb hints |
| Professioni (4×) | `free_text` | LLM; che/cui/dove |
| Steckbrief identikit | `cloze` | 6 gaps; `referenceDocument` with 3 profiles |
| Quiz “Chi sono io?” | `multiple_choice` | **6 scenes** × `questions[]` length 2 (grammar → person); gallery in `referenceDocument` — [§ Quiz](#quiz-chi-sono-io-settled) |
| Lettera di motivazione | `drag_drop` | Formula bank → 7 gaps |
| Menù (5×) | `free_text` | LLM; gastronomia + relativi |
| Bonus vocab | `matching` | `poolPairs` + `sampleSize: 10` |

**Not used:** `screen_type: "bonus"`, map/SMS special screens, NPC sprites in JSON.

---

## Draft scoring (placeholder for JSON)

Pattern: chapter 01 / `docs/quest-scene-content-format.md` §6. Task scenes: `"backpack": { "pieces": 1 }`. Story: **no** `scoring`.

| Scene (draft) | Quest | Task | Pizza (draft) | Rationale |
| ------------- | ----- | ---- | ------------- | --------- |
| cloze Dario | quest-02 | cloze (~25+ gaps) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| freetext ×4 | quest-02 | free_text | `scored`, `maxSlices: 2`, `linear`, `floor` | Pizza scales with ratio |
| cloze Steckbrief | quest-03 | cloze (6 gaps) | `scored`, `maxSlices: 2`, `linear`, `floor` | Pizza scales with ratio |
| MC quiz ×6 | quest-03 | multiple_choice (2 questions each) | `scored`, `maxSlices: 2`, `linear`, `floor` | Pizza scales with ratio|
| drag_drop letter | quest-04 | drag_drop (7 targets) | `scored`, `maxSlices: 3`, `linear`, `floor` | Pizza scales with ratio |
| freetext ×5 | quest-04 | free_text | `scored`, `maxSlices: 2`, `linear`, `floor` | Per menù category if split |
| bonus matching | quest-01-bonus | matching pool ×10 | `scored`, `maxSlices: 3`, `linear`, `floor` | Bonus — pizza scales with ratio |

**Chapter pizza (rough):** ~20–28 slices if all tasks passed (depends on freetext scene split). Team rebalance later.

---

## Settled decisions

| Topic | Decision |
| ----- | -------- |
| Hub `title` | **`«Bologna — secondo giorno»`** (replaces placeholder `Firenze`) |
| `locked` | **`false`** for `chapter-02` at ship |
| Quest unlock after 2.0 | **Strictly sequential** — `quest-02` → `quest-03` → `quest-04`; **not** parallel |
| Old `chapter-02` stub files | **Delete** full tree; rebuild from this overview |
| Map / pin UI copy | **Omit** raw map illumination; mission-list framing only |
| Story formatting | Same as [chapter-01 plan §1](./chapter-01-implementation-plan.md#1-story-scenes-story--info) |
| Bonus | `kind: "bonus"` + `Extra: ` title prefix + `matching` pool |
| `autoStartQuestId` | **None** — return to `/chapters/chapter-02` between quests |
| Three profile texts | **`referenceDocument`**, not three extra story scenes |
| Steckbrief cloze | **Option A** — union `correctAnswers`, one cloze scene |
| Freetext pacing | **One play scene per item** (9 freetext scenes); stimulus via `referenceDocument.figures[]` ([§ Reference document](#reference-document-contract-planned-json--ui)) |
| Quiz „Chi sono io?“ | **6 task scenes** (riddles **06–11**), **2× `questions[]`** each; **Avanti** then **Controlla**; same 6-face gallery on every quiz scene |
| Sprites / sounds | **Out of JSON** (background keys only) |

---

## Open decisions (confirm before bulk JSON)

_None — chapter 02 authoring choices settled in this overview. Platform `referenceDocument` extension is a prerequisite, not an open product fork._

---

## Scene count estimate (for JSON planning)

| Quest | Story (`info`) | Task | Total ≈ |
| ----- | -------------- | ---- | ------- |
| quest-01 | 3 | 0 | 3 |
| quest-02 | 10 | 1 + 4 = 5 | 15 |
| quest-03 | 6 | 1 + 6 = 7 | **13** |
| quest-04 | 12 | 1 + 5 = 6 | 18 |
| quest-01-bonus | 3 | 1 | 4 |
| **Chapter total** | **~34** | **~19** | **~56** |

---

## Next steps (after review)

1. **Platform:** `referenceDocument` `figures[]` / `sections[]` ([§ Reference document contract](#reference-document-contract-planned-json--ui)) — **before** chapter 02 JSON that uses galleries or profile sections.
2. **Delete** `lib/content/chapters/chapter-02/` placeholders.
4. **Skeleton:** `scripts/generate-chapter-02-catalog.mjs` + `public/content-assets/chapters/02/**` + minimal-valid scenes.
5. **Content pass:** story verbatim; tasks from raw; bonus `poolPairs` from vocab tables in `chapter-2.md`.
6. **Tests:** `lib/game/content/chapter-02-catalog.test.ts` (quest order, scene counts, bonus wiring).
7. `npm test` / `npm run build`.

---

## Document history

- 2026-06-03 — Settled: quiz = 6 MC scenes × 2 questions; documento gallery on all; referenceDocument JSON/UI spec (`figures`, `sections`).
- 2026-06-03 — Settled: Steckbrief option A; freetext one scene per item + planned documento image; referenceDocument extension noted.
- 2026-06-03 — Settled: hub title «Bologna — secondo giorno», sequential quest unlock, `locked: false`.
- 2026-06-03 — Phase 0 overview from `docs/content_raw/chapter-2.md` (implementation planning only).
