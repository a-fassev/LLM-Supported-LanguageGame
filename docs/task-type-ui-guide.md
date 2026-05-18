# Building task-specific UI (Unity, UI Toolkit)

Per-task screens run **inside the quest shell**: `QuestShellView` clears the **`step-host`** region of **`QuestShellScreen`** (`Assets/Resources/UI/LearningToolkit/QuestShellScreen.uxml`) and **`ToolkitStepFactory`** builds an **`IStepView`** implementation for the active server step.

Legacy **uGUI**, **`StepTemplateCatalog`**, and step **prefabs** were removed; do not follow older prefab/catalog workflows.

## Related code

| Role | Path |
|------|------|
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Contracts | `Assets/Scripts/Presentation/Steps/IStepView.cs`, `ISubmitFromShell.cs`, `StepContext.cs` |
| Implemented steps | `DragDropToolkitStep.cs`, `ClozeTextToolkitStep.cs`, `MultipleChoiceToolkitStep.cs`, `MatchingToolkitStep.cs`, `FreitextLlmToolkitStep.cs`, `SpecialScreenToolkitStep.cs`, `CutsceneToolkitStep.cs`, `StubToolkitTaskStep.cs` |
| Tokens | `UiDesignTokens.cs`, `UiThemeProvider.cs`; USS under `Assets/Resources/UI/LearningToolkit/` |

---

## Architecture

1. **`GameFlowController`** loads **`Quest`**; **`QuestShellView`** mirrors server progression.
2. **`BindStep`** calls **`ToolkitStepFactory.Create(step, _toolkitStepHost, this)`**.
3. If the factory returns **`null`** (only when **`stepHost`** is **`null`**), the shell installs **`MissingToolkitStepView`** — visible message + **`SubmitFromShell`** routes validation feedback so the learner is not stuck silently.
4. **Shell chrome**: Back, primary (**Next** / **Check** / **Finish quest**), loading, validation, reward overlays (`LearningToolkitOverlays`).
5. **Tasks**: shell primary **Controlla** → **`ISubmitFromShell.SubmitFromShell()`**. **Cutscenes**: **Next** → **`StepCompletionRequest`** / advance RPC flow.

Complete a step from code:

```csharp
onRequest(new StepCompletionRequest { requestComplete = true });
```

Use **`StepContext.presentValidationMessage`** for client-side validation errors (shell-owned overlay).

### Remote media URLs (`http` / `https`)

Steps that load remote images or audio (`imageUrl`, MultipleChoice `audioUrl`, etc.) use **`ToolkitStepHttpResourceUrl`**: **string-level checks** when parsing `contentJson`, and **`TryVerifyForClientFetch`** immediately before `UnityWebRequest` so **hostnames** are **resolved** and blocked when any address is loopback, private (RFC1918), link-local, or IPv6 ULA (with a small per-host session cache). If **`Dns.GetHostAddresses`** throws (offline, some runtimes), verification may **fail open** with a logged warning — prefer trusted CDNs and author-controlled URLs.

---

## Workflow for a new `taskType`

1. Agree **`contentJson`** shape with whoever owns **`game_quest_steps`** / API.
2. Add **`YourSomethingToolkitStep : IStepView`** (+ **`ISubmitFromShell`** if the shell submits it).
3. Build UI with **`UnityEngine.UIElements`** under **`stepHost`** in **`Bind`**; **`Teardown`** removes what you added.
4. Add **`case "YourTaskType":`** to **`ToolkitStepFactory`**.
5. Prefer **`lg-*`** USS classes; avoid duplicating shell overlays inside the step.

Optional: extend **`Assets/Scripts/Domain/TaskType.cs`** only if tooling still mirrors enums.

---

## `contentJson` reference (implemented types)

Implementation classes contain DTOs / parsers (names may differ slightly from legacy **`\*StepView`** files):

### DragDrop (`taskType`: DragDrop)

**Implementation:** **`DragDropToolkitStep`**.

Behaviour summary: drag items into targets; validation on **Check** (including optional **`requireBankEmpty`**). **`imageUrl`** / remote assets must be **`http`** / **`https`**.

Top-level fields (see **`DragDropToolkitStep`** for full DTO):

