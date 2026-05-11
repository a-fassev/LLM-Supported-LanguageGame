# Spiel- und Level-Konfiguration (Gameplay & Content)

Diese Anleitung beschreibt, **wie du das Lernspiel aus Sicht von Inhalten und Spielfluss zusammenstellst**: Welche Bausteine es gibt, wie sich daraus ein Level ergibt, und wie mehrere Levels eine durchspielbare Kampagne ergeben. Für Dateipfade, Pflichtfelder und Validierung nutze ergänzend den technischen **[Content Authoring Guide](CONTENT_AUTHORING_GUIDE.md)**.

---

## 1. Zwei Ebenen: „Welt-Reihenfolge“ und „Level-Inhalt“

| Ebene | Bedeutung für dich als Autor:in | Kurzbeschreibung |
| ------ | --------------------------------- | ---------------- |
| **Level-Katalog (Reihenfolge)** | Legt fest, **in welcher Reihenfolge** Spieler:innen Levels sehen und was freigeschaltet wird. Jedes Eintrags-„Kapitel“ hat eine **stabile Level-ID**, einen **Anzeigenamen**, eine **Positionsnummer** und verweist auf **eine** JSON-Datei mit dem Aufgabeninhalt. | Linearer Fortschritt: Nach Abschluss eines Levels wird üblicherweise das nächste in der Reihenfolge freigeschaltet. |
| **Level-JSON (Aufgaben)** | Ist die **konkrete Lektion**: Thema, Schwierigkeit, Reihenfolge der Aufgaben, Bewertung, Übungsformate. | Ein Level = eine durchspielbare Sequenz von Aufgaben mit klaren Abschlussregeln. |

So entsteht das Gesamtspiel: Im Katalog **stellst du die Lerntour** zusammen (Reihenfolge, Namen, welche Content-Datei zu welchem Level gehört). In den JSON-Dateien **gestaltest du die Lernerfahrung** pro Einheit (Übungen, Texte, Regeln zum Weiterkommen).

---

## 2. Fortschritt im Hub (lineare Freischaltung)

- **Erstes Level** in der Reihenfolge ist von Anfang an spielbar; alle folgenden starten gesperrt, bis das **vorherige** Level erfolgreich abgeschlossen wurde.
- Spieler:in-Punkte und Statistiken werden beim Fortschritt mitgeführt (Details zur Speicherung stehen nicht im Level-JSON; sie sind technisch an die Laufzeit gekoppelt).

**Praktische Konsequenz:** Wenn du ein neues Thema nach „Mitte der Kampagne“ einfügst, musst du die **Reihenfolge im Katalog** so setzen, dass die gewünschte Lernlogik noch stimmt — nicht nur die neuen Aufgaben in einer JSON schreiben.

---

## 3. Was jedes Level (JSON) „über“ den Inhalt sagt

Diese Felder prägen, **wie das Level gefühlt und eingeordnet wird** (über die konkreten Fragen/Antworten hinaus):

| Feld / Konzept | Gameplay-/Content-Rolle |
| -------------- | ---------------------- |
| **levelId** | Eindeutiger Name dieser Einheit innerhalb der App (Zuordnung zum Katalog, Fortschritt, Fehlersuche). Sollte **stabil** bleiben, wenn Spieler:innen bereits Fortschritt haben. |
| **displayName** | Der Name, unter dem Spieler:innen diese Einheit vor allem im Menü oder Hub wiedererkennen. |
| **difficulty** (`easy` / `medium` / `hard`) | Für dich und die UI zur Einordnung; nutze konsistent dieselbe Skala über das Spiel. |
| **theme** (optional) | Freies Schlagwort zu Lernbereich/Stimmung (z. B. Alltag Schule); hilft beim Sortieren und Beiordnen von Content mehrerer Teams. |

Der eigentliche Ablauf im Level wird durch **taskOrder** (Reihenfolge der Aufgaben-IDs) und die **tasks**-Liste beschrieben.

---

## 4. Aufgabentypen (Übungsformate)

Jede Aufgabe hat immer eine **kurze Aufgabenstellung (`prompt`)** und einen **Typ**, der festlegt, **was die Lernenden tun**:

| Typ | Was Lernende typischerweise tun |
| --- | -------------------------------- |
| **multiple_choice** | Eine richtige Option aus mehreren auswählen. |
| **matching** | Elemente zweier Listen sinnvoll paaren (z. B. Italienisch ↔ Bedeutung). |
| **cloze_text** | Lückentext ausfüllen; optional gibt es vordefinierte Auswahlmöglichkeiten pro Lücke (sonst gilt die akzeptierte Antwortliste als Referenz für die Bewertung). |
| **error_hunt** | Einen sprachlichen Fehler im Text erkennen und korrigieren; mehrere Formulierungen können als gültige Korrektur gelten. |
| **drag_drop** | Wörter/Teile in die richtige Reihenfolge bringen (z. B. Satzbau). |
| **llm_free_text** | Freie Textantwort (länger oder kurz), die gegen **Kriterien** und gewünschte **Strukturen** beurteilt wird — dafür ist ein angeschlossener Bewertungsdienst nötig. |
| **llm_word_guess** | Raten eines Zielwortes unter Begrenzung der Versuche; gleichfalls über den Bewertungsdienst gelöst. |

**Hinweis zu LLM-Aufgaben:** Didaktisch eignen sie sich für Produktion, Bewertungsraster und differenziertes Feedback. Technisch gehören Schlüssel, Netzwerk und Fehlerarten zur Integration — ohne brauchbare Verbindung bekommen Spieler:innen keine stabile Bewertung.

---

## 5. Spielfluss innerhalb eines Levels

### 5.1 Reihenfolge

**taskOrder** ist die Playlist: Die IDs müssen alle in `tasks` vorkommen. So steuerst du z. B. erst Wortschatz, dann Grammatik, dann freie Produktion — oder umgekehrt einen sanften Einstieg.

### 5.2 Wann dürfen Lernende zur nächsten Aufgabe?

| **unlockNextTaskWhen** | Bedeutung |
| ----------------------|----------- |
| `pass` (Standard) | Nächste Aufgabe erst, wenn diese Aufgabe **bestanden** ist (siehe Bewertung unten). |
| `always` | Nach einem Versuch gilt die Aufgabe als abgeschlossen fürs Weiterkommen — sinnvoll für reine Warm-ups oder optionale Stationschecks, wenn du keine harte Tür haben willst. |
| `perfect_score` | Nächste Aufgabe erst bei **voller Punktezahl** für diese Aufgabe — gut für sehr knifflige Schlüsselmomente („alles korrekt, sonst bleiben wir hier“). |

### 5.3 Zählt die Aufgabe fürs Bestehen des Levels?

- **`requiredToPassLevel: true`** (Standard): Nur wenn alle als „erforderlich“ markierten Aufgaben **bestanden** wurden, kann das Gesamtlevel gültig bestanden sein (abhängig von der Level-Abschlussregel unten).
- **`false`:** Optionale Aufgaben (zusätzlicher Stoff, ohne den Abschluss zu blockieren) — etwa Bonusraum oder zusätzlicher Text.

### 5.4 Anzahl Versuche

- **`maxAttempts`:** Obergrenze der Einreichungen für diese Aufgabe. Ist keine sinnvolle Grenze gesetzt, ist der technische Default **unkommentiert häufig** — didaktisch solltest du für knifflige Aufgaben bewusst Grenzen setzen, damit Frustration und Abbrüche vorhersehbar bleiben.

---

## 6. Bewertung pro Aufgabe (wie „richtig genug“ aussieht)

Jede Aufgabe hat eine **Scoring-Konfiguration**, die ihr **„bestanden“** und die **Punktzahl** bestimmt:

| **policy** | Typische Lernerfahrung |
| ---------- | ---------------------- |
| **strict_binary** | Alles oder nichts — eine Teilrichtigkeit reicht oft nicht („prüfen“ im Sinne eines klaren Schlüssels). |
| **partial_points** | Teilpunkte (z. B. drei Paare, zwei richtig = mittlere Punkte); mit **passThreshold** legst du fest, wie viel eines Maximums noch als **bestanden** zählt. |
| **threshold_pass** | Fokus auf Übersteigen eines Mindeststands — ebenfalls über **passThreshold** steuerbar, wenn ihr nicht jede Teilaufgabe gleich stark gewichten wollt. |

**maxPoints** skaliert, wie stark diese Aufgabe ins **Score-Budget** eines Levels einzahlt (wichtig für Mindest-Prozent-Regeln auf Levelbasis).

