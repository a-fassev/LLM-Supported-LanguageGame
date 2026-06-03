### ATTO 6.0 — Passaggio dopo l’atto 5

#### **Hard Facts**

·       **Luogo:** Casa Ferrari, camera del/della protagonista (mattina)

·       **NPC:** nessuno

·       **Compiti:** nessuno

·       **Atto successivo:** mappa con 6.1 e 6.2 aperti, 6.3 bloccato

#### **Note per il team tecnico**

·       Breve sequenza narrativa; 6.1 e 6.2 in ordine libero.

·       Sblocco 6.3 automatico quando entrambi i nodi sono completati.

#### **Scena**

**[Narratore]** È arrivata la conferma della professoressa. Inizia l’ultima parte del tuo percorso a Bologna.

**[Monologo interiore]** Oggi ho due tappe: il turno al ristorante e un incontro al parco.

**[Narratore]** Sulla mappa si accendono due pin nello stesso momento.

  


 

### ATTO 6.1 — Al ristorante: blocco letteratura (3 compiti)

#### **Hard Facts**

·       **Luogo:** Ristorante in centro

·       **NPC:** Signor Marini (breve), collega sullo sfondo

·       **Compiti:** 3

·       **Obiettivi:** comprensione letteraria, abbinamento domanda-risposta, discorso indiretto

·       **Ricompensa:** 1 punto arredo

·       **Atto successivo:** ritorno mappa, 6.3 ancora bloccato finché manca il 6.2

#### **Note per il team tecnico**

·       Compito 1: senza LLM (comprensione con righe).

·       Compito 2: senza LLM (matching).

·       Compito 3: senza LLM (lückentext/drag & drop con blocchi per il discorso indiretto).

#### **Scena**

**[Narratore]** Tra due ordinazioni noti un libro aperto: "Bianca come il latte, rossa come il sangue".

**[Monologo interiore]** Leggo solo un momento... ma il testo mi cattura subito.

#### **Compito 1 — comprendere 1 (p. 112): Prof per sempre!**

Materiale implementazione:

Testo A1 (S. 112/113) – materiale completo per il compito (righe rilevanti numerate):

1 È il Sognatore. Merda. Ci mancava solo  
2 questa [...].  
3 "Salve, prof, cosa ho fatto?" [...].  
4 Sorride.  
5 "Ho deciso di passare a trovarti, magari ti  
6 andava di finire il discorso dell'altro giorno."  
7 Ecco, lo sapevo. I prof sono prof fino alla  
8 morte, devono farti le lezioni anche sotto  
9 casa tua.  
10 "Prof, lasciamo perdere il discorso dell'altra  
11 volta..." [...].  
12 "Andiamo a prendere un gelato."  
13 Mi sorride. Sì, ha detto così: un ge-la-to.  
14 I prof mangiano il gelato. Sì, i prof mangiano  
15 il gelato e si sporcano la bocca come fanno  
16 tutti gli altri.  
17 "Il suo blog è bello, a volte un po' troppo  
18 filosofico, ma quando posso lo leggo."  
19 Il prof ringrazia continuando a leccare il suo  
20 gelato al pistacchio e al caffè - soliti gusti  
21 pallosi da prof - e mi ricorda Terminator che  
22 lecca le mie scarpe da tennis.  
23 "Allora, cosa ti è successo l'altro giorno?"  
24 Lo sapevo che non mollava la presa. I prof  
25 sono come i boa, ti si arrotolano attorno  
26 quando sei distratto, poi aspettano che butti  
27 fuori l'aria e stringono, e a ogni espirazione  
28 stringono di più, [...].  
29 "Ma a lei che gliene importa, prof?"  
30 Il Sognatore mi guarda fisso negli occhi.  
31 "Forse avevi bisogno di una mano, di un  
32 consiglio ..."

Testo compito direttamente sotto il titolo: Trova nel testo i passaggi corretti e indica la riga.

Soluzione diretta: "non ti lasciano mai in pace" -> r. 24; "possono essere curiosi" -> r. 23; "non mangiano in modo strano" -> r. 15-16; "devono spiegare tutto" -> r. 8-9; "amano aiutare" -> r. 31-32.

Tipologia: abbinamento con riferimento alle righe

Categoria: Senza LLM – comprensione deterministica

Istruzione: Trova nel testo le frasi giuste e indica la riga.

Affermazioni da verificare:

1) "I prof non ti lasciano mai in pace."

2) "Anche i prof possono essere curiosi."

3) "I prof non mangiano in modo strano."

4) "I prof devono sempre spiegare tutto a tutti."

5) "I prof amano anche aiutare gli altri."