| Field | Notes |
|-------|--------|
| **`prompt`** / **`subtitle`** | Title / instructions |
| **`shuffleItemOrder`** | Shuffle source tiles |
| **`requireBankEmpty`** | All items must be placed |
| **`items`** | **`id`**, **`label`**, optional **`imageUrl`** |
| **`targets`** | **`id`**, **`title`**, **`correctItemIds`**, **`targetMode`** semantics |
| **`presentation`** | **`targetMode`**: **`blocks`** or **`lines`**; section labels |
| **`lines`** | Sentence segments when **`lines`** mode |

Examples (blocks vs lines) match the shapes previously documented for DragDrop; validate against **`DragDropToolkitStep`** when extending.

---

### MultipleChoice (`taskType`: MultipleChoice)

**Implementation:** **`MultipleChoiceToolkitStep`**.

Root / per-question fields include **`stem`** blocks (**text** / **image** / **audio**), **`options`**, **`correctOptionIds`**, **`selectionMode`** (**single** / **multiple**), **`preserveOptionOrder`**. See **`MultipleChoiceToolkitStep`** / nested DTO types for exact tables.

---

### ClozeText (`taskType`: ClozeText)

**Implementation:** **`ClozeTextToolkitStep`**. Parse and behaviour live in that file.

Learner-facing validation messages from **Check** / composite hosts are **Italian**.
---

### Matching (`taskType`: Matching)

**Implementation:** **`MatchingToolkitStep`**.

Learners connect **left** and **right** items. **Drag** from a left card and release on the correct right card (rubber-band line while dragging), **or** **tap** a left item then a right item. **`imageUrl`** values must be absolute **`http`/`https`** when present.

| Field | Notes |
|-------|--------|
| **`prompt`**, **`subtitle`** | Title / instructions |
| **`leftItems`**, **`rightItems`** | Each: **`id`**, **`label`**, optional **`imageUrl`** |
| **`correctPairs`** | Each pair: **`leftItemId`**, **`rightItemId`** — each left id appears **exactly once**; each right id at most **once** (one-to-one matching). |
| **`presentation`** | Optional **`leftLabel`**, **`rightLabel`**, **`shuffleRightOrder`** (shuffle the right column for display). If labels are omitted, defaults are **Sinistra** / **Destra**. |

Learners can remove a pair with the **×** control on a paired left row (or re-pair / toggle as before).

Example (minimal):

```json
{
  "prompt": "Abbina le coppie",
  "leftItems": [
    { "id": "l1", "label": "Buongiorno" },
    { "id": "l2", "label": "Grazie" }
  ],
  "rightItems": [
    { "id": "r1", "label": "Mattina" },
    { "id": "r2", "label": "Ringraziamento" }
  ],
  "correctPairs": [
    { "leftItemId": "l1", "rightItemId": "r1" },
    { "leftItemId": "l2", "rightItemId": "r2" }
  ],
  "presentation": {
    "leftLabel": "Italiano",
    "rightLabel": "Significato",
    "shuffleRightOrder": true
  }
}
```

---

### FreitextLlm (`taskType`: FreitextLlm)

**Implementation:** **`FreitextLlmToolkitStep`** + **`IEvaluationGateForTaskCompletion`**.

Behaviour summary:

- Multiline **`TextField`** captures the learner response.
- **Check** first calls **`POST /api/game/runs/{runId}/steps/{stepId}/evaluate`** with `{ "answerText": "<learner reply>" }`. The LLM verdict must pass before **`POST .../complete`** may run **with `{ "evaluationGateToken": "<uuid>" }`**.
- Tokens are mirrored into `player_freitext_llm_gates` (see migrations) and revoked after authoritative completion.

Minimal `contentJson` / **`content_payload`** template:

```json
{
  "prompt": "Italian writing prompt headline.",
  "instruction": "Extra guidance beneath the headline (optional).",
  "targetLanguage": "it",
  "showWordCount": true,
  "showCharacterCount": false,
  "minWords": 6,
  "maxWords": 120,
  "evaluation": {
    "grammarWeight": 1,
    "vocabularyWeight": 1,
    "registerWeight": 1,
    "passThreshold": 0.72,
    "registerTarget": "neutral",
    "scoringPolicy": "threshold_pass",
    "maxPoints": 5,
    "evaluationCriteria": [
      "Italian grammar clarity",
      "Word-choice fit versus prompt",
      "Register aligns with communicated audience"
    ],
    "targetStructures": ["relative pronouns"]
  }
}
```

