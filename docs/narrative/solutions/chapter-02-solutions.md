# Chapter 2 — Test solutions (Capitolo 2: Giornata libera)

Step-by-step answer key for QA and playtesting. Correct task answers are taken from `content_payload` JSON in:

- `supabase/migrations/20260627150000_chapter_02_act_content.sql`
- `supabase/migrations/20260627150100_chapter_02_review_fixes.sql` (drag-drop slot 3 + identikit payload; same answers as canonical migration)

**How to use this doc:** Cutscene steps have no graded input — tap **Avanti** / **Weiter** through beats. Task steps list the expected input. Cloze gaps accept any listed variant (case-insensitive unless noted). Drag-drop slots accept any item listed for that slot. Freitext steps are LLM-graded; use the sample sentences below.

**Quest order on the map:** After the morning bridge (2.0), quests 2.1–2.3 are parallel — any order works. Bonus vocab (2.5) unlocks after all three are done.

---

## Quest 1 — Akt 2.0: La mattina a casa

`chapter-02-quest-01-morning-bridge`

| Step | Kind | Action |
|------|------|--------|
| 0 | Cutscene | Read narrator / inner-monologue beats; continue until the map opens with three new pins (Nutelleria, home, restaurant). No task input. |

---

## Quest 2 — Akt 2.1: Nutelleria con Dario

`chapter-02-quest-02-nutelleria`

| Step | Kind | Task type | Action |
|------|------|-----------|--------|
| 0 | Cutscene | — | Meet Dario at the Nutelleria; continue through dialog. |
| 1 | Task | ClozeText | Fill all gaps below (one accepted answer per gap is enough). |
| 2 | Cutscene | — | Dario introduces the professions exercise; continue. |
| 3 | Task | FreitextLlm | Write Italian descriptions (see sample answers). |
| 4 | Cutscene | — | Dario leaves; return to map. |

### Step 1 — Cloze: future tense, possessives, adverbs (`chapter-02-q2-cloze-archeologo`)

Prompt: *Parla con Dario del suo sogno…*

Fill gaps **in order** (first accepted answer shown; alternates in parentheses):

| # | Gap context (short) | Answer |
|---|---------------------|--------|
| 1 | Dario: *___!* (adverb: how it went) | **Benissimo** |
| 2 | *…ho deciso che ___ l'archeologo* | **farò** |
| 3 | *Ma non ___ bisogno di voti più alti* | **avrai** |
| 4 | *Sono questi che ti ___.* | **mancano** |
| 5 | *Da domani ___ tutti i giorni.* | **studierò** |
| 6 | *Così gli insegnanti mi ___* | **daranno** |
| 7 | *…mi ___ voti.* (adjective) | **buoni** (not *bene*) |
| 8 | *___ genitori ___ contentissimi.* | **I miei** |
| 9 | *(genitori) ___ contentissimi.* | **saranno** |
| 10 | *Che dici: ___ mamma mi ___* | **la** |
| 11 | *…mamma mi ___ il libro* | **comprerà** |
| 12 | *___ un ___ voto naturalmente!* | **Prenderò** |
| 13 | *…un ___ voto* (adjective) | **buon** (not *buono*) |
| 14 | *___ anche di chiacchierare* | **Smetterò** |
| 15 | *…anche se ___* (verb) | **sarà** |
| 16 | *…anche se sarà ___.* (adjective) | **difficile** |
| 17 | *Così alla fine ___ un'ottima maturità.* | **farai** |
| 18 | *Non ___ mica* | **sarà** |
| 19 | *Non sarà mica ___.* | **facile** |
| 20 | *Ma che cosa ___ voi di questa* | **penserete** |
| 21 | *…di questa ___ idea?* | **mia** |
| 22 | *Boh, la ___.* | **accetteranno** |
| 23 | *Sai già cosa ___ dopo* | **farai** |
| 24 | *…dopo ___ maturità?* | **la** |
| 25 | *…una mezza idea su ___ futuro.* | **il mio** |
| 26 | *___ mangiare qualcosa insieme* | **Potremmo** |

**Compact sequence (copy-paste friendly):**  
Benissimo → farò → avrai → mancano → studierò → daranno → buoni → I miei → saranno → la → comprerà → Prenderò → buon → Smetterò → sarà → difficile → farai → sarà → facile → penserete → mia → accetteranno → farai → la → il mio → Potremmo

### Step 3 — Freitext: professions with relative pronouns (`chapter-02-q2-freitext-professions`)

**Requirements (from payload):** Italian; ≥ 20 words, ≤ 200; describe **architect**, **journalist**, **doctor**, **gardener**; use **che**, **cui**, or **dove** at least once per profession; pass threshold 0.68.

**Sample passing text (adapt pronouns/gender as needed):**

