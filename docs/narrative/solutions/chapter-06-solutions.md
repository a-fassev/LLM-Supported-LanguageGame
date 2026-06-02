# Chapter 6 — QA walkthrough & task answers

**Chapter slug:** `chapter-06` — *Capitolo 6: Ultima parte a Bologna*

**Sources:** `20260702120000_chapter_06_act_content.sql`, `20260702120100_chapter_06_scored_pizza.sql`

**Narrative:** Atto 6.0–6.3 in [chapter-6.md](../chapter-6.md)

**Prerequisite:** Complete `chapter-05-quest-04-formal-mail` (La mail formale) and all prior chapter 5 quests.

**Map flow:** After the morning bridge, **Al ristorante** and **La signora siciliana** unlock in parallel (any order). **Quiz in piazza** unlocks only after both are done.

**Shell UI:**

| Context | Primary button | Notes |
| -------- | --------------- | ----- |
| Cutscene steps | **Avanti** | Beat pager; last beat advances the step on the server |
| Task steps | **Controlla** | Check/submit answers |
| Literature tasks | **Leggi il testo** / **Leggi le risposte** | Step-level `referenceDocument` on matching + Freitext |
| Sicily photos | **→** in photo grid | Display-only SpecialScreen (`blocks: []`) before cloze |

**Rewards (tasks after scored migration):** `pizza.mode = scored` (max 2 slices from former flat value, `minRatioToComplete` 0.01). Photo-only step has `{}` rewards. `backpack.mode = first_completion`, value 1 on graded tasks.

---

## Quest 1 — `chapter-06-quest-01-morning-bridge`

**Display name:** Camera tua  
**Unlock:** After `chapter-05-quest-04-formal-mail` (chapter 5 complete)  
**Flow:** `blockBack: true` — no auto-start (two map pins)

| order | kind | logical_task_key | QA action |
| ----- | ---- | ---------------- | --------- |
| 0 | cutscene | `chapter-06-q1-cutscene-bridge` | **Avanti** × **3 beats** (narrator → inner monologue → narrator / two pins) |

---

## Quest 2 — `chapter-06-quest-02-restaurant-literature`

**Display name:** Al ristorante  
**Unlock:** After quest 1  
**Flow:** `blockBack: false`

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-06-q2-cutscene-intro` | **Avanti** × **2 beats** (book + inner monologue) |
| 1 | task | Matching | `chapter-06-q2-matching-line-ref` | Open **Leggi il testo**; match statements to lines (shuffle on right) |
| 2 | task | Matching | `chapter-06-q2-matching-interview` | Open **Leggi le risposte**; match 8 questions to 8 answers |
| 3 | task | FreitextLlm | `chapter-06-q2-freitext-indirect` | Write 3–5 sentences (sample below); **Controlla** → evaluate → complete |
| 4 | cutscene | — | `chapter-06-q2-cutscene-outro` | **Avanti** × **1 beat** |

### Matching — line reference (p. 112)

| Affermazione | Riga |
|--------------|------|
| 1) I prof non ti lasciano mai in pace. | r. 24 |
| 2) Anche i prof possono essere curiosi. | r. 23 |
| 3) I prof non mangiano in modo strano. | r. 15-16 |
| 4) I prof devono sempre spiegare tutto a tutti. | r. 8-9 |
| 5) I prof amano anche aiutare gli altri. | r. 31-32 |

### Matching — interview (p. 114)

Pair question **n** with answer **n** (1↔1 … 8↔8). Right column is shuffled at runtime.

### FreitextLlm — discorso indiretto (sample)

Use as a model (LLM-graded; not exact string match):

> Abbiamo domandato a D'Avenia il titolo dell'ultimo libro che ha letto e lui ha risposto che ha appena finito di rileggere l'Odissea di Omero. Quando gli abbiamo chiesto perché ha scelto un tema così difficile per Bianca come il latte rossa come il sangue ha spiegato che vita e morte sono gli unici temi che non lo annoiano. Ha affermato che non si identifica con il personaggio del professore, ma che in ogni personaggio c'è sempre un po' dello scrittore. Ha aggiunto che vive sempre in modo eccitante l'inizio e la fine di ogni libro e che, quando non scrive, insegna.

---

## Quest 3 — `chapter-06-quest-03-sicily-lady`

**Display name:** La signora siciliana  
**Unlock:** After quest 1 (parallel with quest 2)  
**Flow:** `blockBack: false`

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-06-q3-cutscene-intro` | **Avanti** × **2 beats** (narrator + signora dialog) |
| 1 | task | SpecialScreen | `chapter-06-q3-photo-sicily` | Browse **7** Sicily photos; **Controlla** to continue (no score) |
| 2 | task | ClozeText | `chapter-06-q3-cloze-cleft` | Fill **8 gaps** (4 sentences); see table below |
| 3 | cutscene | — | `chapter-06-q3-cutscene-outro` | **Avanti** × **1 beat** |

### ClozeText — cleft sentences (accepted gap answers)

One accepted answer per gap is enough (case-insensitive).

| # | Gap (highlight) | Accepted (examples) |
|---|-----------------|---------------------|
| 1a | A Trapani è ___ che vorrei vedere | `la città barocca` |
| 1b | perché ___ | `questa città non l'ho vista ancora` |
| 2a | Non sono ___ che mi interessano | `le saline` |
| 2b | perché ___ | `le saline le ho visitate già tante volte` |
| 3a | A Piazza Armerina sono ___ che vorrei vedere | `i mosaici` |
| 3b | perché ___ | `i mosaici li trovo affascinanti` |
| 4a | A Palermo è ___ che vorrei visitare | `il Palazzo della Giustizia` |
| 4b | perché ___ | `questo posto l'ho visto tante volte nei documentari su Giovanni Falcone` |

---

## Quest 4 — `chapter-06-quest-04-piazza-quiz`

**Display name:** Quiz in piazza  
**Unlock:** After quests 2 **and** 3  
**Flow:** `blockBack: false` — story finale

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-06-q4-cutscene-intro` | **Avanti** × **2 beats** (piazza quiz + inner monologue) |
| 1 | task | MultipleChoice | `chapter-06-q4-quiz-italiana` | Answer all **16** MC items; **Controlla** |
| 2 | cutscene | — | `chapter-06-q4-cutscene-finale` | **Avanti** × **1 beat** (backpack / end of run narrative) |

### Multiple choice — answer key (p. 125)

| # | Correct option |
|---|----------------|
| 1 | c |
| 2 | c |
| 3 | b |
| 4 | c |
| 5 | c |
| 6 | b |
| 7 | c |
| 8 | b |
| 9 | c |
| 10 | b |
| 11 | c |
| 12 | b |
| 13 | b |
| 14 | a |
| 15 | a |
| 16 | a |

---

## SQL sanity (dev)

```sql
SELECT q.slug, q.is_active, count(s.id) AS steps
FROM game_quests q
JOIN game_chapters c ON c.id = q.chapter_id
LEFT JOIN game_quest_steps s ON s.quest_id = q.id AND s.is_active
WHERE c.slug = 'chapter-06'
GROUP BY q.slug, q.is_active
ORDER BY q.slug;
```

Expected: **4** active quests; step counts **1 + 5 + 4 + 3 = 13**.