---

### Special Screen (`taskType`: `SpecialScreen`, `SpecialScreenSms`, `SpecialScreenMailEditor`, `SpecialScreenPhotoViewer`, `SpecialScreenReader`)

**Implementation:** **`SpecialScreenToolkitStep`** (`ToolkitStepFactory` routes all variants to the same host).

Behaviour summary:

- **`step_kind`** remains **`task`** — progression uses the normal shell **Controlla** → **`complete_quest_step_task`** flow (same as other puzzle tasks).
- **Reader display-only** (**`SpecialScreenReader`** or **`screenVariant`**: **`reader`** with optional empty **`blocks`**): Unity renders **`readerChrome`** (hero image + long text, optional two columns or line-numbered excerpt). Paging **←** / **→** is **hidden**; **Controlla** completes the step with no embedded mechanic validation.
- For all other special screens, one server step hosts **multiple ordered mechanics** inside **`blocks`**; learners move with **←** / **→** (same pattern as multiple-choice paging, with a centered progress caption between the arrows).
- **→** validates the **current** block only (embedded **`ClozeText`** / **`ErrorSpotting`** rules), when **`blocks`** is non-empty.
- Shell **Controlla** is accepted only on the **last** block (or immediately in reader display-only mode) and then validates **every** block again before **`StepCompletionRequest`** fires (no-op when there are zero blocks).

**Learner-facing validation copy** for special screens and for embedded **`ClozeText`** / **`ErrorSpotting`** blocks is **Italian** (aligned with standalone error-spotting tasks).

Chrome loads from **`SpecialScreenHost`** (`Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml`) with a **programmatic fallback** if Resources loading fails.

DTO types live beside other payloads in **`ToolkitStepContentDtos.cs`** (`SpecialScreenContentDto`, `SpecialScreenReaderChromeDto`, `SpecialScreenSmsChromeDto`, `SpecialScreenChatMessageDto`, `SpecialScreenBlockDto`, `SpecialScreenStubBlockDto`).

#### Top-level `contentJson`

| Field | Required | Notes |
| ----- | -------- | ----- |
| **`screenVariant`** | no | Authoring hint (`sms`, `whatsapp`, `mail`, `photo`, `reader`, `generic`, …). `whatsapp` applies a subtle green tint to outgoing bubbles. |
| **`title`** | no | Chrome headline (hidden for messenger **or** reader display-only; reader may fall back to **`readerChrome.headline`**) |
| **`subtitle`** | no | Chrome subline (hidden for messenger **or** reader display-only; reader may fall back to **`readerChrome.subheadline`**) |
| **`smsChrome`** | no | Messenger transcript + status bar. When present **and** messenger mode is active (see below), Unity renders a **smartphone mockup**, **scrollable** chat, and hosts mechanics inside bubbles. Ignored when reader mode wins (see below). |
| **`readerChrome`** | yes for reader mode | Required when **`taskType`** is **`SpecialScreenReader`** **or** **`screenVariant`** is **`reader`**. See **Reader mode** below. |
| **`blocks`** | yes *except* reader display-only | Non-empty ordered array for messenger / generic multi-part screens. For **display-only reader** steps, omit **`blocks`** or send an empty array `[]`. |

#### Reader mode (magazine / book excerpt)

Reader UI activates when **`taskType`** is **`SpecialScreenReader`** **or** **`screenVariant`** is **`reader`** (case-insensitive). **`readerChrome`** is **required** and **`readerChrome.bodyText`** must be non-empty (plain text; newlines preserved).

- **Messenger conflict:** if reader mode applies, **`smsChrome`** / messenger layout is **not** used (even if `smsChrome.messages` is populated).
- **Remote images:** optional **`readerChrome.imageUrl`** must be an absolute **`http`/`https`** URL allowed by **`ToolkitStepHttpResourceUrl`** (same rules as other toolkit steps).
- **`columnCount`:** **`1`** or **`2`**. **`2`** (default when omitted or any other value) uses a **two-column** magazine flow: paragraphs split on blank lines (`\n\n`); a single long paragraph is split near the midpoint on a space.
- **`showLineNumbers`:** when **`true`**, each line (split on `\n`) is shown with a **monotonic line index** in the gutter; **single-column** only (Unity ignores multi-column for this mode).
- **Shell paging:** hidden when **`blocks`** is empty; learners press **Controlla** to complete.