Fonte: Scambio 2 plus, p. 112.

Base soluzione: Loesung_Lezione_6_S112.docx.

#### **Compito 2 — pratica 4 (p. 114): Intervista con D’Avenia (ricostruzione domande)**

Materiale implementazione:

Testo pratica 4 (S. 114) – materiale completo per il compito:

Cari amici tedeschi, grazie per le vostre domande! Mi fa molto piacere sapere che leggete i miei libri. Ecco le mie risposte:

1) Questa non è una domanda difficile, proprio ieri ho finito nuovamente di leggere l’Odissea di Omero. 2) Una domanda facile, perché vita e morte sono gli unici temi che non mi annoiano. 3) Non veramente, comunque c’è sempre un po’ dello scrittore in ogni personaggio. 4) Entrambi in modo eccitante, sia l’inizio sia la fine. 5) Insegno naturalmente! 6) Non so se oggi scriverò. Da una settimana sono piuttosto pigro. 7) I miei consigli? Scrivere, scrivere, scrivere – non avere mai paura! E soprattutto leggere moltissimo. 8) Sì, ma questo è ancora un segreto. Forse ne sentirete parlare a breve. A presto, Alessandro D’Avenia.

Testo compito direttamente sotto il titolo: Associa le risposte e ricostruisci le 8 domande dell’intervista.

Soluzione diretta: 1) Qual è stato l’ultimo libro che ha letto? 2) Parlando di Bianca come il latte rossa come il sangue, perché ha scelto un tema così difficile? 3) Si identifica con il personaggio del professore? 4) Come vive ogni volta l’inizio e la fine di un libro che scrive? 5) Che cosa fa quando non scrive? 6) Oggi scriverà ancora qualcosa? 7) Cosa consiglia ai giovani scrittori? 8) Ha già un nuovo progetto?

Tipologia: matching / ordinamento

Categoria: Senza LLM – Matching

Istruzione: Associa le risposte alle domande corrette e ordina la sequenza dell’intervista.

Pool domande:

1) Qual è stato l’ultimo libro che ha letto?

2) Perché ha scelto un tema così difficile?

3) Si identifica con il personaggio del professore?

4) Come vive l’inizio e la fine di un libro?

5) Che cosa fa quando non scrive?

6) Oggi scriverà ancora qualcosa?

7) Che cosa consiglia ai giovani scrittori?

8) Ha già un nuovo progetto?

Fonte: Scambio 2 plus, p. 114.

Base soluzione: Loesung_Lezione_6_S114.docx.

#### **Compito 3 — pratica 4 (p. 114-115): completare il discorso indiretto**

Materiale implementazione:

Testo pratica 4 (S. 114) – materiale completo per il compito:

Cari amici tedeschi, grazie per le vostre domande! Mi fa molto piacere sapere che leggete i miei libri. Ecco le mie risposte:

1) Questa non è una domanda difficile, proprio ieri ho finito nuovamente di leggere l’Odissea di Omero. 2) Una domanda facile, perché vita e morte sono gli unici temi che non mi annoiano. 3) Non veramente, comunque c’è sempre un po’ dello scrittore in ogni personaggio. 4) Entrambi in modo eccitante, sia l’inizio sia la fine. 5) Insegno naturalmente! 6) Non so se oggi scriverò. Da una settimana sono piuttosto pigro. 7) I miei consigli? Scrivere, scrivere, scrivere – non avere mai paura! E soprattutto leggere moltissimo. 8) Sì, ma questo è ancora un segreto. Forse ne sentirete parlare a breve. A presto, Alessandro D’Avenia.

Testo compito direttamente sotto il titolo: Completa le parti mancanti al discorso indiretto al presente.

Soluzione diretta (ordine buchi): 1) di dirci il titolo dell’ultimo libro che ha letto; 2) ha appena finito di rileggere l’Odissea di Omero; 3) ha scelto un tema così difficile; 4) vita e morte sono gli unici temi che non lo annoiano; 5) non si identifica con il personaggio del professore; 6) in ogni personaggio c’è sempre un po’ dello scrittore; 7) lui vive sempre in modo eccitante l’inizio e la fine di ogni libro; 8) insegna; 9) di scrivere tanto, di non avere mai paura e di leggere moltissimo; 10) il suo nuovo progetto è ancora un segreto.

Tipologia: lückentext / drag & drop con blocchi di frase

Categoria: Senza LLM – Lückentext deterministico

Istruzione: Completa le frasi con i blocchi corretti. Non serve produzione libera.

Struttura frasi:

1) Abbiamo domandato a D’Avenia ___ e lui ha risposto che ___.

