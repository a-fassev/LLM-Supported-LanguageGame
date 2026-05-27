# Navigation Chrome Parts — Single Source (UI Builder)

> **Purpose:** Recurring map / quest-shell header chrome (wallet HUD, pause, page header row) lives in exactly one structural source per component under `Templates/Parts/*.uxml`, composed into screen UXML via **`ui:Template` + `ui:Instance`** — the same authoring pattern as task templates (`task-template-parts-single-source-foundation.md`). Styling is edited in UI Builder on the part (USS `lg-*` classes); changes propagate to every screen that instances the part.

---

## Problem Statement

Today, wallet badges and `lg-page-header` rows are **copied inline** across `ChapterOverviewScreen`, `QuestOverviewScreen`, `TaskShellScreen`, and `AvatarShopScreen` (with **inconsistent element names** on Avatar Shop). Pause uses a stable `pause-menu-button` name but is still duplicated markup. USS for HUD look is already centralized (`components-hud.uss`), but **DOM structure** can drift between screens and UI Builder previews.

Leaderboard already follows the target pattern for **list content** (`LeaderboardPlayerRowPart`, `LeaderboardTeamSummaryPart` + `ui:Instance`); **header chrome** there is still inline.

---

## Pattern to Follow (validated on task templates)

| Rule | Navigation chrome |
|------|-------------------|
| Canonical structure | Only in `Assets/Resources/UI/LearningToolkit/Templates/Parts/*.uxml` |
| Screen / shell composition | `*Screen.uxml` declares `ui:Template` (`src` GUID from part `.meta`, hash = filename e.g. `#NavigationWalletHudPart`) + `ui:Instance` — **no duplicate inline wallet/header trees** |
| Styling | USS classes on part nodes (`lg-hud-strip`, `lg-hud-badge`, `lg-btn`, `lg-page-header`, …). Avoid screen-local inline `style=` on shared chrome; prefer part + USS edits |
| Protected `name` anchors | Stable for C# `Q<>` — do not rename without updating binders |
| UI Builder workflow | Open part → edit layout/classes → save → all instancing screens/shells reflect it in Editor preview |
| GUID hygiene | After moving/renaming parts: **Tools → Learning Toolkit → Validate UXML Template References** (`LearningToolkitUxmlTemplateGuidValidator`) |
| Runtime vs tasks | **No** `ClearHost` / `InstantiatePart` for nav chrome — screens load once via `UIDocument`; instances expand in the visual tree. Only **label text** updates at runtime |

**Difference from quest steps:** Task hosts rebuild dynamic children from JSON (`ClearHost` + `InstantiatePart`). Navigation chrome is **fixed structure**; binders only refresh wallet numbers and wire pause.

---

## Confirmed Decisions

| Question | Decision |
|----------|----------|
| Where do parts live? | `Templates/Parts/` (same folder family as task/leaderboard parts) |
| New part assets | `NavigationWalletHudPart.uxml`, `NavigationPageHeaderWithWalletPart.uxml`, `NavigationPageHeaderMinimalPart.uxml` |
| Wallet element names (all screens) | `hud-strip`, `wallet-pizza`, `wallet-backpack` (retire Avatar `wallet-strip` / `wallet-chip-*`) |
| Pause button | Inside header parts; `name="pause-menu-button"` unchanged (`LearningToolkitChromeUx`) |
| Pause behavior | Keep `LearningToolkitPauseChromeBinder` on map screens; quest shells keep `QuestShellSharedRuntime` + shared pause modal |
| Wallet values | New `WalletHudBinder` reads labels via `WalletUiTotals`; views call `Refresh()` instead of duplicating `RefreshWallet*` |
| Screen-specific header actions | Stay in **screen UXML** inside `header-actions-host` (empty slot in header part) — Avatar, Refresh, Broschüre, etc. |
| MainMenu / Auth / CutShell | Out of scope (no wallet header row or intentionally different shell) |
| API / gameplay | No changes |

---

## Part Specifications

### 1. `NavigationWalletHudPart.uxml`

**Root:** `navigation-wallet-hud-part` (or `hud-strip` as root name — pick one root `name`, document in binder).

**Tree (canonical):**

```
hud-strip.lg-hud-strip
├── wallet-badge-pizza.lg-hud-badge.lg-hud-badge--pizza
│   ├── hud-pizza-icon (glyph P)
│   └── wallet-pizza.lg-hud-badge__value
└── wallet-badge-backpack.lg-hud-badge.lg-hud-badge--backpack
    ├── hud-backpack-icon (glyph B)
    └── wallet-backpack.lg-hud-badge__value
```

