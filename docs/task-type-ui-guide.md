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

## UI Builder templates (quest steps)

Task and cutscene layouts are authored as **UXML** under `Assets/Resources/UI/LearningToolkit/Templates/` and loaded at runtime via **`ToolkitStepUx`** (`Assets/Scripts/Presentation/Steps/ToolkitStepUx.cs`).

| Pattern | Usage |
|--------|--------|
| Mount root template | `ToolkitStepUx.TryMount(host, ToolkitStepTemplatePaths.…, "root-name", out _root)` |
| Detached beat/panel | `ToolkitStepUx.Instantiate(path, "root-name")` |
| Clear dynamic host (removes UI Builder fixtures) | `ToolkitStepUx.ClearHost(host)` — call at start of bind on every runtime-cleared host |
| Clone shared row/card/bubble | `ToolkitStepUx.InstantiatePart(ToolkitStepTemplatePaths.…Part, "root-name")` from `Templates/Parts/` |
| Bind text slots | `ToolkitStepUx.SetOptionalLabel(label, text)` |
| Query slots | `ToolkitStepUx.QueryRequired` / `QueryOptional` (see `ToolkitStepUx.cs`) |

**Protected `name` attributes** in UXML must stay stable — C# queries them by name. Do not rename `task-prompt`, `mc-options-host`, `cutscene-beat-host`, etc., without updating the step class.

Paths are centralized in **`ToolkitStepTemplatePaths`** (`Tasks/`, `Cutscenes/`, `Parts/`, `SpecialScreens/`). Styling uses **`lg-*`** USS classes (`task-templates.uss`, per-type USS).

**UI Builder fixtures (Option B):** production templates may include Italian sample trees under named hosts so designers style real structure without separate `*Preview.uxml`. On bind, **`ClearHost`** then rebuild dynamic lists from **`contentJson`** using **`InstantiatePart`** so runtime DOM matches fixture hierarchy and classes. Fixture children must live only inside hosts that bind clears.

Reference host: **`SpecialScreenHost.uxml`** + **`SpecialScreenToolkitStep`**.

## Workflow for a new `taskType`