2) Quando gli abbiamo chiesto perché ___, ha spiegato che ___.

3) Ha affermato che ___, ma che ___.

4) Ha aggiunto che ___ e che, quando non scrive, ___.

5) Lui consiglia ai giovani scrittori ___ e ha detto che ___.

Fonte: Scambio 2 plus, p. 114-115.

Base soluzione: Loesung_Lezione_6_S114.docx.

**[Narratore]** Chiudi il libro e torni al lavoro con la testa piena di idee.

  


 

### ATTO 6.2 — Incontro con la signora siciliana (1 compito)

#### **Hard Facts**

·       **Luogo:** Parco/Caffè (zona tranquilla)

·       **NPC:** signora siciliana anziana

·       **Compiti:** 1

·       **Obiettivi:** usare la messa in rilievo per motivare preferenze

·       **Ricompensa:** 1 punto arredo

·       **Atto successivo:** dopo 6.1 + 6.2 si sblocca 6.3

#### **Note per il team tecnico**

·       Categoria: Senza LLM – Lückentext con pattern fissi.

·       Le immagini di p. 122 restano visibili durante la compilazione.

#### **Scena**

**[Narratore]** La signora ti mostra foto della Sicilia sul tablet e aspetta una risposta precisa.

**[Signora]** "Non basta dire mi piace: dimmi perché proprio quello."

#### **Compito 1 — pratica 4 (p. 123): È in Sicilia che voglio andare!**

Materiale implementazione:

Materiale 6.2 (S. 122/123) – materiale completo per il compito:

Luoghi: 1) Palermo – Cattedrale Santa Vergine Maria Assunta; 2) Palermo – mercati (Ballarò, Vucciria, Capo); 3) Monreale – Cattedrale di Santa Maria Nuova; 4) Agrigento – Valle dei Templi; 5) Piazza Armerina – Villa Romana del Casale; 6) Scala dei Turchi; 7) Trapani – saline/città barocca.

Strutture linguistiche: "È ... che vorrei vedere perché ..." / "Non sono ... che mi interessano perché ...".

Testo compito direttamente sotto il titolo: Completa solo le parti evidenziate dei luoghi con la messa in rilievo. Le motivazioni sono già date; non c’è produzione libera.

Soluzione diretta: 1) la città barocca; 2) le saline; 3) la Cattedrale di Santa Maria Nuova; 4) i mosaici; 5) il Palazzo della Giustizia.

Tipologia: completamento frasi

Categoria: Senza LLM – Lückentext deterministico

Istruzione: Completa cinque frasi con la messa in rilievo (è ... che / non sono ... che ...).

Starter:

1) "A Trapani è ______ che vorrei vedere perché questa città non l’ho vista ancora."

2) "Non sono ______ che mi interessano perché le saline le ho visitate già tante volte."

3) "A Monreale non è ______ che mi interessa perché la Cattedrale la vedo su quasi ogni cartolina della città."

4) "A Piazza Armerina sono ______ che vorrei vedere perché i mosaici li trovo affascinanti."

5) "A Palermo è ______ che vorrei visitare perché questo posto l’ho visto tante volte nei documentari su Giovanni Falcone."

Fonte: Scambio 2 plus, p. 122/123 (informarsi 3 + pratica 4 trasformati in un compito deterministico).

Base soluzioni: Loesung_Lezione_6_S123.docx, Occhio_37_Loesung.pdf.

**[Narratore]** La signora annuisce soddisfatta: "Perfetto, adesso è chiarissimo."

  


 

### ATTO 6.3 — Finale in Piazza Maggiore (1 compito)

#### **Hard Facts**

·       **Luogo:** Piazza Maggiore

·       **NPC:** nessun NPC fisso (evento pubblico)

·       **Compiti:** 1

·       **Obiettivi:** ripasso complessivo delle lezioni 1-6

·       **Ricompensa:** sblocco arredo finale + fine gioco

·       **Atto successivo:** conclusione partita

#### **Note per il team tecnico**

·       Categoria: Senza LLM – Multiple Choice.

·       Domande prese direttamente dal quiz di p. 125.

#### **Scena**

**[Narratore]** Per la Festa della Repubblica in piazza c’è un grande quiz pubblico sull’Italia. Tutti partecipano: studenti, famiglie, turisti.

**[Monologo interiore]** Ultima prova. Dopo questo, il percorso è completo.

#### **Compito 1 — ripasso 8 (p. 125): Quiz all’italiana**

Testo compito direttamente sotto il titolo: Risolvi tutte le 16 domande del quiz.

Soluzione diretta: 1c, 2c, 3b, 4c, 5c, 6b, 7c, 8b, 9c, 10b, 11c, 12b, 13b, 14a, 15a, 16a.

