# Unity 2D Grundgeruest — Requirements Foundation

> **Purpose**: Ein klickbares Unity-2D-Spielgrundgeruest bereitstellen, damit das Team Navigation, Levelstruktur und Aufgabentyp-Shells stabil testen und spaeter mit echter Aufgabenlogik fuellen kann.

## Problem Statement
Aktuell gibt es noch kein spielbares Grundgeruest mit klarer Nutzerfuehrung. Spieler:innen brauchen einen einfachen Einstieg ueber ein Hauptmenue, eine klare Uebersicht ueber Aufgaben ueber eine Stadtkarte und einen konsistenten Rueckweg aus jedem Level. Ohne diese Basis kann das Team Aufgabentypen nicht effizient iterieren, testen oder inhaltlich befuellen.

---

## Confirmed Decisions
| Question | Decision |
|----------|----------|
| Main Hub: frei begehbar oder UI-basiert? | UI-basierte Stadtkarte mit Pins; keine bewegbaren Figuren auf der Karte. |
| Einstiegsszene? | `MainMenu` ist immer die erste Szene und fester Startpunkt. |
| Levelabschluss-Flow? | `Level beenden` fuehrt immer zurueck auf `CityMap`. |
| Beenden-Button im ersten Milestone? | Nein, komplett entfernt. |
| Levellayout? | Links kleine statische User-Figur (gleiches Sprite in allen Levels), rechts Aufgabenflaeche. |
| Szenenaufteilung? | Eine Szene pro Aufgabentyp (7 Typen), jeweils als durchklickbarer Stub. |
| Szenenwechsel-Architektur? | Zentraler `GameFlowController` (Singleton + `DontDestroyOnLoad`) mit duennen View-Skripten pro Szene. |

---

## User Experience

### User Flows
1. Spieler:in startet das Spiel in `MainMenu`.
2. Klick auf `Spielen` laedt `CityMap`.
3. In `CityMap` sind alle Aufgabentyp-Pins sichtbar und klickbar.
4. Klick auf einen Pin oeffnet die zugehoerige `Level*`-Szene.
5. In jedem Level sieht der/die Nutzer:in links die kleine User-Figur und rechts den Aufgabenbereich (zunaechst Stub-Inhalt).
6. Klick auf `Zur Stadtkarte` beendet das Level und fuehrt zurueck zu `CityMap`.
7. In `CityMap` kann jederzeit ueber `Hauptmenue` zurueck zu `MainMenu` navigiert werden.

### Empty / Loading / Error States
- **Empty (Level-Stub):** Rechts wird ein klarer Platzhaltertext gezeigt (`Aufgabenlogik folgt`), damit der Status eindeutig ist.
- **Loading:** Kein separater Ladebildschirm im ersten Milestone; direkter Szenenwechsel.
- **Error (Szene fehlt / Name falsch):** Defensive Guard im Flow-Controller mit Debug-Log und Rueckfall zu `MainMenu` statt Hard-Fail.

### User Expectations
- Navigation ist in jedem Schritt eindeutig und reversibel.
- Keine Sackgassen: Immer ein klarer Weg zurueck zur Karte oder ins Hauptmenue.
- UI reagiert direkt und konsistent, auch wenn Aufgabenlogik noch nicht final ist.

---

## Scope

### In Scope
- Unity-2D-Shell mit folgenden Szenen:
  - `MainMenu`
  - `CityMap`
  - `LevelErrorSpotting`
  - `LevelDragDrop`
  - `LevelClozeText`
  - `LevelMatching`
  - `LevelMultipleChoice`
  - `LevelFreeText`
  - `LevelRelativeClause`
- Fester Flow: `MainMenu -> CityMap -> Level* -> CityMap`, plus `CityMap -> MainMenu`.
- Stadtkarte mit klickbaren Pins fuer alle Aufgabentypen.
- Level-Shell-Layout links/rechts (Figur links, Aufgabenflaeche rechts).
- Zentrale Szenenwechsel-Logik ueber `GameFlowController`.
- View-Skripte pro Szene fuer UI-Bindings.

### Out of Scope
- Konkrete Aufgabenlogik pro Aufgabentyp.
- Bewertungssystem (deterministisch oder LLM).
- Progression/Unlocking-Logik auf der Karte.
- Login, Backend-Anbindung, Datenspeicherung, Telemetrie.
- Audio, Animationen, Feinschliff, Skin-Freischaltungen.

---

## Engineering Design

### Unity
- Projekt bleibt 2D/URP-basiert.
- Build Settings: `MainMenu` als erste Szene; restliche Szenen per Name ladbar.
- Jede Szene enthaelt nur die fuer ihren Zweck noetigen UI-Objekte.
- Keine Gameplay-Physik fuer Hub/Navigation erforderlich (`Rigidbody2D` fuer Hub explizit nicht noetig).

### Next.js app
N/A fuer dieses Grundgeruest.