> L'architetto è una persona che progetta case e edifici.  
> Il giornalista è una persona di cui leggiamo gli articoli sul giornale.  
> Il medico lavora in un ospedale dove cura le persone malate.  
> Il giardiniere è una persona che pianta fiori e alberi nel giardino.

---

## Quest 3 — Akt 2.2: Progetto scolastico a casa

`chapter-02-quest-03-school-project`

| Step | Kind | Task type | Action |
|------|------|-----------|--------|
| 0 | Cutscene | — | Open school portal at home; continue. |
| 1 | Task | SpecialScreen | Read three profiles (photo grid); complete **one** identikit cloze (all three keys below). |
| 2 | Cutscene | — | Bridge to quiz; continue. |
| 3 | Task | MultipleChoice | Six questions — grammar option, then famous person (12 selections total). |
| 4 | Cutscene | — | Homework saved; map points to restaurant. |

### Step 1 — Identikit cloze (`chapter-02-q3-profiles-identikit`)

Read profiles via the photo cards, then fill **one** of the three optional identikit blocks. Each block has six gaps.

#### Roberto Saviano

| Field | Accepted answers (any one) |
|-------|---------------------------|
| nome | Roberto Saviano |
| età (oppure data di nascita) | nato il 22 settembre 1979 · 22 settembre 1979 |
| regione d'origine | Campania |
| professione | scrittore e giornalista · scrittore · giornalista |
| È famoso/a perché … | ha scritto il libro Gomorra · ha scritto il libro "Gomorra" · ha scritto Gomorra · ha scritto Gomorra sulla Camorra |
| particolarità | vive con la scorta della polizia · vive con la scorta |

#### Alessandro Del Piero

| Field | Accepted answers (any one) |
|-------|---------------------------|
| nome | Alessandro Del Piero |
| età (oppure data di nascita) | nato il 9 novembre 1974 · 9 novembre 1974 |
| regione d'origine | Veneto |
| professione | calciatore · commentatore TV · calciatore e commentatore TV |
| È famoso/a perché … | ha giocato diciannove anni nella Juventus · ha vinto la Coppa del Mondo nel 2006 · ha giocato nella Juventus per diciannove anni |
| particolarità | ha una fondazione per giovani calciatori · fondazione per giovani calciatori |

#### Chiara Ferragni

| Field | Accepted answers (any one) |
|-------|---------------------------|
| nome | Chiara Ferragni |
| età (oppure data di nascita) | nata il 7 maggio 1987 · 7 maggio 1987 |
| regione d'origine | Lombardia |
| professione | influencer · imprenditrice di moda · influencer e imprenditrice di moda |
| È famoso/a perché … | ha aperto il blog The Blonde Salad · è una delle influencer più conosciute al mondo · The Blonde Salad |
| particolarità | ha la sua linea di moda Chiara Ferragni Collection · Chiara Ferragni Collection |

### Step 3 — Quiz: relative pronouns + famous Italians (`chapter-02-q3-quiz-famous-italians`)

For each numbered item, pick the **grammar** option first, then the **person**.

| # | Grammar (choose) | Person (choose) |
|---|------------------|-----------------|
| 1 | **che / ha fondato** (option a) | **Maria Montessori** |
| 2 | **sono arrivate / di cui** (option a) | **Cristoforo Colombo** |
| 3 | **che / ha fatto** (option a) | **Giuseppe Verdi** |
| 4 | **di cui / che** (option a) | **Leonardo da Vinci** |
| 5 | **che / ha creato** (option a) | **Michelangelo Buonarroti** |
| 6 | **che / ha scritto / di cui** (option a) | **Elena Ferrante** |

**Completed sentences (for reference):**

1. Chi è la donna molto famosa **che** ha **fondato** la casa dei bambini nel 1907? → Maria Montessori  
2. Dove **sono arrivate** le tre caravelle di questo uomo **di cui** parliamo ancora oggi? → Cristoforo Colombo  
3. Chi è il musicista **che** nel 1800 ha **fatto** il politico? → Giuseppe Verdi  
4. Chi è l'artista **di cui** conosciamo un dipinto molto famoso **che** si chiama "La Gioconda"? → Leonardo da Vinci  
5. Come si chiama lo scultore **che** ha **creato** il David di Firenze? → Michelangelo Buonarroti  
6. Come si chiama la scrittrice… **che** ha **scritto** quattro romanzi su Napoli e **di cui** non si sa molto? → Elena Ferrante  

---

## Quest 4 — Akt 2.3: Trattoria da Marini

`chapter-02-quest-04-restaurant`

