# AKT 4.0 — Camera tua (Erzähler-Brücke)

**Hard Facts**

•       **Ort:** Wohnung der Gastfamilie Ferrari, Zimmer der Spielfigur (Morgenszene)

•       **NPCs:** keine

•       **Aufgaben:** keine

•       **Folgeakt:** Karte öffnet sich, ein neuer Pin wird freigeschaltet (Giardini Margherita)

**Hinweise für das technische Team**

•       Reine Erzähler-Eröffnung des Akts, keine Interaktion außer „Weiter"-Buttons

•       Hintergrund: Zimmer der Spielfigur am Morgen, Sonnenlicht durchs Fenster. Souvenirs der bisherigen Akte sichtbar (Made-in-Italy-Zeitschrift, Bologna-Flyer)

•       Nach der letzten Erzähler-Box: Karten-View öffnet sich, ein neuer Pin (Giardini Margherita) leuchtet auf

•       Konsistenzcheck mit Avatar-Customization und Fortschritt aus Akt 1, 2 und 3

**Szene**

[Narratore] Un nuovo giorno a Bologna. Il sole entra caldo nella tua camera. Sulla scrivania ci sono i ricordi dei tuoi giorni precedenti: la rivista „Made in Italy" di Lorenzo, il volantino del Museo della Storia di Bologna.

[Monologo interiore] Oggi è sabato — niente scuola. La signora Ferrari ieri mi ha detto che i Giardini Margherita sono particolarmente belli in questo periodo: fiori d'estate, tanta gente fuori. Una bella giornata per una passeggiata.

[Narratore] Sulla mappa di Bologna si illumina un nuovo posto: i Giardini Margherita.

→ Übergang zur Karte

# AKT 4.1 — Sara ai Giardini Margherita

**Hard Facts**

•       **Ort:** Giardini Margherita, der größte Park von Bologna

•       **Zeitpunkt:** Vormittag, am Tag nach Akt 3

•       **NPCs:** Sara (Klassenkameradin der Spielfigur am Liceo Galvani, ca. 17, gerade aus den Sommerferien in Sizilien zurück, traurig wegen Trennung von Marco)

•       **Aufgaben:** 3 (Freitext Foto-Beschreibung, Lückentext Konjunktiv/Infinitiv, Fehlersuche Konjunktiv vs. Infinitiv)

