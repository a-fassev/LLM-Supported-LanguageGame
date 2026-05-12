# Spiel-Anforderungen (Stand aus Team-JF 12.05.2026)

Kurzfassung der besprochenen **funktionalen und organisatorischen Anforderungen** für das Sprachlern-Spiel (Italienisch, Schulprojekt). Quelle: Meeting-Transkript; bei Abweichungen zur späteren Lehrkräfte-Abstimmung gilt der aktualisierte Stand mit Frau Bernhofer.

---

## 1. Zielbild und Kontext

- **Fachlicher Kontext:** Italienisch-Unterricht / Schulbuchbezug; Inhalte werden vom Inhaltsteam aufbereitet und nach Absprache mit der Lehrkraft geliefert (u. a. Aufgaben aus dem Buch, teils angepasst, inkl. „Fehlersuche“-Texte o. Ä.).
- **Wissenschaftlicher Rahmen:** Es gibt eine **Research Question**, die durch **Spieldurchführung** beantwortet werden soll, ergänzt um **Tests vorher und nachher**. Zusätzlich sollen **Begründungen** für gewählte **Aufgabentypen** und **Inhalte** methodisch sauber ausgearbeitet werden (Einbindung in Paper; Konzepte aus Literatur möglichst früh, damit sie ins Spiel fließen können).
- **Technologie-Mix:** Client-seitig **Unity**; **Backend/Hosting** (besprochen: **Azure**, z. B. Container-Umgebung mit vorhandenen Credits). **LLM** zunächst **stark eingeschränkt**: viele Aufgabentypen als **feste, deterministische Logik** im Backend; LLM nur **punktuell** bei **ein oder zwei** Aufgabentypen, später schrittweise erweiterbar.

---

## 2. Spielkonzept und UX (High Level)

### 2.1 Navigation und Welt

- **Kein komplexer „Hub“,** in dem eine Figur frei herumläuft (Referenz: externer Vorschlag wurde verworfen).
- Stattdessen: **Stadtkarte** als übergeordnete Ansicht.
- **Pins auf der Karte**, deren Sichtbarkeit vom **Level** abhängt.
- **Klick auf Pin** → Einstieg in eine **Quest**; Quests sind **verkettet** (eine abschließen → nächste wird relevant).

### 2.2 Maskottchen / Figur

- Maskottchen **nicht** als steuerbare Spielfigur zwingend nötig; Variante: Figur **statisch in einer Ecke** („wie ein Bildschirm“), ohne aufwendige Bewegungssteuerung.
- **Belohnungssystem (Referenzprojekt Essen):** je nach Aufgabenleistung **0–3 „Pizzastücke“**; damit lassen sich **Skins** für das Maskottchen freischalten.
- Optional: **unterschiedliche Gesichtsausdrücke** je nach Spielsituation (nice-to-have).
- **Visuelle Idee:** z. B. **Löwe** (Stadtwappen Bologna) oder neutral **Junge/Mädchen** (Schulausfluss-Kontext)—noch nicht final.

### 2.3 Aufgaben und Modularität

- Aufgabentypen **modular** halten (Beispiel: **Drag-and-Drop**), sodass vor allem **Texte/Inhalte** getauscht werden können, ohne Kernlogik neu zu bauen.
- Aufgabentypenliste ist ein **Team-Vorschlag** aus Buch-tauglichen Formaten; **LLM-lastige** oder aufwendige Typen können **gestrichen oder ersetzt** werden, wenn die Umsetzung zu teuer ist.
- **Wenig Freitext** (aus didaktischer / Bewertungssicht gewünscht).

### 2.4 Plattform und Zugang

- Referenz aus anderer Schulgruppe: Spiel **browserbasiert** gehostet; Teilnehmer **einloggen** mit **generiertem Nutzernamen** und Passwort (nicht Tablet-native App zwingend).
- implication für Umsetzung: **Klick-/UI-lastiges** Konzept passt gut zur **Karte** und reduziert Steuerungs-Risiken.

---

## 3. Technische Anforderungen