1. Agree **`contentJson`** shape with whoever owns **`game_quest_steps`** / API.
2. Add **`YourSomethingToolkitStep : IStepView`** (+ **`ISubmitFromShell`** if the shell submits it).
3. Add **`Templates/Tasks/YourTaskTemplate.uxml`** and mount it in the step constructor; bind payload in **`Bind`**; **`Teardown`** removes the mounted root.
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
- **Reader display-only** (**`SpecialScreenReader`** or **`screenVariant`**: **`reader`**): Unity renders **`readerChrome`** only when **`blocks`** is omitted or empty; non-empty **`blocks`** are **rejected at parse**. Optional two columns / line-numbered excerpt. Paging **←** / **→** is **hidden**; **Controlla** completes without embedded mechanic validation.
- **Photo gallery / slideshow** (**`SpecialScreenPhotoViewer`** or **`screenVariant`**: **`photo`**): Unity renders **`photoViewerChrome`** in the first «part». Use **`displayMode`** **`grid4`** (wrapped row) or **`slideshow`** (image + in-panel **←**/**→**). Optional learner **`caption`** fields validated against **`acceptedCaptions`**. **`smsChrome`** must **not** be combined with photo mode. Additional mechanics may follow in **`blocks`** (photo is always **part 1**).
- **E-mail / letter editor** (**`SpecialScreenMailEditor`** or **`screenVariant`**: **`mail`** / **`letter`**): Unity renders **`mailChrome`** (read-only header rows, optional greeting/closing) and nests ordered **`blocks`** inside the body area. **`smsChrome.messages`** must **not** be combined with mail mode. The in-frame **send** button triggers the same validation + completion path as shell **Controlla** (including the **last-part** rule when several **`blocks`** exist). After validation succeeds, **`sendSuccessText`** is shown briefly before the step completes.
- For all other special screens, one server step hosts **multiple ordered mechanics** inside **`blocks`**; learners move with **←** / **→** (same pattern as multiple-choice paging, with a centered progress caption between the arrows).
- **→** validates the **current** block only (embedded **`ClozeText`** / **`ErrorSpotting`** rules, or **photo** learner captions when leaving the photo part), when **`blocks`** is non-empty **or** the photo part is not the only part.
- Shell **Controlla** is accepted only on the **last** block (or immediately in reader display-only mode or **photo-only display mode** with no learner captions) and then validates **every** block again before **`StepCompletionRequest`** fires (no-op when there are zero blocks in reader-only mode).


**Learner-facing validation copy** for special screens and for embedded **`ClozeText`** / **`ErrorSpotting`** blocks is **Italian** (aligned with standalone error-spotting tasks).

Chrome loads from **`SpecialScreenHost`** (`Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml`) with a **programmatic fallback** if Resources loading fails.

DTO types live beside other payloads in **`ToolkitStepContentDtos.cs`** (`SpecialScreenContentDto`, `SpecialScreenMailChromeDto`, `SpecialScreenReaderChromeDto`, `SpecialScreenPhotoViewerChromeDto`, `SpecialScreenPhotoItemDto`, `SpecialScreenSmsChromeDto`, `SpecialScreenChatMessageDto`, `SpecialScreenBlockDto`, `SpecialScreenStubBlockDto`).

#### Top-level `contentJson`

| Field | Required | Notes |
| ----- | -------- | ----- |
| **`screenVariant`** | no | Authoring hint (`sms`, `whatsapp`, `mail`, `photo`, `reader`, `generic`, …). `whatsapp` applies a subtle green tint to outgoing bubbles. |
| **`title`** | no | Chrome headline (hidden for messenger **or** reader display-only **or** mail / letter mode; reader may fall back to **`readerChrome.headline`**) |
| **`subtitle`** | no | Chrome subline (hidden for messenger **or** reader display-only **or** mail / letter mode; reader may fall back to **`readerChrome.subheadline`**) |
| **`smsChrome`** | no | Messenger transcript + status bar. When present **and** messenger mode is active (see below), Unity renders a **smartphone mockup**, **scrollable** chat, and hosts mechanics inside bubbles. Ignored when reader mode wins (see below). Must **not** populate **`messages`** when **mail / letter** mode applies. |
| **`readerChrome`** | yes for reader mode | Required when **`taskType`** is **`SpecialScreenReader`** **or** **`screenVariant`** is **`reader`**. See **Reader mode** below. |
| **`photoViewerChrome`** | yes for photo mode | Required when **`taskType`** is **`SpecialScreenPhotoViewer`** **or** **`screenVariant`** is **`photo`**. See **Photo viewer mode** below. |
| **`mailChrome`** | no | Optional authoring for **mail / letter** mode. When mail mode applies, omitted fields use sensible UI defaults. See **Mail / letter editor mode** below. |
| **`blocks`** | yes *except* reader / photo-only | Non-empty array for messenger / generic multi-part screens **and** for mail/letter editor mode. **Photo mode** may use **`[]`** when the step is **only** the gallery, or add entries for **additional** parts after the photo part. In **reader mode**: **omit `blocks` or `[]` only** — combining non-empty **`blocks`** with reader chrome is invalid. |

#### Mail / letter editor mode

Mail UI activates when **`taskType`** is **`SpecialScreenMailEditor`** **or** **`screenVariant`** is **`mail`** / **`letter`** (case-insensitive). **`SpecialScreenMailEditor`** takes precedence over a conflicting **`screenVariant`:** **`photo`** (the mail frame is still used).

- **`blocks`:** non-empty array: each entry is a **`cloze_text`**, **`error_spotting`**, or **`stub`** block rendered inside the editable «body» region (multi-part paging matches other special screens).
- **Messenger conflict:** **`smsChrome.messages`** must be empty/absent.
- **Chrome order (mail):** **`Da` / `A` / `Oggetto`** first, then the **`blocks[]`** «body» box, then **`greeting`** and **`closing`**, then **Invia** — matches a layout where the learner works on the message first and sees salutation/sign-off underneath. The mail column scrolls vertically when content exceeds the viewport.
- **Send affordance:** **`mailChrome.sendButtonText`** (default **Invia**) labels the in-panel button; **`mailChrome.sendSuccessText`** (default **E-mail inviata.**) appears briefly after successful local validation, before **`StepCompletionRequest`**. Shell **Controlla** performs the same checks.

| `mailChrome` field | Required | Notes |
| ------------------ | -------- | ----- |
| **`format`** | no | **`email`** or **`letter`** — **`letter`** omits the subject row |
| **`rowLabelFrom`** / **`rowLabelTo`** / **`rowLabelSubject`** | no | Visible labels for the three header rows (Italian defaults **Da:** / **A:** / **Oggetto:**) |
| **`from`** / **`fromText`** | no | Address line after **Da:** — either key works (use **`fromText`** if your toolchain reserves **`from`**) |
| **`to`** / **`toText`** | no | Address line after **A:** |
| **`subject`** / **`subjectText`** | no | **Oggetto** line (**`subject`** hidden in letter layout) |
| **`greeting`** / **`greetingText`** | no | Salutation above the **`blocks`** body |
| **`closing`** / **`closingText`** | no | Sign-off below the **`blocks`** body |
| **`sendButtonText`** | no | In-frame button — default **Invia** |
| **`sendSuccessText`** | no | Short confirmation line — default **E-mail inviata.** |

Example (**`SpecialScreenMailEditor`**, single embedded cloze):

```json
{
  "screenVariant": "mail",
  "mailChrome": {
    "from": "studio.italiano@scuola.it",
    "to": "prof.rossi@scuola.it",
    "subject": "Compito: registri formali e informali",
    "greeting": "Gentile Prof.ssa Rossi,",
    "closing": "Cordiali saluti,\nAlex",
    "sendButtonText": "Invia",
    "sendSuccessText": "E-mail inviata."
  },
  "blocks": [
    {
      "blockType": "cloze_text",
      "clozeText": {
        "prompt": "Completa con la forma adatta.",
        "caseSensitive": false,
        "lines": [
          {
            "segments": [
              { "kind": "text", "text": "Ti scrivo per " },
              { "kind": "gap", "correctAnswers": ["chiedere", "domandare"], "maxLength": 24 },
              { "kind": "text", "text": " un chiarimento sulla lezione." }
            ]
          }
        ]
      }
    }
  ]
}
```

Example (**`letter`**, subject row suppressed):

```json
{
  "screenVariant": "letter",
  "mailChrome": {
    "format": "letter",
    "rowLabelFrom": "Da:",
    "rowLabelTo": "A:",
    "from": "Alex",
    "to": "Nonna Lucia",
    "greeting": "Cara nonna,",
    "closing": "Un abbraccio,\nAlex"
  },
  "blocks": [
    {
      "blockType": "stub",
      "stub": {
        "headline": "",
        "body": "(Esercizio di produzione scritta — collega qui una closure o un altro blocco quando disponibile.)"
      }
    }
  ]
}
```

#### Reader mode (magazine / book excerpt)

Reader UI activates when **`taskType`** is **`SpecialScreenReader`** **or** **`screenVariant`** is **`reader`** (case-insensitive). **`readerChrome`** is **required** and **`readerChrome.bodyText`** must be non-empty (plain text; newlines preserved).

- **No interactive `blocks`:** reader mode must not define mechanics — omit **`blocks`** or use **`[]`**. The client rejects payloads that mix **`readerChrome`** (when reader mode applies) with a non-empty **`blocks`** array.
- **Messenger conflict:** if reader mode applies, **`smsChrome`** / messenger layout is **not** used (even if `smsChrome.messages` is populated).
- **Remote images:** optional **`readerChrome.imageUrl`** must be an absolute **`http`/`https`** URL allowed by **`ToolkitStepHttpResourceUrl`** (same rules as other toolkit steps).
- **`columnCount`:** **`1`** or **`2`**. **`2`** (default when omitted or any other value) uses a **two-column** magazine flow: paragraphs split on blank lines (`\n\n`); a single long paragraph splits on a **space** near the midpoint, or at a **character** midpoint if there is **no** space.
- **`showLineNumbers`:** when **`true`**, each line (split on `\n`) is shown with a **monotonic line index** in the gutter; **single-column** only (Unity ignores multi-column for this mode).
- **Shell paging:** hidden when **`blocks`** is empty; learners press **Controlla** to complete.

| `readerChrome` field | Required | Notes |
| -------------------- | -------- | ----- |
| **`bodyText`** | yes | Long reading copy |
| **`imageUrl`** | no | Optional hero illustration |
| **`headline`** / **`subheadline`** | no | In-panel titles; fall back to root **`title`** / **`subtitle`** when empty |
| **`columnCount`** | no | `1` or `2` (see above) |
| **`showLineNumbers`** | no | Book-excerpt style line numbers |

#### Photo viewer mode (gallery / slideshow)

Photo UI activates when **`taskType`** is **`SpecialScreenPhotoViewer`** **or** **`screenVariant`** is **`photo`** (case-insensitive). **`photoViewerChrome`** is **required** and must include at least one **`items[]`** entry. **`smsChrome.messages`** must **not** be populated (combine with **reader**, not messenger).

- **`displayMode`:** **`grid4`** (default when omitted) shows a **wrapped** row/column grid; **`slideshow`** shows **one** image with **in-panel** **←** / **→** (separate from shell paging when multiple parts exist).
- **`prompt`:** optional instruction line above the gallery.
- **`showCaptions`:** when **`true`**, fixed **`caption`** text is shown under each image (learner **`TextField`** is shown regardless when **`requireLearnerCaption`** is **`true`**).
- **`items[]`:** each item needs **`imageUrl`** (**`http`/`https`**, allowed hostnames per **`ToolkitStepHttpResourceUrl`**). Use **`caption`** for fixed labels. For a learner-written caption, set **`requireLearnerCaption`:** **`true`** and **`acceptedCaptions`** (non-empty; **case-insensitive** unless **`caseSensitive`:** **`true`**).
- **Additional `blocks`:** optional. When present, the **photo** is **part 1**; shell **←** / **→** moves between photo and nested mechanics (**`cloze_text`**, **`error_spotting`**, **`stub`**). When the step has **only** the photo part (no extra **`blocks`**) and **no** learner captions, shell paging is **hidden** and **Controlla** completes immediately. Other **`SpecialScreen`** payloads with a **single** mechanic block still show **«Parte 1 di 1»** (paging chrome preserved).

| `photoViewerChrome` field | Required | Notes |
| ------------------------- | -------- | ----- |
| **`items`** | yes | At least one image entry |
| **`displayMode`** | no | `grid4` or `slideshow` |
| **`prompt`** | no | Instruction copy |
| **`showCaptions`** | no | Show fixed `caption` labels |

Example (**`SpecialScreenPhotoViewer`**, **`grid4`**, three fixed captions + one learner caption):

```json
{
  "screenVariant": "photo",
  "title": "Galleria",
  "subtitle": "Completa l'ultima didascalia.",
  "photoViewerChrome": {
    "displayMode": "grid4",
    "prompt": "Tre didascalie sono già scritte. Scrivi la quarta.",
    "showCaptions": true,
    "items": [
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg",
        "caption": "Il gatto"
      },
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/320px-YellowLabradorLooking_new.jpg",
        "caption": "Il cane"
      },
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Big_ben_clock_face.jpg/320px-Big_ben_clock_face.jpg",
        "caption": "Il monumento"
      },
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Hungary.svg/320px-Flag_of_Hungary.svg.png",
        "requireLearnerCaption": true,
        "acceptedCaptions": ["La bandiera", "bandiera"]
      }
    ]
  },
  "blocks": []
}
```

Example (**`slideshow`**):

```json
{
  "screenVariant": "photo",
  "photoViewerChrome": {
    "displayMode": "slideshow",
    "showCaptions": true,
    "items": [
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg",
        "caption": "Foto 1"
      },
      {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/320px-YellowLabradorLooking_new.jpg",
        "caption": "Foto 2"
      }
    ]
  },
  "blocks": []
}
```

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

**Implementation:** **`CutsceneToolkitStep`** + **`ICutsceneBeatNavigator`**.

Cutscenes are **presentation-only**: learners tap shell **Weiter** to page through **`beats[]`** locally; the server **`advance`** RPC runs only after the **last** beat (no **Controlla**, no puzzle rewards). Quest-wide chrome (brochure, pause, `blockBack`, auto-start next quest) lives in **`game_quests.meta_payload`** → API **`metaJson`** — see **`DOC/02-steps-and-rewards.md`**.

**Strict authoring (Next.js):** [`cutsceneContentSchema.ts`](../apps/web/lib/game/schemas/cutsceneContentSchema.ts) — **`.strict()`**, no legacy root `title`/`body`.

**Server error convention:** malformed cutscene JSON → HTTP **502** `payload_invalid` / `Malformed Cutscene content payload` (bootstrap may list **`details.cutscenePayloadErrors`**).

**Unity:** `JsonUtility` + guards. Invalid payload → Italian placeholder, **`IsContentValid == false`**, primary **Weiter** disabled (no server advance).

| Root field | Required | Notes |
| ---------- | -------- | ----- |
| **`beats`** | yes (min 1) | Ordered narrative beats |
| **`npcCast`** | no | `{ id, displayName, portraitId?, side? }` for NPC dialog |
| **`navigation`** | no | `{ blockBack?, primaryCtaLabel? }` |

| Per-beat field | Required | Notes |
| -------------- | -------- | ----- |
| **`presentationMode`** | yes | `narrator` \| `npcDialog` \| `innerMonologue` \| `gameInfo` |
| **`body`** | yes | Plain text |
| **`speakerId`** | yes when `npcDialog` | Must match **`npcCast[].id`** when `npcCast` is non-empty |
| **`title`**, **`subtitle`** | no | Optional headlines |
| **`autoAdvanceMs`** | no | Positive ms; auto-**Weiter** after delay |
| **`primaryCtaLabel`** | no | Overrides shell **Weiter** for this beat (else `navigation.primaryCtaLabel`) |

Example (minimal):

```json
{
  "beats": [
    { "presentationMode": "narrator", "body": "Iniziamo la tua avventura nella città." }
  ]
}
```

Example (NPC dialog):

```json
{
  "npcCast": [{ "id": "tonio", "displayName": "Tonio", "side": "right" }],
  "beats": [
    { "presentationMode": "narrator", "body": "Entri nel bar." },
    { "presentationMode": "npcDialog", "speakerId": "tonio", "body": "Ciao!" }
  ],
  "navigation": { "primaryCtaLabel": "Weiter" }
}
```

Anti-pattern (invalid — legacy root shape):

```json
{
  "title": "Incomplete",
  "body": "Old shape"
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

- **`QuestShellView.ConfigureShellPrimaryChrome`** sets **Weiter** (cutscene beat pager) vs **Controlla** (tasks).
- Invalid cutscene JSON: **`ICutsceneBeatNavigator.IsContentValid == false`** — **Weiter** disabled, no advance RPC.
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