| Step | Kind | Task type | Action |
|------|------|-----------|--------|
| 0 | Cutscene | — | Enter Trattoria da Marini; ask about summer job; continue. |
| 1 | Task | DragDrop | Drag formulas into seven letter slots (see table). |
| 2 | Cutscene | — | Marini reads email; menu challenge; continue. |
| 3 | Task | FreitextLlm | Describe menu courses with relative pronouns (see samples). |
| 4 | Cutscene | — | Job offer; chapter beat ends. |

### Step 1 — Motivation letter drag-drop (`chapter-02-q4-dragdrop-motivation-letter`)

Drag from the **Formule** bank into each slot. Empty the bank when done. Multiple items are valid where noted.

| Slot | Letter context | Drag this item (any listed) |
|------|----------------|------------------------------|
| (1) Anrede | Opening salutation | **Gentili Signore e Signori,** · Gentile Signora Cassari, · Gentile Signor De Valli, · Egregio Direttore, · Stimata Dottoressa, |
| (2) | *… presentare la mia candidatura per un lavoretto …* | **con la presente desidero candidarmi …** · vorrei chiedere/presentare … |
| (3) | *… ho sedici anni e frequento …* | **all'inizio / per primo** |
| (4) | *… ho già lavorato come babysitter …* | **inoltre / in più / …** |
| (5) | *… sono una persona molto motivata …* | **poi / più tardi …** |
| (6) | *… non esiti a contattarmi.* | **Se desidera/Se desiderate ulteriori informazioni, non esiti/non esitate a contattarmi.** |
| (7) Schlussformel | Closing | **In attesa di una Vostra gentile risposta, invio i miei più cordiali saluti** · Gradirei molto ricevere presto Vostre notizie. · RingraziandoVi anticipatamente, porgo i miei più distinti saluti. |

**Reference solution (one valid full set):**

1. Gentili Signore e Signori,  
2. con la presente desidero candidarmi …  
3. all'inizio / per primo  
4. inoltre / in più / …  
5. poi / più tardi …  
6. Se desidera/Se desiderate ulteriori informazioni, non esiti/non esitate a contattarmi.  
7. RingraziandoVi anticipatamente, porgo i miei più distinti saluti.

### Step 3 — Freitext: Italian menu structure (`chapter-02-q4-freitext-menu`)

**Requirements (from payload):** Italian; ≥ 25 words, ≤ 250; describe **antipasti**, **primi**, **secondi (with contorni)**, **pizze**, **dolci**; use **che**, **cui**, or **dove** at least once per category; pass threshold 0.68.

**Sample passing text:**

> Gli antipasti sono piccoli piatti che si mangiano all'inizio del pasto.  
> I primi piatti sono piatti di pasta o riso che si mangiano dopo gli antipasti, come le tagliatelle al ragù.  
> I secondi piatti sono piatti di carne o pesce che si mangiano dopo i primi, con cui si servono spesso dei contorni di verdura.  
> Le pizze sono un piatto tipico italiano che si mangia di solito la sera in pizzeria.  
> I dolci sono piatti che si mangiano alla fine del pasto, come la torta della nonna.

---

## Quest 5 — Bonus: Parole della lezione 2

`chapter-02-quest-05-bonus-vocab`

| Step | Kind | Task type | Action |
|------|------|-----------|--------|
| 0 | Cutscene | — | Chapter recap; bonus prompt; continue. |
| 1 | Task | Matching | Match each Italian word to its English equivalent (10 pairs). |

### Step 1 — Vocabulary matching (`chapter-02-q5-matching-vocab`)

Connect left (Italian) → right (English):

| Italian | English |
|---------|---------|
| la professione | profession / occupation |
| l'archeologo | archaeologist |
| il medico | doctor / physician |
| il/la giornalista | journalist |
| l'architetto | architect |
| fare la scorta a | to provide bodyguard protection for |
| il liceo linguistico | linguistic high school |
| la mano | hand |
| disponibile | available |
| il frigorifero | refrigerator |

*(Right column order is shuffled in-game.)*

---

## Quick reference — graded steps only

| Quest | Step | Task key | Type | Pizza (flat) |
|-------|------|----------|------|--------------|
| 2.1 Nutelleria | 1 | `chapter-02-q2-cloze-archeologo` | ClozeText | 2 |
| 2.1 Nutelleria | 3 | `chapter-02-q2-freitext-professions` | FreitextLlm | 2 |
| 2.2 School | 1 | `chapter-02-q3-profiles-identikit` | SpecialScreen | 2 |
| 2.2 School | 3 | `chapter-02-q3-quiz-famous-italians` | MultipleChoice | 2 |
| 2.3 Restaurant | 1 | `chapter-02-q4-dragdrop-motivation-letter` | DragDrop | 2 |
| 2.3 Restaurant | 3 | `chapter-02-q4-freitext-menu` | FreitextLlm | 2 |
| Bonus | 1 | `chapter-02-q5-matching-vocab` | Matching | 3 |
