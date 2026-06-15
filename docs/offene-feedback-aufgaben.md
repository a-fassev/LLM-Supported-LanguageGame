# Offene Feedback-Aufgaben nach Janniks Umsetzung

Stand: 15. Juni 2026

Dieses Dokument enthält nur Aufgaben, die nicht durch Janniks gemeldete Umsetzung abgedeckt sind. Janniks erledigte Punkte sind bewusst entfernt: Logo, Freitext ohne oberes Wortlimit, Sticker-Ueberschriften, Squadre-Karten, MC-Counter, Drag-and-drop-Zweispaltenlayout, Lueckentext-Input-Layout, Kapitelauswahl-Layout, Bonus-Erfolgsoverlay, OpenAI-Wechsel und Replay-Reward-Modus.

## Allgemein: Rewards, Progression und Pilotbetrieb

### 1. Reward-Balancing ueber alle Kapitel pruefen

**Problem:** Im Feedback wird mehrfach gefragt, ob man insgesamt genug Pizzastuecke bekommt, um das ganze Zimmer freizukaufen. Ebenso ist unklar, ob der Rucksack am Ende wirklich 100 Prozent erreichen kann, besonders wenn einzelne LLM-Aufgaben schwach bewertet oder uebersprungen werden.

**Was anders gemacht werden soll:** Es soll eine konsistente Belohnungslogik geben: genug Pizza fuer das Zimmer, ein sinnvoller Puffer fuer nicht perfekte Ergebnisse und ein nachvollziehbarer Rucksack-Fortschritt.

**Weg zur Umsetzung:** Alle `scoring`-Eintraege in `lib/content/chapters/chapter-01` bis `chapter-06` summieren. Danach gegen die Zimmerpreise im Shop abgleichen. Falls die Summe zu knapp ist, gezielt `maxSlices` und/oder Rucksackwerte in den JSONs bzw. Generatoren anpassen. Nicht die technische Reward-Logik aendern, sondern die Content-Belohnungen balancen.

### 2. Pizza bei mehreren Versuchen klaeren

**Problem:** Feedback fragt, ob es gewollt ist, dass man auch nach mehreren Versuchen die volle Pizza-Belohnung bekommt.

**Was anders gemacht werden soll:** Fachlich entscheiden, ob volle Pizza bei spaetem Erfolg gewollt ist oder ob die Belohnung nach Versuchen sinken soll.

**Status:** Noch offen. Eine Reduktion nach Fehlversuchen ist aktuell nicht umgesetzt.

**Weg zur Umsetzung:** Wenn Reduktion gewollt ist, muss zuerst technisch festgelegt werden, wie Fehlversuche persistiert werden. Aktuell werden Fehlversuche nicht sauber als eigene auswertbare Versuche gespeichert; deshalb ist das keine reine Content-Aenderung, sondern eine Aenderung an Datenmodell/Service-Logik. Wenn volle Belohnung bleiben soll, keine Umsetzung noetig, aber in Anleitung/Scoring-Erklaerung transparent machen.

### 3. Kapitelabschluss-Schwellen pruefen

**Problem:** Laut Feedback lassen sich Kapitel/Aufgaben teilweise nicht beenden, weil der Prozentwert zu niedrig ist. Manchmal waere ein Abschluss schon mit sehr niedriger Quote sinnvoll. Zusaetzlich ist dem Spieler nicht immer klar, was zum Abschluss noch fehlt.

**Was anders gemacht werden soll:** Die `minRatioToComplete`-Schwellen sollen pro Aufgabe didaktisch passend sein. Aufgaben sollen nicht unnoetig blockieren. Wenn eine Aufgabe nicht abgeschlossen werden kann, soll die Rueckmeldung klarer machen, ob Punkte, richtige Zuordnungen oder eine Mindestquote fehlen.

**Weg zur Umsetzung:** Alle Aufgaben mit `minRatioToComplete` in den Kapiteln pruefen. Besonders offene/komplexe Aufgaben und Drag-and-drop-Aufgaben ggf. niedriger setzen. Bei reinen Uebungsaufgaben eher niedrigere Schwellen verwenden, bei Kernverstaendnis-Aufgaben hoeher. Danach pruefen, ob die bestehende Retry-/Fehlermeldung dem Spieler ausreichend erklaert, warum es noch nicht weitergeht; falls nicht, als UI-/Message-Aufgabe an Jannik geben.

### 4. Bonus-Belohnung vor oder waehrend Bonusaufgaben sichtbar machen

**Problem:** In Lucas Feedback steht, dass bei Bonusaufgaben mit Vokabeln nicht ersichtlich ist, wie viele Pizzastuecke man dafuer bekommt. Jannik hat laut Liste das Erfolgsoverlay bei Bonusaufgaben repariert; das deckt aber nur die Anzeige nach Abschluss ab, nicht die Erwartung vor oder waehrend der Aufgabe.

