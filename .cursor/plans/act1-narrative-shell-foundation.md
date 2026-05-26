# Act 1 narrative shell — requirements foundation

> **Purpose:** Give learners a story-first quest experience (Erzähler, NPC dialog, innerer Monolog, Spielinfo) with usable quest-shell chrome (reference document, pause, forced flow) so content can be authored for Chapter 1 without rework. This milestone delivers **scaffolding and contracts only**—no Act 1 storyline copy, no bonus vocab pool, no SMS freitext mechanics.

---

## Problem statement

Today, cutscenes are a single generic panel (`title` + `body`) with no distinction between narrator lines, NPC speech, player thoughts, or game-info hints. The quest shell cannot keep a brochure readable across task steps, has no pause menu, and always requires manual **Next** with an escapable **Back to chapters** path. That blocks the content team’s Act 1 script (opening room, classroom dialog, forced SMS bridge, bar brochure tasks) and forces workarounds (SMS tasks for dialog, duplicated reader text per step).

Learners should experience clear narrative modes inside cutscenes, optional in-quest reference reading, a standard pause affordance, and scripted flow (auto-advance, no back, auto-continue to the next quest) where designers require it.

---

## Confirmed decisions

| Question | Decision |
|----------|----------|
| Content structure | **Chapter 1 = Akt 1.** Each **Akt 1.x = one `game_quests` row** (Quest x). Steps inside a quest use `game_quest_steps.order_index`. |
| Dialog in cutscenes | **Multiple NPCs in one cutscene step** via a **`beats[]` array** inside one cutscene `content_payload`, not one DB row per spoken line. |
| Narrative presentation | **`presentationMode` per beat** (`narrator`, `npcDialog`, `innerMonologue`, `gameInfo`) drives layout in `CutsceneToolkitStep`. |
| SMS / per-gap freitext (Act 1.2) | **Out of scope** for this milestone—no new scoring or content; existing `SpecialScreenSms` + deterministic cloze unchanged. |
| Bonus vocab pool (10 random pairs) | **Deferred:** product wants **dynamic server draw** later; **not** part of this foundation’s implementation areas. |
| Visual polish | **Out of scope:** room/classroom/bar backgrounds, NPC emotion sprites, sounds, avatar-in-scene rendering. Scaffolding uses placeholders (labels, optional `portraitId` string resolved when art exists). |
| Cutscene schema | **Single contract** — replace today’s `title`/`body`-only shape with **`beats[]`** (+ optional `npcCast[]`). **No `schemaVersion`, no v1/v2, no runtime legacy adapter.** Existing demo seeds are **migrated in the same milestone** to the new shape. |
| Reference document scope | **Quest-level** document (one brochure for all steps in a quest, e.g. Bar), not global or chapter-wide. |
| Flow flags scope | **Quest-level** defaults with **optional per-cutscene overrides** for `blockBack` and `autoAdvanceMs`. |
| Auto-start next quest | **Client-driven** after successful quest finish, using **quest metadata** from bootstrap (no new RPC). Target quest must already be **unlocked** per existing `unlock_rules`. |
| Localization | Shell CTAs honor **`primaryCtaLabel`** when set (beat or cutscene root); default **Weiter** (German). Replace hardcoded English **Next** on cutscene shell chrome. |

---

## User experience

### User flows

#### A. Cutscene with multiple beats (one quest step)

1. Learner enters a cutscene step (e.g. classroom intro).
2. Shell shows beat 1 using the layout for its `presentationMode` (e.g. narrator: centered italic text, no avatar).
3. Learner taps **Weiter** (or beat auto-advances after `autoAdvanceMs` if configured).
4. Same step advances to beat 2 (e.g. `npcDialog`: NPC portrait on configured side, speech bubble, speaker name).
5. Further beats may switch NPCs via `speakerId` (Prof.ssa Ricci, Chiara, etc.) within the **same** cutscene step.
6. After the **last** beat, shell calls the existing cutscene **advance** API (same as today’s single-screen cutscene).