•       **Lernziele:** Über visuelle Eindrücke und Erlebnisse berichten (Bildbeschreibung); Konjunktiv vs. Infinitiv (L'infinito invece del congiuntivo bei gleichem Subjekt); Verben/Präpositionen, die den Infinitiv verlangen; Pronomen und Präpositionen im Kontext

•       **Belohnung:** tbd

•       **Folgeakt:** Spieler kehrt zur Karte zurück, 4.2 wird freigeschaltet

**Hinweise für das technische Team**

•       Sara braucht Sprite-Designs (triste/abbattuta, leggermente sorridente, riconoscente)

•       Hintergrund: Giardini Margherita — paesaggio del parco con alberi, panchina, sullo sfondo il laghetto. Atmosfera estiva, alcuni passanti come statisti

•       Avatar der Spielfigur sitzt mit Sara auf einer Parkbank

•       Aufgabe 1 (Foto-Beschreibung): 4 Buchfotos aus S. 72-73 werden angezeigt. 3 sind vorbeschriftet, Foto D muss die Spielfigur per Freitext beschreiben. LLM-Bewertung

•       Aufgabe 2: 1:1 Übernahme von Esercizio 2 „Sara rivuole Marco?" (S. 75). Freitext-Eingabe pro Lücke mit Auto-Check

•       Aufgabe 3 (Fehlersuche): 5 Sätze von Sara mit jeweils einer markierten Verbform. Spieler klickt auf den Fehler und tippt die Korrektur

•       Buchverweise: S. 72-73 (Ingresso, Fotos), S. 74 (A1 + Occhio alla lingua), S. 75 (Esercizio 2)

**Szene**

[Narratore] Cammini per i Giardini Margherita. Il sole splende, le famiglie fanno picnic sull'erba, qualcuno suona la chitarra sotto un albero. Su una panchina vicino al laghetto c'è una ragazza seduta, un po' rannicchiata su se stessa — e guardandola meglio la riconosci: è Sara, una compagna di classe del Liceo Galvani. Sembra triste.

[Monologo interiore] Quella è Sara della mia classe. La settimana scorsa era ancora in Sicilia con il suo ragazzo Marco — me ne ha parlato spesso. Ma adesso non sembra che abbia bei ricordi. Vado a salutarla.

[Risposta del giocatore] „Ciao Sara! Tutto bene? Posso sedermi qui un attimo?"

[Sara] „Oh ciao... sì, certo. Scusami, sono un po' giù oggi. È da quando sono tornata da Palermo... insomma, è successa una cosa. Ma dai, raccontami tu! Com'è stata la tua settimana? Senti, ho ancora qualche foto della Sicilia sul telefono — vuoi vedere?"

[Narratore] Sara prende il telefono e ti mostra quattro foto della sua vacanza estiva. Tre di queste le ha già descritte brevemente nel suo diario — per la quarta ti chiede aiuto.

[Sara] „Senti, queste tre le ho già descritte per il mio diario di viaggio. Ma per quest'ultima non trovo le parole... mi aiuteresti tu? Descrivimela tu in italiano!"

**Esercizio 1 — Le foto di Sara**

**Aufgabentyp:** Freitext (LLM-bewertet)   

**Lernziel:** Über visuelle Eindrücke berichten, Bildbeschreibung auf B1-Niveau, lexikalische Variabilität   

**Hinweis Technik:** Vier Buchfotos werden angezeigt. Foto A, B und C sind mit kurzen Beschreibungen vorbeschriftet. Foto D ist leer — Spielfigur muss per Freitext mind. 2-3 Sätze schreiben. LLM bewertet inhaltliche Plausibilität, B1-Niveau, korrekte Verbformen. LLM-Prompt enthält Avatar-Geschlecht für Adjektiv-Kongruenz im Feedback.   

**Quelle:** Scambio 2 plus, S. 72-73 (Ingresso Lezione 4, Fotos A-D).

Guarda le quattro foto del viaggio di Sara in Sicilia. Per tre foto Sara ha già scritto una breve descrizione. La quarta foto è ancora senza descrizione: scrivi tu almeno 2-3 frasi per descriverla. Usa un vocabolario vario e fai attenzione ai verbi.

 

**Foto A — Acqua Verde**

Descrizione (data): "Questa foto mostra Acqua Verde, un grande parco acquatico che si trova a solo un'ora da Palermo. Si vedono delle persone che scendono dagli scivoli — sembra che si stiano divertendo tantissimo! Ci sono andata con la mia famiglia il secondo giorno della vacanza."

**Foto B — Al mercato di Palermo**

Descrizione (data): "In questa foto sono al mercato di Palermo. Indosso un cappello di paglia per ripararmi dal sole e sto assaggiando un succo d'arancia fresco. I mercati siciliani sono pieni di colori, di profumi e di gente — adoro questa atmosfera."

**Foto C — Il mercato della Vucciria**

Descrizione (data): "Questo è il famoso mercato della Vucciria a Palermo. Si vedono bancarelle di frutta e verdura coloratissime: arance, limoni, peperoni rossi. È stato meraviglioso girare tra le bancarelle e parlare con i venditori — tutti sono stati gentilissimi con noi turisti."

**Foto D — La cattedrale di Palermo (DA DESCRIVERE)**

[Campo di testo libero per il giocatore]



**Esempio di buona risposta (per la valutazione LLM):**

"In questa foto si vede la cattedrale di Palermo, una delle chiese più importanti della città. Davanti alla cattedrale c'è una carrozza con un cavallo — un modo tradizionale di visitare il centro storico di Palermo. La luce del sole rende l'architettura ancora più bella. Mi piacerebbe tantissimo fare un giro così la prossima volta che vado in Sicilia."



[Sara] „Grazie! Allora, ora che hai visto le mie foto... posso essere sincera con te? Devo proprio sfogarmi un po'."

[Risposta del giocatore] „Certo, dimmi pure. Cos'è successo?"

[Sara] „Marco mi ha lasciata. Sì, proprio lui. Eravamo insieme da sette mesi e sembrava tutto perfetto — soprattutto dopo l'estate a Palermo. E poi stamattina, mentre andavo a scuola... un messaggio sul telefono. Solo un messaggio! Mi ha scritto che non mi ama più e che non è più sicuro di volere stare con me. Senza nessun perché. Senza neanche guardarmi in faccia."

[Sara] „E adesso non voglio andare a scuola. Non posso. Marco va in un'altra scuola adesso, è con Laura — ma le nostre amiche sono tutte là, e non voglio piangere davanti a tutti."

[Monologo interiore] Povera Sara. Vediamo se posso aiutarla a mettere in ordine i suoi pensieri. Mi sta dicendo cose un po' contraddittorie — un momento vuole dimenticare Marco, un momento dopo dice che lo rivuole. Forse possiamo parlarne insieme.

[Sara] „Mi aiuti a capire cosa voglio davvero? Ti dico delle frasi, e tu mi aiuti a completarle. Forse parlando con qualcuno ci vedo più chiaro."

**Esercizio 2 — Sara rivuole Marco?**

**Aufgabentyp:** Lückentext   

**Lernziel:** Wahl zwischen congiuntivo presente und infinito (mit/ohne Präposition) nach Verben wie volere che, è importante che, è meglio che, bastare; korrekte Verwendung von che, cui, mi, più, proprio   

**Hinweis Technik:** Pro Lücke Freitext-Eingabe mit Auto-Check. Verben mit Hilfsangabe in Klammern. Wortbank für Pronomen/Präpositionen sichtbar.   

**Quelle:** Scambio 2 plus, S. 75, Esercizio 2 „Sara rivuole Marco?" (1:1 übernommen). Spielfigur übernimmt die Rolle von Federica.

Mentre accompagni Sara a casa sua, parlate ancora un po'. Metti i verbi in parentesi al congiuntivo o all'infinito e completa con le parole mancanti (preposizioni con o senza articolo, che, cui, mi, più, proprio).

**Wortbank: che — cui — mi — più — proprio**



Sara:        Senti Federica, io rivorrei Marco, ma forse sta insieme con Laura. Per me è importante ___ (io, conoscere) la verità e ___ (tu, mi aiutare).

Tu:            Ma dai. Marco sarebbe ___ stupido, perché tu sei mille volte ___ bella e intelligente di lei. E poi è meglio ___ (tu, non sapere) la verità, Sara.

Sara:        Ma devo comunque sapere la verità. Basta ___ (io, andare) ___ bar ___ gli piacciono ___ sapere se è uscito con lei. ___ (accompagni)?

Tu:            Sara, ascoltami. Non mi piace per niente quest'idea. È importante ___ (tu, guardare) avanti. È veramente meglio ___ (tu, non pensare) più ___ quello stupido. Secondo me, è improbabile ___ (Marco e Laura, andare) negli stessi bar in ___ andavate voi.

Sara:        Boh, tanto, hai detto che è stupido, no?! Ah ah. Ti ringrazio tanto Fede. È bellissimo ___ (io, avere) un'amica come te.



**Soluzioni in ordine:**

io conosca — tu mi aiuti — proprio — più — che tu non sappia — che io vada — al — che — di — Mi accompagni — che tu guardi — di non pensare — a — che Marco e Laura vadano — cui — di avere



[Sara] „Sai una cosa? Forse hai ragione. Forse non lo voglio nemmeno più, Marco. È che... fa male, sai? Dimmi una cosa: secondo te, sto dicendo cose sensate o sto solo girando in tondo? Senti queste frasi che mi escono dalla bocca — ti suonano giuste?"

**Esercizio 3 — Trova gli errori**

**Aufgabentyp:** Fehlersuche   

**Lernziel:** Erkennen, wann der congiuntivo durch den infinito ersetzt werden muss (gleiches Subjekt in Haupt- und Nebensatz) und wann nicht (verschiedene Subjekte → congiuntivo)    **Hinweis Technik:** 5 Aussagen von Sara werden gezeigt, je mit einer markierten Verbform. Spieler klickt auf das falsche Verb (rot markiert bei Klick) und tippt die korrekte Form in ein Eingabefeld daneben. Bei richtiger Korrektur: visuelles Feedback.   

**Quelle:** Eigene Aufgabenerstellung, didaktisch fundiert auf Scambio 2 plus, S. 74 (Occhio alla lingua „L'infinito invece del congiuntivo" + G 4.1, G 4.2).

Sara è confusa e dice delle frasi sbagliate. In ogni frase c'è un verbo che NON va bene: o usa il congiuntivo quando dovrebbe usare l'infinito (perché il soggetto è lo stesso), o usa l'infinito quando dovrebbe usare il congiuntivo (perché i soggetti sono diversi). Clicca sul verbo sbagliato e scrivi la forma giusta.



1. Sara: „Voglio che io dimentichi Marco al più presto possibile."

    → Errore: "che io dimentichi". Forma corretta: dimenticare

    Spiegazione: stesso soggetto (Sara vuole, Sara dimentica) → infinito senza che.



2. Sara: „Spero di Marco mi chiami stasera per spiegarmi tutto."

    → Errore: "di Marco mi chiami". Forma corretta: che Marco mi chiami

    Spiegazione: soggetti diversi (io spero, Marco chiama) → che + congiuntivo.



3. Sara: „Penso di essere stata troppo gelosa con lui."

    → Frase CORRETTA. (Trabocchetto: stesso soggetto, infinito passato giusto.) Se il giocatore clicca, riceve feedback: „Questa frase è giusta!"



4. Sara: „È meglio che io non vedere Marco a scuola domani."

    → Errore: "che io non vedere". Forma corretta: che io non veda

    Spiegazione: dopo è meglio che serve il congiuntivo.



5. Sara: „Federica, ti ringrazio di tu sei una buona amica."

    → Errore: "di tu sei". Forma corretta: che tu sei (oppure: di essere una buona amica — ma cambia il significato)

    Spiegazione: soggetti diversi (io ringrazio, tu sei) → che + indicativo.



**Soluzioni (sintesi):**

1. dimenticare — 2. che Marco mi chiami — 3. CORRETTA — 4. che io non veda — 5. che tu sei

 

[Sara] „Sei davvero gentile. Mi sento già un po' meglio. Sai cosa? Stasera scrivo nel mio diario tutto quello che mi hai detto. Magari domani sto già meglio. A proposito... posso scriverti più tardi? Mi farebbe piacere parlare ancora."

[Risposta del giocatore] „Certo, Sara. Ci sentiamo stasera. E vedrai, andrà tutto bene."

[Monologo interiore] Povera Sara. Stasera, quando sono a casa, le scrivo una mail. Forse posso trovare qualche consiglio buono per consolarla — ho letto un articolo tedesco interessante proprio su questo argomento. Potrei riassumerle le idee principali.

[Narratore] Saluti Sara con un abbraccio. Sulla mappa di Bologna si illumina un nuovo posto: casa della famiglia Ferrari (la sera).

# AKT 4.2 — Una mail per consolare Sara

**Hard Facts**

•       **Ort:** Wohnung der Gastfamilie Ferrari, Schreibtisch im Zimmer der Spielfigur (abends)

•       **Zeitpunkt:** Abend desselben Tages, nach 4.1

•       **NPCs:** keine (nur Erzähler und innerer Monolog; Sara als E-Mail-Adressatin)

•       **Aufgaben:** 1 (Mediation: Trost-E-Mail an Sara, basierend auf einem deutschen Artikel)

•       **Lernziele:** Sprachmittlung Deutsch → Italienisch, Zusammenfassen eines Sachtextes mit kommunikativem Ziel, informelle E-Mail (Anrede/Schlussformel), Konjunktiv/Infinitiv im Kontext von Empfehlungen

•       **Belohnung:** tbd

•       **Folgeakt:** Spieler kehrt zur Karte zurück, 4.3 wird freigeschaltet

**Hinweise für das technische Team**

•       Hintergrund: Schreibtisch der Spielfigur im Zimmer, Laptop offen, Abendlicht / Schreibtischlampe an

•       Der deutsche Artikel „Wie tröste ich jemanden bei Liebeskummer?" wird als lesbares In-Game-Dokument dargestellt (Pop-up oder Overlay), aufrufbar während der Aufgabe über einen Button „Articolo originale"

•       Deutscher Originalartikel bleibt deutsch (= Mediations-Quelltext, 1:1 aus Buch S. 81)

•       Aufgabenstellung komplett auf Italienisch

•       Freitext-Eingabefeld für die E-Mail (mind. 80-120 Wörter empfohlen). LLM-Bewertung auf: inhaltliche Übertragung der Tipps, Konjunktiv/Infinitiv, Anrede/Schlussformel, B1-Korrektheit

•       LLM-Prompt enthält Avatar-Geschlecht für korrekte Adjektiv-Kongruenz im Feedback

•       Buchverweis: S. 81 (Esercizio 7 „I consigli di Melina")

**Szene**

[Narratore] Sei tornato/a nella tua camera a casa Ferrari. È sera, la lampada sulla scrivania illumina il laptop con una luce calda. Fuori sta lentamente facendo buio.

[Monologo interiore] Sara mi ha fatto pena oggi. Ho appena cercato in internet un articolo in tedesco — sul mal d'amore e su come consolare qualcuno. Esattamente quello di cui Sara ha bisogno adesso. Prendo i consigli più importanti e le scrivo una mail in italiano.

[Narratore] Apri l'articolo „Wie tröste ich jemanden bei Liebeskummer?" sul tuo laptop. Accanto, una finestra di posta vuota, indirizzata a Sara.

**Articolo originale (in tedesco):**

**Wie tröste ich jemanden bei Liebeskummer?**

Daniela van Santen ist Liebeskummer-Coach. Zu ihr kommen Menschen, die vor lauter Liebeskrankheit nicht mehr weiterwissen. Auf die Frage, was das Wichtigste beim Trösten sei, rät sie, dass es im Grunde nur ein optimales Vorgehen gebe: „Zuhören, zuhören, zuhören, trösten und nachfragen, wie es so geht. Und zwar immer und immer wieder. Lieber zu häufig als zu selten." Unglücklich Verliebte neigen oft dazu, die Geschichten, die sie belasten, so oft zu erzählen, bis man sie simultan mitsprechen kann. Und spätestens beim zehnten Mal verliert auch die beste Freundin ein wenig die Geduld. „Doch in der Trösterposition darf man niemals sagen, dass es jetzt genug sei", betont Daniela van Santen. „Sprüche wie ‚Jetzt reiß dich mal zusammen' sind vollkommen unangebracht."

**Fünf Tipps für den perfekten Liebeskummertrost:**

1. Zuhören, Zuhören und fragen! Auch wenn der Betroffene die Geschichte zum 100sten Mal erzählt, muss man da als guter Freund/gute Freundin durch. Mit der eigenen Meinung hinter dem Berg halten, denn die spielt in der ersten Zeit keine Rolle. Die betroffene Person möchte sich jetzt eigentlich nur aussprechen und ausweinen.

2. Sprich auf keinen Fall über deine eigenen Erfahrungen. Die gute Idee dahinter, nach dem Motto „Mir ging es doch auch schon mal so schlecht", bringt in diesem Fall keinen Trost.

3. Behalte Sprüche wie „Das wird schon wieder", „Andere Mütter haben auch hübsche Söhne/Töchter" für dich. Bei wirklichem Liebeskummer sind sie unangebracht, sie helfen nicht weiter, und die betroffene Person fühlt sich nicht ernst genommen, wird vielleicht sogar traurig oder wütend.

4. Sich die Rachegedanken des Gegenübers anzuhören ist eine Sache — zu ermuntern oder sogar beim Umsetzen zu helfen, strikt verboten. Rachegedanken helfen beim Verarbeiten, durchziehen sollte man sie nie. Später wird man sich nur dafür schämen.

5. Bitte niemals von der eigenen glücklichen Beziehung erzählen. Für diese Gespräche müssen dann andere Freunde herhalten, denn Personen mit Liebeskummer tut so etwas einfach nur zu weh.

(Fonte: [http://jetzt.sueddeutsche.de/texte/anzeigen/562054](http://jetzt.sueddeutsche.de/texte/anzeigen/562054), Marie-Charlotte Maas, 6.04.2016)

 

**Esercizio 1 — Scrivi una mail di consolazione a Sara**

**Aufgabentyp:** Freitext-Mediation (LLM-bewertet)   

**Lernziel:** Sprachmittlung Deutsch → Italienisch, Zusammenfassen mit kommunikativem Ziel (Trösten), Konjunktiv/Infinitiv, informelle Anrede- und Schlussformeln   

**Hinweis Technik:** Freitext-Eingabe (80-120 Wörter empfohlen). LLM bewertet inhaltliche Übertragung, kommunikative Wirkung, Konjunktiv/Infinitiv, informellen Stil, B1-Korrektheit. Avatar-Geschlecht im LLM-Prompt für Adjektiv-Kongruenz im Feedback.   

**Quelle:** Scambio 2 plus, S. 81, Esercizio 7 „I consigli di Melina" (deutscher Quelltext 1:1; Setting angepasst: Spielfigur schreibt direkt an Sara).

Hai trovato un articolo in tedesco con consigli su come consolare qualcuno che ha il mal d'amore. Riassumi i consigli più importanti in una mail in italiano a Sara. Spiegale cosa, secondo i consigli, dovresti e non dovresti fare per aiutarla. Usa il congiuntivo e l'infinito dove serve.

**Suggerimenti per il tuo testo:**

•       Comincia con un saluto informale (es. "Cara Sara," / "Ciao Sara,")

•       Riassumi 3-4 dei consigli dell'articolo (cosa devi fare, cosa non devi fare)

•       Adatta i consigli alla situazione di Sara

•       Chiudi con una frase di incoraggiamento e una formula di saluto (es. "Un abbraccio," / "A presto,")

•       Lunghezza: 80-120 parole circa



**Esempio di buona risposta (per la valutazione LLM):**

"Cara Sara, ho pensato molto a te oggi. Ho letto un articolo interessante sul mal d'amore e voglio condividere con te quello che ho imparato. Per prima cosa, voglio che tu sappia che sono qui per ascoltarti — anche se mi ripeti la stessa storia mille volte. È normale aver bisogno di parlare. Però non ti dirò mai "basta, dimentica Marco", perché so che non aiuta. Penso che sia importante che tu prenda i tuoi sentimenti sul serio, anche quelli di rabbia. Ma evita di fare cose di cui poi ti pentirai. E ricorda: non sei sola. Un grande abbraccio, [Nome]"



**Criteri di valutazione (per il LLM):**

•       Trasferimento contenutistico: almeno 3 dei 5 consigli dell'articolo ripresi

•       Adattamento alla situazione di Sara (non solo riassunto neutro)

•       Uso corretto del congiuntivo (dopo voglio che, penso che, è importante che) e dell'infinito (stesso soggetto, dopo preposizioni)

•       Saluto iniziale informale (Cara/Ciao + nome) e formula di chiusura adeguata

•       Correttezza grammaticale a livello B1; tono empatico e amichevole



[Monologo interiore] Salvo... invio! Spero che la aiuti un po'. Domani sicuramente ci vediamo a scuola.

[Narratore] Chiudi il laptop e vai a dormire. Domattina sulla mappa di Bologna sarà visibile un nuovo posto: casa della famiglia Ferrari (il giorno dopo).

# AKT 4.3 — L'invito a Comacchio

**Hard Facts**

•       **Ort:** Wohnung der Gastfamilie Ferrari, Zimmer der Spielfigur (Folgetag, Vormittag)

•       **Zeitpunkt:** Vormittag des Tages nach Akt 4.2

•       **NPCs:** Sara (per Sprachnachricht/WhatsApp) — kein direktes Sprite nötig

•       **Aufgaben:** 2 (Multiple Choice zur Einladung, Lückentext SMS an Mutter)

•       **Lernziele:** Detailgenaues Leseverstehen einer Einladung, Informationsentnahme, informelles Berichten in SMS-Form, Konjunktionen (II) wie comunque, non solo ... ma anche, da una parte ... dall'altra, tutto sommato

•       **Belohnung:** tbd

•       **Folgeakt:** Übergang zur Bonus-Aufgabe, danach Akt 5

**Hinweise für das technische Team**

•       Hintergrund: Zimmer der Spielfigur am Vormittag, Tageslicht durchs Fenster. Smartphone in der Hand der Spielfigur

•       Sprachnachricht-/WhatsApp-Chat-UI: zuerst Sprachnachricht von Sara (als Text dargestellt mit Audio-Symbol), dann weitergeleitete „INVITO"-Nachricht von Giulia

•       Comacchio-Einladung (S. 82-83) muss als lesbares In-Game-Dokument dargestellt werden (Pop-up oder Overlay), aufrufbar während Aufgabe 1 und 2

•       Einladungstext: 1:1 aus dem Buch S. 82-83 übernommen

•       Aufgabe 1: 4 MC-Fragen mit je 3 Antwortoptionen

•       Aufgabe 2: SMS-Chat-UI mit Mutter. 8 SMS-Anfänge aus Buch S. 84 in chronologischer Reihenfolge. Pro SMS Freitext-Eingabe mit Auto-Check. Mehrere richtige Lösungen möglich

•       Buchverweise: S. 82-83 (B1 Comacchio-Einladung), S. 84 (Esercizio 1 „Che ne dirà la mamma?")

**Szene**

[Narratore] La mattina dopo ti svegli e vedi un messaggio vocale sul telefono. È di Sara.

[Sara — messaggio vocale] „Ehi, ciao! Senti, ho letto la tua mail ieri sera — non posso dirti quanto mi ha aiutato. Davvero, grazie di cuore. E ho una sorpresa per te: ho parlato con Giulia, la mia migliore amica di Comacchio, e... insomma, ti inoltro il messaggio che mi ha mandato. Vuole invitare anche te! Guarda e dimmi cosa ne pensi!"

[Monologo interiore] Comacchio? Sara me ne ha parlato — la piccola città con i canali, a sud di Venezia. Diamo un'occhiata all'invito.

[Narratore] Sara ti inoltra un messaggio della sua amica Giulia. È un invito colorato con tante foto: „INVITO — Divertiti nella Pianura Padana!"

**L'Invito di Giulia**

**Hinweis Technik:** Dieser Text wird als In-Game-Dokument dargestellt (Pop-up oder Overlay). Während Esercizio 1 und 2 muss der Text per Button „Vedi l'invito" aufrufbar bleiben.

**INVITO**

Come superare la fine di una storia d'amore e rinascere più forti di prima! Un weekend a Comacchio — i rimedi contro il mal d'amore esistono davvero!

Vietati sono però i pensieri negativi e la nostalgia!

Si chiamano cioccolato, gelato, ballare, fenicotteri, risotto di mare, spaghetti ai crostacei (la nostra specialità!!!) e budino (non guasta mai 😊). Ma soprattutto ... AMICIZIA!

Ti invito a visitare la mia bellissima città, la „piccola Venezia" con tutti i suoi canali. Comacchio nasce e vive tra terra e acqua. Da una parte trovi il mare, dall'altra Il Parco del Delta del Po.

Che ne dici? La sera andiamo al cinema, in pizzeria o restiamo a casa per una festa in pigiama e mangiamo un chilo di Nutella... scegli tu!

Tutto sommato sarà il weekend ideale per due ragazze favolose come noi! La vita è bella nonostante tutto — perciò ne dobbiamo approfittare pienamente! TVB Giulia



**Programma: i 5 passi contro il mal d'amore**

(A) 1° passo — Abbiamo cinque spiagge che sono ideali per il nostro weekend di relax. Non solo per riposarci al sole..., ma anche per cancellare i tuoi ricordi!

(B) 2° passo — Visitiamo il Ponte degli Sbirri, il Palazzo Bellini e poi il celebre Trepponti, tutti i nostri bellissimi monumenti che ti mostrano la bellezza della vita.

(C) 3° passo — Non dimentichiamo il tramonto... l'orizzonte si colora di effetti straordinari... il benessere è garantito!

(D) 4° passo — Prima facciamo una passeggiata lungo Il Loggiato dei Cappuccini, il più lungo d'Italia, e dopo andiamo in bici, forse vedremo persino qualche fenicottero? (una bella sorpresa!)

(E) 5° passo — E se il tempo sarà brutto... ? Non ti preoccupare! Comunque si può sempre andare al museo... poco lontano si trova il Museo d'Arte Contemporanea Remo Brindisi dove si trova una ricca collezione d'arte del Novecento: Picasso, Andy Warhol e Giorgio De Chirico e... molti altri.

 

**Esercizio 1 — Hai capito l'invito?**

**Aufgabentyp:** Multiple Choice   

**Lernziel:** Detailgenaues Leseverstehen einer Einladung, Identifikation von Programmpunkten, Orten und Aktivitäten   

**Hinweis Technik:** 4 Fragen mit je 3 Antwortoptionen. Einladung bleibt aufrufbar.   

**Quelle:** Scambio 2 plus, S. 82-83, B1 (Einladung 1:1, Fragen eigene Erstellung).

Leggi attentamente l'invito di Giulia. Poi rispondi alle domande.



1. Perché Giulia invita Sara (e te) a Comacchio?

•       a) Per festeggiare il compleanno di Giulia.

•       b) Per aiutare Sara a superare il mal d'amore.

•       c) Per visitare il Parco Nazionale del Po insieme.



2. Quante spiagge ci sono vicino a Comacchio secondo l'invito?

•       a) Tre

•       b) Cinque

•       c) Sette



