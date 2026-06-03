# Chapter 06 — implementation plan (authoring)

Companion to [chapter-06-implementation-overview.md](./chapter-06-implementation-overview.md). **Timeless rules** stay in `.cursor/skills/chapter-content-authoring/SKILL.md` and `docs/quest-scene-content-format.md`.

---

## 1. Story scenes (`story` + `info`)

Same as [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md#1-story-scenes-story--info):

| Raw tag | `content.text` |
| ------- | ---------------- |
| `[Narratore]` | Body only — no `[Narratore]` prefix |
| `[Monologo interiore]` | `Tu\n{line}` |
| `[Signora]` | `Signora\n„…"` |
| `[Info di gioco]` | Body only (bonus hint) |

Use `\n` between speaker and line; `StoryPanel` uses `whitespace-pre-line`.

---

## 2. Skips and replacements

| Raw | Action |
| --- | ------ |
| Mappa con pin / 6.3 bloccato finché 6.1+6.2 | **Narrative only** in `quest-01` scene 03 — unlock = linear `requiresQuestId` |
| 6.1 e 6.2 ordine libero | **Hub order:** `quest-02` then `quest-03` (ristorante → parco) |
| Bonus „schermo neutro, no background“ | **Omit** — bonus uses `bg-neutral` like other chapters |
| Schermata finale gioco dopo bonus | **Scenes 05–07** after bonus matching; play overlay → menu |
| `[Narratore]` bracket in visible Italian | **Strip** |
| German labels in learner UI | **Italian** only in `instruction` / prompts |

---

## 3. Task authoring notes

### Righe S. 112 (`quest-02` scene 03)

- `referenceDocument.body` = testo righe 1–32 **verbatim** raw.
- `matching`: 5 left statements, 5 right row labels; `correctPairs` per overview.
- Presentation: `leftLabel` *affermazione*, `rightLabel` *riga*.

### Intervista S. 114 (`quest-02` scene 04)

- Eight question strings and eight answer blocks from raw pool/solution.
- `referenceDocument` repeats interview intro + numbered answers for consulto.

### Discorso indiretto (`quest-02` scene 05)

- **`cloze`** with 5 sentences, 10 gaps — solutions from raw „ordine buchi“ list.
- Long phrase gaps: `maxLength` 128+ where needed.
- **Not** `drag_drop` unless playtest shows UX need.

### Sicilia (`quest-03` scene 03)

- Five starter lines verbatim; one gap each.
- `referenceDocument`: list of 7 luoghi + `figures[]` (`ref-sicilia-01` …) with Italian captions from raw.

### Quiz MC (`quest-04` scene 03)

- All 16 questions in one `questions[]` array; preserve option order (a/b/c).
- Correct indices: 1→c(2), 2→c(2), 3→b(1), … 16→a(0) per 0-based builder.

### Bonus (`quest-01-bonus` scene 04)

- Pool = tables *Ingresso*, A, B, B2 from raw (full list in generator).
- `sampleSize: 10`, `shuffleRightOrder: true`.
- Title: `Extra: parole della lezione 6`.

---

## 4. Verbatim vs new Italian

| Location | Rule |
| -------- | ---- |
| Story beats | **Verbatim** raw Italian unless typo fix |
| Task prompts / options | **Verbatim** from raw compiti |
| Bridge „due pin“ | **Verbatim** narrator raw 6.0 |

---

## Document history

- 2026-06-03 — Plan companion for chapter 06 Phase 0.
