# Chapter 3 — QA walkthrough & task answers

**Chapter slug:** `chapter-03` — *Capitolo 3: Storia e cioccolato*

**Sources:** `20260627180000_chapter_03_act_content.sql`, `20260627180200_chapter_03_dragdrop_match_mode.sql`, `20260528090421_chapter_03_step_reference_documents_sync.sql`

**Note:** `docs/narrative/chapter-3.md` currently duplicates Chapter 2 narrative. Shipped quest/step content below comes from the migrations.

**Prerequisite:** Complete `chapter-02-quest-04-restaurant` (Trattoria da Marini).

**Shell UI (English hints):**

| Context | Primary button | Notes |
| -------- | --------------- | ----- |
| Cutscene steps | **Avanti** | Beat pager; last beat advances the step on the server |
| Task steps | **Controlla** | Check/submit answers |
| Museum quest | Reference doc button **Vedi il volantino** | Quest-level `meta_payload.referenceDocument`; reading optional for QA |
| Cioccoshow quiz | **Leggi il racconto** | Step-level reference doc on MC task |
| Cioccoshow drag-drop | **Vedi la rivista** | Step-level reference doc on DragDrop task |

**Rewards (all tasks):** `pizza.mode = flat` — 2 slices per task (3 on bonus). `backpack.mode = first_completion`, value 1.

---

## Quest 1 — `chapter-03-quest-01-morning-bridge`

**Display name:** Akt 3.0: Camera tua  
**Unlock:** After `chapter-02-quest-04-restaurant`  
**Flow:** `blockBack: true` → **auto-starts** `chapter-03-quest-02-museum` on finish

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-03-q1-cutscene-morning-bridge` | Tap **Avanti** through **3 beats** (narrator → inner monologue → narrator / map pin) |

---

## Quest 2 — `chapter-03-quest-02-museum`

**Display name:** Akt 3.1: Museo della Storia di Bologna  
**Unlock:** After quest 1  
**Flow:** `blockBack: false` → **auto-starts** `chapter-03-quest-03-valentina` on finish  
**Reference doc (quest chrome):** *Bologna — duemila anni di storia* (`volantino-bologna-storia`) — button **Vedi il volantino**. Skip reading; answers are in the table below.

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-03-q2-cutscene-museum-intro` | **Avanti** × **4 beats** |
| 1 | task | MultipleChoice | `chapter-03-q2-quiz-bologna-storia` | Answer all 6 MC questions → **Controlla** |
| 2 | cutscene | — | `chapter-03-q2-cutscene-museum-bridge` | **Avanti** × **2 beats** |

### Step 1 — Multiple choice (*Quiz: Bologna, duemila anni di storia*)

Select one option per question, then **Controlla**.

| # | Question (short) | Select option ID | Answer text |
| - | ---------------- | ---------------- | ----------- |
| 1 | Who founded the city? | **b** | Gli Etruschi, nel VI secolo a.C. |
| 2 | Etruscan name for Bologna? | **b** | Felsina |
| 3 | University founded when? | **b** | Nel 1088 |
| 4 | Nickname for the university? | **c** | La Dotta |
| 5 | Height of Torre degli Asinelli? | **b** | 97,2 metri |
| 6 | Portici UNESCO since? | **c** | Dal 2021 |

---

## Quest 3 — `chapter-03-quest-03-valentina`

**Display name:** Akt 3.2: La guida Valentina  
**Unlock:** After quest 2  
**Flow:** `blockBack: false` → **auto-starts** `chapter-03-quest-04-cioccoshow` on finish

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-03-q3-cutscene-valentina-intro` | **Avanti** × **6 beats** (NPC Valentina) |
| 1 | task | ClozeText | `chapter-03-q3-cloze-congiuntivo` | Fill 9 gaps → **Controlla** |
| 2 | cutscene | — | `chapter-03-q3-cutscene-suffixes` | **Avanti** × **4 beats** |
| 3 | task | Matching | `chapter-03-q3-matching-suffixes` | Match 8 pairs → **Controlla** |
| 4 | task | ClozeText | `chapter-03-q3-cloze-suffixes` | Fill 6 gaps → **Controlla** |
| 5 | cutscene | — | `chapter-03-q3-cutscene-outro` | **Avanti** × **3 beats** |

### Step 1 — Cloze (*congiuntivo presente o passato*)

Enter exactly (case-insensitive):

| Gap | Answer |
| --- | ------ |
| 1 | `sia venuta` |
| 2 | `abbia preso` |
| 3 | `abbia` |
| 4 | `venga` |
| 5 | `riesca` |
| 6 | `ti sia divertito` |
| 7 | `abbia ballato` |
| 8 | `manchi` |
| 9 | `voglia` |

### Step 3 — Matching (*accrescitivi e diminutivi*)

Connect left → right:

| Base word | Derived form |
| --------- | ------------ |
| pizza | pizzetta (piccola) |
| cioccolato | cioccolatino (piccolo) |
| palazzo | palazzone (grande) |
| goloso | golosone (molto goloso) |
| libro | librone (grande) |
| casa | casetta (piccola e carina) |
| ragazzo | ragazzaccio (birichino) |
| tavolo | tavolino (piccolo) |

### Step 4 — Cloze (*-ino, -etto, -ello, -one*)

| # | Answer |
| - | ------ |
| 1 | `tavolone` |
| 2 | `pezzetto` |
| 3 | `golosoni` |
| 4 | `casette` |
| 5 | `palazzone` |
| 6 | `libretto` **or** `librone` (both accepted) |

---

## Quest 4 — `chapter-03-quest-04-cioccoshow`

**Display name:** Akt 3.3: Cioccoshow in piazza Maggiore  
**Unlock:** After quest 3  
**Flow:** `blockBack: false` — **no** auto-start next quest

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-03-q4-cutscene-piazza-intro` | **Avanti** × **2 beats** |
| 1 | cutscene | — | `chapter-03-q4-cutscene-lorenzo-intro` | **Avanti** × **5 beats** (NPC Lorenzo) |
| 2 | task | MultipleChoice | `chapter-03-q4-quiz-torino` | Optional **Leggi il racconto** → answer 4 MC → **Controlla** |
| 3 | task | ClozeText | `chapter-03-q4-cloze-si-impersonale` | Fill all gaps → **Controlla** |
| 4 | task | DragDrop | `chapter-03-q4-dragdrop-made-in-italy` | Optional **Vedi la rivista** → drag all items to cities → **Controlla** |
| 5 | cutscene | — | `chapter-03-q4-cutscene-outro` | **Avanti** × **3 beats** |

