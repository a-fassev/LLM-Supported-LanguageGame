AKT 2.0 — Übergang nach Akt 1 (Erzähler-Brücke) 

**Hard Facts** 

- Ort: Wohnung der Gastfamilie Ferrari, Zimmer der Spielfigur (Morgenszene) 

- NPCs: keine 

- Aufgaben: keine 

- Folgeakt: Karte öffnet sich, drei neue Pins werden freigeschaltet (Nutelleria, Schulprojekt zuhause, Restaurant) 

**Hinweise für das technische Team** 

- Reine Erzähler-Eröffnung des Akts, keine Interaktion außer "Weiter"-Buttons 

- Hintergrund: Zimmer der Spielfigur am Morgen, Sonnenlicht durchs Fenster 

- Nach der letzten Erzähler-Box: Karten-View öffnet sich, drei neue Pins leuchten auf 

**Szene** 

[Narratore] Hai dormito bene nella tua nuova camera. La signora Ferrari ti ha lasciato la colazione in tavola: pane, marmellata, un cappuccino. 

[Monologo interiore] Oggi ho un po' di tempo libero. Devo finire un progetto per la scuola su un italiano famoso. E poi ho letto che un ristorante qui in centro cerca personale per l'estate — magari vado a vedere. Ma prima voglio fare un giro per la città... 

[Narratore] Sulla mappa di Bologna si illuminano tre nuovi posti: una Nutelleria nel centro, la tua casa (per il progetto di scuola) e un ristorante in centro. 

→ Übergang zur Karte 

 

AKT 2.1 — Nutelleria (incontro con Dario) 

**Hard Facts** 

- Ort: Nutelleria, Bologna 