3. Qual è una specialità della cucina di Giulia?

•       a) Il risotto di mare e gli spaghetti ai crostacei

•       b) I tortellini al ragù e la mortadella

•       c) La pizza Margherita e il gelato al cioccolato



4. Cosa propone Giulia in caso di brutto tempo?

•       a) Restare a casa per una festa in pigiama con la Nutella

•       b) Andare al Museo d'Arte Contemporanea Remo Brindisi

•       c) Visitare il Trepponti e il Palazzo Bellini



**Soluzioni: 1-b, 2-b, 3-a, 4-b**



[Sara — messaggio vocale 2] „Allora, che ne pensi? Vieni anche tu? Sarebbe bellissimo! E senti — devi dire ai tuoi genitori della Germania, no? Magari scrivi a tua mamma. Comunque, fammi sapere appena puoi!"

[Monologo interiore] Un viaggio a Comacchio! Certo che voglio venire. Ma a mamma in Germania devo proprio scriverlo — altrimenti si preoccupa. Le racconto dell'invito.

**Esercizio 2 — SMS alla mamma ("Che ne dirà la mamma?")**

**Aufgabentyp:** Lückentext (SMS-Form)    **Lernziel:** Informelles Berichten, Wiedergabe von Informationen aus einem Sachtext (Einladung), Verwendung der Konjunktionen II    **Hinweis Technik:** SMS-Chat-UI mit Mutter als Adressatin. 8 SMS-Anfänge in chronologischer Reihenfolge. Pro SMS Freitext-Eingabe mit Auto-Check; mehrere richtige Lösungen möglich. Einladung bleibt aufrufbar.    **Quelle:** Scambio 2 plus, S. 84, Esercizio 1 „Che ne dirà la mamma?" (SMS-Anfänge 1:1 übernommen; Adressatin auf Spielfigurs deutsche Mutter angepasst).

