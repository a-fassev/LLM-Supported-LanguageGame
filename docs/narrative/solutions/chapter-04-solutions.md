# Chapter 4 — QA walkthrough & task answers

**Chapter slug:** `chapter-04` — *Capitolo 4: Sara e l'amicizia*

**Sources:** `20260630120000_chapter_04_act_content.sql`, `20260630140000_chapter_04_narrative_replace.sql`, `20260630120100_chapter_04_scored_pizza.sql`

**Narrative:** Akt 4.0–4.3 + bonus in [chapter-4.md](../chapter-4.md)

**Prerequisite:** Complete `chapter-03-quest-04-cioccoshow`.

**Map flow:** Linear — Camera tua → Sara → Mail → Comacchio → optional bonus vocab. Chapter 5 unlocks after `chapter-04-quest-04-comacchio` (bonus not required).

**Shell UI:**

| Context | Primary button | Notes |
| -------- | --------------- | ----- |
| Cutscene steps | **Avanti** | Beat pager |
| Task steps | **Controlla** | Scored pizza on most tasks |
| Reference docs | **Vedi l'invito** / **Articolo originale** | Comacchio invite, German article |
| Photo grid | **→** | Four Sicily photos before Freitext D |

**Rewards:** Tasks use `pizza.mode = scored` (max 2 slices). Bonus matching uses flat 3 slices.

---

## Quest 1 — `chapter-04-quest-01-morning-bridge`

**Display name:** Camera tua  
**Unlock:** After `chapter-03-quest-04-cioccoshow`  
**Flow:** `blockBack: true`, auto-start Sara quest

| order | kind | logical_task_key | QA action |
| ----- | ---- | ---------------- | --------- |
| 0 | cutscene | `chapter-04-q1-cutscene-bridge` | **Avanti** × 3 beats (morning room → Giardini pin) |

---

## Quest 2 — `chapter-04-quest-02-sara-giardini`

**Display name:** Sara ai Giardini Margherita  
**Unlock:** After quest 1

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-04-q2-cutscene-intro` | **Avanti** (Sara at park) |
| 1 | task | SpecialScreen | `chapter-04-q2-photo-sicily` | View 4 photos (no pizza) |
| 2 | task | FreitextLlm | `chapter-04-q2-freitext-foto-d` | Describe foto D (Palermo cathedral), ≥15 words |
| 3 | task | ClozeText | `chapter-04-q2-cloze-sara-marco` | 14 gaps — see table below |
| 4 | task | ErrorSpotting | `chapter-04-q2-error-spotting-congiuntivo` | Fix 4 verbs; sentence 3 is correct |
| 5 | cutscene | — | `chapter-04-q2-cutscene-outro` | **Avanti** |

### Cloze — Sara rivuole Marco? (gap order)

| # | Answer |
|---|--------|
| 1 | io conosca / che io conosca |
| 2 | tu mi aiuti / che tu mi aiuti |
| 3 | proprio |
| 4 | più |
| 5 | che tu non sappia |
| 6 | che io vada |
| 7 | al |
| 8 | che |
| 9 | di / per |
| 10 | Mi accompagni / mi accompagni |
| 11 | che tu guardi |
| 12 | di non pensare |
| 13 | a |
| 14 | che Marco e Laura vadano |
| 15 | cui |
| 16 | di avere |

### Error spotting — corrections

| # | Wrong | Correct |
|---|-------|---------|
| 1 | io dimentichi | dimenticare |
| 2 | di Marco mi chiami | che Marco mi chiami |
| 3 | — | (correct sentence — do not count as error) |
| 4 | vedere | veda / che io non veda |
| 5 | di tu sei | che tu sei |

### Freitext — foto D (sample)

> In questa foto si vede la cattedrale di Palermo con una carrozza davanti. Il sole illumina la facciata ed è un posto molto bello da visitare.

---

## Quest 3 — `chapter-04-quest-03-mail-consolation`

**Display name:** Una mail per consolare Sara  
**Unlock:** After quest 2

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-04-q3-cutscene-intro` | **Avanti** |
| 1 | task | FreitextLlm | `chapter-04-q3-freitext-mail-sara` | Open **Articolo originale**; write 60–180 word mail in Italian |
| 2 | cutscene | — | `chapter-04-q3-cutscene-outro` | **Avanti** |

### Freitext — mail (sample)

Use informal greeting, 3+ tips from the German article (listen, no platitudes, no revenge encouragement, no happy-relationship talk), adapted to Sara. Example opening: *Cara Sara,* … *Un abbraccio,*

---

## Quest 4 — `chapter-04-quest-04-comacchio`

**Display name:** L'invito a Comacchio  
**Unlock:** After quest 3  
**Flow:** Auto-starts bonus vocab after completion

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-04-q4-cutscene-intro` | **Avanti** (Sara voice message) |
| 1 | task | MultipleChoice | `chapter-04-q4-mc-invito` | Open **Vedi l'invito**; answer 4 MC |
| 2 | task | SpecialScreenSms | `chapter-04-q4-sms-mamma` | Complete 8 SMS lines to Mamma |
| 3 | cutscene | — | `chapter-04-q4-cutscene-outro` | **Avanti** → bonus offered |

### Multiple choice

| # | Answer |
|---|--------|
| 1 | b — mal d'amore |
| 2 | b — Cinque spiagge |
| 3 | a — risotto / spaghetti ai crostacei |
| 4 | b — Museo Remo Brindisi |

### SMS to Mamma (examples per line)

Accept paraphrases from the invite: invited to Comacchio, program/steps, *piccola Venezia*, five beaches, museum if bad weather, evening cinema/pizzeria/pigiama, four steps, no negative thoughts.

---

## Quest 5 — `chapter-04-quest-05-bonus-vocab` (optional)

**Display name:** Bonus: Parole della lezione 4  
**Unlock:** After quest 4  
**Chapter 5:** Not required for `chapter-05` unlock

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-04-q5-cutscene-bonus-intro` | **Avanti** |
| 1 | task | Matching | `chapter-04-q5-matching-vocab` | Match 10 random IT↔EN pairs from pool |

---

## Retired (wrong) slugs

These are deactivated in migration; should not appear in chapter overview:

- `chapter-04-quest-02-restaurant-literature`
- `chapter-04-quest-03-sicily-lady`
- `chapter-04-quest-04-piazza-quiz`