Tipologia: multiple choice

Categoria: Senza LLM – Multiple Choice

Istruzione: Risolvi le 16 domande del quiz.

Set di riferimento (come nel libro): dalla domanda sulla Notte Rosa fino alla citazione su Goethe e la Sicilia.

Catalogo completo delle domande (pronto per implementazione in gioco):

1) La Notte Rosa si festeggia: a) in Puglia. b) in Toscana. c) in Emilia Romagna.

2) La Puglia è una regione italiana: a) del nord. b) del centro. c) del sud.

3) Nominate tre città etrusche che si trovano al centro d’Italia: a) Volterra, Cerveteri, Milano. b) Cerveteri, Arezzo, Orvieto. c) Arezzo, Orvieto, Lucca.

4) Chi ha inventato l’eTwinning? a) Il Prof. Ghilliardi. b) La sezione "Scambi internazionali" dell’Ufficio Scuola. c) La Commissione Europea.

5) Roberto Saviano è famoso perché: a) è spesso in TV. b) lavora per i Carabinieri. c) si impegna contro la mafia.

6) Comacchio è famosa per: a) la pizza. b) i canali. c) le mandorle.

7) A Torino è nato/a: a) la Nutella. b) la pizza Margherita. c) il Pinguino.

8) Italo Svevo è un autore importante di: a) Milano. b) Trieste. c) Roma.

9) Trova l’intruso! Quale attrazione turistica non si trova a Napoli? a) Piazza Plebiscito. b) Teatro San Carlo. c) Mole Antonelliana.

10) Treja è il nome di: a) un cinema nel centro di Roma. b) un parco avventura a un’ora di macchina da Roma. c) un quartiere di Trieste.

11) Il primo Circolo dei Lettori è nato a: a) Roma. b) Palermo. c) Torino.

12) Margherita Hack amava: a) la carne. b) le stelle. c) la chiesa cattolica.

13) Palermo si trova: a) in Piemonte. b) in Sicilia. c) nel Lazio.

14) Al Ferrara Buskers Festival: a) si presentano musicisti ed artisti. b) vediamo nuovissimi film italiani per i giovani. c) puoi mangiare specialità della zona Padana.

15) Quale regola è sbagliata? Il calcio storico: a) si gioca sull’erba. b) si gioca in tutto con 54 giocatori. c) non conosce intervalli e dura 50 minuti.

16) Che cosa ha detto Goethe sulla Sicilia? a) "L’Italia, senza la Sicilia, non lascia alcuna immagine nell’anima: qui comincia tutto." b) "L’Italia, senza la Sicilia, è solo un paese banale." c) "La Sicilia è la chiave di tutto: qui comincia tutto."

Chiave soluzione (interna): 1c, 2c, 3b, 4c, 5c, 6b, 7c, 8b, 9c, 10b, 11c, 12b, 13b, 14a, 15a, 16a.

Fonte: Scambio 2 plus, p. 125.

Base soluzione: Loesung_Lezione_6_S125.docx.

**[Narratore]** Hai finito il quiz. Prima della schermata finale si apre ancora l’ultimo controllo dei vocaboli.

  


 

### Fine Atto 6 — passaggio al compito bonus

#### **Hard Facts**

·       **NPCs:** nessuno

·       **Compiti:** 1 compito bonus (matching vocaboli)

·       **Ricompensa:** fette di pizza (consiglio: 2 fette se tutto è corretto)

·       **Atto successivo:** fine gioco dopo il bonus

#### **Note per il team tecnico**

·       Il passaggio narrativo chiude l’atto 6 e apre direttamente il compito bonus.

·       Schermo neutro, nessuno sfondo specifico, nessun avatar visibile.

·       Vokabel-Matching: selezione randomizzata di 10 vocaboli dal pool Vocabolario Lezione 6.

·       A ogni nuovo tentativo vengono scelti altri 10 vocaboli.

·       Colonna italiana a sinistra, colonna inglese randomizzata a destra.

·       Feedback visivo se il match è corretto; se è sbagliato, le parole tornano indietro.

#### **Scena**

**[Narratore]** Hai completato il sesto capitolo della tua avventura a Bologna. La collezione è completa e dopo il controllo dei vocaboli appare la schermata finale.

**[Narratore]** Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero?

**[Info di gioco]** Risolvi questo compito bonus per guadagnare fette di pizza extra!

#### **Esercizio bonus — Matching: parole italiane e inglesi**

Aufgabentyp: Matching (Bonus-Aufgabe)

Lernziel: Vokabelfestigung Lezione 6