Scrivi dei messaggi a tua mamma per raccontarle dell'invito. Completa le frasi usando le informazioni dell'invito di Giulia.



Mamma, ascolta che bello! 😍

 

[16:03]    1. Giulia è grande! Mi ha ___

[16:05]    2. Giulia ha preparato un ___

[16:07]    3. Comacchio si chiama anche ___

[16:10]    4. Ci sono cinque ___

[16:13]    5. Se il tempo sarà brutto, ___

[16:15]    6. La sera andiamo ___

[16:17]    7. Lei ha scritto di quattro ___

[16:21]    8. Vietati sono ___

 

**Esempi di soluzioni (mehrere richtige Antworten möglich):**

1. ...invitata a Comacchio (con Sara) per un weekend / ...invitata a passare un weekend a Comacchio per superare il mal d'amore di Sara.

2. ...programma fantastico / ...invito con cinque passi contro il mal d'amore / ...weekend pieno di attività.

3. ...„piccola Venezia" perché ha tanti canali / ...„piccola Venezia", perché nasce e vive tra terra e acqua.

4. ...spiagge ideali per riposarsi al sole e cancellare i ricordi tristi.

5. ...andiamo al Museo d'Arte Contemporanea Remo Brindisi (dove ci sono opere di Picasso, Andy Warhol e Giorgio De Chirico).

