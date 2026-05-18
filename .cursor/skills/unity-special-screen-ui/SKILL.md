---
name: unity-special-screen-ui
description: >-
  Unity quest shell Special Screens: composite task steps (`SpecialScreen*` taskType)
  with sequential blocks (cloze, error-spotting, stub), chrome host, JsonUtility payloads,
  and factory routing. Use when adding W-style screens (SMS/mail/photo/reader shells),
  new embedded block kinds, SpecialScreenHost UX, `content_json`/`contentJson` contracts,
  or changing validation/navigation inside `SpecialScreenToolkitStep`.
---

# Unity Special Screen step UI (UI Toolkit)

Special Screens are **normal tasks** (`game_quest_steps.step_kind = task`): progression stays **`complete_quest_step_task`** / shell **Controlla**, not cutscene advance.

One server row usually hosts **several mechanics** as **`blocks[]`**, sequenced with **←** / **→** (same arrow chrome as multiple-choice paging) inside [`SpecialScreenToolkitStep.cs`](Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs). Shell **Controlla** only on the **last** part; it re-validates **every** block. **Display-only readers** (**`SpecialScreenReader`** / **`screenVariant` `reader`** with empty **`blocks`**) hide paging; **Controlla** submits immediately once the chrome is loaded.

Contract tables and learner-copy notes: **`docs/task-type-ui-guide.md`** (Special Screen section).

## Routing

- **`ToolkitStepFactory`**: extend **`IsSpecialScreenTaskType`** when adding a new `task_type` string (same host class unless you split intentionally).
- Registered variants today: **`SpecialScreen`**, **`SpecialScreenSms`**, **`SpecialScreenMailEditor`**, **`SpecialScreenPhotoViewer`**, **`SpecialScreenReader`** → **`SpecialScreenToolkitStep`**.

## `contentJson` (Unity `JsonUtility`)

- Root DTOs: **`SpecialScreenContentDto`**, **`SpecialScreenBlockDto`**, **`SpecialScreenStubBlockDto`**, optional **`SpecialScreenReaderChromeDto`**, **`SpecialScreenSmsChromeDto`** / **`SpecialScreenChatMessageDto`** in [`ToolkitStepContentDtos.cs`](Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs).
- **`screenVariant`**: authoring hint for skins (`sms`, **`whatsapp`** (green outgoing bubbles), `mail`, `photo`, `reader`, …).
- **`smsChrome`**: optional messenger transcript + status bar; when messenger mode is active (`SpecialScreenSms` task type **or** `screenVariant` `sms`/`whatsapp`), Unity renders a smartphone mockup + **`ScrollView`** chat and embeds mechanics in bubbles (`hostsEmbeddedMechanic` + `embeddedMechanicBlockIndex`; **always author `embeddedMechanicBlockIndex` when not block `0`** — JsonUtility defaults omitted ints to `0`). Deferred-mechanic rows without **`text`** show a muted **`…`**; entirely empty rows are rejected at parse time and omitted at runtime. Styles: **`special-screen-messenger.uss`** (imported by **`theme-learn.uss`**).
- **`readerChrome`**: magazine/book reader (**`SpecialScreenReader`** **or** `screenVariant` **`reader`**): optional **`imageUrl`** + **`bodyText`**, **`columnCount`**, **`showLineNumbers`**. **Empty `blocks`** = display-only shell (arrow row hidden); messenger chrome is suppressed when reader mode applies. USS: **`special-screen-reader.uss`** (via **`theme-learn.uss`**).
- **`blocks[]`**: required for messenger / generic multi-mechanic payloads (non-empty). For reader display-only payloads, **`blocks`** may be **omitted** or **`[]`**.

**Supported `blockType`** (case-insensitive aliases in code): **`cloze_text` / `ClozeText`**, **`error_spotting` / `ErrorSpotting`**, **`stub`**.

Nested payloads must satisfy the same rules as standalone tasks — **`ClozeTextToolkitStep.TryParseContentDto`**, **`ErrorSpottingToolkitStep.TryParseContentDto`**.

## Embedded mechanics

- Reuse **`ClozeTextToolkitStep`** / **`ErrorSpottingToolkitStep`** with **`useMutedChrome: false`** so panels do not stack inside the host chrome.
- **`TryValidateLocally`** on those steps is the single validation source for composite submit (never duplicate gap/error rules in the host).

## Adding a new block kind

1. Extend **`BlockKind`** / **`ClassifyBlock`** / **`ValidateBlockPayload`** / **`CreateNestedBlock`** in **`SpecialScreenToolkitStep`** (keep parse validation aligned with **`JsonUtility`** field shapes).
2. Implement **`ISpecialScreenNestedBlock`**: **`Bind`**, **`Teardown`**, **`SetInteractable`**, **`TryValidate`**, **`IsBinderReady`**.
3. **`Bind`**: clone **`StepContext`** with **`CloneStepContext`**-style field copy and nested **`contentJson`** (`JsonUtility.ToJson` on the nested DTO).
4. Update **`docs/task-type-ui-guide.md`** block table + example snippet.

For purely visual chrome (SMS frame, mail headers): prefer branching on **`screenVariant`** inside the host or lightweight USS/UXML under Resources — keep mechanic payloads separate from layout unless authoring asks otherwise.

## Chrome asset

- **`Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml`** — loaded via **`Resources.Load("UI/LearningToolkit/SpecialScreenHost")`**; host falls back to programmatic chrome if loading fails. Messenger chrome (phone + bubbles) is built in code inside each block slot when **`smsChrome`** + messenger mode apply.

## Backend reminder

- **`task_type`** is free text paired with **`step_kind`** rules; no new **`step_kind`** required.
- Example seed script pattern: **`supabase/scripts/special_screen_foundation_demo.sql`**; SMS/WhatsApp demo: **`supabase/scripts/special_screen_sms_whatsapp_demo.sql`**; Reader demo: **`supabase/scripts/special_screen_reader_demo.sql`**.

## Checklist

- [ ] Payload parses at bind time; **`IsBinderReady`** passes for every block after bind (host aborts cleanly otherwise).
- [ ] **`presentValidationMessage`** for learner errors only (no extra overlay stack).
- [ ] New **`task_type`** added to **`IsSpecialScreenTaskType`** when introducing another **`SpecialScreen*`** alias.
- [ ] Play Mode (multi-block): **→** gates progression; **Controlla** completes task + wallet overlay path unchanged.
- [ ] Play Mode (**reader-only**): no **→**, **Controlla** succeeds from the single screen once content parsed.

## Key paths

| Role | Path |
|------|------|
| Host step | `Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs` |
| DTOs | `Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Chrome UXML | `Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml` |
| Messenger USS | `Assets/Resources/UI/LearningToolkit/special-screen-messenger.uss` (via `theme-learn.uss`) |
| Reader USS | `Assets/Resources/UI/LearningToolkit/special-screen-reader.uss` (via `theme-learn.uss`) |
| Demo seed SQL | `supabase/scripts/special_screen_sms_whatsapp_demo.sql`; reader: `special_screen_reader_demo.sql` |
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