**Was anders gemacht werden soll:** Spieler sollen schon vor oder waehrend der Bonusaufgabe erkennen, welche Belohnung sie erhalten koennen.

**Weg zur Umsetzung:** Pruefen, ob Task-/Quest-Chrome die moegliche Pizza-/Rucksack-Belohnung bei Bonusquests anzeigen kann. Wenn es nur Content betrifft, Bonus-Aufgabenanweisungen um einen kurzen Belohnungshinweis ergaenzen. Wenn es ein einheitliches UI-Element braucht, an Jannik geben; nicht mit dem bereits erledigten Erfolgsoverlay verwechseln.

### 5. Kapitel-Sperrung fuer Testphase

**Problem:** Amelie merkt an, dass die Sperrung fuer die Testphase noch fehlt. Es sollen nur 2 oder 3 Kapitel freigeschaltet sein.

**Was anders gemacht werden soll:** Fuer den Pilotbetrieb sollen spaetere Kapitel manuell gesperrt werden.

**Weg zur Umsetzung:** In den jeweiligen `chapter.json`-Dateien `locked: true` setzen. Vorher festlegen, ob nur Kapitel 0-2 oder 0-3 offen sein sollen. Keine Datenbank-Logik aendern.

### 6. Hosting und Stresstest klaeren

**Problem:** Es ist offen, ob das Hosting fuer ca. 20 gleichzeitige Schueler stabil genug ist.

**Was anders gemacht werden soll:** Vor dem Schuleinsatz soll klar sein, ob der aktuelle Plan reicht.

**Weg zur Umsetzung:** Kein Content-Fix. Separat mit dem Team klaeren: Azure-Plan, Supabase-Limits, LLM-Kosten/Rate-Limits. Danach einen kurzen Stresstest mit parallelen Logins und Aufgabenstarts durchfuehren.

## Allgemein: Bedienung und Dokumente

### 7. Tablet- und Handy-Ansicht bei offenen Layoutpunkten mitpruefen

**Problem:** Amelie schreibt, dass UI-Probleme auf iPad-Groesse auch auf Handy-Groesse mitkorrigiert werden sollen, falls sie dort ebenfalls auftreten. In den Feedbacks werden mehrere Punkte auf iPad/Laptop genannt, aber nicht immer ist klar, ob sie auch mobil auftreten.

**Was anders gemacht werden soll:** Jede offene Layoutanpassung soll mindestens auf Desktop/Laptop, iPad-Groesse und Handy-Groesse geprueft werden. Nicht nur die groesste Ansicht darf funktionieren.

**Weg zur Umsetzung:** Bei jedem offenen UI-/Shop-/Drag-drop-Punkt nach der Anpassung Screenshots oder manuelle Checks in drei Breiten machen. Wenn ein Problem nur in einer Ansicht auftritt, die Loesung responsiv begrenzen. Janniks bereits gemeldete Fixes nicht neu aufnehmen, aber bei der Endpruefung trotzdem kontrollieren.

### 8. Drag-and-drop-Aufgaben ohne Herauszoomen bedienbar machen

**Problem:** In mehreren Feedbackstellen steht, dass man herauszoomen muss, um Drag-and-drop-Felder zu verschieben, weil Wortbank und Zielzonen nicht gleichzeitig sichtbar bzw. bedienbar sind. Genannt sind Intro/Chapter 0, Kapitel 1 und Akt 6.1 Exercise 2.

**Was anders gemacht werden soll:** Drag-and-drop-Aufgaben muessen ohne Browser-Zoom funktionieren. Wortbank und Drop-Zonen sollen gleichzeitig erreichbar sein, auch auf iPad und Handy.

**Weg zur Umsetzung:** Die betroffenen Drag-drop-Szenen identifizieren und pruefen, ob das Problem durch zu lange Labels, zu viele Items oder zu grosse Zonen entsteht. Content-seitig Items kuerzen/aufteilen, falls moeglich. Wenn das Problem trotz Janniks Zweispalten-Fix bleibt, als technische Restaufgabe an Jannik geben: Drag-container, Scrollverhalten und Touch-DnD muessen gemeinsam funktionieren.

### 9. Dokumente-Button deutlicher hervorheben

**Problem:** In mehreren Aufgaben muss der Spieler das Dokument oeffnen, aber der Button ist offenbar nicht auffaellig genug. Dadurch wirken Aufgaben so, als wuerden Texte fehlen.

**Was anders gemacht werden soll:** Der Dokumentzugriff soll in Aufgaben mit Referenztext besser erkennbar sein.

**Weg zur Umsetzung:** Entweder den Dokument-Button visuell hervorheben oder in den betreffenden Aufgabenanweisungen klarer schreiben: `Apri il documento e leggi il testo prima di rispondere.` Da Jannik UI-Punkte uebernommen hat, fuer Timon zunaechst Content-seitig die Aufgabenanweisungen schaerfen.