#### B. Presentation modes (learner-visible)

| Mode | Learner sees | Avatar |
|------|----------------|--------|
| `narrator` | Centered narrative text; optional subtitle; italic body styling | None |
| `npcDialog` | Speech bubble + NPC name; portrait placeholder on left or right | NPC (`speakerId` → cast entry) |
| `innerMonologue` | Thought-style bubble; first-person text | None (player thought, not chat) |
| `gameInfo` | Distinct “hint” panel (icon + body); clearly not story voice | None |

#### C. Reference document (e.g. Bar brochure)

1. Quest metadata declares a **reference document** (title + body text, optional `documentId` for authoring).
2. On every step in that quest (cutscene and task), shell shows a **Broschüre ansehen** (or configured label) control in quest chrome—not inside the task payload.
3. Tapping opens a **modal overlay** with scrollable text; closing returns to the current step without losing progress.
4. Task steps (Matching, DragDrop, etc.) do not duplicate the brochure in their `contentJson` for display—authoring links tasks to the quest-level doc only.

#### D. Pause menu

1. Learner opens pause from a **fixed shell control** (e.g. header button) on any quest step.
2. Overlay offers **Resume**, **Back to chapters** (subject to `blockBack`), and placeholder entries for settings/audio if needed later (disabled or “coming soon” is acceptable).
3. Resume closes overlay; game state unchanged.

#### E. Forced flow

1. **Auto-advance:** Selected beats (or whole cutscene via per-beat `autoAdvanceMs`) advance without tap after a short delay; learner can still tap to skip wait.
2. **Block back:** On quests/beats flagged `blockBack`, **Back to chapters** is hidden or disabled—no confirm modal escape.
3. **Auto-start next quest:** When learner finishes quest N and metadata names `autoStartQuestSlug` (e.g. after quest `1-1-school` → `1-2-sms`), shell starts the next quest run **without** landing on quest overview first, if that quest is unlocked.

### Empty / loading / error states

| Situation | Learner experience |
|-----------|-------------------|
| Cutscene JSON invalid (bootstrap) | Quest does not start; existing **502 / payload_invalid** path; fix content (unchanged server convention). |
| Beat index / missing `speakerId` | Fallback: show body text in narrator layout; log warning in editor/dev builds. |
| Reference doc missing body | Hide **Broschüre** button for that quest. |
| Auto-start target locked or missing | After finish, fall back to **Quest overview** (current behavior). |
| Auto-start API failure | Show existing load-error banner; remain on shell or return to overview. |
| Pause during network submit | Pause does not cancel in-flight submit; buttons disabled while `_submitting` (same as today). |

### User expectations

- Narrative modes are **visually distinct** so Spielinfo never reads like story.
- **Weiter** is predictable: one button advances beats, then leaves the step.
- Brochure is **one tap away** on all steps of a quest that defines it.
- Forced sequences (1.1 → 1.2) feel continuous—no accidental exit to chapter map mid-bridge.

---

## Scope

### In scope

1. **Cutscene narrative contract** — Replace Zod schema, Unity DTO, and `CutsceneToolkitStep` with multi-beat UI (`beats[]`, four `presentationMode` values, `npcCast[]`). Migrate all existing cutscene rows in repo seeds/scripts to the new JSON shape.
2. **Quest-level `meta_payload`** (jsonb) on `game_quests` — exposed on bootstrap as `metaJson` (stringified JSON) containing:
   - `referenceDocument?: { documentId?, title, bodyText, buttonLabel? }`
   - `flow?: { blockBack?: boolean, autoStartQuestSlug?: string }`
