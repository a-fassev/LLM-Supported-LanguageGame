# Chapter 04 — implementation plan (authoring)

Companion to [chapter-04-implementation-overview.md](./chapter-04-implementation-overview.md). **Timeless rules** stay in `.cursor/skills/chapter-content-authoring/SKILL.md` and `docs/quest-scene-content-format.md`.

---

## 1. Story scenes (`story` + `info`)

Same as [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md#1-story-scenes-story--info):

| Raw tag | `content.text` |
| ------- | ---------------- |
| `[Narratore]` | Body only — no `[Narratore]` prefix |
| `[Monologo interiore]` / `[Risposta del giocatore]` | `Tu\n{line}` |
| `[Sara]` / `[Sara — messaggio vocale]` | `Sara\n„…"` |
| `[Info di gioco]` | Body only (bonus hint) |

Use `\n` between speaker and line; `StoryPanel` uses `whitespace-pre-line`.

---

## 2. Skips and replacements

| Raw | Action |
| --- | ------ |
| Map / pin / avatar customization / Sara sprites | **Omit** — hub mission list + backgrounds only |
| Full invito / German article in narrator scene | **Omit** — `referenceDocument` on task scenes only |
| Akt 4.0 → 4.1 park transition | **New** narrator bridge `quest-01` scene **03** |
| Akt 4.1 → 4.2 evening | Covered by last story beats in `quest-02` (no extra bridge scene) |
| Akt 4.2 → 4.3 next morning | Implicit next quest (`quest-04` opens with morning) |
| Bonus „neutral screen, no background" | **Omit** — use bonus quest `background` like other chapters |
| `[Narratore]` bracket in visible Italian | **Strip** — never show tag |
| Raw „Federica" in cloze | Lines use **`Tu:`** — learner is the friend |

---

## 3. Task authoring notes

### Foto freetext (`quest-02` scene 07)

- `referenceDocument.figures[]` ×4 with asset keys under `chapters/04/quests/02/ref-foto-*`.
- Captions for A–C: include Sara’s **given** descriptions (verbatim).
- Foto D caption: *La cattedrale di Palermo (da descrivere)* — learner text in freetext field only.
- Example answer from raw → `evaluationCriteria` / judge context only.

### Congiuntivo cloze (`quest-02` scene 14)

- Full dialogue from raw § *Esercizio 2* in `lines[]`.
- Word bank in `instruction`, not duplicated in every gap.
- **16 gaps** — order matches solution list in overview.

### Error spotting (`quest-02` scene 16)

- Five Sara sentences; author **one** `isError: true` segment per faulty sentence (the marked verb phrase).
- Sentence **3**: all segments `isError: false` (trap).
- `acceptedCorrections` per raw; trim/case-insensitive match at score time.

### Mediation mail (`quest-03` scene 04)

- German article in `referenceDocument.body` (verbatim, including numbered tips and source URL line).
- Italian `instruction` + `task.prompt` from raw assignment block.
- LLM rubric: transfer ≥3 tips, Sara-specific advice, congiuntivo/infinitivo, saluto/chiusura, B1 empathy.

### Invito MC (`quest-04` scene 05)

- `referenceDocument.body` = *INVITO* + *Programma* A–E verbatim.
- Four MC items; options verbatim from raw.

### SMS cloze (`quest-04` scene 09)

- Opening line `Mamma, ascolta che bello! 😍` as literal.
- Eight timestamped stems; each gap accepts variants from raw *Esempi di soluzioni*.
- Same `referenceDocument` as MC scene (duplicate id optional for authoring clarity).

### Bonus matching (`quest-01-bonus` scene 04)

- Merge all vocab tables from raw *Esercizio bonus* into `poolPairs`.
- `sampleSize: 10`, `shuffleRightOrder: true`.

---

## 4. Verbatim vs new Italian

| Content | Rule |
| ------- | ---- |
| Story dialogue, exercises, invito, German article | **Verbatim** from `docs/content_raw/chapter-4.md` unless typo fix |
| Bridge scene `quest-01` scene 03 | **New** 1–2 sentences (Italian) — park walk |
| LLM criteria strings | English in `evaluationCriteria` (judge); learner strings Italian |
| German authoring labels (*Wortbank*, …) in raw | **Translate** in `content.instruction` / prompts (*Parole disponibili*, …) — not copied into TaskChrome |

---

## Document history

- 2026-06-03 — Created with Phase 0 overview.