### 10. Aufgabenstellungen mit versteckten Dokumenten pruefen

**Problem:** Besonders bei den Beruehmten-Personen-Texten wird gesagt, man solle Texte lesen, aber die Aufgabe startet direkt und die Texte sind nur im Dokument.

**Was anders gemacht werden soll:** Der Ablauf soll klarer werden: erst Text lesen, dann Aufgabe bearbeiten.

**Weg zur Umsetzung:** In den betroffenen Szenen vor der Aufgabe eine Story-/Info-Szene einfuegen oder die Aufgabenanweisung explizit mit Dokumenthinweis formulieren. Betroffen: Kapitel 2.2 und weitere Aufgaben mit `referenceDocument`.

## Shop / Zimmer

### 11. Shop-Abdeckungen auf iPad/Laptop neu ausrichten und lesbar machen

**Problem:** Amelie beschreibt im Shop mehrere konkrete Abdeckungsprobleme: Die oberste/linkeste Box ueberlappt mit dem Erklaertext, die kleine Box daneben ist zu klein, der Preistext ist nicht lesbar, und die Box am Stiftehalter rechts auf dem Tisch verdeckt bzw. skaliert schlecht. Weitere Sperrflaechen fuer Bett, Teppich, Sitzkissen, Notiz und beide Wandregale decken die Objekte nicht sauber ab oder sind zu klein.

**Was anders gemacht werden soll:** Jede Sperrflaeche soll das zugehoerige Objekt vollstaendig und sauber abdecken, ohne wichtige UI-Texte zu ueberdecken. Preis und Buttontext muessen in jeder Box lesbar bleiben. Die Felder sollen optisch zum Zimmerstil passen, aber nicht transparent sein.

**Weg zur Umsetzung:** In der Room-/Shop-Konfiguration die Positionen und Groessen aller genannten Item-Overlays pruefen. Besonders Bett, Teppich, Sitzkissen, Notiz, linkes Wandregal, rechtes Wandregal, Stiftehalter und die obere linke Box skalieren bzw. verschieben. Danach auf Laptop und iPad kontrollieren. Wenn die Umsetzung rein CSS-/Layout-bedingt ist, an Jannik reporten; wenn es Item-Koordinaten/Content sind, bei Timon lassen.

## Chapter 0 / Intro

### 12. Alte Testaufgaben nach dem Koffer-Intro entfernen oder umdeuten

**Problem:** Nach der Sequenz, in der der Koffer fertig gepackt ist, tauchen weiterhin alte Test-/Demo-Aufgaben auf. Das wirkt nicht mehr wie ein echtes Intro.

**Was anders gemacht werden soll:** Chapter 0 soll als angenehmer Einstieg und Spielanleitung funktionieren, nicht wie ein technischer Testparcours.

**Weg zur Umsetzung:** `lib/content/chapters/chapter-00/quests/quest-01/scenes` pruefen. Entweder alte Aufgaben entfernen und durch kurze Anleitungsszenen ersetzen oder die Aufgaben klar als Tutorial formulieren. Wenn Tutorial: jede Aufgabe muss inhaltlich zur Koffer-/Reise-Situation passen.

### 13. Letztes Chapter-0-Bild austauschen

**Problem:** Fuer die letzte Sequenz passt das Bild laut Feedback nicht.

**Was anders gemacht werden soll:** Das Abschlussbild soll zur fertigen Reisevorbereitung passen.

**Weg zur Umsetzung:** Asset-Key der letzten Szene in Chapter 0 pruefen und entweder ein passenderes vorhandenes Bild verwenden oder ein neues Bild erzeugen. Nur die betroffene Szene/Asset-Zuordnung aendern.

## Chapter 1.0

### 14. Spielhinweis zu Pizza und Zimmer korrigieren

**Problem:** Der Text sagt, Pizzastuecke seien fuer Avatar/Vestiti/Accessori. Das passt nicht mehr, weil Pizza fuer das Zimmer genutzt wird.

**Was anders gemacht werden soll:** Text ersetzen durch: `Per i compiti risolti riceverai delle fette di pizza. Puoi usarle per arredare la tua stanza con nuovi mobili e oggetti.`

**Weg zur Umsetzung:** In `scripts/generate-chapter-01-catalog.mjs` die entsprechende Info-Szene aendern und Chapter 1 neu generieren. Danach generierte JSONs committen.

### 15. Spielhinweis zu Map/Kapitelfortschritt korrigieren

**Problem:** Der Text spricht von einer Bologna-Map bzw. Orten, die sich oeffnen. Das passt nicht mehr zur aktuellen Kapitel-/Quest-Struktur.

**Was anders gemacht werden soll:** Text ersetzen durch: `Avanzi capitolo per capitolo: così scoprirai la città a poco a poco e incontrerai persone interessanti lungo il percorso.`