- NPCs: Dario (compagno di classe del Liceo Galvani, sogna di fare l'archeologo) 

- Aufgaben: 2 (Lückentext Possessivformen + Futur, Freitext mit Relativpronomen via LLM) 

- Lernziele: Possessivpronomen (mit/ohne Artikel), Futur (futuro semplice), Relativpronomen (che, cui, dove), Berufsvokabular 

- Belohnung: tbd 

- Folgeakt: Spieler kehrt zur Karte zurück, 2.2 und 2.3 weiterhin frei wählbar 

**Hinweise für das technische Team** 

- Dario braucht Sprite-Design (neutral, entusiasta, sorridente) 

- Hintergrund: Innenraum einer Nutelleria mit Theke, Crêpes-Station, Holzhockern, warmen Brauntönen 

- Aufgabe 1 (Lückentext): Pro Lücke Freitext-Eingabe mit Auto-Check. Verbformen mit Hilfsangabe in Klammern. Possessivlücken ohne Hilfsangabe (Schüler entscheidet selbst, ob mit/ohne Artikel). Bei avverbio/aggettivo-Auswahl: zwei Optionen kursiv vorgegeben, Schüler wählt die richtige 

- Aufgabe 2 (Freitext LLM): mehrere Berufsbilder werden nacheinander angezeigt (Bild + Beruf), Spieler tippt eine Beschreibung mit Relativpronomen. LLM bewertet auf korrekte Verwendung von che/cui/dove und inhaltliche Plausibilität 

- LLM-Prompt muss Geschlecht des Avatars berücksichtigen für Adjektiv-Kongruenz im Feedback 

**Szene** 

[Narratore] Cammini sotto i portici e ti fermi davanti a un locale che hai sentito nominare tante volte: la Nutelleria. Profumo di crêpe e di cioccolato. Entri e ti siedi a un tavolinovicino alla finestra. 

[Narratore] A un tavolo vicino c'è un ragazzo che riconosci subito: è Dario, un compagno della tua nuova classe al Liceo Galvani. Ti vede e ti fa un cenno con la mano. 

[Dario] "Ehi, ciao! Anche tu qui? Vieni, siediti con me. Non posso credere a quello che mi è successo oggi!" 

[Risposta del giocatore] "Ciao Dario! Cosa è successo?" 

[Dario] "Ho appena parlato con Elena, un'amica di mia madre. Lei fa l'archeologa e mi ha raccontato del suo lavoro. È stato bellissimo! Sai, ho deciso: da grande voglio farel'archeologo anch'io!" 

[Monologo interiore] Dario sembra davvero entusiasta. Vediamo se i suoi piani sono realistici... 

**Esercizio 1 — Anch'io farò l'archeologo!** 

Aufgabentyp: Lückentext Lernziel: Possessivformen (mit/ohne Artikel) + Futur (futuro semplice) + scelta tra avverbio e aggettivo Hinweis Technik: 

- Pro Lücke Freitext-Eingabe mit Auto-Check 

- Verbformen mit Hilfsangabe in Klammern 

- Possessivlücken ohne Hilfsangabe (Schüler entscheidet selbst, ob mit/ohne Artikel) 

- Bei avverbio/aggettivo-Auswahl: zwei Optionen kursiv vorgegeben, Schüler wählt die richtige 

- Die Lücken sind in den Repliken beider Sprecher verteilt: Dario (NPC) und Spielfigur 

- Quelle: Scambio 2 plus, S. 35, A5 — Spielfigur übernimmt Saras Rolle 1:1 

Parla con Dario del suo sogno. Scegli l'avverbio o l'aggettivo, poi completa con i possessivi (con o senza articolo) e i verbi al futuro. 

Tu: Allora, com'è andata con l'archeologa? Dario: *Benissimo/Buonissimo*! Sai, ho deciso che ___ (fare) l'archeologo anch'io! Tu: Davvero? Ma non ___ (avere) bisogno di votipiù alti per farlo? Sono questi che ti ___ (mancare). Dario: Sì, certo. Da domani ___ (studiare) tutti i giorni. Così gli insegnanti mi ___ (dare) *bene/buoni* voti. ___ genitori ___ (essere) contentissimi. Che dici: ___ mamma mi ___ (comprare) il libro sull'archeologia che abbiamo visto ieri? ___ (Prendere) un *bene/buon* voto naturalmente! ___ (Smettere) anche di chiacchierare con gli altri, anche se ___ (essere) *difficile/difficilmente*. Tu: Così alla fine ___ (fare) un'ottima maturità. Non ___ (essere) mica *facile/facilmente*. Dario: Ma che cosa ___ (pensare) voi di questa ___ idea? Tu: Boh, la ___ (accettare). Dario: E tu? Sai già cosa ___ (fare) dopo ___ maturità? Tu: Sì, ho già una mezza idea su ___ futuro. Sai che mi piace molto la musica e proprio ieri ho sentito un'intervista... Dario: Ah, interessante, dimmi tutto. ___ (Potere) mangiare qualcosa insieme e tu racconti. Chene dici? 

Soluzioni: Benissimo / farò / avrai / mancano / studierò / daranno / buoni / I miei / saranno / la / comprerà / Prenderò / buon / Smetterò / sarà / difficile / farai / sarà / facile / penserete / mia / accetteranno / farai / la / sul / Potremmo 

[Dario] " Sai, dopo il discorso con Elena ho pensato a tante cose. Per esempio: ma tu in Germania, conosci tanti mestieri diversi? Adesso te ne dico qualcuno e tu mi spieghi cosafanno. Usa frasi con *che*, *cui* o *dove*, così pratichiamo un po'." 

**Esercizio 2 — Descrivi le professioni** 

Aufgabentyp: Freitext (LLM-bewertet) Lernziel: Relativpronomen (che, cui, dove) + Berufsvokabular aus S. 30-31 Hinweis Technik: 

- Spieler bekommt nacheinander 4 Berufsbilder angezeigt (Bild + Berufsbezeichnung aus dem Buch) 

- Pro Beruf tippt der Spieler eine Beschreibung mit mindestens einem Relativpronomen 

- LLM bewertet: (a) korrekte Verwendung von che/cui/dove, (b) inhaltliche Plausibilität, (c) grammatikalische Korrektheit auf B1-Niveau 

- Bei Fehlern: kurzes, konstruktives Feedback auf Italienisch 

- LLM-Prompt enthält Avatar-Geschlecht für korrekte Adjektiv-Kongruenz im Feedback 

- Mindestlänge pro Antwort: ein vollständiger Satz mit Relativpronomen 

Descrivi ogni professione con una frase. Usa *che*, *cui* o *dove*. 

Professioni (mit Bildern aus S. 30-31): 

1. l'architetto / l'architetto donna 

1. il/la giornalista 

1. il medico 

1. il/la giardiniere/a 

Esempi di buone risposte: 

- "L'architetto è una persona che progetta case e edifici." 

- "Il giornalista è una persona di cui leggiamo gli articoli sul giornale." 

- "Il medico lavora in un ospedale dove cura le persone malate." 

- "Il giardiniere è una persona che pianta fiori e alberi." 

[Dario] "Sei bravissimo/a! Senti, io devo andare, ho ancora molte cose da fare. Ci vediamo domani a scuola, eh! E grazie per la chiacchierata." 

[Monologo interiore] Che entusiasmo, Dario. Forse anch'io dovrei pensare di più al mio futuro. Ma adesso ho cose più urgenti: i compiti di scuola mi aspettano a casa, e cercavoanche un lavoretto per l'estate... 

[Narratore] Esci dalla Nutelleria. Sulla mappa restano ancora due luoghi importanti per oggi: la casa della famiglia Ferrari, dove ti aspettano i compiti, e un ristorante in centroche cerca personale per l'estate. 

 

AKT 2.2 — Casa della famiglia Ferrari: progetto scolastico "Italiani famosi" 

**Hard Facts** 

- Ort: Wohnung der Gastfamilie Ferrari, Schreibtisch im Zimmer der Spielfigur 

- NPCs: keine (nur Erzähler und innerer Monolog) 

- Aufgaben: 2 (Lückentext Steckbrief, Multiple Choice Quiz mit Relativpronomen) 

- Lernziele: Leseverstehen, Informationsentnahme, Relativpronomen (che, cui, dove) + participio passato 

- Belohnung: tbd 

- Folgeakt: Spieler kehrt zur Karte zurück, 2.3 weiterhin frei wählbar 

**Hinweise für das technische Team** 

- Hintergrund: Schreibtisch der Spielfigur im Zimmer, Laptop offen, Tageslicht durchs Fenster 

- Aufgaben-Bildschirm mit drei Karteikarten (Foto + Name) der Persönlichkeiten Saviano, Del Piero, Ferragni — anklickbar 

- Bei Klick auf eine Karteikarte: Lesetext öffnet sich als Overlay/Pop-up 

- Karteikarten enthalten je ein Foto und einen Lesetext (ca. 150-200 Wörter) 

- Texte müssen jederzeit erneut aufrufbar sein (durch erneutes Klicken auf die Karteikarte) 

- Aufgabe 1: Spielfigur entscheidet sich für eine Person und füllt deren Steckbrief aus. Drei Steckbrief-Vorlagen, je nach Auswahl 

- Aufgabe 2: Multiple Choice. Direkte Übernahme der Buchübung S. 46, B11. Pro Frage: (a) Lücken (pronome relativo + participio passato) als Multiple-Choice-Optionen, (b) Zuordnung zu einer der sechs abgebildeten Persönlichkeiten 

**Szene** 

[Narratore] Torni a casa della famiglia Ferrari. La signora Ferrari ti saluta dalla cucina e ti ricorda che hai i compiti da fare. Sali in camera tua, accendi il computer e apri il portale della scuola. 

[Monologo interiore] Ecco il primo vero compito per il Liceo Galvani. La Signora Wagner ci ha chiesto di scegliere un italiano famoso, di leggere il profilo e di fare un identikit. E dopo c'è anche un quiz su altre persone famose. Vediamo chi sono... 

[Spielinfo] Clicca su ciascuna scheda per leggere il profilo. Quando hai letto i tre testi, scegli una persona e completa il suo identikit. 

**Lesetext 1 — Roberto Saviano** 

Hinweis Technik: Text aus Scambio 2 plus, S. 32, A1. Wird als In-Game-Dokument dargestellt, muss jederzeit per Klick auf die Karteikarte erneut aufrufbar sein. 

Roberto Saviano è nato il 22 settembre 1979. Nei suoi articoli e libri racconta normalmente della criminalità organizzata, soprattutto della Camorra. Di sicuro è diventato famosoper il suo libro "Gomorra" (2006). Il libro parla della Camorra in Campania perché l'autore è cresciuto in quella zona. Per questo conosce bene i problemi che ci sono lì. Tuttaviaè specialmente con la pubblicazione di "Gomorra" che la sua vita cammina veloce in un'altra direzione. Da allora non può più vivere senza scorta, cioè senza poliziotti che glistanno vicino. Se vuole andare al cinema o si sente male e deve andare dal dottore, parla con gli uomini della scorta che lo accompagnano subito. E chiaramente deve chiedere ai suoi "ragazzi" se vuole prendere velocemente un caffè al bar. Tutto sommato, non è sempre una vita facile. Saviano però continua a lottare. Non solo non si arrende, ma lavorasodo e fa in continuazione nuove indagini: nel 2020 è uscito il suo ultimo libro "Gridalo", un libro con cui chiede a tutti di aver il coraggio di non stare zitti e parlare sempre apertamente dei problemi. 

**Lesetext 2 — Alessandro Del Piero** 

Hinweis Technik: Neu erstellter Text im Stil des Buchtexts (B1, Sprachregister wie Saviano-Text). 

Alessandro Del Piero è nato il 9 novembre 1974 a Conegliano, una piccola città in Veneto. Da bambino la sua famiglia non era ricca: il padre lavorava come elettricista e la madre stava a casa. Lui giocava a calcio nelle strade del paese con il fratello maggiore Stefano. A tredici anni è entrato nella squadra giovanile del Padova, e a diciotto anni è arrivato alla Juventus, una delle squadre più famose d'Italia. Ha giocato per la Juventus per diciannove anni: nessun altro giocatore ha fatto la stessa cosa. Per questo i tifosi glihanno dato il soprannome "Pinturicchio" e poi "Capitano". Con la Juventus ha vinto molti campionati italiani, ma il momento più bello della sua carriera è arrivato nel 2006: conla nazionale italiana ha vinto la Coppa del Mondo in Germania. Tutti gli italiani ricordano il suo gol nella semifinale contro i tedeschi. Oggi Del Piero non gioca più, ma lavoracome commentatore in TV e aiuta i giovani calciatori con la sua fondazione. È sposato con Sonia e ha tre figli.  

**Lesetext 3 — Chiara Ferragni** 

Hinweis Technik: Neu erstellter Text im Stil des Buchtexts. 

Chiara Ferragni è nata il 7 maggio 1987 a Cremona, in Lombardia. Da ragazza studiava legge all'università di Milano, ma la sua vera passione era la moda. Nel 2009, quandoaveva solo ventidue anni, ha aperto un blog di moda chiamato "The Blonde Salad". All'inizio nessuno credeva nel suo progetto, ma in pochi anni il blog è diventato famosissimoin tutto il mondo. Oggi Chiara è una delle influencer più conosciute del pianeta: sui suoi profili social la seguono milioni di persone. Ha creato anche una sua linea di moda, "Chiara Ferragni Collection", con scarpe, vestiti e accessori. Nel 2018 si è sposata con il rapper Fedez in una cerimonia spettacolare in Sicilia. Hanno avuto due figli, Leone e Vittoria, e per anni la loro vita è stata seguita dai fan su Instagram. Nel 2024 però la coppia si è separata e Chiara ha vissuto un periodo difficile, anche per un caso legato a undolce di Natale, il "pandoro Balocco". Però continua a lavorare ed è ancora una delle donne più importanti del mondo della moda in Italia. **** 

**Esercizio 1 — Che persona straordinaria!** 

Aufgabentyp: Lückentext (Steckbrief) Lernziel: Leseverstehen, Informationsentnahme aus B1-Texten Hinweis Technik: 

- Spieler wählt eine der drei Persönlichkeiten und füllt deren Steckbrief aus 

- Sechs Lücken pro Steckbrief, Freitext-Eingabe mit Auto-Check 

- Mehrere richtige Schreibweisen werden akzeptiert 

- Der gewählte Lesetext bleibt während der Bearbeitung per Klick aufrufbar 

- Vorlage: Scambio 2 plus, S. 32, comprendere 1 

Scegli una delle tre persone e completa il suo identikit con le informazioni del testo. Puoi sempre rileggere il profilo cliccando di nuovo sulla scheda. 

**Identikit — struttura uguale per tutte e tre le persone:** 

- nome: 

- età (oppure data di nascita): 

- regione d'origine: 

- professione: 

- È famoso/a perché … 

- particolarità: 

Soluzioni di riferimento: 

*Saviano:* Roberto Saviano / nato il 22 settembre 1979 / Campania / scrittore e giornalista / ha scritto il libro "Gomorra" sulla Camorra / vive con la scorta della polizia 

*Del Piero:* Alessandro Del Piero / nato il 9 novembre 1974 / Veneto / calciatore (oggi commentatore TV) / ha giocato diciannove anni nella Juventus e ha vinto la Coppa del Mondo nel 2006 / ha una fondazione per giovani calciatori 

*Ferragni:* Chiara Ferragni / nata il 7 maggio 1987 / Lombardia / influencer e imprenditrice di moda / ha aperto il blog "The Blonde Salad" ed è una delle influencer più conosciute al mondo / ha la sua linea di moda "Chiara Ferragni Collection" 

[Monologo interiore] Bene, l'identikit è pronto. Adesso il quiz: la Signora Wagner ha preparato anche un gioco "Chi sono io?" con altre persone famose italiane. Vediamo se riesco a indovinare... 

**Esercizio 2 — Italiani famosi: il quiz** 

Aufgabentyp: Multiple Choice (zwei Schritte pro Frage) Lernziel: Relativpronomen (che, cui, dove) + participio passato Hinweis Technik: 

- Pro Frage zwei Schritte:  

- Schritt A: Spieler wählt die richtige Kombination aus pronome relativo + participio passato  

- Schritt B: Spieler ordnet die fertige Frage einer der sechs abgebildeten Persönlichkeiten zu 

- Sechs Persönlichkeiten als anklickbare Karten mit Foto und Name: Giuseppe Verdi, Cristoforo Colombo, Maria Montessori, Michelangelo Buonarroti, Elena Ferrante, Leonardo da Vinci 

- Bei Elena Ferrante: graue Silhouette (wie im Buch), da keine bekannten Fotos existieren 

- Quelle: Scambio 2 plus, S. 46, B11 — 1:1 übernommen 

Gli italiani hanno preparato per i partner tedeschi un quiz ("Chi sono io?") su italiani famosi. Metti i pronomi relativi (con o senza preposizioni) e la forma corretta del participio. Poi abbina le persone alle frasi. 

1. Chi è la donna molto famosa ___ ha ___ (fondare) la casa dei bambini nel 1907? 

1. Dove sono ___ (arrivare) le tre caravelle di questo uomo ___ parliamo ancora oggi? 

1. Chi è il musicista ___ nel 1800 ha ___ (fare) il politico? 

1. Chi è l'artista ___ conosciamo un dipinto molto famoso ___ si chiama "La Gioconda"? 

1. Come si chiama lo scultore ___ ha ___ (creare) il David di Firenze? 

1. Come si chiama la scrittrice, famosissima in tutto il mondo, ___ ha ___ (scrivere) quattro romanzi su Napoli e ___ non si sa molto? 

Persone (anklickbar mit Bild): Giuseppe Verdi / Cristoforo Colombo / Maria Montessori / Michelangelo Buonarroti / Elena Ferrante / Leonardo da Vinci 

Soluzioni: 

1. che / ha fondato — Maria Montessori 

1. sono arrivate / di cui parliamo — Cristoforo Colombo 

1. che / ha fatto — Giuseppe Verdi 

1. di cui conosciamo / che si chiama — Leonardo da Vinci 

1. che / ha creato — Michelangelo Buonarroti 

1. che / ha scritto / di cui non si sa — Elena Ferrante 

[Monologo interiore] Fatto! La Signora Wagner sarà contenta. Adesso però ho davvero fame, e penso che c'è ancora una cosa da fare oggi: quel ristorante in centro cercapersonale per l'estate... 

[Narratore] Salvi il compito sul portale della scuola e chiudi il computer. Sulla mappa di Bologna resta un ultimo posto da visitare oggi: il ristorante. 

 

AKT 2.3 — Ristorante in centro: domanda per un lavoretto estivo 

**Hard Facts** 

- Ort: Ristorante im Zentrum von Bologna 

- NPCs: Signor Marini (Restaurantbesitzer, ca. 55, freundlich aber prüfend) 

- Aufgaben: 2 (Lückentext Motivationsschreiben, Freitext mit Relativpronomen via LLM) 

- Lernziele: Formelle Briefformeln, Struktur einer lettera di motivazione, Gastronomie-Vokabular (Menüstruktur), Relativpronomen (che, cui, dove) 

- Belohnung: tbd 

- Folgeakt: Nach Abschluss wird Akt 3 freigeschaltet 

**Hinweise für das technische Team** 

- Signor Marini braucht Sprite-Design (neutral, prüfend-skeptisch, zufrieden-lächelnd) 

- Hintergrund: Restaurant-Innenraum mit gedeckten Tischen, Weinregal, offener Küche im Hintergrund. Tageslicht/frühe Abendstimmung 

- Spielfigur sitzt mit Laptop an einem der Tische 

- Aufgabe 1 (Motivationsschreiben): Lückentext mit Drag & Drop aus Formulierungshilfen-Liste S. 51. Mehrere Optionen pro Kategorie, mehrere Lösungen können richtig sein. Keine Adresse, kein Datum 

- Aufgabe 2 (Freitext LLM): Beschreibung der Menü-Kategorien mit Relativpronomen. LLM-Prompt mit Avatar-Geschlecht für Adjektiv-Kongruenz im Feedback 

**Szene** 

[Narratore] Esci di nuovo nel pomeriggio. Sotto i portici, vicino a Piazza Maggiore, trovi il ristorante di cui ti ha parlato la signora Ferrari: "Trattoria da Marini". All'ingresso c'èun cartello: *Cercasi personale per la stagione estiva — luglio e agosto*. 

[Monologo interiore] Bene. Lavorare durante l'estate non sarebbe male. Posso guadagnare qualcosa e migliorare il mio italiano. Entriamo.  

[Narratore] Entri nel ristorante. Un uomo sulla cinquantina, con il grembiule bianco, sta pulendo un tavolo vicino alla finestra. Ti vede e si avvicina. 

[Signor Marini] "Buongiorno! Vuoi mangiare qualcosa? In questo momento la cucina è chiusa, riapriamo più tardi." 

[Risposta del giocatore] " Buongiorno, no, scusi… Ho visto il cartello fuori. Cerco un lavoretto per l'estate." 

[Signor Marini] "Ah, perfetto! Stiamo cercando ragazzi/e per la stagione estiva. Hai con te una lettera di motivazione?"  

[Risposta del giocatore] "Non ancora, ma ho il portatile. Posso prepararla adesso?" 

[Signor Marini] "Certo, siediti pure. Quando hai finito, me la mandi via email e poi parliamo un po'. Ah, e visto che siamo un ristorante: ti farò anche qualche domanda sui piattiitaliani, eh!" 

[Monologo interiore] Va bene. Apro il computer. Ci sono delle formule fisse che si usano sempre nelle lettere formali: devo solo scegliere quelle giuste. 

**Esercizio 1 — Lettera di motivazione** 

Aufgabentyp: Lückentext (Drag & Drop mit festen Formeln) Lernziel: Struttura e formule fisse di una lettera di motivazione formale Hinweis Technik: 

- Spieler bekommt ein Briefgerüst mit 7 Lücken 

- Rechts daneben eine Liste der Formulierungshilfen aus S. 51 (Per iniziare, Per scrivere la parte centrale, Per strutturare e collegare, Per finire) 

- Drag & Drop: Spieler zieht die passende Formel in die richtige Lücke 

- Mehrere Formeln können richtig sein — bei korrektem Match grünes Feedback 

- Quelle: Scambio 2 plus, S. 50-51 (Competenze 1) und S. 158-159 (Strategie 1.1) 

[Spielinfo] Completa la lettera di motivazione con le formule giuste. Trascina le espressioni dalla lista a destra nelle lacune. 

Ogg.: Domanda per un lavoretto estivo 

___ (1) 

___ (2) presentare la mia candidatura per un lavoretto durante l'estate presso la Vostra trattoria. 

___ (3) ho sedici anni e frequento la decima classe di un liceo linguistico a Monaco di Baviera. Studio l'italiano da tre anni e quest'estate vorrei migliorare la mia lingualavorando in Italia. ___ (4) ho già lavorato come babysitter per due estati e ho fatto volontariato nella mensa della mia scuola, quindi ho un po' di esperienza con il pubblico e conil servizio. 

___ (5) sono una persona molto motivata, puntuale e disponibile. Mi piace lavorare in squadra e imparare cose nuove. Sono particolarmente interessato/a al lavoro in cucina o al servizio ai tavoli. 

___ (6) non esiti a contattarmi. 

___ (7) 

**Liste der Formulierungshilfen (Drag & Drop, in vier Kategorien gegliedert):** 

*Per iniziare:* 

- Gentili Signore e Signori, 

- Gentile Signora Cassari, 

- Gentile Signor De Valli, 

- Egregio Direttore, 

- Stimata Dottoressa, 

*Per scrivere la parte centrale:* 

- con la presente desidero candidarmi … 

- vorrei chiedere/presentare … 

- Vi prego di … 

*Per strutturare e collegare:* 

- all'inizio / per primo 

- poi / più tardi … 

- inoltre / in più / … 

- infine / alla fine 

*Per finire:* 

- Se desidera/Se desiderate ulteriori informazioni, non esiti/non esitate a contattarmi. 

- In attesa di una Vostra gentile risposta, invio i miei più cordiali saluti 

- Gradirei molto ricevere presto Vostre notizie. 

- RingraziandoVi anticipatamente, porgo i miei più distinti saluti. 

Soluzioni di riferimento (akzeptiert werden auch sinngemäße Varianten aus der Liste): 

1. Gentili Signore e Signori, *(oder andere Anrede)* 

1. con la presente desidero candidarmi *(oder: vorrei chiedere/presentare)* 

1. all'inizio / per primo 

1. inoltre / in più 

1. poi 

1. Se desidera/Se desiderate ulteriori informazioni 

1. RingraziandoVi anticipatamente, porgo i miei più distinti saluti. *(oder andere Schlussformel)* 

[Narratore] Salvi la lettera e la mandi all'indirizzo email del ristorante. Pochi secondi dopo, il Signor Marini apre il suo telefono, legge il messaggio e si avvicina al tuo tavolo conun sorriso. 

[Signor Marini] "Bene, bene! Bella lettera. Adesso però la prova vera: se vuoi lavorare qui da Marini, devi conoscere un po' la nostra cucina. Ti faccio vedere il nostro menù. Descrivimi com'è strutturato un menù italiano: cosa sono le varie parti? Usa frasi con *che*, *cui* o *dove*, va bene?" 

**Esercizio 2 — Conosci la struttura di un menù italiano?** 

Aufgabentyp: Freitext (LLM-bewertet) Lernziel: Gastronomie-Vokabular (Aufbau eines italienischen Menüs) + Relativpronomen (che, cui, dove) in praktischer Anwendung Hinweis Technik: 

- Spieler bekommt nacheinander 5 Menü-Kategorien angezeigt (Bezeichnung + Bilder von Beispielgerichten aus S. 71) 

- Pro Kategorie tippt der Spieler eine Beschreibung mit mindestens einem Relativpronomen 

- LLM bewertet: (a) korrekte Verwendung von che/cui/dove, (b) inhaltliche Plausibilität (weiß, wo die Kategorie im Menü steht und was sie enthält), (c) grammatikalische Korrektheit auf B1-Niveau 

- Bei Fehlern: kurzes, konstruktives Feedback auf Italienisch 

- LLM-Prompt enthält Avatar-Geschlecht für Adjektiv-Kongruenz im Feedback 

- Mindestlänge pro Antwort: ein vollständiger Satz mit Relativpronomen 

- Quelle: Scambio 2 plus, S. 71 (Vocaboli extra: Al ristorante) 

Descrivi ogni parte del menù con una frase. Usa *che*, *cui* o *dove*. 

Categorie (con immagini dei piatti tipici da S. 71): 

1. gli antipasti 

1. i primi piatti 

1. i secondi piatti (con contorni) 

1. le pizze 

1. i dolci 

Esempi di buone risposte: 

- "Gli antipasti sono piccoli piatti che si mangiano all'inizio del pasto." 

- "I primi piatti sono piatti di pasta o riso che si mangiano dopo gli antipasti, come le tagliatelle al ragù." 

- "I secondi piatti sono piatti di carne o pesce che si mangiano dopo i primi, con cui si servono spesso dei contorni di verdura." 

- "Le pizze sono un piatto tipico italiano che si mangia di solito la sera in pizzeria." 

- "I dolci sono piatti che si mangiano alla fine del pasto, come la torta della nonna." 

[Signor Marini] "Bravissimo/a! Si vede che hai studiato bene. Senti, mi piaci. Per l'estate ti posso prendere come aiuto in sala. Adesso vai a casa, parla con la tua famigliaospitante e poi ci sentiamo. Ah, e tieni: il primo caffè da Marini te lo offro io!"  

[Monologo interiore] Che giornata! Ho conosciuto meglio Bologna, ho fatto i compiti, ho trovato anche un lavoretto per l'estate. Non è male, sono appena arrivato/a! 

[Narratore] Esci dal ristorante. Il sole tramonta sui portici di Bologna. 

 

Fine Akt 2 — Übergang zur Bonus-Aufgabe (italienische Version) 

**Hard Facts** 

- NPCs: keine 

- Aufgaben: 1 Bonus-Aufgabe (Vokabel-Matching) 

- Belohnung: Pizzastücke  

- Folgeakt: Übergang zu Akt 3 

**Hinweise für das technische Team** 

- Erzähler-Übergang schließt Akt 2 ab und führt direkt zur Bonus-Aufgabe 

- Neutraler Bildschirm, kein Hintergrund-Setting, kein Avatar sichtbar 

- Vokabel-Matching: randomisierte Auswahl von 10 Vokabeln aus dem Gesamt-Pool von Lezione 2 

- Bei jedem Spieldurchlauf werden andere 10 Vokabeln gezogen, damit die Aufgabe wiederholbar bleibt 

- Schüler verbindet jede italienische Vokabel mit ihrem englischen Synonym 

- Bei richtigem Match: visuelles Feedback. Bei falschem Match: Wörter springen zurück 

- Belohnung nach Abschluss: Animation + Update im Inventar 

**Szene** 

[Narratore] Hai completato il secondo capitolo della tua avventura a Bologna. Hai parlato del futuro con un nuovo amico, hai conosciuto tre italiani famosi e hai fatto domandaper il tuo primo lavoretto. 

[Narratore] Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero? 

[Spielinfo] Risolvi questo compito bonus per guadagnare fette di pizza extra! 

**Esercizio bonus — Matching: parole italiane e inglesi** 

Aufgabentyp: Matching (Bonus-Aufgabe) Lernziel: Vokabelfestigung Lezione 2 Hinweis Technik: 

- Randomisierte Auswahl von 10 Vokabeln aus dem Gesamt-Pool von Lezione 2 

- Vokabel-Pool umfasst alle Vokabeln aus den Wortschatzlisten: Le professioni, Cosa fanno i poliziotti, Scuola e formazione, Le parti del corpo, Ancora caratteristiche, La tecnologia 

- Wiederholbarkeit: bei jedem neuen Durchlauf andere 10 Vokabeln 

Collega ogni parola italiana al suo equivalente inglese. 

**Le professioni** 


|                                    |                         |
| ---------------------------------- | ----------------------- |
| **italiano**                       | **english**             |
| **la professione**                 | profession / occupation |
| **il mestiere**                    | trade / job             |
| **il medico**                      | doctor / physician      |
| **l'impiegato/a (di banca)**       | (bank) clerk / employee |
| **il/la giardiniere/a**            | gardener                |
| **il/la giornalista**              | journalist              |
| **l'archeologo/l'archeologa**      | archaeologist           |
| **il poliziotto, la poliziotta**   | police officer          |
| **l'architetto/l'architettodonna** | architect               |
| **l'insegnante**                   | teacher                 |
| **il professore/la professoressa** | teacher / professor     |
| **il dottore, la dottoressa**      | doctor                  |


**Cosa fanno i poliziotti?** 


|                                             |                                            |
| ------------------------------------------- | ------------------------------------------ |
| **italiano**                                | **english**                                |
| **(creare) un profilo**                     | (to create) a profile                      |
| **informare (il pubblico)**                 | to inform (the public)                     |
| **fare un'indagine**                        | to carry out an investigation              |
| **lottare contro la criminalità**           | to fight against crime                     |
| **fare la scorta a**                        | to provide bodyguard protection for        |
| **inscenare (un caso)**                     | to stage (a case)                          |
| **(spiegare) la particolarità (di uncaso)** | (to explain) the particularity (of a case) |


**Scuola e formazione** 


|                                |                                  |
| ------------------------------ | -------------------------------- |
| **italiano**                   | **english**                      |
| **il liceo artistico**         | art high school                  |
| **il liceo classico**          | classical/humanistic high school |
| **il liceo scientifico**       | scientific high school           |
| **il liceo linguistico**       | linguistic high school           |
| **il liceo musicale**          | music high school                |
| **la formazioneprofessionale** | vocational training              |
| **il passaggio**               | transition / passage             |
| **la scuola primaria**         | primary school                   |
| **la scuola secondaria**       | secondary school                 |
| **l'obbligo (d'istruzione)**   | (school) obligation              |
| **lo stage; lo/la stagista**   | internship; intern               |


