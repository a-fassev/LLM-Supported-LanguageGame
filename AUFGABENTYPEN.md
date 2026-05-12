# Aufgabenkategorien

Überblick über die besprochenen Aufgabentypen für das Sprachlern-Spiel, gruppiert nach **ohne LLM** (deterministisch prüfbar) und **mit LLM** (nur gezielt einsetzen). Inhaltlich angelehnt an das Dokument *Aufgabenkategorien* (Inhaltsteam).

---

## Ohne LLM

Diese Typen lassen sich gegen fest hinterlegte Lösungen oder Muster prüfen und eignen sich für eine stabile, vorhersagbare Spielerfahrung.

### Fehlersuche

Schülerinnen und Schüler erhalten einen Satz oder kurzen Text mit eingebautem Fehler (Grammatik, Wortstellung, falsche Form) und **markieren oder korrigieren** ihn. Die Lösung ist hinterlegt; die Bewertung ist **deterministisch**.

### Drag & Drop

Elemente werden per Ziehen an die richtige Stelle gesetzt, zum Beispiel:

- Satzbausteine in die korrekte Reihenfolge
- Wörter in passende Lücken
- Pronomen zu ihren Bezugswörtern
- Begriffe in Kategorien (z. B. *indicativo* / *congiuntivo*)

Die Aufgabe ist **eindeutig** gegen ein Lösungsmuster prüfbar.

### Lückentext

Vorgegebener Text mit ausgelassenen Wörtern oder Formen. Die Lücken werden gefüllt, entweder:

- per **Multiple Choice** (sehr robust), oder
- per **Freitext**, abgeglichen mit einer Liste **akzeptierter Lösungen**

Geeignet für gezieltes Üben einzelner Grammatikformen.

### Matching

Zwei Spalten werden einander zugeordnet, zum Beispiel:

- idiomatische Verben ↔ Bedeutungen
- italienische Wörter ↔ englische Synonyme (Sprachmittlung, wie im Buch)
- Bilder ↔ Begriffe
- Wenn-Sätze ↔ passende Hauptsätze (*periodo ipotetico*)

**Deterministische** Paarbewertung.

### Multiple Choice

Auswahl der richtigen Antwort aus typischerweise **3–4 Optionen**. Einsetzbar für:

- Hörverstehen (Audio + Optionen)
- Leseverstehen (Text + Verständnisfragen)
- Sprachmittlung
- Grammatikentscheidungen (welche Form passt?)
- kulturelles Wissen

Bewertung ist **deterministisch**; die Mechanik ist **sehr gut wiederverwendbar**.

---

## Mit LLM

Nur **gezielt** nutzen: Kontrolle und Nachvollziehbarkeit sind hier schwieriger als bei festen Aufgaben.

### Freitext (bewertet)

Schülerinnen und Schüler formulieren eine **eigene Antwort** (z. B. NPC-Frage beantworten, Situation beschreiben, höfliche Bitte formulieren). Ein Sprachmodell bewertet anhand **vorab definierter Kriterien**, z. B.:

- Vorkommen bestimmter Zielstrukturen (z. B. „muss *congiuntivo* enthalten“)
- kommunikative Angemessenheit
- grobe Korrektheit

Mögliches Ergebnis: **Bestanden/Nicht bestanden** oder Punktwert mit kurzem Feedback.

**Hinweis:** Diese Kategorie birgt das **größte Bewertungsrisiko** (Halluzinationen, Inkonsistenz über mehrere Durchläufe).

### Wortbeschreibungen mit Relativpronomen

Ein vorgegebenes Wort soll beschrieben werden **mit Relativsätzen** (z. B. *è una cosa che…*, *è un posto dove…*, *è una persona la quale…*), **ohne** das Zielwort zu nennen. Das Modell **errät** das Wort aus der Beschreibung. Liegt der Treffer innerhalb von **1–3 Versuchen**, gilt die Aufgabe als bestanden.

Bewertungsschwerpunkt: **kommunikative Verständlichkeit**, nicht Grammatikperfektion. Hier liegt die Stärke des LLM eher im **Sprachverstehen** als in präziser Fehlerdiagnose.

---

## Kurzfassung für die Umsetzung

| Kategorie        | LLM | Prüfbarkeit        |
|-----------------|-----|--------------------|
| Fehlersuche     | nein | deterministisch    |
| Drag & Drop     | nein | gegen Lösungsmuster |
| Lückentext      | nein | MC oder Lösungsliste |
| Matching        | nein | Paare              |
| Multiple Choice | nein | feste Schlüssel    |
| Freitext        | ja   | Kriterien + Risiko |
| Relativsatz-Rätsel | ja | Rate-Versuche      |

Die finale Liste kann sich nach **Machbarkeit in Unity**, **Backend** und **didaktischer Freigabe** noch anpassen; Aufgabentypen lassen sich bei Bedarf **streichen oder ersetzen**.