**Weg zur Umsetzung:** In `scripts/generate-chapter-01-catalog.mjs` die zweite Info-Szene anpassen und generieren.

## Chapter 1.1

### 16. Lueckentext: Klammerwoerter fehlen

**Problem:** Beim Lueckentext fehlen laut Feedback die Woerter in Klammern hinter den Luecken.

**Was anders gemacht werden soll:** Die Aufgabenanzeige soll klar zeigen, welches Verb/Pronomen zu welcher Luecke gehoert.

**Weg zur Umsetzung:** Die Cloze-Szene in Chapter 1.1 pruefen. Bei Bedarf die `segments` so erweitern, dass die Klammerhinweise als normaler Text neben den Luecken stehen. Generator und JSON aktualisieren.

### 17. Fehlersuche auf vier Fehler umbauen

**Problem:** Die aktuelle Fehlersuche hat zu viele Fehler und wirkt dadurch komisch formatiert. Fast jede Aussage ist falsch.

**Was anders gemacht werden soll:** Die Aufgabe soll die Feedback-Version mit vier Fehlern verwenden. Fehler sind: `siediti sempre a un tavolino`, `cappuccino a tutte le ore`, `un solo piatto`, `il conto separato è la regola`.

**Weg zur Umsetzung:** In `scripts/generate-chapter-01-catalog.mjs` die Error-Spotting-Segmente anpassen: einen bisherigen Fehler korrekt machen bzw. entfernen, `expectedErrorRange` auf 4 setzen, akzeptierte Korrekturen pruefen. Danach Tests fuer Chapter 1 anpassen.

## Chapter 1.2

### 18. SMS Matteo: Klammerwoerter fehlen

**Problem:** Beim SMS-Lueckentext fehlen laut Feedback die Woerter in Klammern.

**Was anders gemacht werden soll:** Spieler sollen erkennen, welche Verbform oder welches Pronomen erwartet wird.

**Weg zur Umsetzung:** Die SMS-Cloze-Szene in `scripts/generate-chapter-01-catalog.mjs` ueberarbeiten und Klammerhinweise in den sichtbaren Text integrieren.

## Chapter 1.3

### 19. Broschuere klar lesbar machen

**Problem:** Tonio kuendigt eine Broschuere an, aber im Spiel ist nicht klar genug, dass man sie lesen kann/soll.

**Was anders gemacht werden soll:** Vor den Aufgaben soll klar sein: Die Broschuere ist im Dokument und soll gelesen werden.

**Weg zur Umsetzung:** In den betroffenen Szenen die Anweisung schaerfen, z.B. `Apri il documento e leggi la brochure.` Optional eine kurze Info-Szene vor Aufgabe 1 einfuegen.

### 20. Aufgabe 1 als Eingabe statt Matching pruefen

**Problem:** Feedback sagt, die Aufgabe war so gedacht, dass Schueler selbst Woerter in der Broschuere suchen. Aktuell ist es Matching.

**Was anders gemacht werden soll:** Aufgabe soll eher Eingabe/Suche sein als Zuordnung.

**Weg zur Umsetzung:** Pruefen, ob vorhandener Task-Typ `cloze` oder `free_text` besser passt. Wahrscheinlich einzelne Eingabefelder mit gesuchten Woertern aus der Broschuere verwenden. Matching nur behalten, wenn es didaktisch akzeptiert wird.

### 21. Aufgabe 2 Bernhofer-Aenderung pruefen

**Problem:** Feedback sagt, Aufgabe 2 habe eine Bernhofer-Aenderung noch nicht uebernommen.

**Was anders gemacht werden soll:** Die konkrete Aufgabenfassung aus der Bernhofer-Storyline muss gegen die aktuelle Szene verglichen werden.

**Weg zur Umsetzung:** Chapter 1.3 Aufgabe 2 im Generator mit dem Bernhofer-Dokument vergleichen. Nur die konkrete Abweichung anpassen, keine Neustrukturierung ohne Not.

### 22. Tonio-Dialog Bernhofer-Fassung pruefen

**Problem:** Im Feedback steht als nicht uebernommene Aenderung der Tonio-Dialog mit Mischfassung `Cosa ti posso offrire desideri?`. Das deutet darauf hin, dass die Bernhofer-Korrektur nicht sauber in der Spielversion gelandet ist.

**Was anders gemacht werden soll:** Der Dialog soll sprachlich glatt sein und nicht beide Varianten gleichzeitig enthalten. Wahrscheinlich soll `Cosa desideri?` oder eine andere eindeutige Bernhofer-Fassung stehen, nicht `offrire desideri`.

**Weg zur Umsetzung:** In Chapter 1.3 den Tonio-Dialog im Generator mit dem Bernhofer-Dokument vergleichen. Nur die gelb markierte, nicht gestrichene finale Fassung uebernehmen und Mischreste entfernen.