3. **Quest shell reference overlay** — persistent control + modal reader across steps in a run.
4. **Quest shell pause menu** — modal overlay; resume + leave (respecting `blockBack`).
5. **Flow behavior** — per-beat `autoAdvanceMs`; quest/cutscene `blockBack`; post-finish `autoStartQuestSlug` in `QuestShellView` / `GameFlowController`.
6. **Documentation** — update `DOC/02-steps-and-rewards.md` cutscene section (new shape only; no Act 1 story content).
7. **Tests** — web: Zod/fixtures for cutscene + meta_payload parsing; Unity: optional smoke tests if low-cost.

### Out of scope

- Act 1 German/Italian **content** authoring and seed migrations for real storyline text.
- Player avatar rendered inside cutscene backgrounds.
- Old cutscene fields (`title`/`body` at payload root without `beats[]`) — removed, not supported at runtime.
- City **map** scene with geographic pins (quest overview list remains the hub).
- **Dynamic bonus vocab pool** (server-side random 10 from pool)—tracked for a follow-up milestone.
- SMS **freitext-per-gap** and new Special Screen block types.
- New task types; changes to `complete_quest_step_task` / pizza scoring.
- Pause affecting server session TTL or save-state beyond client overlay.
- Audio, haptics, vibration on SMS.

---

## Engineering design

### Unity

**Cutscene (`CutsceneToolkitStep`, `CutsceneContentDto`, UXML/USS under `Assets/Resources/UI/LearningToolkit/`)**

**Payload shape (breaking replacement of current `CutsceneContentDto`):**

| Field | Required | Notes |
|-------|----------|--------|
| `beats` | yes (min 1) | Ordered narrative beats; single-line cutscene = one beat |
| `npcCast` | no | `{ id, displayName, portraitId?, side? }` — referenced by `speakerId` on beats |
| `navigation` | no | `{ blockBack?, primaryCtaLabel? }` — cutscene-level defaults |

**Per beat:** `presentationMode` (required), `body` (required); optional `title`, `subtitle`, `speakerId`, `autoAdvanceMs`, `primaryCtaLabel`.

- Iterate `beats[]` locally; shell **Weiter** advances beat index until last beat, then fire existing `StepCompletionRequest` / advance routine.
- Layout (USS): `lg-cutscene-narrator`, `lg-cutscene-npc`, `lg-cutscene-thought`, `lg-cutscene-gameinfo`.
- `npcCast[]` maps `speakerId` → `displayName`, `portraitId` (placeholder until art), `side` (`left` \| `right`).
- Invalid/missing payload → same strict bootstrap failure as today (no silent fallback to old shape).
- Quest-level `blockBack` from `meta_payload`; cutscene `navigation.blockBack` overrides when set.

**Quest shell (`QuestShellView`, new overlay classes in `LearningToolkitOverlays.cs` or siblings)**

- On bind: read quest `metaJson` from `GameFlowController` (stored when quest run started from bootstrap).
- `LearningToolkitReferenceDocumentModal` — scrollable body, dismiss.
- `LearningToolkitPauseMenuModal` — resume / leave.
- Wire pause button in `QuestShellScreen.uxml` (or runtime-created chrome).
- `ConfigureBackToChaptersButton`: respect `blockBack` from quest meta + cutscene `navigation.blockBack`.
- After `FinishPendingRunRoutine` success: if `flow.autoStartQuestSlug` set, resolve quest id from `SelectedChapterQuests`, call same start path as `QuestOverviewView` (reuse `StartQuestRoutine` logic via shared helper).

**`GameFlowController`**

- Store `ServerQuestMetaJson` when `BeginServerQuest` is called (pass from start-quest envelope).
- Optional: `CutsceneBeatNavigationPolicy` helper for shell + step.

**`StepContext`**

- Add optional `questMetaJson` (or parsed reference doc + flow flags) so cutscene step can read per-cutscene overrides without re-fetching.

### Next.js app

**Schemas (`apps/web/lib/game/schemas/`)**

- **Replace** `cutsceneContentSchema.ts` with the new strict object (`beats[]` min 1, per-beat `presentationMode` enum, optional `npcCast`, optional `navigation`). Remove root-level `title`/`body` requirements.
- New `questMetaPayloadSchema.ts` for `game_quests.meta_payload`; lenient parse on read for bootstrap.

