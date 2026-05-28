# Chapter 1 — QA solutions walkthrough

**Audience:** Testers who do not speak Italian.  
**Source:** `20260527160000_chapter_01_act1_content.sql`, `20260527170000_chapter_01_review_fixes.sql`, `20260628110000_chapter_01_bonus_vocab.sql`  
**Chapter:** `chapter-01` — *Capitolo 1: Bologna*

## Global tester notes


| Topic                  | Detail                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Quest order**        | Q1 → Q2 → Q3 (auto-chained). Q4 bonus unlocks after Q3; pick from chapter map.             |
| **Cutscene CTA**       | Footer **Avanti** (tap through beats). Top **Pausa** = pause menu.                         |
| **Task CTA**           | **Controlla** to submit. Reward overlay **Avanti** to continue.                            |
| **Pizza**              | All tasks: **flat 2 slices** (+ 1 backpack on first completion). No scored tasks in Ch. 1. |
| **Back**               | Q1 & Q2: `blockBack: true`. Q3 & Q4: back allowed.                                         |
| **Reference doc (Q3)** | **Leggi la brochure** — optional; answers below are enough.                                |


---

## Quest 1 — `chapter-01-quest-01-opening-school`

**Auto-start next:** `chapter-01-quest-02-sms-bridge`


| Step | Kind          | Action                                      |
| ---- | ------------- | ------------------------------------------- |
| 0    | Cutscene      | **Avanti** × **6** beats                    |
| 1    | Cutscene      | **Avanti** × **4** beats                    |
| 2    | ClozeText     | Fill gaps → **Controlla** (table below)     |
| 3    | Cutscene      | **Avanti** × **2** beats                    |
| 4    | ErrorSpotting | Mark 5 errors + corrections → **Controlla** |
| 5    | Cutscene      | **Avanti** × **2** beats → auto Q2          |


### Step 2 — Cloze (`chapter-01-q1-cloze-vacation`)

Case-insensitive. Feminine alternates shown where accepted.


| #   | Answer            | Also accepted                    |
| --- | ----------------- | -------------------------------- |
| 1   | `sono andato`     | `sono andata`                    |
| 2   | `sono andato`     | `era`                            |
| 3   | `vedevamo`        | `abbiamo visto`                  |
| 4   | `è piaciuto`      | —                                |
| 5   | `facevo`          | —                                |
| 6   | `andavamo`        | —                                |
| 7   | `era`             | `Era`                            |
| 8   | `è piovuto`       | —                                |
| 9   | `abbiamo dovuto`  | —                                |
| 10  | `ho conosciuto`   | —                                |
| 11  | `abbiamo parlato` | —                                |
| 12  | `era`             | `Era`                            |
| 13  | `sono tornato`    | `sono tornata`                   |
| 14  | `mi sentivo`      | —                                |
| 15  | `partivo`         | `sarei partito`, `sarei partita` |


### Step 4 — Error spotting (`chapter-01-q1-error-spotting-customs`)

Exactly **5** errors. Click phrase → type correction:


| Click text                                                    | Type correction                                     |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `siediti sempre a un tavolino`                                | `bisogna stare in piedi al banco per risparmiare`   |
| `gli italiani bevono il cappuccino a tutte le ore del giorno` | `gli italiani bevono il cappuccino solo la mattina` |
| `scegli tu stesso il tavolo`                                  | `si aspetta che il personale assegni il tavolo`     |
| `un solo piatto, di solito pizza o pasta`                     | `più portate in un pasto completo`                  |
| `il conto separato è la regola in Italia`                     | `si paga insieme` or `si paga in comune`            |


---

## Quest 2 — `chapter-01-quest-02-sms-bridge`

**Auto-start next:** `chapter-01-quest-03-bar`


| Step | Kind             | Action                              |
| ---- | ---------------- | ----------------------------------- |
| 0    | Cutscene         | **Avanti** × **2**                  |
| 1    | SpecialScreenSms | Cloze in SMS bubble → **Controlla** |
| 2    | Cutscene         | **Avanti** × **2** → auto Q3        |


### Step 1 — SMS cloze (`chapter-01-q2-sms-cloze`)


| #   | Answer              | Also accepted       |
| --- | ------------------- | ------------------- |
| 1   | `ti`                | `Ti`                |
| 2   | `ci ha dato`        | `Ci ha dato`        |
| 3   | `gli abbiamo detto` | `Gli abbiamo detto` |
| 4   | `gli`               | `Gli`               |
| 5   | `mi hanno detto`    | `Mi hanno detto`    |
| 6   | `gli hai mandato`   | `Gli hai mandato`   |
| 7   | `le ho promesso`    | `Le ho promesso`    |
| 8   | `le`                | `Le`                |
| 9   | `ti`                | `Ti`                |
| 10  | `ci`                | `Ci`                |


---

## Quest 3 — `chapter-01-quest-03-bar`

**No auto-start** — returns to map. Bonus Q4 unlocks after finish.