### 23. `50 metri (larghezza)` vereinfachen

**Problem:** `50 metri (larghezza)` wirkt anders als die anderen Optionen; `larghezza` soll weg.

**Was anders gemacht werden soll:** Option/Label nur als `50 metri` anzeigen.

**Weg zur Umsetzung:** In der entsprechenden Chapter-1.3-Szene das Item-Label anpassen und ggf. Tests aktualisieren.

## Chapter 2.1

### 24. Dario-Cloze exakt nach Feedback-Fassung uebernehmen

**Problem:** Die Aufgabe ist laut Feedback noch nicht exakt umgesetzt. Besonders Formatierung, Klammerwoerter und Entweder-oder-Stellen sind unklar.

**Was anders gemacht werden soll:** Die im Feedback angegebene Fassung soll exakt verwendet werden. Entfernte Teile duerfen nicht wieder auftauchen. Die Loesungsliste muss exakt zur neuen Fassung passen.

**Weg zur Umsetzung:** In `scripts/generate-chapter-02-catalog.mjs` Szene 07 von Quest 02 ueberarbeiten: sichtbare Klammerhinweise ergaenzen, `Benissimo/Buonissimo`, `bene/buoni`, `difficile/difficilmente`, `facile/facilmente` klar darstellen, entfernte Luecken nicht mehr akzeptieren. Scoring-Test fuer diese Szene aktualisieren.

### 25. Berufe-Freitext ohne Bilder

**Problem:** Die Bilder bei den Beruf-Aufgaben werden als unnoetig beschrieben.

**Was anders gemacht werden soll:** Aufgabe soll die Berufe direkt nennen, ggf. fett/auffaellig, ohne Bildreferenz.

**Weg zur Umsetzung:** In den Freitext-Berufsszenen die `referenceDocument.figures` entfernen oder den Dokumentbezug weglassen. Aufgabenstellung so formulieren, dass der jeweilige Beruf sichtbar im Prompt steht.

### 26. LLM-Kontext bei Berufe-Aufgabe pruefen

**Problem:** Es gibt Feedback zu LLM-Problemen in Akt 2.1 Aufgabe 2.

**Was anders gemacht werden soll:** LLM soll besser erkennen, ob die Berufsbeschreibung zur Aufgabe passt.

**Weg zur Umsetzung:** Evaluation Criteria der betroffenen Freitext-Szenen schaerfen. Nur Content-/Prompt-Kriterien anpassen, nicht die OpenAI-Technik.

## Chapter 2.2

### 27. Beruehmte-Personen-Texte vor Aufgabe besser praesentieren

**Problem:** Spieler sollen Texte lesen, landen aber direkt in der Aufgabe und muessen erst `Dokument` finden.

**Was anders gemacht werden soll:** Textlekture soll als Schritt vor der Aufgabe klar sein.

**Weg zur Umsetzung:** Eine kurze Story-/Info-Szene vor der Steckbrief-Aufgabe einfuegen oder die Anweisung deutlich machen: `Apri il documento, leggi i profili e poi completa...`

### 28. Steckbrief-Format verbessern

**Problem:** Steckbrief ist laut Feedback falsch bzw. schwer zu lesen.

**Was anders gemacht werden soll:** Der Steckbrief soll klar strukturiert sein: Name, Jahr/Datum, Herkunft, Beruf, bekannt fuer, Besonderheit.

**Weg zur Umsetzung:** Cloze-Segmente der Steckbrief-Aufgabe optisch und textlich ordnen. Ggf. mehrere kurze Zeilen statt langer Block. Keine UI-Komponente aendern, wenn Content-Struktur reicht.

### 29. Steckbrief-Bewertung flexibler machen

**Problem:** Deterministische Bewertung ist bei Steckbriefantworten zu streng.

**Was anders gemacht werden soll:** Mehr richtige Varianten akzeptieren, besonders bei Del Piero und Ferragni.

**Weg zur Umsetzung:** `correctAnswers` je Gap erweitern. Fuer Person-spezifische Antworten sicherstellen, dass Saviano-, Del-Piero- und Ferragni-Muster nicht vermischt sind.

### 30. Del-Piero-Text final pruefen

**Problem:** Feedback sagt, nicht alle Aenderungen fuer Del Piero seien uebernommen.

**Was anders gemacht werden soll:** Del-Piero-Profil muss exakt der Feedbackfassung entsprechen.

**Weg zur Umsetzung:** `DEL_PIERO_BODY` in `scripts/generate-chapter-02-catalog.mjs` gegen den Feedbacktext vergleichen. Abweichungen gezielt korrigieren.

### 31. Musterloesungen Del Piero/Ferragni pruefen

**Problem:** Laut Feedback sind Musterloesungen teilweise noch Saviano-Werte.

**Was anders gemacht werden soll:** Jede Person muss eigene korrekte Antwortvarianten haben.