**Bootstrap / start quest (`game-progress-service.ts`)**

- Select `meta_payload` on quests; map to `metaJson` on `GameQuestBootstrapDto` and start-quest response.
- `collectCutscenePayloadErrors` validates only the new cutscene shape.

**Repository (`game-progress-repository.ts`)**

- Include `meta_payload` in quest selects.

**Migrations (`supabase/migrations/`)**

- `ALTER TABLE game_quests ADD COLUMN meta_payload jsonb NOT NULL DEFAULT '{}'::jsonb;`
- **Follow-up migration (or amend seeds):** rewrite all `step_kind = cutscene` rows in committed seeds (`20260518140000_*`, `20260528120000_*`, demo scripts) from `{ title, body, … }` to `{ beats: [...] }`.
- No change to RPC signatures for advance/complete.

### Integration

- Unity HTTP contract only: bootstrap + start quest return `metaJson`; cutscene `contentJson` uses `beats[]` shape.
- No change to advance/complete request bodies for this milestone.

### Data & persistence

| Data | Where |
|------|--------|
| Cutscene beats, NPC cast | `game_quest_steps.content_payload` |
| Reference doc, flow flags | `game_quests.meta_payload` |
| Beat index during multi-beat cutscene | **Client-only** until last beat triggers advance RPC |
| Pause state | **Client-only** overlay |

### Error handling

| Layer | Failure | User sees |
|-------|---------|-----------|
| Bootstrap | Invalid cutscene in catalog | Cannot start game session for that quest (existing 502 handling) |
| Unity parse | Unknown `presentationMode` | Narrator fallback + dev log |
| Advance RPC | Network/409 | Existing load error / retry patterns in `QuestShellView` |
| Auto-start next | Quest locked | Quest overview (fallback) |

### Security

- N/A beyond existing session auth. `meta_payload` and cutscene text are trusted author content (no learner-authored HTML). Reference modal renders plain text only.

### Performance

- Multi-beat cutscenes are lightweight UI Toolkit labels; no per-beat network calls until final advance.
- Reference modal reuses one instance attached to overlay plane (same pattern as `LearningToolkitRewardModal`).

---

## Validated assumptions

| Assumption | Status | Fallback |
|------------|--------|------------|
| One cutscene DB step can hold an entire dialog block (many beats) without RPC changes | ✅ Validated | Split into multiple cutscene rows (worse UX, still works) |
| `JsonUtility` can deserialize `beats[]` and `npcCast[]` with `[Serializable]` nested types | ⚠️ Needs check during implementation | Use Newtonsoft or manual parser only if Unity limits bite; prefer nested `[Serializable]` classes per existing DTO style |
| Quest finish → start next quest can reuse existing `POST /api/game/quests/:id/start` | ✅ Validated | Manual overview if start fails |
| `blockBack` on bridge quests is sufficient without hiding Android back / OS gestures | ⚠️ Needs check | Document as best-effort; only shell back button |
| German **Weiter** is acceptable default for all locales in this study build | ✅ Per product | `primaryCtaLabel` override per beat/quest |

---

## Identified risks

| Risk | Mitigation |
|------|------------|
| Old cutscene JSON left in DB after deploy | Same-milestone seed migration + bootstrap 502 until fixed |
| Unity/Zod shape drift | Shared fixture JSON in web tests; mirror sample in `Assets/Data/` for Unity smoke |
| Multi-beat cutscene + auto-advance races with shell **Weiter** | Disable double-tap; cancel coroutine on manual advance |
| `meta_payload` typo fails bootstrap | Strict schema on write; lenient read with empty object default |
| Auto-start skips overview when player expected map | Only set `autoStartQuestSlug` on explicit bridge quests (1.1→1.2); document in authoring guide |
| Reference overlay + task modals z-order conflict | Insert reference/pause modals on same overlay plane with consistent sorting (pause above reference) |

