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

One server row usually hosts **several mechanics** as **`blocks[]`**, sequenced with **←** / **→** (same arrow chrome as multiple-choice paging) inside [`SpecialScreenToolkitStep.cs`](Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs). Shell **Controlla** only on the **last** part; it re-validates **every** block. **Display-only readers** (**`SpecialScreenReader`** / **`screenVariant` `reader`** with empty **`blocks`**) hide paging; **Controlla** submits immediately once the chrome is loaded. **Photo-only** (**`SpecialScreenPhotoViewer`** / **`screenVariant` `photo`**, **`photoViewerChrome`** only, no learner captions) hides paging the same way; mixed **photo + `blocks[]`** uses part 1 for the gallery.

Contract tables and learner-copy notes: **`docs/task-type-ui-guide.md`** (Special Screen section).

## Routing

- **`ToolkitStepFactory`**: extend **`IsSpecialScreenTaskType`** when adding a new `task_type` string (same host class unless you split intentionally).
- Registered variants today: **`SpecialScreen`**, **`SpecialScreenSms`**, **`SpecialScreenMailEditor`**, **`SpecialScreenPhotoViewer`**, **`SpecialScreenReader`** → **`SpecialScreenToolkitStep`**.

## `contentJson` (Unity `JsonUtility`)

- Root DTOs: **`SpecialScreenContentDto`**, **`SpecialScreenBlockDto`**, **`SpecialScreenStubBlockDto`**, optional **`SpecialScreenMailChromeDto`**, **`SpecialScreenReaderChromeDto`**, **`SpecialScreenPhotoViewerChromeDto`** / **`SpecialScreenPhotoItemDto`**, **`SpecialScreenSmsChromeDto`** / **`SpecialScreenChatMessageDto`** in [`ToolkitStepContentDtos.cs`](Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs).
- **`screenVariant`**: authoring hint for skins (`sms`, **`whatsapp`** (green outgoing bubbles), `mail`, `photo`, `reader`, …).
- **`smsChrome`**: optional messenger transcript + status bar; when messenger mode is active (`SpecialScreenSms` task type **or** `screenVariant` `sms`/`whatsapp`), Unity renders a smartphone mockup + **`ScrollView`** chat and embeds mechanics in bubbles (`hostsEmbeddedMechanic` + `embeddedMechanicBlockIndex`; **always author `embeddedMechanicBlockIndex` when not block `0`** — JsonUtility defaults omitted ints to `0`). Deferred-mechanic rows without **`text`** show a muted **`…`**; entirely empty rows are rejected at parse time and omitted at runtime. Styles: **`special-screen-messenger.uss`** (imported by **`theme-learn.uss`**).
- **`readerChrome`**: magazine/book reader (**`SpecialScreenReader`** **or** `screenVariant` **`reader`**): optional **`imageUrl`** + **`bodyText`**, **`columnCount`**, **`showLineNumbers`**. **Empty `blocks`** = display-only shell (arrow row hidden); **`blocks`** must not be populated in reader mode (client rejects mixed payloads). Messenger chrome is suppressed when reader mode applies. USS: **`special-screen-reader.uss`** (via **`theme-learn.uss`**).
- **`photoViewerChrome`**: gallery / slideshow (**`SpecialScreenPhotoViewer`** **or** `screenVariant` **`photo`**): **`displayMode`** `grid4` or `slideshow`, **`items[]`** (`imageUrl`, optional **`caption`**, optional learner **`requireLearnerCaption`** + **`acceptedCaptions`**). Do not combine with **`smsChrome.messages`**. Extra **`blocks[]`** become parts **after** the photo part. USS: **`special-screen-photo-viewer.uss`** (via **`theme-learn.uss`**).
- **`mailChrome`**: e-mail / letter frame (**`SpecialScreenMailEditor`** **or** `screenVariant` **`mail`** / **`letter`**): read-only header rows, then embedded **`blocks[]`**, then **`greeting`** and **`closing`**, then in-frame send (same flow as shell **Controlla**). Header fields: **`from`** / **`fromText`**, **`to`** / **`toText`**, etc. Scrolls vertically when content is tall. Do not combine with **`smsChrome.messages`**. USS: **`special-screen-mail.uss`** (via **`theme-learn.uss`**).
- **`blocks[]`**: required for messenger / mail / generic multi-mechanic payloads unless **reader** or **photo-only** (see above). For reader payloads, **`blocks`** must be **omitted** or **`[]`** only.

**Supported `blockType`** (case-insensitive aliases in code): **`cloze_text` / `ClozeText`**, **`error_spotting` / `ErrorSpotting`**, **`stub`**.

Nested payloads must satisfy the same rules as standalone tasks — **`ClozeTextToolkitStep.TryParseContentDto`**, **`ErrorSpottingToolkitStep.TryParseContentDto`**.

## Server scoring (Next.js, must stay aligned)

Authoritative pizza for **`SpecialScreen*`** steps uses the same **`complete`** attempt path as other tasks when `reward_rules.pizza` is **scored**. The server (`apps/web/lib/game/scoring/evaluateTaskAttempt.ts`, **`evaluateSpecialScreen`**):