| Bereich | Anforderung |
|--------|--------------|
| Client | Unity; Grundlogik so, dass **pro Aufgabentyp mindestens ein durchspielbarer Level** existiert (erste Ausbaustufe). |
| Backend | Feste Validierung/Aufgabenlogik wo möglich; LLM nur begrenzt einsetzen. |
| Hosting | Azure (o. Ä.) für API/Hosting; Kostenrahmen mit Hochschul-Credits abgestimmt. |
| Daten | **Keine personenbezogenen Daten** der Schülerinnen und Schüler speichern; **Spielernamen zufällig generiert** (Zahlen/Buchstaben o. Ä.). |
| Metriken | Spielmetriken möglich, aber **nicht personenrückführbar**; Schulen sensibilisieren, dass Profilbildung ohne Namen trotzdem Theorie sein kann—transparent kommunizieren. |

---

## 4. Datenschutz und Organisation an der Schule

- **Elterninformation/-einwilligung** vorsehen; mit Schule **schriftlich** klären, was erhoben wird und wie der Ablauf ist.
- **Zufallsnamen + Passwort:** organisatorisch **Zettel** zum Aufschreiben für SuS vorsehen (Referenz aus Gespräch mit anderer Schule).
- **EU-Hosting** allein ersetzt keine Kommunikation mit Schule/Eltern; bei Bedarf **Datenschutz-Review** durch Expert:in (wie bei Referenzprojekt empfohlen).
- Bei Ausfall von Schlüsselpersonal technisch: **früh** und **nachvollziehbar** mit Betreuung (Matthias) und Schule kommunizieren.

---

## 5. Inhaltlicher Lieferprozess

1. **Grundgerüst** (Storyline, Spielname, Kapitel-/Quest-Struktur, Aufgabenkategorien) **finalisieren** und an **Frau Bernhofer** schicken.
2. Nach Freigabe: **Aufgabenpakete** aus Buch/Inhaltsteam so aufbereiten, dass sie **als Default-Inhalte** ins Spiel übernommen werden können.
3. Technik kann parallel **Skeleton** bauen; fehlende Einzelaufgaben sind weniger kritisch als fehlende **Aufgabentyp-Mechaniken**.

---

## 6. Zeitplan und Schulbesuch (aus Gespräch)

- **Schulwoche** für Durchführung zuletzt genannt: **29.06.–03.07.** (Kalender mit Ferien/Semesterende abstimmen).
- Frühere Kohorte: mehrere kurze Einheiten über Semester; **jetzt:** stärker **komprimiert** (z. B. **ein-zwei Blöcke**/Recap statt sechs verteilter Besuche)—**konkret mit Lehrkraft abstimmen**.
- **Zielmarke Mitte Juni:** erste Version des Spiels **feature-complete / „ready for tests“**; danach **1–2 Wochen** Puffer für Tests, Fixes und Organisation vor Schultermin.
- Paper/Ausarbeitung kann **nach** der Feldphase weiterlaufen (z. B. bis September—vereinbarte Rahmen flexibel halten).

---

## 7. Abgestimmte Sprint-/Team-Ziele (Auszug)

| Team / Thema | Ziel (aus Meeting) |
|--------------|-------------------|
| Inhalt | Grundgerüst bis **Freitag** Richtung Lehrkraft; Abstimmung **Mitte Folgewoche** (~**Mittwoch**); danach Aufgabenpakete rollierend vorbereiten. |
| Technik (Unity) | Bis **Dienstag Folgewoche:** Grundlogik, **ein Level pro Aufgabentyp**, durchklickbar (noch ohne Feinschliff/Story-Zusammenhalt). |
| Backend/Hosting | Grundgerüst Hosting (z. B. Azure) parallel aufsetzen. |
| Research | Bis **Dienstag Folgewoche:** **Research Question(s)**—optional **zwei Varianten** zur Auswahl; **1–2 Literaturkonzepte**; Orientierung an Paper/Vorgehen der Referenzgruppe möglich. |

---

## 8. Offene Punkte / zu klären

- Exakte **finalen Aufgabentypen** nach Machbarkeit und Lehrkraft-Feedback.
- **Deployment-Pfad:** WebGL vs. reines Web-Frontend + API—mit Referenz „browser login“ und Unity-Stack im Team abstimmen.
- **Umfang LLM** pro Aufgabentyp nach erstem Review mit Betreuung.
- Endgültiges **Maskottchen** und Asset-Umfang (Skins, Ausdrücke).
- **Teststrategie** (intern, mit Lehrkraft, ggf. kurzes Review durch erfahrene Externe für Didaktik/Italienisch).

---

*Dokument dient der gemeinsamen Orientierung; Detailentscheidungen erfolgen mit Lehrkraft und Betreuung.*