### Integration
N/A fuer dieses Grundgeruest (noch keine Unity-Web/Backend-Integration im Scope).

### Data & persistence
N/A fuer den ersten Milestone (kein Persistieren von Nutzerfortschritt).

### Error Handling
- `GameFlowController` validiert Ziel-Szenennamen vor/waehrend Load.
- Bei ungueltiger Zielszene: Fehler loggen, Rueckfall auf `MainMenu`.
- Null-Checks in View-Skripten fuer fehlende Button-Referenzen.

### Security
N/A fuer dieses Grundgeruest (keine externe Eingabe, keine Tokens, keine personenbezogenen Daten in Scope).

### Performance
- Ziel: sofortige, ruckelfreie Szenenwechsel fuer kleine Stub-Szenen.
- Leichtgewichtige UI-Layouts, keine schweren Runtime-Systeme im ersten Schritt.

---

## Clean Architecture (fuer das Grundgeruest)

### Layering
- **Presentation Layer (Unity UI + Scene Views):**
  - `MainMenuView`, `CityMapView`, `LevelShellView`
  - Verantwortlich fuer Button-Events und Darstellung.
- **Application Layer (Flow-Orchestrierung):**
  - `GameFlowController`
  - Verantwortlich fuer Navigation, Routing und globale App-Zustaende auf hohem Niveau.
- **Domain Layer (Aufgabenmodell, spaeter):**
  - `TaskType` als zentrales Enum/Modell fuer Aufgabentypen.
  - Noch keine Bewertungsregeln im ersten Milestone.
- **Infrastructure Layer (Unity SceneManagement):**
  - Kapselt `SceneManager.LoadScene`-Aufrufe hinter klaren Methoden.

### Abhaengigkeitsregel
- Views kennen nur den Application-Einstiegspunkt (`GameFlowController.Instance`) und keine direkte Szenen- oder Task-Logik.
- Application kennt Domain-Typen (`TaskType`) und Infrastruktur (SceneLoader).
- Domain bleibt Unity-UI-unabhaengig.

### Vorteile fuer dieses Projekt
- Klare Trennung zwischen UI-Klicklogik und Navigationslogik.
- Aufgabentyp-Logik kann spaeter pro Level rechts eingefuegt werden, ohne den globalen Flow umzubauen.
- Gute Testbarkeit der Navigationsentscheidungen (zu pruefen ueber klar benannte Methoden).

---

## Validated Assumptions
| Assumption | Status | Fallback |
|-----------|--------|----------|
| Alle 7 Aufgabentypen sollen direkt als eigene Stub-Level vorhanden sein. | ✅ Validated | Falls Umfang zu hoch wird: voruebergehend Level zusammenfassen und Pins deaktivieren. |
| Main Hub ist rein die Stadtkarten-UI ohne freie Bewegung. | ✅ Validated | Bei spaeterem Wunsch: separaten explorativen Hub als neuer Scope-Punkt einfuehren. |
| Eine einheitliche kleine Figur links in allen Levels reicht fuer Milestone 1. | ✅ Validated | Spaeter auf skin-/zustandsabhaengige Varianten erweitern. |
| Kein `Beenden`-Button ist fuer den Zielkontext okay. | ✅ Validated | Bei Bedarf plattformabhaengig spaeter ergaenzen (Standalone only). |

---

## Identified Risks
| Risk | Mitigation |
|------|------------|
| Szenennamen driften zwischen Build Settings und Code. | Zentrale Konstanten/Mapping-Tabelle und einmalige Namenskonvention festlegen. |
| Duplicate `GameFlowController` Instanzen durch Szenen-Setup. | Singleton-Guard in `Awake` + Duplikat sofort `Destroy`. |
| UI-Referenzen in Views fehlen nach Prefab-/Scene-Aenderungen. | `SerializeField` + Validierung in `OnValidate`/`Awake` mit klaren Fehlermeldungen. |

---

## Success Criteria
- [ ] Spiel startet immer in `MainMenu`.
- [ ] `Spielen` fuehrt zu `CityMap`.
- [ ] Jeder Pin in `CityMap` laedt die korrekte `Level*`-Szene.
- [ ] Jeder `Level*`-Stub hat links die gleiche kleine Figur und rechts den Aufgaben-Placeholder.
- [ ] `Zur Stadtkarte` funktioniert in allen Levels konsistent.
- [ ] `Hauptmenue` auf der Karte funktioniert jederzeit.
- [ ] Kein `Beenden`-Button ist im Grundgeruest vorhanden.

---

## Implementation Areas (for planning mode)
1. Szenen anlegen und Build-Settings-Reihenfolge finalisieren.
2. UI-Shells fuer `MainMenu`, `CityMap` und `Level*`-Stubs aufbauen.
3. `TaskType`-Mapping und `GameFlowController` implementieren.
4. View-Skripte pro Szene umsetzen und Buttons verdrahten.
5. Minimales Fehlerhandling und Referenz-Validierung ergaenzen.