Feedback-Texte, die Lernenden sehen, kommen aus der jeweiligen Logik/Auswertung der Aufgabe (bei LLM-Aufgaben auch aus Modell-antwortbezogenem Feedback). Fehlermeldungen bei technischen Ausfällen sind produktintern vereinheitlicht — dort nutzt ihr konfigurierbare Katalogtexte nicht pro JSON-Zeile, sondern zentral.

---

## 7. Wann gilt ein Level als gesamtsch „bestanden“?

Die **Level-Abschlussregel (`levelCompletionRule`)** kombiniert zwei Ideen:

1. **Alle erforderlichen Aufgaben bestanden:** Aufgaben mit `requiredToPassLevel: true` müssen als bestanden durch die Aufgabenlogik markiert sein — sonst scheitert das Level immer.

2. **Modus des Levels:**
   - **`all_required`:** Sobald diese Pflichtaufgaben bestanden sind, ist das Level bestanden — **unabhängig** davon, ob optionale Aufgaben mitgemacht wurden (optional kannst du trotzdem welche für Motivation oder Extra-Punkte einbauen).
   - **`min_score`:** Zusätzlich muss eine **Mindest-Prozentzahl** der im Level erreichbaren Summenpunkte erreicht worden sein. Das eignet sich, wenn ihr **„stark genug durch die ganze Mischung“** verlangen wollt, nicht nur einzelne Hürden ohne Gesamtgewichtung.

Damit lässt sich z. B. stark didaktisch unterscheiden: **„Alles Kernaufgaben sauber lösen“** vs. **„Mindest-X% über alle Übungen, inklusive Teilpunkten“**.

---

## 8. Vorgehen: Ein neues Level „zusammenstecken“

1. **Lernziel formulieren:** Was soll nach diesem Block sitzen (Funktion/Wortschatz/Struktur)?
2. **Aufgabenkette planen:** Erst Verständnis/Leichtes, dann Anwendung, optional Produktion oder LLM-Check — **taskOrder** so setzen, dass der Schwierigkeit und der Motivation entsprochen wird.
3. **Pro Aufgabe:** Typ wählen, **prompt** formulieren, lösbaren Inhalt anlegen und **unlockNextTaskWhen** / **requiredToPassLevel** / **maxAttempts** so setzen, dass der gewünschte Rhythmus entsteht.
4. **Punkte konfigurieren:** **policy**, **maxPoints**, **passThreshold** so abstimmen, dass „knapp bestanden“ und „überzeugend“ euren didaktischen Erwartungen entsprechen — und zum gewählten **levelCompletionRule** passt (v. a. bei `min_score`).
5. **Mit dem Katalog verknüpfen:** Neues oder geändertes Level in die **globale Reihenfolge** einhängen, **levelId** und **displayName** mit dem Katalog konsistent halten, JSON-Pfad korrekt setzen.
6. **Validierung & Probe:** Siehe **[Content Authoring Guide](CONTENT_AUTHORING_GUIDE.md)** (Schema-Checkliste, einmaliges Durchspielen in Unity).

---

## 9. Kurzüberblick: Wer konfiguriert was?

| Thema | Wo du es gedanklich „steckst“ |
| ----- | ----------------------------- |
| Welche Levels es gibt und in welcher Reihenfolge | Level-Katalog (Reihenfolge, Referenz auf jeweilige Content-JSON) |
| Themennamen, Schwierigkeit, thematisches Label pro Einheit | Level-JSON: `displayName`, `difficulty`, optional `theme` |
| Reihenfolge und Form der Übungen | Level-JSON: `taskOrder` + Aufgabenobjekte |
| Strenger vs. lockerer Aufgabenfluss | Pro Aufgabe: `unlockNextTaskWhen`, `maxAttempts`, `requiredToPassLevel` |
| Wie strenge Bewertung pro Übung wirkt | Pro Aufgabe: `scoring` (policy, Punkte, Schwellen) |
| Wann das Level „offiziell“ gilt | Level-JSON: `levelCompletionRule` |

Damit solltest du ohne C#-Kentnisse entscheiden können, wie sich **„das ganze Spiel“** aus Lerneinheiten und Regeln zusammensetzt. Für konkrete JSON-Felder, Beispieldateien und technische Fallbacks gilt weiterhin **`CONTENT_AUTHORING_GUIDE.md`** und das Schema **`Assets/_Project/Content/Schemas/level-content.schema.json`**.