**Weg zur Umsetzung:** Steckbrief-Gaps und Tests pruefen. Falls eine Antwort fuer Del Piero/Ferragni fehlt oder falsch zugeordnet ist, `correctAnswers` erweitern/korrigieren.

## Chapter 2.3

### 32. Bilder in Aufgabe 2 entfernen

**Problem:** Bilder in Aufgabe 2 sind unnoetig und offenbar keine passenden Bilder.

**Was anders gemacht werden soll:** Aufgabe soll ohne Bilder funktionieren.

**Weg zur Umsetzung:** Betroffene Szene identifizieren und `referenceDocument.figures` entfernen oder durch reine Textanweisung ersetzen.

### 33. Weiterkommen bei teilweise richtiger Loesung ermoeglichen

**Problem:** Feedback sagt, man konnte nicht zur naechsten Aufgabe, wenn nicht alles richtig war.

**Was anders gemacht werden soll:** Teilpunkte sollen reichen, wenn die Aufgabe entsprechend bewertet wird.

**Weg zur Umsetzung:** Scoring der Aufgabe pruefen. `minRatioToComplete` ggf. senken und sicherstellen, dass `evaluateTaskAttempt` Teilpunkte fuer den Task-Typ korrekt verwendet.

## Chapter 2.4

### 34. Restaurant-Erzaehltext Zeitraum korrigieren

**Problem:** Text nennt konkret Juli/August bzw. wirkt wie kurzer Ferienjob. Feedback sagt: weglassen, Job ueber ganzes Sommer-Halbjahr.

**Was anders gemacht werden soll:** Zeitraum neutraler formulieren, z.B. `per la stagione estiva` ohne `luglio e agosto`.

**Weg zur Umsetzung:** Chapter 2.4 Einstiegsszene im Generator pruefen und Zeitraum entfernen/anpassen.

### 35. Restaurant-Bild passend zum Erzaehltext machen

**Problem:** Text sagt, man sieht die Pizzeria von aussen und geht hinein; Bild zeigt bereits Innenraum.

**Was anders gemacht werden soll:** Entweder Bild aendern oder Text an Bild anpassen.

**Weg zur Umsetzung:** Wenn moeglich vorhandenes Aussenbild verwenden. Falls keines da ist, Text so formulieren, dass man bereits am/ im Restaurant ist. Nur betroffene Szene/Asset-Zuordnung aendern.

### 36. Motivationsbrief exakt nach Feedback umbauen

**Problem:** Aufgabe 1 ist laut Feedback nicht richtig umgesetzt.

**Was anders gemacht werden soll:** Drag-and-drop-Lueckentext mit exakt dieser Struktur:
`Ogg.: Domanda per un lavoretto estivo`, Slots 1-7, vollstaendiger Brieftext, Pool und Loesungen wie im Feedback.

**Weg zur Umsetzung:** `scripts/generate-chapter-02-catalog.mjs` Szene 11 umbauen: Briefvorlage in `referenceDocument.body`, Items pool bereinigen, Zielslots und `correctItemIds` exakt an Feedback anpassen. Tests aktualisieren.

### 37. Motivationsbrief-Pool bereinigen

**Problem:** Pool soll genau die genannten Auswahlmoeglichkeiten enthalten. Aktuell sind zusaetzliche/abweichende Formeln moeglich.

**Was anders gemacht werden soll:** Pool enthaelt nur sinnvolle Varianten aus dem Feedback, z.B. Anreden, Kandidaturformeln, Reihenfolgewoerter, Kontaktformeln, Schlussformeln.

**Weg zur Umsetzung:** `letterFormulas` im Generator anpassen und Zielslots entsprechend verbinden.

### 38. LLM-Kontext Menue-Aufgaben schaerfen

**Problem:** Beispiel zeigt, dass eine inhaltlich falsche Antwort zu `secondi piatti` 80 Prozent bekommen hat.

**Was anders gemacht werden soll:** LLM muss staerker pruefen, ob die Antwort inhaltlich zur Menuekategorie passt.

**Weg zur Umsetzung:** Evaluation Criteria der Menue-Freitextszenen anpassen. Fuer `secondi piatti` explizit ausschliessen, dass Pasta/Riso als Hauptbeschreibung akzeptiert wird. Vergleichbares fuer andere Kategorien pruefen.

### 39. Signor-Marini-Schlusssatz final korrigieren

**Problem:** Feedback markiert den Satz weiterhin als falsch/unsauber: `il primo caffè da Marini in offerta`.

**Was anders gemacht werden soll:** Sprachlich saubere finale Fassung festlegen.

**Weg zur Umsetzung:** Satz im Generator korrigieren. Vorschlag: `Ah, e tieni: il primo caffè da Marini te lo offro io!` falls das fachlich wieder erlaubt ist, oder `il primo caffè da Marini è gratis per te!`.