---

## Success criteria

- [ ] Author can publish a cutscene with ≥2 beats and ≥2 distinct `speakerId` values in one step; learner walks through with **Weiter** and sees mode-appropriate layout.
- [ ] Single-beat narrator cutscene (one `beats` entry) works for simple intros.
- [ ] All committed cutscene seeds validate under the new schema; game bootstrap succeeds.
- [ ] Quest with `referenceDocument` in `meta_payload` shows **Broschüre ansehen** on cutscene and task steps; modal shows full text.
- [ ] **Pause** opens and closes on any step; resume returns to same beat/task.
- [ ] Quest with `flow.blockBack: true` cannot leave via shell back (hidden/disabled).
- [ ] Cutscene beat with `autoAdvanceMs` advances without tap after delay.
- [ ] Quest with `flow.autoStartQuestSlug` starts that quest immediately after finish when unlocked.
- [ ] `DOC/02-steps-and-rewards.md` documents cutscene `beats[]` shape and `meta_payload` fields (no legacy `title`/`body` root).

---

## Implementation areas (for planning mode)

1. **Supabase** — `game_quests.meta_payload` migration; **rewrite cutscene `content_payload` in seeds** to `beats[]` shape (greenfield + endcap + any scripts).
2. **Web schemas & bootstrap** — replace `cutsceneContentSchema`, add `questMetaPayloadSchema`, repository select, DTO mapping, validation tests.
3. **Unity contracts** — `GameQuestBootstrapDto.metaJson`, `GameFlowController` quest meta, `StepContext` quest meta.
4. **Cutscene UI** — replace `CutsceneContentDto` + `CutsceneToolkitStep` (beat pager, four layouts, `autoAdvanceMs`); remove old title/body-only UI path.
5. **Quest shell overlays** — reference modal, pause modal, UXML chrome buttons, z-order.
6. **Quest shell flow** — `blockBack`, auto-start next quest, beat auto-advance vs shell **Weiter**.
7. **Docs** — `DOC/02-steps-and-rewards.md` + `DOC/01-game-configuration.md` (Akt 1.x = quest slug).

---

## Authoring convention (Chapter 1)

For planning and content pipeline alignment (no content in this milestone):

| Story label | DB target |
|-------------|-----------|
| Akt 1 | `game_chapters.slug` e.g. `chapter-01` |
| Akt 1.0 | `game_quests.slug` e.g. `chapter-01-quest-00-opening` |
| Akt 1.1 | `chapter-01-quest-01-school` |
| Akt 1.2 | `chapter-01-quest-02-sms-bridge` with `flow.autoStartQuestSlug` unset on prior; prior quest sets `autoStartQuestSlug` → `chapter-01-quest-02-sms-bridge` |
| Akt 1.3 / 1.4 / 1.5 | separate quest slugs; unlock via existing `unlock_rules` after 1.2 logical key |
| Bar brochure | `meta_payload.referenceDocument` on bar quest only |

Example cutscene payload (illustrative):

```json
{
  "npcCast": [
    { "id": "ricci", "displayName": "Prof.ssa Ricci", "side": "right" },
    { "id": "chiara", "displayName": "Chiara", "side": "left" }
  ],
  "beats": [
    { "presentationMode": "narrator", "body": "Du betrittst das Klassenzimmer…" },
    { "presentationMode": "npcDialog", "speakerId": "ricci", "body": "Guten Morgen zusammen! …" },
    { "presentationMode": "npcDialog", "speakerId": "chiara", "body": "Ich fange an, Frau Professor! …" },
    { "presentationMode": "innerMonologue", "body": "Alle schauen mich an. …" }
  ],
  "navigation": { "blockBack": false }
}
```

Single narrator line (e.g. Akt 1.0 beat):

```json
{
  "beats": [
    { "presentationMode": "narrator", "body": "Willkommen in Bologna." }
  ]
}
```
