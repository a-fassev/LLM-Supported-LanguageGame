# Raw markdown → catalog mapping

Source tags in `docs/content_raw/chapter-*.md` map to **one scene per beat**.

## Story beats

| Raw | `scene_type` / `screen_type` | `content.text` |
| --- | ---------------------------- | -------------- |
| `[Narratore]` | `story` / `info` | Body only (no „Narratore“ prefix) |
| `[Info di gioco]` | `story` / `info` | Hint body only |
| NPC (`[Prof.ssa Ricci]`, `[Tonio]`, …) | `story` / `info` | Line 1: display name · Line 2: dialogue (`\n`) |
| `[Monologo interiore]` / `[Risposta del giocatore]` | `story` / `info` | Line 1: `Tu` · Line 2: text (`\n`) |
| SMS speaker | `story` / `info` | Line 1: short label (e.g. `Matteo`) · Line 2: message (`\n`) |

Do not leave raw bracket labels in player-visible text unless product requests it.

## Structure

| Raw | Catalog |
| --- | ------- |
| Akt / act (1.0, 1.1, …) | One **main** quest folder (`quest-01`, `quest-02`, …) |
| Bonus block at end of chapter raw | `quest-NN-bonus` with `"kind": "bonus"`, title `Extra: …` |
| Exercise block | `task` scene + implemented `screen_type` |
| Broschüre / long reading | `referenceDocument` on **task** scenes; optional short story “read first” |

## Chapter 01 reference map

| Quest | Source | Main tasks |
| ----- | ------ | ---------- |
| `quest-01` | Akt 1.0 | 0 |
| `quest-02` | Akt 1.1 | cloze, error_spotting |
| `quest-03` | Akt 1.2 | cloze (SMS) |
| `quest-04` | Akt 1.3 | matching ×2, drag_drop (+ brochure doc) |
| `quest-01-bonus` | Vocab pool | matching `sampleSize: 10` |

Unlock: each main `requiresQuestId` = previous main; bonus `requiresQuestId: "quest-04"`.

Quest `quest-02` → `quest-03` is **continuous** (no extra hub break beyond normal quest-end return to list).