### 40. Bonus/Matching-Tabelle zu Grotte pruefen

**Problem:** Feedback-Tabelle nennt erwartete Paarungen wie `cave -> la grotta / caverna`, `route dimensions -> il percorso / le dimensioni`.

**Was anders gemacht werden soll:** Matching-Optionen und akzeptierte Antworten sollen zur Feedback-Tabelle passen.

**Weg zur Umsetzung:** Chapter 2.4 bzw. passendes Bonus-Matching identifizieren und Items/Loesungen gegen Tabelle pruefen.

## Akt 3.1

### 41. Infoflyer deutlicher machen

**Problem:** Infoflyer ist nicht kenntlich genug.

**Was anders gemacht werden soll:** Spieler sollen klar erkennen, dass der Flyer das zentrale Dokument fuer Aufgabe 1 ist.

**Weg zur Umsetzung:** Aufgabenanweisung und/oder Referenzdokumenttitel schaerfen. Optional im Text schreiben: `Apri il documento: è il volantino del museo.`

## Akt 3.2

### 42. Valentina-Dialog pruefen

**Problem:** Feedback nennt den Valentina-Dialog und den Monolog als rot markiert bzw. zu korrigieren.

**Was anders gemacht werden soll:** Text muss exakt lauten:
`Credo che tu assaggererai... Firenze ...`
und
`Questa donna sta parlando...`

**Weg zur Umsetzung:** Generator Chapter 3 pruefen. Aktueller Stand sieht weitgehend richtig aus, aber exakt gegen Feedback inklusive Auslassungspunkte und Anfuehrungszeichen abgleichen.

### 43. Akt 3.2 Aufgabe 1 Textverschiebung

**Problem:** Text ist verschoben.

**Was anders gemacht werden soll:** Aufgabe soll lesbar/aligned sein.

**Weg zur Umsetzung:** Falls es Content-bedingt ist, lange Segmente aufteilen. Wenn es UI-bedingt ist, an Jannik geben. Inhaltlich mindestens pruefen, ob unnötig lange Inline-Segmente die Verschiebung verursachen.

### 44. Loesung `manchi` vs `manci` pruefen

**Problem:** Unsicherheit, ob `manchi` oder `manci` richtig ist.

**Was anders gemacht werden soll:** Korrekte italienische Form verwenden.

**Weg zur Umsetzung:** In der Aufgabe die Loesung pruefen. Korrekt ist sehr wahrscheinlich `manchi` von `mancare`; `manci` ist hier falsch.

### 45. Akt 3.2 Aufgabe 2 Teil B Textverschiebung

**Problem:** Teil B ist verschoben.

**Was anders gemacht werden soll:** Text und Eingabefelder sollen nachvollziehbar stehen.

**Weg zur Umsetzung:** Content-Segmente pruefen und ggf. auf mehrere Zeilen/kuerzere Textsegmente aufteilen. UI-Anteil ggf. an Jannik.

## Akt 3.3

### 46. `Wortbank` durch `Termini` ersetzen

**Problem:** In einer Aufgabe steht noch `Wortbank`.

**Was anders gemacht werden soll:** Italienisches Label `Termini` verwenden.

**Weg zur Umsetzung:** In `scripts/generate-chapter-03-catalog.mjs` die Instruction der betroffenen Szene ersetzen und Chapter 3 neu generieren.

### 47. Doppelte Aufgabenstellung entfernen

**Problem:** Bei Aufgabe 3 kommt die Aufgabenstellung doppelt vor.

**Was anders gemacht werden soll:** Aufgabe soll die Anweisung nur einmal anzeigen.

**Weg zur Umsetzung:** Pruefen, ob `instruction` und `task.prompt` identisch sind. Eine der beiden Formulierungen kuerzen oder entfernen, sodass UI nicht doppelt wirkt.

### 48. Doppelte Bonus-Aufgabenstellung entfernen

**Problem:** Auch in der Bonusaufgabe kommt die Aufgabenstellung doppelt vor.

**Was anders gemacht werden soll:** Nur eine klare Aufgabenanweisung anzeigen.

**Weg zur Umsetzung:** Bonus-Szene in Chapter 3 pruefen, `instruction`/`prompt` entdoppeln.

### 49. Akt 3.3 Exercise 3 als Vorbild pruefen

**Problem:** Feedback nennt Exercise 3 als Inspiration fuer andere Verschiebungsaufgaben.

**Was anders gemacht werden soll:** Gute Struktur dieser Aufgabe auf andere Drag-/Verschiebungsaufgaben uebertragen, soweit Content-seitig moeglich.

**Weg zur Umsetzung:** Aufgabe analysieren und bei problematischen Drag-drop-Aufgaben aehnliche kurze Labels, klare Zielzonen und kompakte Items verwenden.

## Akt 4.1

### 50. Sara-Monolog Szene 1 pruefen

