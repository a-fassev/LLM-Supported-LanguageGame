# Config Contract (V1)

Ziel: schnelle Aenderbarkeit ueber Konfiguration statt Code.  
Quelle fuer Content-Validierung: `Assets/_Project/Content/Schemas/level-content.schema.json`.

## 1) Level JSON (pro Leveldatei)

```json
{
  "levelId": "a2-school-sequence-01",
  "version": 1,
  "displayName": "A2 School Mission",
  "difficulty": "medium",
  "theme": "school_life",
  "taskOrder": ["task-1", "task-2"],
  "levelCompletionRule": { "mode": "all_required" },
  "tasks": []
}
```

Pflichtfelder:
- `levelId`: eindeutige Level-ID
- `version`: Schema-Version (integer)
- `displayName`: Anzeigename
- `difficulty`: `easy | medium | hard`
- `taskOrder`: Reihenfolge der `taskId`s
- `levelCompletionRule`: Abschlussregel
- `tasks`: Aufgabenliste

Optionale Felder:
- `theme`: freies Tagging fuer Hub/Katalog

## 2) Level Completion Rule

```json
{ "mode": "all_required" }
```
oder
```json
{ "mode": "min_score", "minScorePercent": 70 }
```

Keys:
- `mode`: `all_required | min_score`
- `minScorePercent` (optional): 0-100, relevant fuer `min_score`

## 3) Task Base Contract (alle Tasktypen)

Pflichtfelder:
- `taskId`: eindeutige Task-ID im Level
- `taskType`: Typ der Aufgabe
- `prompt`: Anweisung fuer den Spieler
- `scoring`: Bewertungsobjekt

Optionale Felder:
- `assets`: Asset-Referenzen (Pfad/ID)
- `requiredToPassLevel`: `true|false` (Default: `true`)
- `unlockNextTaskWhen`: `always | pass | perfect_score` (Default: `pass`)
- `maxAttempts`: integer >= 1 (wenn nicht gesetzt: unbegrenzt)

## 4) Scoring Contract

```json
{
  "policy": "partial_points",
  "maxPoints": 5,
  "passThreshold": 0.6
}
```

Keys:
- `policy`: `strict_binary | partial_points | threshold_pass`
- `maxPoints` (optional, empfohlen): integer >= 1
- `passThreshold` (optional): 0-1

## 5) Tasktype-spezifische Keys

- `error_hunt`
  - Pflicht: `textWithError`, `acceptedCorrections[]`

- `drag_drop`
  - Pflicht: `tokens[]`, `correctOrder[]`

- `cloze_text`
  - Pflicht: `templateText`, `gaps[]`
  - `gaps[]` Item: `gapId`, `acceptedAnswers[]`, optional `options[]`

- `matching`
  - Pflicht: `leftItems[]`, `rightItems[]`, `correctPairs[]`
  - `correctPairs[]` Item: `left`, `right`

- `multiple_choice`
  - Pflicht: `question`, `choices[]`, `correctChoiceId`
  - `choices[]` Item: `id`, `label`

- `llm_free_text`
  - Pflicht: `evaluationCriteria[]`, `targetStructures[]`

- `llm_word_guess`
  - Pflicht: `targetWord`, `maxGuessAttempts`

## 6) Runtime App Config (nicht in Level-JSON)

Diese Keys gehoeren in eine App-/Runtime-Config (z. B. ScriptableObject oder eigene JSON), nicht in Content-Dateien:

- `resumeLastAttempt`: `true|false`
- `apiTimeoutMs`: z. B. `12000`
- `apiRetryCount`: z. B. `1`
- `persistenceProvider`: `local` (V1), spaeter `supabase`
- `errorCodeToMessageMap`: Mapping fuer `CONTENT_INVALID`, `TASK_CONFIG_INVALID`, `NETWORK_TIMEOUT`, `API_UNAVAILABLE`, `API_INVALID_RESPONSE`, `SCENE_LOAD_FAILED`
- `inputHintProfiles`: Plattformspezifische UI-Hinweise fuer Keyboard/Mouse und Gamepad
- `scoreRules`: globale Defaults fuer Score-Gewichtung und Rundung
- `playerProgressionRules`: Regeln fuer spaetere Stats/Modifier-Freischaltung

## 7) Authoring-Checkliste (kurz)

- Jede `taskId` ist eindeutig innerhalb der Datei.
- `taskOrder` referenziert nur vorhandene `taskId`s.
- Jeder Tasktyp hat seine Pflichtfelder.
- `levelCompletionRule` passt zur Bewertungslogik.
- JSON validiert gegen `level-content.schema.json`.