6. ...al cinema, in pizzeria o restiamo a casa per una festa in pigiama (e mangiamo Nutella).

7. ...passi contro il mal d'amore (le spiagge, i monumenti come il Trepponti, il tramonto, la passeggiata al Loggiato dei Cappuccini).

8. ...i pensieri negativi e la nostalgia.



[Sara — messaggio vocale 3] „Allora? Hai detto a tua mamma? Allora, ti aspettiamo a Comacchio! Sarà fantastico, vedrai!"

[Monologo interiore] Fatto! La mamma mi ha già risposto e va benissimo. Un weekend a Comacchio con Sara e Giulia — sarà bellissimo. Ma prima dovrei ripassare ancora i vocaboli di questa lezione, prima di tornare a scuola domani.

[Narratore] Metti via il telefono. Davanti a te il libro d'italiano è aperto — è ora di un piccolo esercizio di vocabolario.

# Fine Akt 4 — Übergang zur Bonus-Aufgabe

**Hard Facts**

•       **NPCs:** keine

•       **Aufgaben:** 1 Bonus-Aufgabe (Vokabel-Matching)

•       **Belohnung:** Pizzastücke (Empfehlung: 2 Stück bei vollständig richtiger Lösung)

•       **Folgeakt:** Übergang zu Akt 5