| `readerChrome` field | Required | Notes |
| -------------------- | -------- | ----- |
| **`bodyText`** | yes | Long reading copy |
| **`imageUrl`** | no | Optional hero illustration |
| **`headline`** / **`subheadline`** | no | In-panel titles; fall back to root **`title`** / **`subtitle`** when empty |
| **`columnCount`** | no | `1` or `2` (see above) |
| **`showLineNumbers`** | no | Book-excerpt style line numbers |

#### Messenger mode (SMS / WhatsApp viewer)

Messenger UI activates when **`smsChrome.messages`** is a **non-empty** array **and** any of:

- **`taskType`** is **`SpecialScreenSms`**, or
- **`screenVariant`** is **`sms`** or **`whatsapp`** (case-insensitive).

Otherwise `smsChrome` is ignored and the generic special-screen chrome is used (title/subtitle + sequential blocks only).

Rules (Unity client validation):

- Every chat message must set **`direction`** to **`incoming`** (left / NPC-style) or **`outgoing`** (right / player-style).
- **Each** entry in **`blocks`** must be referenced by **exactly one** chat message with **`hostsEmbeddedMechanic`: true** and matching **`embeddedMechanicBlockIndex`** (0-based index into **`blocks`**). Embed the mechanic that should appear inside that bubble (typically **`cloze_text`**).
- **Unity `JsonUtility`**: if **`embeddedMechanicBlockIndex`** is **omitted** from JSON, it deserializes as **`0`** — always include the property explicitly when targeting block index **`1`** or higher (otherwise authoring mistakes may surface only as wrong-slot UX).
- Messages without `hostsEmbeddedMechanic` use plain **`text`** (optional **`author`** caption above the bubble).
- Rows must include at least one of **`text`**, **`author`**, or **`hostsEmbeddedMechanic`** — purely empty rows fail validation.
- **`null` entries inside `messages`** are rejected at parse time.
- For a row with **`hostsEmbeddedMechanic`** targeting **another** block than the active «part», provide optional **`text`** as a conversational preview; if **`text`** is empty, Unity shows a muted **`…`** placeholder instead of an empty bubble.
- Fully empty bubbles (no author, no body, no mechanic slot on this part) are **not** rendered.
- **`smsChrome.statusBar`**: optional; **`timeText`** and **`signalHint`** are atmosphere-only (defaults apply if omitted).
- **`smsChrome.chatHeaderTitle`**: optional in-app header (e.g. contact name).
- For a learner completing **their own** reply, host **`cloze_text`** in an **`outgoing`** bubble; NPC prompts stay **`incoming`**.

Server storage: PostgreSQL column is **`content_payload` (jsonb)**; HTTP/API exposes the same object as **`contentJson`**.

#### Block object (`blocks[]`)

| Field | Notes |
| ----- | ----- |
| **`blockType`** | `cloze_text` / `ClozeText`, `error_spotting` / `ErrorSpotting`, `stub` (case-insensitive) |
| **`clozeText`** | Same shape as standalone **`ClozeText`** tasks |
| **`errorSpotting`** | Same shape as standalone **`ErrorSpotting`** tasks |
| **`stub`** | Optional **`headline`** / **`body`** placeholder copy |

Example (minimal multi-block):

```json
{
  "screenVariant": "generic",
  "title": "Schermata speciale (esempio)",
  "subtitle": "Usa «→» tra le parti, poi «Controlla».",
  "blocks": [
    {
      "blockType": "cloze_text",
      "clozeText": {
        "prompt": "Completa.",
        "caseSensitive": false,
        "lines": [
          {
            "segments": [
              { "kind": "text", "text": "Mi chiamo " },
              { "kind": "gap", "correctAnswers": ["Anna"], "maxLength": 24 }
            ]
          }
        ]
      }
    },
    {
      "blockType": "stub",
      "stub": {
        "headline": "Cornice segnaposto",
        "body": "Qui arriveranno cornici SMS / mail / lettore."
      }
    }
  ]
}
```

