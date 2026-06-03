# Chapter 03 — implementation plan (authoring)

Companion to [chapter-03-implementation-overview.md](./chapter-03-implementation-overview.md). **Timeless rules** stay in `.cursor/skills/chapter-content-authoring/SKILL.md` and `docs/quest-scene-content-format.md`.

---

## 1. Story scenes (`story` + `info`)

Same as [chapter-01-implementation-plan.md](./chapter-01-implementation-plan.md#1-story-scenes-story--info):

| Raw tag | `content.text` |
| ------- | ---------------- |
| `[Narratore]` | Body only — no `[Narratore]` prefix |
| `[Monologo interiore]` / `[Risposta del giocatore]` | `Tu\n{line}` |
| NPC (`[Valentina]`, `[Lorenzo Conti]`) | `Valentina\n„…"` or `Lorenzo Conti\n„…"` |
| `[Info di gioco]` | Body only (bonus hint) |

Use `\n` between speaker and line; `StoryPanel` uses `whitespace-pre-line`.

---

## 2. Skips and replacements

| Raw | Action |
| --- | ------ |
| Map / pin / “illuminano” UI | **Omit** — hub mission list only |
| Full volantino / rivista in narrator scene | **Omit** — `referenceDocument` on task scenes only |
| Akt 3.0 → 3.1 “automatic transition” | **New** narrator bridge scene `quest-01` scene **03** (Italian, 1–2 sentences) |
| Avatar customization / sprite / sound notes | **Ignore** for JSON |
| `[Narratore]` bracket in visible Italian | **Strip** — never show tag |

---

## 3. Task authoring notes

### Volantino MC (`quest-02` scene 05)

- `content.instruction` — read flyer, choose correct answer (Italian).
- `content.task.questions[]` — six entries; three options each; labels verbatim from raw.
- `referenceDocument.title` — *Bologna — duemila anni di storia*; `body` — full B1 flyer from raw (single `body`, not `sections`).

### Congiuntivo cloze (`quest-03` scene 09)

- Dialogue lines as `lines[]` with `literal` + `gap` segments; infinitives in parentheses stay in **literal** text.
- Accept Unicode apostrophe variants if needed in `correctAnswers`.
- **Not** `free_text` / LLM: raw „Freitext mit Auto-Check“ = typed gap + deterministic `correctAnswers` (`cloze`).

### Story beat split (`quest-03` scenes 10–11)

- Scene **10:** Valentina praise only.
- Scene **11:** Narrator — lavagna (separate beat; do not merge with 10).

### Matching accrescitivi (`quest-03` scene 14)

- `leftItems` / `rightItems` from raw table; meanings in right labels optional (e.g. `(piccola)`).

### Suffix cloze (`quest-03` scene 15)

- Prompt per numbered sentence; parenthesis word in literal; gap for derived form.

### Lorenzo MC (`quest-04` scene 08)

- `referenceDocument.body` = Lorenzo monologue (verbatim).
- Four MC questions after reading — same `questions[]` pattern as museum.

### Si impersonale (`quest-04` scene 11)

- Word bank in `content.instruction` (not selectable UI).
- Gaps for `si` forms and agreement adjectives (`buona`, `buoni`, …) per raw solutions.

### Drag-drop Made in Italy (`quest-04` scene 15)

- Targets = cities + `non-italiano`; one card per product; rivista `referenceDocument` duplicate OK on same scene.

### Bonus (`quest-01-bonus` scene 04)

- Build `poolPairs` from all tables in `docs/content_raw/chapter-3.md` from **Ingresso** through **Autocontrollo**.
- `sampleSize: 10`, `shuffleRightOrder: true`.

---

## 4. Scoring

Apply [overview § Draft scoring](./chapter-03-implementation-overview.md#draft-scoring-placeholder-for-json) on first JSON pass; team may rebalance later.
