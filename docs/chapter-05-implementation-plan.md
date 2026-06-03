# Chapter 05 — implementation plan (authoring)

Companion to [chapter-05-implementation-overview.md](./chapter-05-implementation-overview.md). **Timeless rules** stay in `.cursor/skills/chapter-content-authoring/SKILL.md` and `docs/quest-scene-content-format.md`.

---

## 1. Story scenes (`story` + `info`)

Same as [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md#1-story-scenes-story--info):

| Raw tag | `content.text` |
| ------- | ---------------- |
| `[Narratore]` | Body only — no `[Narratore]` prefix |
| `[Monologo interiore]` / `[Chat — Tu]` / `[Risposta del giocatore]` | `Tu\n{line}` |
| `[Chat — Sara]` / `[Sara]` | `Sara\n„…"` |
| `[Compagno]` | `Compagno\n„…"` |
| `[Info di gioco]` | Body only (bonus hint) |

Use `\n` between speaker and line; `StoryPanel` uses `whitespace-pre-line`.

---

## 2. Skips and replacements

| Raw | Action |
| --- | ------ |
| Camera pan (window → desk → phone) | **Omit** — single room background per quest |
| Bonus „neutral screen, no background, no avatar" | **Omit** — bonus uses `bg-neutral` like other chapters |
| Ferrara / Notte Rosa as trip options | **Omit** from drag_drop — only Lucca/Firenze (raw § 5.2) |
| Full Testo A/B in narrator scenes | **Omit** — `referenceDocument` on MC task only |
| Prof reply letter in story | **Omit** — `referenceDocument` on mail cloze (`quest-04` scene 04) |
| Akt 5.0 → 5.1 | Direct — Sara already on scene in raw |
| Akt 5.1 → 5.2 caffè | **New** narrator bridge `quest-02` scene **07** |
| Akt 5.2 → 5.3 evening | **New** narrator beat `quest-03` scene **07** (return home) |
| Akt 5.3 → bonus | Last `quest-04` story + bonus bridge scenes (verbatim raw) |
| `[Narratore]` bracket in visible Italian | **Strip** — never show tag |
| German labels (*Wortbank*, *Lückentext*, …) in learner UI | **Italian** in `instruction` / prompts only |

---

## 3. Task authoring notes

### Lucca MC (`quest-02` scene 04)

- `referenceDocument.body` = Testo A (Simone letter) + Testo B (offerta gruppi) **verbatim** from raw.
- **Five** MC questions in **one** scene; options verbatim; keys 1B, 2B, 3B, 4B, 5A.
- `instruction`: *Leggi i testi (p. 104/105) e scegli la risposta migliore.*

### Pro/contro drag_drop (`quest-03` scene 04)

- Eight cards verbatim; four targets: Lucca PRO / Lucca CONTRO / Firenze PRO / Firenze CONTRO.
- Solutions: PRO Lucca = 1,2,3; CONTRO Lucca = 4,5; PRO Firenze = 6,7; CONTRO Firenze = 8.
- `shuffleItemOrder: true`; `matchMode: "all"` per zone.

### Aggettivo cloze (`quest-03` scene 05)

- **Order:** after drag (04), before narrator *decisione* (06) — matches raw.
- One **full-phrase** gap per line; lines 5–6 allow two adjective positions (`un evento caro` / `un caro evento`, etc.).
- **Not** `free_text` — fixed keys only (S. 101, pratica 9).

### Mail formale cloze (`quest-04` scene 04)

- Gaps for saluto, `Le`, `ci`, imperativi, ringraziamento, chiusura — order matches raw solution list.
- Saluto gap `maxLength: 128`; `Professor` / `Professore` variants in `correctAnswers[]`.
- `referenceDocument`: prof reply (S. 106) as context — learner mail is the exercise body in `lines[]`.

### Imperativo matching (`quest-04` scene 05)

- Eight infiniti ↔ imperativo (Lei); `correctPairs` use `leftItemId` / `rightItemId`.
- `shuffleRightOrder: true`.

### Bonus matching (`quest-01-bonus` scene 04)

- All vocab tables from raw (*Ingresso*, A, B, *Altre parole*) → `poolPairs`.
- `sampleSize: 10`, `shuffleRightOrder: true`.
- Title: `Extra: parole della lezione 5`.

---

## 4. Verbatim vs new Italian

| Content | Rule |
| ------- | ---- |
| Story dialogue, MC options, cards, cloze stems, mail template | **Verbatim** from `docs/content_raw/chapter-5.md` unless typo fix |
| Bridge `quest-02` scene 07 (→ caffè) | **New** 1–2 sentences (Italian) |
| Bridge `quest-03` scene 07 (→ sera / mail) | **New** 1–2 sentences (Italian) |
| NPC / `Tu` dialogue | **`„…"`** via `quoteItalianDialogue()` in generator |
| Bridge `quest-04` scene 03 (open laptop / modello) | **New** one narrator line — raw jumps straight to task |
| German authoring labels in raw | **Do not** copy into `instruction` |

---

## 5. Pilot lock

| Field | Value |
| ----- | ----- |
| `chapter.json` → `locked` | **`false`** (playable on hub after chapter 04 completion) |
| Generator | `locked: false` in `writeJson("chapter.json", …)` — re-run after edits |

---

## Document history

- 2026-06-03 — Created with Phase 0 overview; `locked: false` for pilot playtest.
