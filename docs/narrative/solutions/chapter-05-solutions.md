# Chapter 5 — QA walkthrough & task answers

**Chapter slug:** `chapter-05` — *Capitolo 5: La gita a Lucca*

**Sources:** `20260701120000_chapter_05_act_content.sql`, `20260701120100_chapter_05_scored_pizza.sql`

**Narrative:** Atto 5.0–5.3 in [chapter-5.md](../chapter-5.md)

**Prerequisite:** Complete `chapter-04-quest-04-piazza-quiz` (Quiz in piazza). After Ch.4 finale, the game may auto-start quest 1.

**Shell UI:**

| Context | Primary button | Notes |
| -------- | --------------- | ----- |
| Cutscene steps | **Avanti** | Beat pager |
| Task steps | **Controlla** | Scored pizza after migration |
| MC / mail cloze | **Leggi i testi** / **Leggi il testo** | `referenceDocument` on steps |

**Rewards (tasks):** `pizza.mode = scored` (max 2 slices, `minRatioToComplete` 0.01). `backpack.mode = first_completion`, value 1.

---

## Quest 1 — `chapter-05-quest-01-week-bridge`

**Display name:** Novità dalla classe  
**Unlock:** After `chapter-04-quest-04-piazza-quiz`  
**Flow:** `blockBack: true`, auto-start → quest 2

| order | kind | logical_task_key | QA action |
| ----- | ---- | ---------------- | --------- |
| 0 | cutscene | `chapter-05-q1-cutscene-bridge` | **Avanti** × **5 beats** (narrator → Sara chat → monologue ×2 → narrator) |

---

## Quest 2 — `chapter-05-quest-02-lucca-mc`

**Display name:** Perché andare a Lucca?  
**Unlock:** After quest 1

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-05-q2-cutscene-intro` | **Avanti** × **3 beats** |
| 1 | task | MultipleChoice | `chapter-05-q2-mc-lucca-texts` | Open **Leggi i testi**; answer 5 questions |
| 2 | cutscene | — | `chapter-05-q2-cutscene-outro` | **Avanti** × **2 beats** |

### Multiple choice (all single-select)

| # | Correct option |
|---|----------------|
| 1 | **b** — Due giorni al Lucca Comics… |
| 2 | **b** — Treno, albergo, biglietto festival |
| 3 | **b** — Valore culturale e artistico |
| 4 | **b** — Genitori informati e consenso |
| 5 | **a** — Ottenere un sì motivato per gita scolastica |

---

## Quest 3 — `chapter-05-quest-03-cafe-debate`

**Display name:** Al caffè  
**Unlock:** After quest 2

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-05-q3-cutscene-intro` | **Avanti** × **3 beats** |
| 1 | task | DragDrop | `chapter-05-q3-dragdrop-pro-contro` | Sort 8 cards into buckets |
| 2 | task | ClozeText | `chapter-05-q3-cloze-aggettivo` | Fill 6 gaps (one per line) |
| 3 | cutscene | — | `chapter-05-q3-cutscene-outro` | **Avanti** × **1 beat** |

### Drag & drop

| Bucket | Cards |
|--------|-------|
| Lucca PRO | 1, 3, 7 |
| Lucca CONTRO | 5, 8 |
| Firenze PRO | 2, 4, 6 |
| Firenze CONTRO | *(empty)* |

### Cloze — adjective position

| Line | Answer |
|------|--------|
| Giulio è … studente | `un solo` |
| Sofia è … ragazza | `una povera` |
| Rita e Franco sono amici … | `vecchi` |
| Nando è un ragazzo … | `solo` |
| È un evento … | `caro` |
| Parla di … amico | `un vecchio` |

---

## Quest 4 — `chapter-05-quest-04-formal-mail`

**Display name:** La mail formale  
**Unlock:** After quest 3  
**Flow:** Last main quest in chapter (no auto-start to Ch.6 yet)

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-05-q4-cutscene-intro` | **Avanti** × **2 beats** |
| 1 | task | ClozeText | `chapter-05-q4-cloze-mail` | Open **Leggi il testo**; fill 8 gaps |
| 2 | task | Matching | `chapter-05-q4-matching-imperativo` | Match 8 infinitives to Lei imperatives |
| 3 | cutscene | — | `chapter-05-q4-cutscene-outro` | **Avanti** × **2 beats** |

### Mail cloze (gap order)

`Le` · `Le` · `ci` · `legga` · `pensi` · `Si ricordi` · `ci proibisca` · `ci risponda`

### Matching — imperativo di cortesia

| Infinito | Forma |
|----------|--------|
| essere | sia |
| avere | abbia |
| andare | vada |
| dare | dia |
| dire | dica |
| fare | faccia |
| stare | stia |
| sapere | sappia |