**Hinweise für das technische Team**

•       Erzähler-Übergang schließt Akt 4 ab und führt direkt zur Bonus-Aufgabe

•       Neutraler Bildschirm, kein Hintergrund-Setting, kein Avatar sichtbar

•       Vokabel-Matching: randomisierte Auswahl von 10 Vokabeln aus dem gesamten Pool von Vocabolario Lezione 4 (Ingresso, A1, B, Autocontrollo — Quelle: Scambio 2 plus, S. 190-192)

•       Bei jedem Spieldurchlauf werden andere 10 Vokabeln gezogen

•       Italienische Spalte links (fest), englische Spalte rechts (randomisiert)

•       Belohnung nach Abschluss: Animation + Update im Inventar

**Szene**

[Narratore] Hai completato il quarto capitolo della tua avventura a Bologna. Hai aiutato un'amica in un momento difficile, le hai scritto una mail di consolazione e hai ricevuto un invito speciale per un weekend a Comacchio.

[Narratore] Prima di chiudere il capitolo, mettiti alla prova: quante parole di questa lezione ricordi davvero?

[Info di gioco] Risolvi questo compito bonus per guadagnare fette di pizza extra!

**Esercizio bonus — Matching: parole italiane e inglesi**

**Aufgabentyp:** Matching (Bonus-Aufgabe)