- Only **`stub`**, **`cloze_text` / `ClozeText`**, and **`error_spotting` / `ErrorSpotting`** in **`content_payload.blocks[]`** participate in scoring. Any other **`blockType`** → **502 `unsupported_special_screen_block`** (do not add mystery types in DB without updating **`mapSpecialBlockType`** + Zod attempt shapes + evaluator).
- Missing nested **`clozeText`** / **`errorSpotting`** on a scored block → **`payload_invalid`** (not silent skip).
- **Stub-only** `blocks[]` (no cloze/error): completion can succeed with **no pizza** for that step (implementation: eligibility **ratio** vs pizza-only **pizzaRatio** in the evaluator—stubs are not exercises).
- Adding a **new embedded block kind** for scoring: extend Unity **`ClassifyBlock`** **and** server **`mapSpecialBlockType`**, attempt schema, and **`evaluateSpecialScreen`** branch together.

## Embedded mechanics

- Reuse **`ClozeTextToolkitStep`** / **`ErrorSpottingToolkitStep`** with **`useMutedChrome: false`** so panels do not stack inside the host chrome.
- **`TryValidateLocally`** on those steps is the single validation source for composite submit (never duplicate gap/error rules in the host).
- When cloning **`StepContext`** for nested blocks, **forward** **`presentBusyOverlay`** and **`dismissBusyOverlay`** from the parent context so embedded mechanics (e.g. **Freitext** / LLM-heavy flows) use the same shell loading overlay as standalone tasks.

## Adding a new block kind

1. Extend **`BlockKind`** / **`ClassifyBlock`** / **`ValidateBlockPayload`** / **`CreateNestedBlock`** in **`SpecialScreenToolkitStep`** (keep parse validation aligned with **`JsonUtility`** field shapes).
2. Implement **`ISpecialScreenNestedBlock`**: **`Bind`**, **`Teardown`**, **`SetInteractable`**, **`TryValidate`**, **`IsBinderReady`**.
3. **`Bind`**: clone **`StepContext`** with **`CloneStepContext`**-style field copy and nested **`contentJson`** (`JsonUtility.ToJson` on the nested DTO); copied fields must include **`presentBusyOverlay`** / **`dismissBusyOverlay`** when the new block type can trigger slow work.
4. Update **`docs/task-type-ui-guide.md`** block table + example snippet.

For purely visual chrome (SMS frame, mail headers): prefer branching on **`screenVariant`** inside the host or lightweight USS/UXML under Resources — keep mechanic payloads separate from layout unless authoring asks otherwise.

## Chrome asset

- **`Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml`** — loaded via **`Resources.Load("UI/LearningToolkit/SpecialScreenHost")`**; host falls back to programmatic chrome if loading fails. Messenger chrome (phone + bubbles) is built in code inside each block slot when **`smsChrome`** + messenger mode apply.

## Backend reminder

- **`task_type`** is free text paired with **`step_kind`** rules; no new **`step_kind`** required.
- Example seed script pattern: **`supabase/scripts/special_screen_foundation_demo.sql`**; SMS/WhatsApp demo: **`supabase/scripts/special_screen_sms_whatsapp_demo.sql`**; Reader demo: **`supabase/scripts/special_screen_reader_demo.sql`**; Photo viewer: **`supabase/scripts/special_screen_photo_viewer_demo.sql`**; Mail editor: **`supabase/scripts/special_screen_mail_editor_demo.sql`**.

## Checklist

- [ ] Payload parses at bind time; **`IsBinderReady`** passes for every block after bind (host aborts cleanly otherwise).
- [ ] **`presentValidationMessage`** for learner errors only (no extra overlay stack).
- [ ] New **`task_type`** added to **`IsSpecialScreenTaskType`** when introducing another **`SpecialScreen*`** alias.
- [ ] Play Mode (multi-block): **→** gates progression; **Controlla** completes task + wallet overlay path unchanged.
- [ ] Play Mode (**reader-only**): no **→**, **Controlla** succeeds from the single screen once content parsed.
- [ ] Play Mode (**mail / letter**): mail frame + in-frame send matches **Controlla**; no **`smsChrome.messages`**.

## Key paths

| Role | Path |
|------|------|
| Host step | `Assets/Scripts/Presentation/Steps/SpecialScreenToolkitStep.cs` |
| DTOs | `Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs` |
| Factory | `Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs` |
| Chrome UXML | `Assets/Resources/UI/LearningToolkit/SpecialScreenHost.uxml` |
| Messenger USS | `Assets/Resources/UI/LearningToolkit/special-screen-messenger.uss` (via `theme-learn.uss`) |
| Reader USS | `Assets/Resources/UI/LearningToolkit/special-screen-reader.uss` (via `theme-learn.uss`) |
| Photo USS | `Assets/Resources/UI/LearningToolkit/special-screen-photo-viewer.uss` (via `theme-learn.uss`) |
| Mail USS | `Assets/Resources/UI/LearningToolkit/special-screen-mail.uss` (via `theme-learn.uss`) |
| Demo seed SQL | `supabase/scripts/special_screen_sms_whatsapp_demo.sql`; reader: `special_screen_reader_demo.sql`; photo: `special_screen_photo_viewer_demo.sql`; mail: `special_screen_mail_editor_demo.sql` |
| Shell | `Assets/Scripts/Presentation/QuestShellView.cs` |