**Problem:** Feedback nennt den Satz:
`Quella è Sara... me ne ha parlato spesso in classe...`

**Was anders gemacht werden soll:** Text muss exakt und sprachlich sauber der Feedbackfassung entsprechen.

**Weg zur Umsetzung:** Chapter 4 Generator mit Feedback vergleichen und nur Abweichungen korrigieren.

### 51. Sara-Dialog nach Freitext pruefen

**Problem:** Feedback nennt alte Mischfassung:
`non ne voglio andare parlare... è forse sta...`

**Was anders gemacht werden soll:** Text muss bereinigt sein:
`non ne voglio parlare... forse sta...`

**Weg zur Umsetzung:** Aktuellen Generator prüfen. Falls noch Mischfassung vorhanden, korrigieren.

### 52. Aufgabe 2 letzte Loesung korrigieren

**Problem:** Letztes Feld soll `avere / che io abbia` sein, nicht `di avere`.

**Was anders gemacht werden soll:** `di avere` entfernen oder nicht als korrekte Hauptloesung akzeptieren, je nach finaler Aufgabenlogik.

**Weg zur Umsetzung:** Chapter 4 Cloze-Szene prüfen. `correctAnswers` fuer letztes Gap anpassen und Test aktualisieren.

### 53. Szene vor Akt 4.2 Monolog pruefen

**Problem:** Feedback nennt den Monolog mit `Ma sto anche un po' in crisi...`.

**Was anders gemacht werden soll:** Text soll der Feedbackfassung entsprechen.

**Weg zur Umsetzung:** Generator Chapter 4 Szene vor Quest 03 pruefen und exakt angleichen.

## Akt 4.3

### 54. Sara-Sprachnachricht pruefen

**Problem:** Feedback nennt alte Mischfassung mit `ieri sera`, `inoltro mando`, `mi ha mandato ho ricevuto`, `Guarda Leggilo`.

**Was anders gemacht werden soll:** Bereinigte Fassung verwenden: `ho letto la tua mail ieri`, `ti mando`, `ho ricevuto`, `Leggilo`.

**Weg zur Umsetzung:** Generator Chapter 4 Quest 04 Szene 02 pruefen. Falls Mischreste vorhanden, korrigieren.

### 55. SMS an Mama: Zeichenlimits und Alignment

**Problem:** Textfelder sind zu kurz und nicht aligned.

**Was anders gemacht werden soll:** Antworten muessen in die Eingabefelder passen; Text/Luecken sollen nachvollziehbar stehen.

**Weg zur Umsetzung:** In der SMS-Cloze-Szene `maxLength` erhoehen oder entfernen und lange Segmente aufteilen. Wenn UI weiter verschiebt, an Jannik geben.

## Akt 5

### 56. Zwei Texte im Dokument bei Akt 5 Exercise 1 pruefen

**Problem:** Feedback fragt, ob zwei Texte in der Dokument-Funktion gewollt sind.

**Was anders gemacht werden soll:** Falls beide Texte gebraucht werden, in der Aufgabenstellung klar sagen. Falls nicht, Dokument reduzieren.

**Weg zur Umsetzung:** Chapter 5 Quest 02/Exercise 1 Referenzdokument pruefen. Titel und Anweisung klar machen: `Leggi il testo A e il testo B...`

### 57. Pro/Contra-Aufgabe Teilbewertung pruefen

**Problem:** Aufgabe erkennt offenbar nur, wenn alle Statements richtig zugeordnet wurden.

**Was anders gemacht werden soll:** Teilweise richtige Zuordnungen sollen bewertet werden, sofern der Task-Typ das kann.

**Weg zur Umsetzung:** Scoring und `matchMode`/Targets der Szene pruefen. Wenn Content-seitig `matchMode: all` zu streng ist, anpassen. Wenn Evaluator nur alles-oder-nichts kann, an Jannik geben.

## Akt 6

### 58. Bonus: `oscuro, -a` pruefen

**Problem:** Feedback fragt, ob `oscuro, -a` so gewollt ist.

**Was anders gemacht werden soll:** Entscheiden, ob die Vokabel so stehen bleiben soll oder vereinfacht wird.

**Weg zur Umsetzung:** Chapter 6 Bonus-Vokabelliste pruefen. Falls Lernniveau/Format nicht passt, Label anpassen.

## Bilder

### 59. Unpassende Bilder gezielt pruefen

**Problem:** Konkret genannt sind Chapter 0 letzte Sequenz und Chapter 2.4 Restaurant. Generell sollen passende Hintergruende vorhanden sein.

**Was anders gemacht werden soll:** Bild muss zum Erzaehltext passen.

**Weg zur Umsetzung:** Nur konkret betroffene `background`-Keys/Assets pruefen. Entweder Text an Bild anpassen oder neues/passenderes Bild verwenden. Keine pauschalen Bildaenderungen.