**Lernziel:** Vokabelfestigung Lezione 4

**Quelle:** Scambio 2 plus, Vocabolario Lezione 4 (S. 190-192)

**Hinweis Technik:**

•       Randomisierte Auswahl von 10 Vokabeln aus dem Gesamt-Pool von Vocabolario Lezione 4

•       Vokabel-Pool umfasst alle Vokabeln aus den Wortschatzlisten der Lezione 4 (Ingresso, A1 „Parliamo dell'amore", B „Pianura Padana", Autocontrollo)

•       Italienische Spalte links (in fester Reihenfolge), englische Spalte rechts (randomisiert)

•       Wiederholbarkeit: bei jedem neuen Durchlauf andere 10 Vokabeln

Collega ogni parola italiana al suo equivalente inglese.



**Ingresso**


|                     |                   |
| ------------------- | ----------------- |
| **italiano**        | **english**       |
| la regione autonoma | autonomous region |
| il divertimento     | amusement / fun   |
| il poeta            | poet              |
| il/la musicista     | musician          |
| il successo         | success           |
| la poesia           | poetry / poem     |




**Parliamo dell'amore**


|                                       |                                        |
| ------------------------------------- | -------------------------------------- |
| **italiano**                          | **english**                            |
| innamorarsi (di); innamorato, -a (di) | to fall in love (with); in love (with) |
| rubare (il cuore)                     | to steal (the heart)                   |
| impazzire                             | to go crazy                            |
| fissarsi su                           | to fixate on                           |
| lasciare                              | to leave                               |
| l'emozione f.                         | emotion                                |
| rivolere (il/la partner)              | to want (one's partner) back           |
| risolvere (i problemi d'amore)        | to solve (love problems)               |
| prendere in giro                      | to make fun of / to tease              |
| piangere, part. pass. pianto          | to cry                                 |
| subire                                | to endure / to suffer                  |
| la tortura                            | torture                                |
| vale la pena (di)                     | it's worth it (to)                     |
| all'improvviso                        | suddenly                               |
| togliere, part. pass. tolto           | to take away / to remove               |




**Per tirarti su — Pianura Padana**


|                             |                                |
| --------------------------- | ------------------------------ |
| **italiano**                | **english**                    |
| tirare                      | to pull                        |
| tirare su                   | to cheer up / to lift up       |
| la Pianura Padana           | the Po Valley                  |
| disperato, -a               | desperate                      |
| creativo, -a                | creative                       |
| il rimedio                  | remedy                         |
| il mal d'amore              | lovesickness / heartache       |
| guastare                    | to spoil / to ruin             |
| l'amicizia                  | friendship                     |
| vietare                     | to forbid                      |
| la nostalgia                | nostalgia / homesickness       |
| il canale                   | channel / canal                |
| da una parte ... dall'altra | on one hand ... on the other   |
| la terra                    | earth / land                   |
| il pigiama                  | pyjamas                        |
| favoloso, -a                | fabulous                       |
| nonostante prep.            | in spite of                    |
| TVB (Ti voglio bene)        | I love you (friendship/family) |
| cancellare                  | to cancel / to delete          |
| il ricordo                  | memory / souvenir              |
| il tramonto                 | sunset                         |
| l'orizzonte m.              | horizon                        |




**Per tirarti su (continua)**


|                        |                                  |
| ---------------------- | -------------------------------- |
| **italiano**           | **english**                      |
| il respiro             | breath                           |
| il limite              | limit                            |
| conviene               | it is appropriate / it is better |
| il castello            | castle                           |
| la letteratura         | literature                       |
| strappare              | to tear                          |
| lo strappo             | tear / rupture                   |
| l'effetto              | effect                           |
| in effetti             | indeed                           |
| (essere) in giro       | to be out / to be around         |
| la raccomandazione     | recommendation                   |
| gli occhiali (da sole) | (sun)glasses                     |
| fra/tra                | in / within (time)               |
| pentirsi di qc.        | to regret something              |
| la scrittura           | writing / handwriting            |
| il verso               | verse                            |
| l'illustrazione f.     | illustration                     |
| pericoloso, -a         | dangerous                        |
| il motorino            | moped                            |




**Ulteriori parole (Ingresso allargato / contesto)**


|                               |                                    |
| ----------------------------- | ---------------------------------- |
| **italiano**                  | **english**                        |
| colorare; colorarsi           | to colour; to become coloured      |
| il benessere                  | wellbeing                          |
| garantire                     | to guarantee                       |
| celebre                       | famous                             |
| la collezione                 | collection                         |
| lasciarsi                     | to break up / to part              |
| il senso                      | sense / meaning                    |
| bilingue agg.                 | bilingual                          |
| il carattere                  | character                          |
| il ponte                      | bridge                             |
| l'aeroporto                   | airport                            |
| ciò che                       | that which / what                  |
| ci vuole / ci vogliono        | one needs / it takes               |
| la magia                      | magic                              |
| la citazione                  | quotation                          |
| appendere, part. pass. appeso | to hang up                         |
| estivo, -a                    | summery / summer (adj.)            |
| girare                        | to turn / to go around / to wander |
| il tragitto                   | journey / route                    |
| la plastica                   | plastic                            |
| il graffito                   | graffiti                           |
| rispettare                    | to respect                         |
| il giudice                    | judge                              |
| la lotta                      | fight / struggle                   |
| l'eroe, l'eroina              | hero, heroine                      |
| il muro                       | wall                               |
| lo sguardo                    | look / gaze                        |
| il bacio                      | kiss                               |
| legittimo, -a                 | legitimate                         |
| proibire                      | to forbid                          |
| la scritta                    | inscription / writing              |
| noleggiare                    | to rent                            |
| il gommone                    | rubber dinghy                      |
| condividere                   | to share                           |




**Autocontrollo**


|                              |                        |
| ---------------------------- | ---------------------- |
| **italiano**                 | **english**            |
| sopportare                   | to endure / to bear    |
| considerare                  | to consider            |
| intorno a; guardarsi intorno | around; to look around |


