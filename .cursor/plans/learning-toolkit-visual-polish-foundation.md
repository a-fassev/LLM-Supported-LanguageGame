# Learning Toolkit Visual & Content Polish — Requirements Foundation

> **Purpose**: Bring every Learning Toolkit screen, shell, part, task template, cutscene, special screen, and overlay to a consistent visual and authoring standard—centralized sprites, clearer borders and spacing, unified element naming, Italian learner-facing copy, and JSON/DB contracts that reference bundled assets instead of ad hoc remote URLs where possible.

**Inventory source**: `[docs/unity/ui-learning-toolkit-inventory.md](../../docs/unity/ui-learning-toolkit-inventory.md)` (§0–§11).  
**Audit date**: 2026-05-27 (UXML/USS/C#/web schema review on `unity-implementation`).

---

## Problem Statement

Players and authors today see an uneven UI layer: navigation and auth screens use **English** preview and runtime chrome while quest tasks and cutscene beats assume **Italian**; shell buttons mix **German** (`Broschüre`, pause/confirm) with **Italian** (`Controlla`, reward CTAs). **No raster sprites** are committed under `Assets/`—menus and panels rely on flat USS only, while task/special-screen images load from **external `http(s)` URLs** with no project-local catalog. **Matching** columns sit too close for readable connector lines; line weight lives only in C# (`3px`). **Borders** are implicit via list-row/modal USS, not applied consistently on chips, cards, and HUD chrome. **Element naming** is mostly kebab + `lg-`* but root ids diverge (`root-shell` vs `avatar-root` vs `quest-root`). Authors lack **per-task-type content Zod** (except FreitextLlm and cutscenes), so image fields and asset keys are documented only in Unity DTOs and DOC.

---

## Confirmed Decisions


| Question                                                           | Decision                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Static images (menus, shell frames, chips, buttons, overlay cards) | Authored in **UI Builder** via `background-image` on VisualElements or USS `background-image` / `-unity-background-image-tint-color`, referencing **Sprite assets** under a single Resources tree (see Asset layout).                                        |
| Dynamic images (portraits, task media, special-screen photos)      | `**content_payload` / `metaJson` JSON** carries stable **asset keys** (not raw URLs in authored content); Unity resolves keys → `Resources` sprites/textures. Legacy `imageUrl` supported only during migration with explicit deprecation.                   |
| Task + cutscene scene background                                    | Every task and cutscene payload supports a dedicated scene background field: `sceneBackgroundAsset` (string key to `GameArt`). This field controls the full-step background image.                                                                          |
| Central asset location                                             | `**Assets/Resources/UI/GameArt/`** with subfolders `Static/`, `Portraits/`, `Tasks/`, `SpecialScreens/` (see Asset layout). Cutscene portraits **move** from `CutscenePortraits/` into `GameArt/Portraits/` (or alias paths in loader—one canonical folder). |
| Image naming + placeholder policy                                  | **Every static and dynamic image gets a unique asset name** and is committed under `GameArt/` as a placeholder first (`ph-*`). No unnamed/implicit image references in UXML, USS, or JSON.                                                                |
| DB schema per task type                                            | Keep storage in `**game_quest_steps.content_payload` JSONB**; extend/normalize JSON fields per task via **Zod content schemas** in `apps/web/lib/game/schemas/` and matching Unity DTOs. No new SQL columns per image.                                       |
| Learner UI language                                                | **Italian** for all player-visible strings in UXML preview samples, runtime fallbacks in `LearningToolkitChromeUx`, shell CTAs, overlay chrome, and cutscene error states. **English** reserved for `ToolkitPreviewScreen` and internal editor tooling only. |
| Auth / account screens                                             | **Italian** for player-facing labels (login/register)—aligned with game language, not English product copy.                                                                                                                                                  |
| Matching layout                                                    | Widen column gutter via **USS tokens** (target **≥ 32px** total between card columns, up from 16px inline); increase connector `**lineWidth` to 5px** (USS token or shared constant); pairing area `min-height` tokenized.                                   |
| Borders                                                            | Add visible borders on interactive surfaces missing edge definition: **cards, chips, drop zones, wallet badges, modal cards, messenger phone frame**—prefer semantic USS classes (`lg-border-subtle`, `lg-border-strong`) over inline `border-width`.        |
| Spacing                                                            | Replace ad hoc inline `margin-`* in screens/tasks with `**lg-mt-`* / `lg-gap-`* tokens** where a token exists; add tokens for recurring 8/12/16px gaps.                                                                                                      |
| Screen size + type scale                                           | Use one baseline layout and type scale across all screens: panel layout by shared screen root classes/tokens; typography from `components-typography.uss` tokens only (no ad hoc per-screen font sizes unless explicitly documented).                       |
| Navigation button authoring                                        | Navigation-screen buttons become reusable **Parts** (e.g., `NavigationPrimaryButtonPart`, `NavigationSecondaryButtonPart`, `NavigationIconButtonPart`) so UI Builder styling/background images are centralized.                                              |
| Element naming                                                     | Adopt **Naming system** below; rename only where binders/views reference names (no drive-by renames).                                                                                                                                                        |
| Remote `imageUrl` in production content                            | **Out of scope for new authoring** after migration; existing demo SQL may keep URLs until re-authored with asset keys.                                                                                                                                       |


---

## Asset Layout (canonical)

```text
Assets/Resources/UI/GameArt/
├── Static/           # Menus, shells, HUD, buttons, overlay frames, chips
│   ├── Navigation/
│   │   ├── Backgrounds/
│   │   └── Buttons/
│   ├── TaskSceneBackgrounds/
│   ├── CutsceneBackgrounds/
│   ├── Shell/
│   ├── Hud/
│   └── Overlays/
├── Portraits/
│   ├── Player/       # current.png (Avatar Shop writes selection here)
│   └── Npc/{id}.png
├── Tasks/            # Optional per-task-type banks (MC stems, drag tiles, matching)
│   ├── MultipleChoice/
│   ├── DragDrop/
│   ├── Matching/
│   └── …
└── SpecialScreens/   # Reader heroes, photo grid items (keyed sets)
```

**Exactly where to place files (placeholder-first):**
- Navigation screen backgrounds: `Assets/Resources/UI/GameArt/Static/Navigation/Backgrounds/`
- Navigation button backgrounds/icons: `Assets/Resources/UI/GameArt/Static/Navigation/Buttons/`
- Task/shell static frames: `Assets/Resources/UI/GameArt/Static/Shell/`
- HUD chips/icons: `Assets/Resources/UI/GameArt/Static/Hud/`
- Overlay/modal frames: `Assets/Resources/UI/GameArt/Static/Overlays/`
- Task full-scene backgrounds (for `sceneBackgroundAsset`): `Assets/Resources/UI/GameArt/Static/TaskSceneBackgrounds/`
- Cutscene full-scene backgrounds (for `sceneBackgroundAsset`): `Assets/Resources/UI/GameArt/Static/CutsceneBackgrounds/`
- Cutscene portraits: `Assets/Resources/UI/GameArt/Portraits/Player/` and `Assets/Resources/UI/GameArt/Portraits/Npc/`
- Task dynamic image banks (for `assetId`): `Assets/Resources/UI/GameArt/Tasks/{TaskType}/`
- Special-screen dynamic image banks (for `assetId`): `Assets/Resources/UI/GameArt/SpecialScreens/{Variant}/`

**Asset naming convention (required):**
- Static: `st-{surface}-{screenOrPart}-{variant}` (example: `st-nav-mainmenu-bg-default`)
- Dynamic: `dy-{domain}-{set}-{item}` (example: `dy-matching-ch1-buongiorno`)
- Placeholder assets for first pass: prefix with `ph-` (example: `ph-st-nav-auth-login-panel`)

**JSON dynamic reference shape** (all task types that support images):

```json
{
  "sceneBackgroundAsset": "static/task-scene-backgrounds/ph-st-task-bg-default",
  "assetId": "chapter1/matching/buongiorno",
  "label": "Buongiorno"
}
```

- `assetId`: path segment under `GameArt/` (validated alphanum `/` `-` `_`).
- `sceneBackgroundAsset`: path segment under `GameArt/` for the full task/cutscene background.
- Optional `imageUrl` during migration → loader tries `assetId` first, then URL.

**Unity resolver**: one `GameArtResourceLoader` (or extend `CutscenePortraitResourceLoader`) used by cutscene, MC, DragDrop, Matching, SpecialScreen steps.

**Web validation**: `assetId` regex + optional allowlist manifest generated at build time (future); minimum Zod `z.string().min(1)`.

**Simple field strategy (applies everywhere):**
- Full scene background for task/cutscene steps: `sceneBackgroundAsset`
- Visual media inside content blocks/items: `assetId`
- Legacy compatibility only: `imageUrl` (temporary fallback)

---

## Sizing & Typography Baseline

- **Screen baseline:** all navigation/shell roots use one shared screen container pattern (`min-height`, content width, and paddings from shared USS tokens), avoiding per-screen custom size drift.
- **Panel sizing:** common panels (`lg-game-panel`, list rows, modal cards) use tokenized min/max widths and paddings; avoid inline pixel values unless documented in this plan.
- **Typography scale:** map all headings/body/button labels to one token ladder from `components-typography.uss` (e.g., display/screen/title/body/caption). No direct inline `font-size`.
- **Button sizing:** primary/secondary/icon buttons follow shared height and horizontal padding tokens; navigation buttons inherit from reusable button parts.
- **Validation target:** each screen should pass a visual consistency pass for screen density, spacing rhythm, and type hierarchy before implementation is marked done.

---

## Naming System


| Layer                    | Pattern                   | Example                                                                                   |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| Screen/shell root `name` | `{feature}-root`          | `main-menu-root`, `quest-shell-root` (rename `quest-root`, `cut-shell-root` → consistent) |
| Part root `name`         | `{feature}-{role}-part`   | `matching-card-part`                                                                      |
| Regions                  | `{feature}-{region}-host` | `mc-options-host`, `step-host`                                                            |
| Actions                  | `{action}-button`         | `primary-action-button`                                                                   |
| Image asset names        | `st-*` / `dy-*` / `ph-*`  | `ph-st-nav-mainmenu-bg`, `dy-matching-ch1-grazie`                                         |
| Navigation button parts  | `Navigation*ButtonPart`   | `NavigationPrimaryButtonPart`, `NavigationIconButtonPart`                                 |
| USS layout               | `lg-{block}` BEM          | `lg-cut-shell__stage`, `lg-page-header`                                                   |
| Preview-only copy class  | `lg-preview-sample`       | Keep; all Italian fixture text                                                            |
| Dynamic image host       | `{feature}-{role}-image`  | `matching-card-image`, `avatar-slot`                                                      |


**Rename policy**: Document breaking renames in implementation plan; update `QueryRequired` / views in same PR as UXML.

---

## User Experience

### User Flows

1. Player opens any navigation screen → sees **Italian** titles/buttons and consistent panel borders/background art where designed.
2. Player enters quest **task shell** → Italian **Controlla**, **Broschüre** → **Documento** / **Guida**; wallet and task panel show clear edges and spacing.
3. Player plays **Matching** → columns far enough apart that connector lines read cleanly; lines slightly thicker.
4. Player sees **cutscene** → portraits from bundled art; NPC names/body in Italian from DB.
5. Player sees task and cutscene steps with a dedicated full-scene background image from `sceneBackgroundAsset`.
6. Player sees **special screen** photos → images from `assetId` (fast, offline-capable in builds that ship art).
7. Author edits content in Supabase → JSON validated per task type including `sceneBackgroundAsset` + optional `assetId` fields.

### Empty / Loading / Error States


| Situation                           | Target UX                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Missing `assetId` / broken sprite   | Placeholder USS on image host (existing cutscene placeholder pattern); Italian short message where a label fits |
| Missing `sceneBackgroundAsset`       | Step renders with default placeholder background (`ph-st-task-bg-default` / `ph-st-cutscene-bg-default`)       |
| Invalid cutscene JSON               | Italian error panel (replace German strings in `CutsceneToolkitStep`)                                           |
| Photo load failure (Special Screen) | Keep Italian `Immagine non disponibile.`                                                                        |
| Loading overlay                     | Italian only (`Caricamento…` / `Un momento…`)                                                                   |


### User Expectations

- Visual density similar to a polished mobile learning app: clear boxes, not flat gray-only panels.
- Italian copy everywhere the child reads text; no German/English shell surprises.

---

## Scope

### In Scope

- Full inventory pass (screens, shells, parts, tasks, cutscenes, special screens, overlays, shared USS).
- `GameArt/` tree + committed placeholder or real sprites for static chrome.
- Every static/dynamic image has a named asset in `GameArt/` (placeholder allowed in first implementation pass).
- JSON/DTO/Zod alignment for `assetId` on all task types that today use `imageUrl`.
- JSON/DTO/Zod alignment for `sceneBackgroundAsset` on all `task` + `cutscene` step payloads.
- Italian translation pass (UXML preview + `LearningToolkitChromeUx` + shell UXML).
- Matching spacing/line weight; border/spacing tokens in USS.
- Naming alignment for roots and new hosts; migration checklist per binder.
- Navigation-screen buttons extracted into reusable parts for centralized UI Builder styling.
- Shared screen-size/type-scale normalization across screens, shells, overlays, and task templates.
- `specialScreenContentSchema.ts` (mirrors Unity `SpecialScreenContentDto`).
- Content Zod for ClozeText, DragDrop, MultipleChoice, Matching, ErrorSpotting (authoring shape).

### Out of Scope

- Gameplay/scoring logic changes.
- New task types (`FreeText`, `RelativeClause` remain stub).
- Avatar Shop purchase/economy backend (only art path → `Portraits/Player/current` wiring if needed for portraits).
- CDN hosting pipeline / Supabase Storage (unless later chosen—foundation uses Resources).
- Canvas/uGUI migration.
- Automatic Italian translation of **DB seed narrative** (separate content authoring pass; foundation lists seeds to update).

---

## Engineering Design

### Unity

- UXML/USS under `Assets/Resources/UI/LearningToolkit/`.
- New/updated loaders in `Assets/Scripts/Presentation/Steps/` and shared `GameArtResourceLoader`.
- `CutscenePlayerPortraitProvider` paths updated to `GameArt/Portraits/`.
- Task and cutscene presenters/steps read `sceneBackgroundAsset` and apply a full-step background image to the shell stage/panel host.
- New navigation button parts under `Templates/Parts/Navigation/Buttons/` and screen UXML updated to `ui:Instance` those parts.
- `MatchingToolkitStep` / USS: gutter + line width.
- Screen size and type scale enforced through shared USS tokens/classes, not per-screen inline values.
- Views: `AuthView`, `MainMenuView`, … only if `name` attributes change.

### Next.js app

- New schemas: `*ContentSchema.ts` per task type + `specialScreenContentSchema.ts`.
- API validation on write/preview endpoints if present; seed scripts updated to `assetId`.

### Integration

- Unity ↔ API: `contentJson` string unchanged at transport layer; **payload shape** evolves with versioned schemas.
- Optional: `GET /api/game/asset-manifest` later—**not** in this foundation.

### Data & persistence

- `content_payload` JSONB only; `metaJson.referenceDocument` stays text (Italian).
- `npcCast[].portraitId` retained; maps to `GameArt/Portraits/Npc/{id}`.

### Error Handling

- Resolver: missing asset → placeholder + log warning; cutscene/task binders must not throw.
- Zod reject on admin/content import with Italian-safe English dev message server-side; player never sees schema errors.

### Security

- Drop or restrict arbitrary `imageUrl` in authored JSON after migration; allowlist only for legacy rows.
- `assetId` sanitization same as `portraitId` (alnum, `_`, `-`, `/`).

### Performance

- Prefer Resources sprites over runtime HTTP for shipped builds.
- Matching line layer unchanged architecturally (Painter2D).

---

## Element Catalog — Required Implementation State

Each entry lists the target work for one file or group. **Status** values: `Rework`, `Light`, `Low`, `Missing preview`, `No runtime change`, `Rework (priority)`.

---

### A. Navigation Screens (`Screens/`)

#### `AuthScreen.uxml`

- **Status:** Rework
- **Assets:** Add static panel/bg sprites in UI Builder
- **DB/JSON:** N/A
- **Naming:** Align to `auth-root`; keep field names
- **Language:** EN → **IT** (all labels/buttons)
- **Borders:** Panel via `lg-game-panel` + subtle border class
- **Spacing:** Replace inline margins with tokens

#### `MainMenuScreen.uxml`

- **Status:** Rework
- **Assets:** Hero/bg static art optional
- **DB/JSON:** N/A
- **Naming:** → `main-menu-root`
- **Language:** EN → **IT**
- **Borders:** Hero border/frame
- **Spacing:** OK tokens; tighten subtitle margin token

#### `LeaderboardScreen.uxml`

- **Status:** Rework
- **Assets:** Team row bg optional static
- **DB/JSON:** API-driven list
- **Naming:** OK
- **Language:** EN → **IT** (incl. fixture rows)
- **Borders:** Row borders visible
- **Spacing:** Reduce inline margins → tokens

#### `ChapterOverviewScreen.uxml`

- **Status:** Rework
- **Assets:** Map/chapter row art static
- **DB/JSON:** Chapter API titles IT
- **Naming:** OK
- **Language:** EN → **IT**
- **Borders:** List row borders
- **Spacing:** Scroll `margin-top` → token

#### `QuestOverviewScreen.uxml`

- **Status:** Rework
- **Assets:** Same as chapter
- **DB/JSON:** Quest API
- **Naming:** OK
- **Language:** EN → **IT**; unify `lg-heading-screen` with chapter
- **Borders:** Row borders
- **Spacing:** Tokenize

#### `AvatarShopScreen.uxml`

- **Status:** Rework
- **Assets:** Preview pane static frame; portrait dynamic later
- **DB/JSON:** Shop TBD
- **Naming:** `avatar-root` → `avatar-shop-root`
- **Language:** EN → **IT**
- **Borders:** Preview pane border
- **Spacing:** Tokenize `avatar-body` inline flex

#### `ToolkitPreviewScreen.uxml`

- **Status:** Low
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** Add `name`s optional
- **Language:** Stay **EN** (dev only)
- **Borders:** N/A
- **Spacing:** Fix duplicate classes

#### Navigation button parts for screen actions (new)

- **Status:** Rework
- **Assets:** Add placeholder/static button background sprites under `GameArt/Static/Navigation/Buttons/`
- **DB/JSON:** N/A
- **Naming:** `NavigationPrimaryButtonPart`, `NavigationSecondaryButtonPart`, `NavigationIconButtonPart`
- **Language:** Labels inherited from each screen in Italian
- **Borders:** Button border classes centralized in part USS
- **Spacing:** Shared button paddings/heights from tokens

---

### B. Navigation Parts (`Templates/Parts/Navigation/`)

#### `NavigationWalletHudPart.uxml`

- **Status:** Rework
- **Assets:** Pizza/backpack icon sprites static
- **DB/JSON:** Wallet API
- **Naming:** OK
- **Language:** Glyph **P/B** → IT labels or icons only
- **Borders:** Badge border
- **Spacing:** HUD padding tokens

#### `NavigationPageHeaderWithWalletPart.uxml`

- **Status:** Rework
- **Assets:** Header bar bg static
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** **Pause** → **Pausa** (UXML + binder)
- **Borders:** Header bottom border
- **Spacing:** —

#### `NavigationPageHeaderMinimalPart.uxml`

- **Status:** Rework
- **Assets:** Same header art
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** —
- **Borders:** Border
- **Spacing:** —

---

### C. Leaderboard Parts (`Templates/Parts/Leaderboard/`)

#### `LeaderboardPlayerRowPart.uxml`

- **Status:** Rework
- **Assets:** Optional rank/medal static
- **DB/JSON:** Leaderboard API
- **Naming:** OK
- **Language:** Fixture EN → **IT**
- **Borders:** Row border
- **Spacing:** Inline min-widths → USS

#### `LeaderboardTeamSummaryPart.uxml`

- **Status:** Rework
- **Assets:** Team color strip static optional
- **DB/JSON:** API
- **Naming:** OK
- **Language:** Fixture EN → **IT**
- **Borders:** Team panel border
- **Spacing:** —

#### `LeaderboardTeamSectionHeaderPart.uxml`

- **Status:** Rework
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** EN → **IT**
- **Borders:** —
- **Spacing:** —

---

### D. Quest Shells (`Shells/`)

#### `TaskShellScreen.uxml`

- **Status:** Rework
- **Assets:** Shell frame, footer bar, primary btn static
- **DB/JSON:** `metaJson.referenceDocument` IT
- **Naming:** `quest-root` → `quest-shell-root`
- **Language:** **Broschüre** → **Documento**; **Controlla** OK
- **Borders:** `lg-game-panel` + footer border
- **Spacing:** Tokenize step `min-height`

#### `CutShellScreen.uxml`

- **Status:** Rework
- **Assets:** Stage bg static optional
- **DB/JSON:** cutscene `navigation.primaryCtaLabel`
- **Naming:** OK BEM
- **Language:** **Weiter** OK; **Pause** → **Pausa**
- **Borders:** Stage border
- **Spacing:** OK structure

---

### E. Task Templates & Parts (by `task_type`)

#### E.1 ClozeText

##### `ClozeTextTaskTemplate.uxml`

- **Status:** Light
- **Assets:** None
- **DB/JSON:** Add `clozeTextContentSchema.ts`; include `sceneBackgroundAsset`
- **Naming:** OK
- **Language:** Already IT
- **Borders:** Gap field border
- **Spacing:** Line row margins → USS

##### `ClozeLineRowPart`, `ClozeLiteralPart`, `ClozeGapFieldPart`

- **Status:** Light
- **Assets:** None
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT preview
- **Borders:** Gap border visible
- **Spacing:** 6px gaps tokenized

#### E.2 DragDrop

##### `DragDropTaskTemplate.uxml`

- **Status:** Rework
- **Assets:** Tile/category static optional
- **DB/JSON:** `sceneBackgroundAsset` + `items[].assetId` (+ migrate `imageUrl`); document `lines` mode
- **Naming:** OK
- **Language:** IT
- **Borders:** Drop zone border stronger
- **Spacing:** Bank/target spacing

##### All `DragDrop*Part` (7 files)

- **Status:** Rework
- **Assets:** Tile sprite via dynamic `assetId`
- **DB/JSON:** Same as template
- **Naming:** OK
- **Language:** IT
- **Borders:** Tile border
- **Spacing:** 8px grid tokens

##### DragDrop — Builder preview (lines mode)

- **Status:** Missing preview
- **Assets:** —
- **DB/JSON:** —
- **Naming:** —
- **Language:** —
- **Borders:** —
- **Spacing:** Add **lines mode** preview using `DragDropLineRowPart`

#### E.3 MultipleChoice

##### `MultipleChoiceTaskTemplate.uxml`

- **Status:** Rework
- **Assets:** —
- **DB/JSON:** `sceneBackgroundAsset` + `options[].assetId`, `stem[].assetId` / `audioAssetId`
- **Naming:** OK
- **Language:** IT
- **Borders:** Option row border
- **Spacing:** Align stem image preview height with runtime (260px token)

##### `McStemTextPart`, `McOptionRowPart`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT
- **Borders:** —
- **Spacing:** —

##### `McStemImagePart`, `McStemAudioPart`

- **Status:** Add Builder preview
- **Assets:** Dynamic image static host
- **DB/JSON:** stem `image`/`audio` blocks in Zod
- **Naming:** OK
- **Language:** IT placeholder
- **Borders:** Image frame border
- **Spacing:** —

#### E.4 Matching

##### `MatchingTaskTemplate.uxml`

- **Status:** Rework (priority)
- **Assets:** —
- **DB/JSON:** `sceneBackgroundAsset` + `leftItems/rightItems[].assetId`; hoist DTO to `ToolkitStepContentDtos`
- **Naming:** OK
- **Language:** IT; right column preview **IT** not EN
- **Borders:** Card border
- **Spacing:** **Column gap ≥32px**; pairing min-height USS

##### `MatchingCardPart`, `MatchingLeftRowPart`, `MatchingColumnHeaderPart`

- **Status:** Rework
- **Assets:** Card image via `assetId`
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT
- **Borders:** Card border
- **Spacing:** Row margin tokens

##### `MatchingToolkitStep` line layer (C#)

- **Status:** Rework
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** N/A
- **Language:** N/A
- **Borders:** N/A
- **Spacing:** **lineWidth 5px** + color token

#### E.5 ErrorSpotting

##### `ErrorSpottingTaskTemplate.uxml`

- **Status:** Light
- **Assets:** None
- **DB/JSON:** `errorSpottingContentSchema.ts` + `sceneBackgroundAsset`
- **Naming:** OK
- **Language:** IT
- **Borders:** Chip/slot borders visible
- **Spacing:** Row spacing OK

##### `ErrorSpottingSlotPart`, `ErrorSpottingChipPart`, `ErrorSpottingInlineFieldPart`

- **Status:** Light
- **Assets:** None
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT
- **Borders:** Marked slot border
- **Spacing:** —

##### `ErrorSpottingSlotMarkedPart`

- **Status:** No runtime change
- **Assets:** N/A
- **DB/JSON:** Preview-only
- **Naming:** OK
- **Language:** IT
- **Borders:** —
- **Spacing:** —

#### E.6 FreitextLlm

##### `FreitextLlmTaskTemplate.uxml`

- **Status:** Light
- **Assets:** None
- **DB/JSON:** `freitextLlmContentSchema.ts` + `sceneBackgroundAsset`
- **Naming:** OK
- **Language:** IT
- **Borders:** Textarea border
- **Spacing:** —

#### E.7 Common

##### `StubTaskPanelPart.uxml`

- **Status:** Light
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** IT when stub shown
- **Borders:** Panel border
- **Spacing:** —

---

### F. Cutscene Templates (`Templates/Cutscenes/`)

#### `CutsceneHost.uxml`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** `cutsceneContentSchema` + `sceneBackgroundAsset`
- **Naming:** OK
- **Language:** IT fixture
- **Borders:** —
- **Spacing:** Remove confusing duplicate fixture or mark preview-only

#### `CutsceneNarratorBeat.uxml`

- **Status:** Rework static art
- **Assets:** Panel art static
- **DB/JSON:** beats JSON IT + `sceneBackgroundAsset`
- **Naming:** OK
- **Language:** IT
- **Borders:** Narrator panel border ✅
- **Spacing:** —

#### `CutsceneNpcDialogBeat.uxml`

- **Status:** Rework portraits
- **Assets:** NPC portrait dynamic `portraitId` → `GameArt/Portraits/Npc/`
- **DB/JSON:** `sceneBackgroundAsset` + `npcCast[]`
- **Naming:** OK
- **Language:** IT
- **Borders:** Bubble border ✅
- **Spacing:** —

#### `CutsceneInnerMonologueBeat.uxml`

- **Status:** Rework portraits
- **Assets:** Player portrait dynamic
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT
- **Borders:** —
- **Spacing:** —

#### `CutsceneGameInfoBeat.uxml`

- **Status:** Light
- **Assets:** Icon static optional
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT
- **Borders:** Accent bar ✅
- **Spacing:** —

#### `CutsceneToolkitStep.cs` (error UI)

- **Status:** Rework
- **Assets:** —
- **DB/JSON:** —
- **Naming:** —
- **Language:** DE → **IT**
- **Borders:** —
- **Spacing:** —

---

### G. Special Screens (`Templates/SpecialScreens/` + Parts)

#### `SpecialScreenHost.uxml`

- **Status:** Rework schema
- **Assets:** —
- **DB/JSON:** `**specialScreenContentSchema.ts` (new)**
- **Naming:** OK
- **Language:** IT preview
- **Borders:** Panel border
- **Spacing:** —

#### `SpecialScreenMessengerChrome.uxml`

- **Status:** Rework static art
- **Assets:** Phone frame static
- **DB/JSON:** `smsChrome`
- **Naming:** OK
- **Language:** IT
- **Borders:** 3px frame ✅
- **Spacing:** —

#### `SpecialScreenMailChrome.uxml`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** `mailChrome`
- **Naming:** OK
- **Language:** IT
- **Borders:** Mail borders ✅
- **Spacing:** —

#### `SpecialScreenPhotoChrome.uxml`

- **Status:** Rework
- **Assets:** —
- **DB/JSON:** `photoViewerChrome.items[].assetId`
- **Naming:** OK
- **Language:** IT
- **Borders:** Cell borders ✅
- **Spacing:** Grid vs runtime parts alignment

#### `SpecialScreenReaderChrome.uxml`

- **Status:** Rework
- **Assets:** Hero `readerChrome.assetId`
- **DB/JSON:** `readerChrome`
- **Naming:** OK
- **Language:** IT
- **Borders:** Hero border ✅
- **Spacing:** —

#### 16× `SpecialScreen/*Part.uxml`

- **Status:** Rework photos
- **Assets:** Photo cells dynamic
- **DB/JSON:** —
- **Naming:** OK
- **Language:** IT
- **Borders:** Per USS
- **Spacing:** —

#### `SpecialScreenToolkitStep.cs`

- **Status:** Rework loader
- **Assets:** Use `GameArtResourceLoader`
- **DB/JSON:** Validate via Zod on server
- **Naming:** OK
- **Language:** IT errors ✅
- **Borders:** —
- **Spacing:** —

---

### H. Overlays (`Templates/Overlays/`)

#### `LoadingOverlay.uxml`

- **Status:** Light
- **Assets:** Modal bg static
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** IT ✅
- **Borders:** Modal border
- **Spacing:** —

#### `LoadErrorBanner.uxml`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** IT ✅
- **Borders:** Top border ✅
- **Spacing:** —

#### `InfoBanner.uxml`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** IT ✅
- **Borders:** —
- **Spacing:** —

#### `ConfirmModal.uxml`

- **Status:** Rework
- **Assets:** —
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** DE preview → **IT**; C# `QuestShellSharedRuntime` DE → **IT**
- **Borders:** Modal border
- **Spacing:** —

#### `UnlockModal.uxml`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** IT ✅
- **Borders:** —
- **Spacing:** —

#### `RewardModal.uxml`

- **Status:** Light
- **Assets:** —
- **DB/JSON:** API copy
- **Naming:** OK
- **Language:** IT ✅
- **Borders:** —
- **Spacing:** —

#### `ReferenceDocumentModal.uxml`

- **Status:** Rework
- **Assets:** —
- **DB/JSON:** `metaJson.referenceDocument` IT
- **Naming:** OK
- **Language:** Close **Schließen** → **Chiudi**
- **Borders:** —
- **Spacing:** —

#### `PauseMenuModal.uxml`

- **Status:** Rework
- **Assets:** —
- **DB/JSON:** N/A
- **Naming:** OK
- **Language:** DE → **IT**; sync `LearningToolkitChromeUx`
- **Borders:** —
- **Spacing:** —

#### `LearningToolkitChromeUx.cs`

- **Status:** Rework
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** N/A
- **Language:** DE constants → **IT**
- **Borders:** N/A
- **Spacing:** N/A

---

### I. Shared USS / Theme

#### `tokens-*.uss`

- **Status:** Rework
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** Add `--lg-border-`*, `--lg-matching-`*, `--lg-gap-*`
- **Language:** N/A
- **Borders:** Centralize border widths
- **Spacing:** Centralize spacing

#### `components-cards-lists.uss`

- **Status:** Rework
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** —
- **Language:** —
- **Borders:** Default card/list borders
- **Spacing:** —

#### `components-hud.uss`

- **Status:** Rework
- **Assets:** HUD sprites ref
- **DB/JSON:** N/A
- **Naming:** —
- **Language:** —
- **Borders:** Wallet badge borders
- **Spacing:** —

#### `components-overlays-empty.uss`

- **Status:** Light
- **Assets:** Overlay frames
- **DB/JSON:** N/A
- **Naming:** —
- **Language:** —
- **Borders:** Modal borders
- **Spacing:** —

#### `task-templates.uss`

- **Status:** Rework
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** —
- **Language:** —
- **Borders:** —
- **Spacing:** Matching-specific layout rules

#### `cutscene-narrative.uss`

- **Status:** Light
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** —
- **Language:** —
- **Borders:** ✅
- **Spacing:** —

#### `special-screen-*.uss` (4 files)

- **Status:** Light
- **Assets:** N/A
- **DB/JSON:** N/A
- **Naming:** —
- **Language:** —
- **Borders:** Mostly ✅
- **Spacing:** —

---

### J. DB / API content schemas (cross-cutting)

#### Cutscene

- **Status:** Add + migrate
- **Current JSON:** `portraitId` (NPC), no dedicated full-scene background field
- **Target:** `sceneBackgroundAsset` + keep `npcCast[].portraitId`; document `GameArt/Static/CutsceneBackgrounds/`

#### ClozeText

- **Status:** Add
- **Current JSON:** none
- **Target:** `clozeTextContentSchema.ts` + `sceneBackgroundAsset`

#### DragDrop

- **Status:** Add + migrate
- **Current JSON:** `items[].imageUrl`
- **Target:** `sceneBackgroundAsset` + `assetId`; `presentation` lines/targets

#### MultipleChoice

- **Status:** Add + migrate
- **Current JSON:** `imageUrl`, `audioUrl`
- **Target:** `sceneBackgroundAsset` + `assetId`, `audioAssetId`

#### Matching

- **Status:** Add + migrate
- **Current JSON:** `imageUrl` (step-local DTO)
- **Target:** `sceneBackgroundAsset` + `assetId` in shared DTO + Zod

#### ErrorSpotting

- **Status:** Add
- **Current JSON:** none
- **Target:** `errorSpottingContentSchema.ts` + `sceneBackgroundAsset`

#### FreitextLlm

- **Status:** Add
- **Current JSON:** —
- **Target:** `freitextLlmContentSchema.ts` + `sceneBackgroundAsset`

#### SpecialScreen*

- **Status:** Add + migrate
- **Current JSON:** `imageUrl` in photo/reader
- **Target:** `assetId` on items/reader

#### SQL rollout (Supabase MCP)

- Add migration(s) to normalize task + cutscene `content_payload` with `sceneBackgroundAsset`.
- Keep migration idempotent: only set default placeholder key when field is missing.
- Execute migrations via Supabase MCP toolchain (apply migration SQL files in order).
- Keep backward compatibility in Unity parser during rollout (fallback default background when field is missing).

#### Quest meta (`referenceDocument`)

- **Status:** Content pass
- **Current JSON:** text fields
- **Target:** Italian content authoring

---

## Validated Assumptions


| Assumption                                                                         | Status                                | Fallback                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| UI Toolkit supports `background-image` from Sprites in UI Builder for menus/shells | ✅ Validated (cutscene binder pattern) | Use USS `background-image` url() to Resources |
| Shipping art in `Resources` is acceptable for study build size                     | ⚠️ Needs check with team              | Compress textures; addressables later         |
| Italian for Auth/login is desired (vs bilingual school IT/DE)                      | ✅ Per user request                    | If bilingual needed, add `locale` later       |
| All existing seeds can be re-authored with `assetId`                               | ⚠️ Needs check                        | Keep URL fallback one release                 |


---

## Identified Risks


| Risk                                  | Mitigation                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Large PR touching all UXML            | Phase by layer: (1) tokens + Matching, (2) language + chrome, (3) assets + schemas |
| Binder breaks on `name` rename        | Grep `QueryRequired` / constants before each rename                                |
| Build size with committed sprites     | Texture import settings; separate optional art repo submodule if needed            |
| Authoring tool still emits `imageUrl` | Zod rejects on write; migration script for seeds                                   |


---

## Success Criteria

- Every inventory row in §Element Catalog marked **Done** or explicitly deferred with reason.
- `GameArt/` convention documented in `docs/authoring/03-styling.md` and `AGENTS.md` (brief).
- Every static and dynamic image is named and present under `Assets/Resources/UI/GameArt/` (placeholder accepted in first iteration).
- Player-facing chrome is **Italian** (no German pause/confirm/brochure close in normal flow).
- Shared screen-size and typography-token consistency validated across all screens/shells.
- Matching columns and **5px** lines verified in Play Mode.
- At least one sample quest per image-bearing task type uses `**assetId`** only.
- Content Zod exists for all implemented task types + Special Screen.
- Static menu/shell sprites visible in UI Builder previews.
- Navigation-screen action buttons are built from reusable button parts (not hand-authored per screen).

---

## Implementation Areas (for planning mode)

1. **Foundation & tokens** — `GameArt/` folders, asset naming (`st-*`, `dy-*`, `ph-*`), USS border/spacing/matching/screen-size/type tokens, `GameArtResourceLoader`.
2. **Matching priority** — column gap, line width, Italian preview column, USS extraction from inline UXML.
3. **Language pass** — `LearningToolkitChromeUx`, shells, navigation screens, overlays, cutscene errors.
4. **Static art pass** — Navigation, shells, HUD, overlays in UI Builder, with named placeholder assets.
5. **Navigation button parts** — extract and wire screen buttons to `Templates/Parts/Navigation/Buttons/`.
6. **JSON/Zod/DTO** — per-task schemas, `assetId` fields, Unity loaders, seed migration.
7. **Task template previews** — DragDrop lines, MC image/audio stems, Matching image cards.
8. **Special Screen** — schema, photo/reader `assetId`, loader swap from HTTP.
9. **Portraits** — commit NPC/player placeholders; Avatar Shop → `Player/current`.
10. **Naming cleanup** — root ids (`*-root`) where binders allow.
11. **Validation** — UXML template validator + Play Mode smoke per screen/task type, plus type-scale/screen-size consistency pass.

---

## Transition to Planning Mode

This foundation is ready for planning mode. The approach is confirmed (central `GameArt/`, `assetId` in JSON, Italian UI, borders/spacing/naming standards), inventory elements are mapped to concrete rework status, and DB/API work is scoped to JSONB + Zod—not SQL columns.

Would you like to proceed to Cursor's planning mode?