### Step 2 — Multiple choice (*La storia di Lorenzo: Torino*)

| # | Select option ID | Answer text |
| - | ---------------- | ----------- |
| 1 | **a** | cacao, zucchero e nocciole piemontesi |
| 2 | **b** | ad Alba nel 1964 |
| 3 | **b** | la Juventus o «Juve», soprannominata «Vecchia Signora» |
| 4 | **c** | si può visitare il Museo Nazionale del Cinema |

### Step 3 — Cloze (*forma impersonale: si + 3ª persona*)

Fill gaps left to right (case-insensitive):

| Gap | Answer |
| --- | ------ |
| 1 | `si compra` |
| 2 | `buona` |
| 3 | `ci si informa` |
| 4 | `si possono avere` |
| 5 | `si vuole conoscere` |
| 6 | `si fa` |
| 7 | `buona` |
| 8 | `si chiama` |
| 9 | `si possono trovare` |
| 10 | `buone` |
| 11 | `si compra` |
| 12 | `non si perdono` |
| 13 | `si mangia` |
| 14 | `buoni` |
| 15 | `si comprano` |
| 16 | `si seguono` |
| 17 | `buoni` |
| 18 | `ci si gode` |

### Step 4 — Drag & drop (*Made in Italy*)

`matchMode: "all"` — each city bucket must receive **all** listed items. Drag every product from the bank; bank must be empty before **Controlla**.

| Target | Items to drop |
| ------ | ------------- |
| **Torino** | il gianduiotto · la FIAT 500 · il Pinguino |
| **Bologna** | i tortellini · il ragù alla bolognese · la mortadella |
| **Alba** | la Nutella |
| **Napoli** | la pizza Margherita |
| **Parma** | il parmigiano reggiano · il prosciutto di Parma |
| **Non italiano** | gli spaghetti bolognese · la Caesar Salad · la pizza hawaiana |

---

## Quest 5 — `chapter-03-quest-05-bonus-vocab`

**Display name:** Bonus: Parole della lezione 3  
**Unlock:** After quest 4  
**Flow:** `blockBack: false` — chapter end

| order | kind | task_type | logical_task_key | QA action |
| ----- | ---- | --------- | ---------------- | --------- |
| 0 | cutscene | — | `chapter-03-q5-cutscene-bonus-intro` | **Avanti** × **2 beats** |
| 1 | task | Matching | `chapter-03-q5-matching-vocab` | Match 10 IT→EN pairs → **Controlla** (flat **3** pizza slices) |

### Step 1 — Bonus vocabulary matching (fixed set)

| Italiano | English |
| -------- | ------- |
| il nord | the North |
| il sud | the South |
| delizioso, -a | delicious |
| golosone | greedy (augmentative) |
| la tradizione | tradition |
| il patrono | patron saint |
| celebrare | to celebrate |
| ammirare | to admire |
| storico, -a | historic / historical |
| matto, -a (per) | crazy (about) |

---

## Quick path summary (tester cheat sheet)

1. **Morning bridge** — 3× Avanti → auto museum  
2. **Museum** — 4× Avanti → MC `b,b,b,c,b,c` → 2× Avanti → auto Valentina  
3. **Valentina** — 6× Avanti → cloze congiuntivo (9 answers) → 4× Avanti → matching (8 pairs) → cloze suffixes (6 answers) → 3× Avanti → auto Cioccoshow  
4. **Cioccoshow** — 2× Avanti → 5× Avanti → MC `a,b,b,c` → cloze si (18 gaps) → drag-drop (13 items to 6 buckets) → 3× Avanti  
5. **Bonus** — 2× Avanti → matching (10 pairs)

**Total cutscene beats:** 34  
**Total scored tasks:** 7 (all flat pizza; no LLM/Freitext steps in this chapter)