Example (**`SpecialScreenSms`**, WhatsApp-style skin, single embedded **`cloze_text`** in-thread):

```json
{
  "screenVariant": "whatsapp",
  "smsChrome": {
    "statusBar": {
      "timeText": "14:32",
      "signalHint": "LTE ●●●●●"
    },
    "chatHeaderTitle": "Marco",
    "messages": [
      {
        "direction": "incoming",
        "author": "Marco",
        "text": "Ciao! Pizza stasera? A che ora ti va bene?"
      },
      {
        "direction": "outgoing",
        "hostsEmbeddedMechanic": true,
        "embeddedMechanicBlockIndex": 0,
        "text": ""
      }
    ]
  },
  "blocks": [
    {
      "blockType": "cloze_text",
      "clozeText": {
        "prompt": "",
        "caseSensitive": false,
        "lines": [
          {
            "segments": [
              { "kind": "text", "text": "Alle " },
              { "kind": "gap", "correctAnswers": ["otto", "8"], "maxLength": 12 },
              { "kind": "text", "text": " va bene!" }
            ]
          }
        ]
      }
    }
  ]
}
```

Example (**`SpecialScreenReader`**, magazine-style two-column body + hero image):

```json
{
  "screenVariant": "reader",
  "title": "",
  "subtitle": "",
  "readerChrome": {
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg",
    "headline": "Rubrica cultura — La città che legge",
    "subheadline": "Articolo dimostrativo (testo sintetico).",
    "columnCount": 2,
    "showLineNumbers": false,
    "bodyText": "Questo contenuto è un esempio per la rubrica ludica.\n\nLa lettura permette una pausa dall'azione degli altri compiti della quest.\n\nUsa nuovi paragrafi (riga vuota) per decidere dove spezzare le colonne: il client raggruppa i paragrafi nella colonna sinistra e poi in quella destra.\n\nAlla fine, il giocatore preme solo «Controlla» per continuare."
  },
  "blocks": []
}
```

Example (**book excerpt**, line-numbered single column):

```json
{
  "screenVariant": "reader",
  "readerChrome": {
    "headline": "Estratto dal libro",
    "subheadline": "Riferimenti con numeri di riga.",
    "columnCount": 2,
    "showLineNumbers": true,
    "bodyText": "Era una mattina luminosa quando Anna uscì di casa.\nSentiva già odore di pane fresco dall'angolo.\nDecise di fermarsi prima del tram."
  },
  "blocks": []
}
```

---

### Cutscenes (`isTask`: false)

**Implementation:** **`CutsceneToolkitStep`**.

Cutscenes are **presentation-only**: learners advance with the quest shell **Next** button (no **Check**, no puzzle rewards from `contentJson`). The server stores JSON in `game_quest_steps.content_payload`; the API exposes it as **`contentJson`** (stringified object).

**Schema version:** optional top-level **`schemaVersion`** (integer, defaults to **`1`** if omitted). Only **`1`** is defined today.

**Strict authoring (Next.js):** cutscene payloads are validated when quests are loaded for session APIs. **`extra` properties are rejected** (Zod `.strict()`): typos like `"tilte"` fail fast so content never silently diverges from this contract.

**Server error convention:** malformed cutscene JSON → HTTP **502** with `code: "payload_invalid"` and message `Malformed Cutscene content payload` (quest bootstrap / start / resume / run snapshot). Responses may include **`details.cutscenePayloadErrors`** (bootstrap: all bad steps) or **`details`** with a single step (`questSlug`, `stepId`, `templateKey`, `issues`) for start/run endpoints — use for authoring fixes, not learner-facing copy. The same `code` string is used for unrelated **`FreitextLlm`** step payload failures on **`/evaluate`** (no `details`); use **path + message** to tell them apart.

**Unity:** parses `contentJson` with `JsonUtility` + guards; invalid JSON shows a short **Italian** placeholder — never raw JSON in the body.