**Le parti del corpo** 


|                                    |             |
| ---------------------------------- | ----------- |
| **italiano**                       | **english** |
| **il braccio, pl. le braccia**     | arm         |
| **la mano, pl. le mani**           | hand        |
| **il ginocchio, pl. le ginocchia** | knee        |
| **l'occhio**                       | eye         |
| **la testa**                       | head        |
| **il naso**                        | nose        |
| **il labbro, pl. le labbra**       | lip         |
| **l'orecchio, pl. le orecchie**    | ear         |
| **il piede**                       | foot        |
| **i capelli**                      | hair        |
| **la spalla**                      | shoulder    |
| **il dito, pl. le dita**           | finger      |
| **il cuore**                       | heart       |
| **la gamba**                       | leg         |
| **il muscolo**                     | muscle      |
| **il dito**                        | toe         |


**Ancora caratteristiche** 


|                      |                       |
| -------------------- | --------------------- |
| **italiano**         | **english**           |
| **rilassato, -a**    | relaxed               |
| **disponibile**      | available             |
| **umano, -a**        | human                 |
| **magnifico, -a**    | magnificent / great   |
| **carismatico, -a**  | charismatic           |
| **orgoglioso, -a**   | proud                 |
| **geniale**          | brilliant / genius    |
| **(super)potente**   | (super)powerful       |
| **(ultra)sensibile** | (ultra)sensitive      |
| **sincero, -a**      | sincere / honest      |
| **responsabile**     | responsible           |
| **flessibile**       | flexible              |
| **duro, -a**         | hard / tough          |
| **snello, -a**       | slim                  |
| **distrutto, -a**    | destroyed / exhausted |
| **pigro, -a**        | lazy                  |
| **vegano, -a**       | vegan                 |


**La tecnologia** 


|                      |                          |
| -------------------- | ------------------------ |
| **italiano**         | **english**              |
| **l'esperto/a**      | expert                   |
| **programmare**      | to program               |
| **utilizzare**       | to use                   |
| **il materiale**     | material                 |
| **il modello**       | model                    |
| **magnetico, -a**    | magnetic                 |
| **chimico, -a**      | chemical                 |
| **la base(chimica)** | (chemical) base          |
| **il comando**       | command / control        |
| **la trasmissione**  | transmission / broadcast |
| **la radio**         | radio                    |
| **il frigorifero**   | refrigerator             |
| **il ventilatore**   | fan / ventilator         |
| **lo schermo**       | screen                   |
| **il robot**         | robot                    |