| Step | Kind     | Action                        |
| ---- | -------- | ----------------------------- |
| 0    | Cutscene | **Avanti** × **5**            |
| 1    | DragDrop | Word families → **Controlla** |
| 2    | Cutscene | **Avanti** × **1**            |
| 3    | Matching | EN ↔ IT → **Controlla**       |
| 4    | Cutscene | **Avanti** × **1**            |
| 5    | DragDrop | Numbers → **Controlla**       |
| 6    | Cutscene | **Avanti** × **4**            |


### Step 1 — Drag-drop word families


| Drag            | Drop target          |
| --------------- | -------------------- |
| `la visita`     | `(v.) visitare`      |
| `aperte`        | `(v.) aprire`        |
| `la profondità` | `(agg.) profondo`    |
| `la larghezza`  | `(agg.) largo`       |
| `l'umidità`     | `(agg.) umido`       |
| `la durata`     | `(sost.) durata`     |
| `parziale`      | `(sost.) parzialità` |
| `la lunghezza`  | `(agg.) lungo`       |


### Step 3 — Matching EN → IT


| English     | Italian         |
| ----------- | --------------- |
| `cave`      | `la grotta`     |
| `route`     | `il percorso`   |
| `itinerary` | `l'itinerario`  |
| `exterior`  | `l'esterno`     |
| `column`    | `la colonna`    |
| `explorer`  | `l'esploratore` |


### Step 5 — Drag-drop numbers


| Drag                   | Drop target                                     |
| ---------------------- | ----------------------------------------------- |
| `1 chilometro`         | `è lungo l'itinerario parziale`                 |
| `3 chilometri`         | `è lungo l'itinerario completo`                 |
| `50 minuti`            | `dura la visita se fai il primo itinerario`     |
| `2 ore`                | `dura la visita se fai il secondo itinerario`   |
| `18 gradi`             | `è la temperatura nella grotta`                 |
| `90 per cento`         | `è l'umidità nella grotta`                      |
| `100 metri`            | `è lunga la più grande caverna della grotta`    |
| `50 metri (larghezza)` | `è larga la più grande caverna della grotta`    |
| `60 metri`             | `è profonda la più grande caverna della grotta` |


---

## Quest 4 (bonus) — `chapter-01-quest-04-bonus-vocab`

**Prerequisite:** Complete Q3


| Step | Kind     | Action                                          |
| ---- | -------- | ----------------------------------------------- |
| 0    | Cutscene | **Avanti** × **3**                              |
| 1    | Matching | Match **10** random IT→EN pairs → **Controlla** |


**Note:** `sampleSize: 10` from pool of **56** — match by label text each run (subset changes).

Full pair pool (one random subset per run)

**Vacation:** `l'agriturismo`↔farm holiday; `la gita culturale`↔cultural trip; `gli scavi`↔excavations; `il parco nazionale`↔national park; `la natura`↔nature; `la campagna`↔countryside; `in campagna`↔in the countryside; `il campeggio`↔camping; `la tenda`↔tent; `il monte`↔mountain; `la cima; in cima`↔summit/at the top; `la montagna`↔mountain; `il mare`↔sea; `la spiaggia`↔beach; `in campeggio`↔at the campsite; `in piscina`↔at the pool; `in spiaggia`↔at the beach; `il fiume`↔river; `il lago`↔lake; `l'ostello (della gioventù)`↔youth hostel; `la cartina`↔map; `andare ... in bici/barca/macchina/treno`↔go by bike/boat/car/train; `andare a cavallo`↔horseback riding.

**Activities:** `l'esperienza`↔experience; `la visita; la visita guidata`↔visit/guided tour; `visitare (gli scavi)`↔visit excavations; `godere / godersi (la natura)`↔enjoy nature; `(fare) il kite surf`↔kitesurfing; `(fare) il trekking`↔trekking; `la canoa`↔canoe; `la barca`↔boat; `andare (sul fiume) in canoa/barca`↔canoeing/boating.

**Adverbs:** `di nuovo`↔again; `di segreto`↔secretly; `di preciso`↔exactly.

**Communication:** `comunicare`↔communicate; `la telefonata`↔phone call; `la piattaforma (ufficiale)`↔official platform; `internet`↔internet; `l'accesso (a internet)`↔internet access; `allegare`↔attach; `aggiungere`↔add; `inviare`↔send; `il saluto`↔greeting; `i miei migliori saluti`↔best regards; `la formula (di saluto iniziale/finale)`↔greeting formula.

**Traits:** `giovane`↔young; `anziano, -a`↔elderly; `buono, -a`↔good/kind; `cattivo, -a`↔bad; `meraviglioso, -a`↔wonderful; `fantastico, -a`↔fantastic; `simpatico, -a`↔likeable; `dolce`↔sweet; `fortunato, -a`↔lucky; `straniero, -a`↔foreign.



---

## Quick reference


| Quest             | Cutscene taps (total) | Graded tasks          |
| ----------------- | --------------------- | --------------------- |
| Q1 opening-school | 14                    | Cloze, ErrorSpotting  |
| Q2 sms-bridge     | 4                     | SpecialScreenSms      |
| Q3 bar            | 11                    | DragDrop ×2, Matching |
| Q4 bonus          | 3                     | Matching (10 random)  |


**Controlla submissions (first full clear):** 7 main + 1 bonus = **8** tasks × 2 pizza = **16 slices** (plus backpack on first completion per task).