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

One server row hosts **several mechanics** as **`blocks[]`**, sequenced with **Indietro** / **Avanti** inside [`SpecialScreenToolkitStep.cs`](Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs). Shell **Controlla** only on the **last** part; it re-validates **every** block.

Contract tables and learner-copy notes: **`docs/task-type-ui-guide.md`** (Special Screen section).

## Routing

- **`ToolkitStepFactory`**: extend **`IsSpecialScreenTaskType`** when adding a new `task_type` string (same host class unless you split intentionally).
- Registered variants today: **`SpecialScreen`**, **`SpecialScreenSms`**, **`SpecialScreenMailEditor`**, **`SpecialScreenPhotoViewer`**, **`SpecialScreenReader`** → **`SpecialScreenToolkitStep`**.

## `contentJson` (Unity `JsonUtility`)

- Root DTOs: **`SpecialScreenContentDto`**, **`SpecialScreenBlockDto`**, **`SpecialScreenStubBlockDto`**, optional **`SpecialScreenSmsChromeDto`** / **`SpecialScreenChatMessageDto`** in [`ToolkitStepContentDtos.cs`](Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs).
- **`screenVariant`**: authoring hint for skins (`sms`, **`whatsapp`** (green outgoing bubbles), `mail`, `photo`, `reader`, …).
- **`smsChrome`**: optional messenger transcript + status bar; when messenger mode is active (`SpecialScreenSms` task type **or** `screenVariant` `sms`/`whatsapp`), Unity renders a smartphone mockup + **`ScrollView`** chat and embeds mechanics in bubbles (`hostsEmbeddedMechanic` + `embeddedMechanicBlockIndex`). Styles: **`special-screen-messenger.uss`** (imported by **`theme-learn.uss`**).
- **`blocks[]`**: required, non-empty; each row has **`blockType`** plus exactly one nested payload.

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
- Example seed script pattern: **`supabase/scripts/special_screen_foundation_demo.sql`**; SMS/WhatsApp demo: **`supabase/scripts/special_screen_sms_whatsapp_demo.sql`**.

## Checklist

- [ ] Payload parses at bind time; **`IsBinderReady`** passes for every block after bind (host aborts cleanly otherwise).
- [ ] **`presentValidationMessage`** for learner errors only (no extra overlay stack).
- [ ] New **`task_type`** added to **`IsSpecialScreenTaskType`** when introducing another **`SpecialScreen*`** alias.
- [ ] Play Mode: **Avanti** gates progression; **Controlla** completes task + wallet overlay path unchanged.

## Key paths

| Role | Path |
|------|------|
| Host step | `Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs` |
| DTOs | `Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Chrome UXML | `Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml` |
| Messenger USS | `Assets/Resources/UI/LearningToolkit/special-screen-messenger.uss` (via `theme-learn.uss`) |
| Demo seed SQL | `supabase/scripts/special_screen_sms_whatsapp_demo.sql` |
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