Quelle: Scambio 2 plus, Vocabolario Lezione 6 (p. 195-197)

Hinweis Technik:

Randomisierte Auswahl von 10 Vokabeln aus dem Gesamt-Pool von Vocabolario Lezione 6.

Italienische Spalte links (in fester Reihenfolge), englische Spalte rechts (randomisiert).

Wiederholbarkeit: bei jedem neuen Durchlauf andere 10 Vokabeln.

Collega ogni parola italiana al suo equivalente inglese.

**Ingresso — Parliamo di letteratura**


|                           |                      |
| ------------------------- | -------------------- |
| italiano                  | english              |
| la (ri)scoperta           | (re)discovery        |
| la letteratura            | literature           |
| il lettore/la lettrice    | reader               |
| il romanzo                | novel                |
| il giallo                 | crime novel          |
| la fiaba                  | fairy tale           |
| c’era una volta           | once upon a time     |
| il paragone               | comparison           |
| la biografia              | biography            |
| la creatività             | creativity           |
| la citazione              | quotation            |
| la recensione             | review               |
| la caricatura             | caricature           |
| precedente                | previous             |
| eccitante                 | exciting             |
| strutturare (un racconto) | to structure a story |
| divorare (un romanzo)     | to devour a novel    |
| la casa editrice          | publisher            |


**A — Testo letterario e sentimenti**


|                |                           |
| -------------- | ------------------------- |
| italiano       | english                   |
| crescere       | to grow                   |
| modificare     | to modify / change        |
| affascinante   | fascinating               |
| la gentilezza  | kindness / politeness     |
| immenso, -a    | immense / enormous        |
| delicato, -a   | delicate / sensitive      |
| grato, -a      | grateful                  |
| grazie a       | thanks to                 |
| la gioia       | joy                       |
| la tristezza   | sadness                   |
| la rabbia      | anger / rage              |
| l’attrezzatura | equipment                 |
| la lacrima     | tear                      |
| il vantaggio   | advantage                 |
| l’infanzia     | childhood                 |
| sporcare       | to make dirty             |
| filosofico, -a | philosophical             |
| arrotolarsi    | to roll / wind oneself up |


**B — Espressioni e racconto**


|                             |                                           |
| --------------------------- | ----------------------------------------- |
| italiano                    | english                                   |
| attorno                     | around                                    |
| distratto, -a               | distracted                                |
| stringere                   | to press / squeeze / tighten              |
| (non mi) importa (di qc.)   | something matters / does not matter to me |
| fisso, -a                   | fixed / steady                            |
| entrambi                    | both                                      |
| pazzesco, -a                | crazy                                     |
| il/la secchione/a           | swot / nerd                               |
| il cammino                  | path / way                                |
| oscuro, -a                  | dark                                      |
| concentrarsi (su)           | to concentrate on                         |
| il principe/la principessa  | prince / princess                         |
| sposare; sposarsi           | to marry; to get married                  |
| scappare                    | to flee / escape                          |
| rotondo, -a                 | round                                     |
| pubblicitario, -a           | advertising                               |
| il vizio                    | vice / flaw                               |
| il fiato; tutto d’un fiato  | breath; in one breath                     |
| magico, -a                  | magical                                   |
| sparire                     | to disappear                              |
| il brano                    | text passage / music piece                |
| il confine                  | border                                    |
| passare una notte in bianco | to spend a sleepless night                |
| andare in bianco            | to fail                                   |
| la bandiera                 | flag                                      |
| alzare bandiera bianca      | to wave the white flag / surrender        |


**B2 / Autocontrollo — Sicilia, natura e ambiente**


|                 |                                 |
| --------------- | ------------------------------- |
| italiano        | english                         |
| il silenzio     | silence                         |
| è lo stesso     | it is all the same              |
| la tempesta     | storm                           |
| l’uragano       | hurricane                       |
| spazzare (via)  | to sweep away                   |
| il terremoto    | earthquake                      |
| (far) crollare  | to collapse / cause to collapse |
| la somma        | sum                             |
| il gas          | gas                             |
| il vapore       | steam / vapor                   |
| la lava         | lava                            |
| il territorio   | territory                       |
| la nazione      | nation                          |
| la provincia    | province                        |
| il sorriso      | smile                           |
| la vignetta     | cartoon / caricature            |
| l’uccello       | bird                            |
| prendere        | to catch / take                 |
| il bastone      | stick                           |
| la tranquillità | calm / tranquility              |
| l’abbreviazione | abbreviation                    |
| il paesino      | small village                   |
| nobile          | noble                           |
| rallegrarsi     | to rejoice / be happy           |
| tratto da       | taken from / adapted from       |


 

 