**Preview defaults:** `wallet-pizza` / `wallet-backpack` text e.g. `0` or `?` (cosmetic for UI Builder only).

**USS:** No new sheet required; use `components-hud.uss`. Part-level overrides only via `lg-*` classes, not per-screen inline margins.

---

### 2. `NavigationPageHeaderWithWalletPart.uxml`

**Root:** `navigation-page-header-part` with class `lg-page-header`.

**Composition:**

```
lg-page-header
├── title-host (flex-grow)
│   └── title-label.lg-heading-screen
├── header-actions-host   ← empty; screens inject buttons here in screen UXML
├── ui:Instance NavigationWalletHudPart
└── pause-menu-button.lg-btn.lg-btn--ghost
```

**Protected names:** `title-label`, `header-actions-host`, `pause-menu-button`, plus wallet names inside nested wallet instance (queryable from document root).

**Screen usage:** Replace inline `lg-page-header` block with one `ui:Instance` of this part; add screen-only buttons as children targeted at `header-actions-host` (UI Builder instance overrides) **or** place buttons in screen UXML immediately before the header instance inside a wrapper row — prefer **slot children on Instance** when UI Builder supports it for the project version; otherwise document one approved wrapper pattern in implementation PR.

---

### 3. `NavigationPageHeaderMinimalPart.uxml`

Same as §2 **without** wallet instance — for **Leaderboard** (title + `header-actions-host` + pause only). Optional: fold “title only” into screen if Leaderboard title stays a loose `Label`; prefer part for consistent header row height/spacing.

**Leaderboard:** Replace inline header (lines 9–13 today) with Instance of minimal part; keep `refresh-button` in `header-actions-host`.

---

## C# Surface

### `ToolkitNavigationTemplatePaths` (new)

`Assets/Scripts/Presentation/ToolkitNavigationTemplatePaths.cs` — Resources paths (no extension), mirroring `ToolkitOverlayTemplatePaths`:

- `NavigationWalletHudPart`
- `NavigationPageHeaderWithWalletPart`
- `NavigationPageHeaderMinimalPart`

Used for documentation parity and any future runtime instantiate needs; primary load path remains screen `UIDocument` UXML.

### `WalletHudBinder` (new)

`Assets/Scripts/Presentation/WalletHudBinder.cs`:

- `bool Bind(VisualElement root)` — `root.Q<Label>("wallet-pizza")`, `wallet-backpack`; log error if missing
- `void Refresh()` — set text from `WalletUiTotals`
- Optional: `Bind(UIDocument doc)` delegating to `doc.rootVisualElement`

**Consumers (replace local refresh):**

| View / presenter | Wallet bind root |
|------------------|------------------|
| `ChapterOverviewView` | `rootVisualElement` |
| `QuestOverviewView` | `rootVisualElement` |
| `AvatarShopView` | `rootVisualElement` (after name unification) |
| `TaskShellPresenter` | `rootVisualElement` |

Pause wiring unchanged (`LearningToolkitPauseChromeBinder` / quest shell runtime).

---

## Migration Map

| Asset | Action |
|-------|--------|
| `NavigationWalletHudPart.uxml` | **Create** |
| `NavigationPageHeaderWithWalletPart.uxml` | **Create**; `ui:Template` + Instance wallet part |
| `NavigationPageHeaderMinimalPart.uxml` | **Create** |
| `ChapterOverviewScreen.uxml` | Instance header part; `avatar-shop-button` in `header-actions-host`; remove inline wallet/header duplicate |
| `QuestOverviewScreen.uxml` | Instance header part |
| `TaskShellScreen.uxml` | Instance header part; `reference-document-button` in `header-actions-host` |
| `AvatarShopScreen.uxml` | Instance header part; align wallet names |
| `LeaderboardScreen.uxml` | Instance minimal header part |
| `ChapterOverviewView.cs` | `WalletHudBinder` |
| `QuestOverviewView.cs` | `WalletHudBinder` |
| `AvatarShopView.cs` | `WalletHudBinder`; remove `wallet-chip-*` queries |
| `TaskShellPresenter.cs` | `WalletHudBinder` for wallet labels |
| `ToolkitNavigationTemplatePaths.cs` | **Create** |
| `WalletHudBinder.cs` | **Create** |
| `docs/task-type-ui-guide.md` or `DOC/03-styling.md` | Short cross-link: navigation chrome parts (optional, only if implementing doc touch) |
| `AGENTS.md` | One bullet under UI conventions (optional, same PR as implementation) |