| Field | Required | Notes |
| ----- | -------- | ----- |
| **`title`** | yes | Headline |
| **`body`** | yes | Flowing narrative / instructions (plain text) |
| **`schemaVersion`** | no | Default `1` |
| **`subtitle`** | no | Line under the headline |
| **`illustrationId`** | no | Optional asset key for future illustration hooks (not auto-resolved in Unity yet) |
| **`tone`** | no | Optional UI tone hint (e.g. `celebratory`, `neutral`); cosmetic only |
| **`ariaNote`** | no | Accessibility / screen-reader note (reserved; Unity may map to `HelpText` later) |
| **`primaryCtaLabel`** | no | Cosmetic only; **does not** replace shell **Next** / localization |

Example (minimal):

```json
{
  "schemaVersion": 1,
  "title": "Benvenuto",
  "body": "Iniziamo la tua avventura nella città."
}
```

Example (options):

```json
{
  "schemaVersion": 1,
  "title": "Ottimo lavoro",
  "subtitle": "Piccola pausa",
  "body": "Hai finito tutti i compiti di questa quest. Premi Avanti per continuare.",
  "tone": "celebratory",
  "illustrationId": "mascot-wave",
  "primaryCtaLabel": "Avanti"
}
```

Anti-pattern (invalid — missing **`body`**, server returns 502):

```json
{
  "schemaVersion": 1,
  "title": "Incomplete"
}
```

---

### ErrorSpotting (`taskType`: ErrorSpotting)

**Implementation:** **`ErrorSpottingToolkitStep`**.

Interactive “Fehlersuche”: **every** segment can be marked/unmarked. A **marked** span shows an **inline `TextField`** (same UX for all tokens); wrong-mark validation and `acceptedCorrections` checks happen only on **Check**. **Ripristina** clears selections and drafts.

| Field | Notes |
| ----- | ------ |
| **`prompt`** | Title / headline |
| **`instruction`** | Hint under headline (optional) |
| **`counterCaption`** | Optional learner hint line above the chips. Supports placeholders **`{count}`**, **`{min}`**, **`{max}`** (filled from authoring). When omitted, Unity shows an Italian default with the exact error count |
| **`expectedErrorRange`** | **`min`**, **`max`** — **authoring only**: the counted `true` error segments (`isError`) must satisfy **`min ≤ count ≤ max`**. Not shown verbatim to learners unless you use **`{min}` / `{max}`** inside **`counterCaption`** |
| **`segments`** | Ordered list of **`id`**, **`text`**, **`isError`**, **`acceptedCorrections`** (required when `isError`; case-insensitive, whitespace-collapsed matching), optional **`hint`**

Learner must end with **exactly** the set of segments where **`isError`** is true (any extra mark or missing error fails on **Check**), and each true-error inline answer must match one of **`acceptedCorrections`**. Inline text on non-error marks is ignored for correction scoring but selection still counts toward the “wrong mark” check.

Example (minimal):

```json
{
  "prompt": "Trova e correggi",
  "instruction": "Tocca le parti sbagliate e scrivi la forma corretta.",
  "expectedErrorRange": { "min": 1, "max": 1 },
  "segments": [
    { "id": "t1", "text": "Maria ", "isError": false },
    { "id": "t2", "text": "vai ", "isError": true, "acceptedCorrections": ["va"] },
    { "id": "t3", "text": "a scuola ogni giorno.", "isError": false }
  ]
}
```

---

### Stub types (`FreeText`, `RelativeClause`, unknown)

**Implementation:** **`StubToolkitTaskStep`** — placeholder UX until a dedicated toolkit step exists.

---

## Cutscenes vs tasks

- **`QuestShellView.ConfigureShellPrimaryChrome`** sets **Next** vs **Check**.
- **`presentValidationMessage`** feeds the shell validation overlay.
- Server authoritative rewards still come from complete-step / advance-step API responses.

---

## Checklist (new task type)

1. [ ] Stable **`contentJson`** with backend.
2. [ ] **`IStepView`** (+ **`ISubmitFromShell`** when shell submits).
3. [ ] **`ToolkitStepFactory`** **`case`** for **`taskType`**.
4. [ ] USS / tokens consistent with menus theme.
5. [ ] Play Mode: **Check** / **Next**, validation overlay, reward overlay after success.

---

## See also

- **`AGENTS.md`** — navigation, UI Toolkit conventions, wallet HUD.