**Not migrated:** `MainMenuScreen`, `AuthScreen`, `CutShellScreen` (cut keeps top `pause-menu-button` only in cut-specific header).

---

## Implementation Phases

### Phase A — Wallet part + binder (smallest vertical slice)

1. Add `NavigationWalletHudPart.uxml` + `.meta`.
2. Add `ToolkitNavigationTemplatePaths` + `WalletHudBinder`.
3. Migrate **one** screen (e.g. `QuestOverviewScreen`) to `ui:Template`/`ui:Instance` wallet only **or** full header — prefer wallet inside header part if Phase B immediately follows.
4. Wire `QuestOverviewView` to `WalletHudBinder`; smoke test Play Mode wallet updates after quest complete.
5. Run GUID validator.

### Phase B — Header parts + remaining screens

1. Add `NavigationPageHeaderWithWalletPart.uxml` (instances wallet part).
2. Add `NavigationPageHeaderMinimalPart.uxml`.
3. Migrate `ChapterOverviewScreen`, `TaskShellScreen`, `AvatarShopScreen`, `LeaderboardScreen`.
4. Migrate remaining views/presenters to `WalletHudBinder`.
5. Remove all duplicate inline HUD/header markup; run GUID validator.

### Phase C — Authoring hygiene

1. Strip redundant inline `style=` on migrated chrome (move spacing to USS if needed — e.g. shared `.lg-page-header__actions` margin).
2. UI Builder pass: open each affected screen + part; confirm preview matches intent.
3. Play Mode pass: Chapter → Quest → Task shell wallet; Avatar shop; Leaderboard pause → main menu.

---

## UI Builder Authoring Checklist (per part)

- [ ] Part opens standalone in UI Builder; layout readable at phone aspect.
- [ ] Only `lg-*` classes for look; tokens via existing USS imports in theme.
- [ ] Protected `name` attributes match binder table above.
- [ ] Parent screen declares `ui:Template` with correct GUID/hash.
- [ ] `ui:Instance` present where screen should show chrome in preview.
- [ ] **Tools → Learning Toolkit → Validate UXML Template References** passes.

---

## Out of Scope

- `MapListRowPart` for chapter/quest rows (separate initiative).
- Runtime `ToolkitStepUx.InstantiatePart` for navigation (not needed).
- Editor automation to push screen-level style overrides into parts.
- MainMenu wallet HUD, Auth/Cut shell redesign.
- Next.js / Supabase changes.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `Q<Label>("wallet-pizza")` fails when querying through nested instances | Query from `rootVisualElement` (Unity searches descendants); verify per screen after migration |
| `header-actions-host` slot pattern unclear in UI Builder | Spike on one screen (Chapter + avatar button); document chosen pattern in PR description |
| Header part change affects quest shell layout | Test `TaskShellScreen` with/without visible `reference-document-button` |
| Shared part edit breaks unintended screens | PR review notes “shared navigation chrome”; smoke all four wallet consumers |

---

## Success Criteria

- [ ] Wallet DOM exists only in `NavigationWalletHudPart.uxml`.
- [ ] Page header row with wallet exists only in `NavigationPageHeaderWithWalletPart.uxml` (plus minimal variant for Leaderboard).
- [ ] UI Builder: editing wallet or header part updates preview on Chapter, Quest, Task shell, Avatar, Leaderboard (minimal).
- [ ] All wallet screens use `WalletHudBinder`; no `wallet-chip-*` names remain.
- [ ] Pause button still binds via existing chrome binders; `pause-menu-button` unchanged.
- [ ] GUID validator clean; Play Mode wallet + pause unchanged for learners.

---

## Reference (existing)

- Foundation: `.cursor/plans/task-template-parts-single-source-foundation.md`
- Authoring: `docs/task-type-ui-guide.md` (§ UI Builder templates — `ui:Template` / `ui:Instance`)
- Example task template: `Templates/Tasks/MultipleChoice/MultipleChoiceTaskTemplate.uxml`
- Example screen using parts: `LeaderboardScreen.uxml` (list/team rows — header still to migrate)
- HUD USS: `components-hud.uss`
- Pause copy/names: `LearningToolkitChromeUx.cs`, `LearningToolkitPauseChromeBinder.cs`
