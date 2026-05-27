# UI styling (Learning Toolkit)

Navigation + quest shell use **UI Toolkit** only — see [AGENTS.md](../AGENTS.md). Prefer **USS + theme** over hard-coded C# styles.

## Bootstrap wiring

[`LearningToolkitBootstrap`](../Assets/Scripts/Presentation/LearningToolkitBootstrap.cs) attaches:

| Resource | Path | Role |
|----------|------|------|
| Panel settings | `Resources/UI/LearningMenusPanelSettings` | Scale / panel defaults |
| Theme stylesheet | `Resources/UI/LearningToolkit/LearningMenusTheme` | Imports **default unity-theme + app USS** |
| Text settings | `Resources/UI/LearningMenusPanelTextSettings` | Fonts / text defaults |

Layouts load from `Resources/UI/LearningToolkit/{path}` **without extension** (e.g. `Screens/MainMenuScreen`, `Shells/TaskShellScreen`).

## UXML screens

| File | Loaded by |
|------|-----------|
| `Screens/AuthScreen.uxml` | [`AuthView`](../Assets/Scripts/Presentation/AuthView.cs) |
| `Screens/MainMenuScreen.uxml` | [`MainMenuView`](../Assets/Scripts/Presentation/MainMenuView.cs) |
| `Screens/ChapterOverviewScreen.uxml` | [`ChapterOverviewView`](../Assets/Scripts/Presentation/ChapterOverviewView.cs) |
| `Screens/QuestOverviewScreen.uxml` | [`QuestOverviewView`](../Assets/Scripts/Presentation/QuestOverviewView.cs) |
| `Shells/TaskShellScreen.uxml` | [`TaskShellPresenter`](../Assets/Scripts/Presentation/TaskShellPresenter.cs) via [`QuestStepShellHost`](../Assets/Scripts/Presentation/QuestStepShellHost.cs) |
| `Shells/CutShellScreen.uxml` | [`CutsceneShellPresenter`](../Assets/Scripts/Presentation/CutsceneShellPresenter.cs) via [`QuestStepShellHost`](../Assets/Scripts/Presentation/QuestStepShellHost.cs) |
| `Screens/AvatarShopScreen.uxml` | [`AvatarShopView`](../Assets/Scripts/Presentation/AvatarShopView.cs) |
| `Templates/SpecialScreens/SpecialScreenHost.uxml` | Special screen composite step host |
| `Templates/Tasks/{taskType}/*.uxml` | Per-task-type layouts (UI Builder) |
| `Templates/Cutscenes/*.uxml` | Cutscene host + beat presentation layouts |
| `Templates/Overlays/*.uxml` | Shared modals/banners (pause, reward, loading, …) — open each file in UI Builder; Italian/German `lg-preview-sample` copy |
| `Screens/ToolkitPreviewScreen.uxml` | Editor / preview tooling (button theme swatch only) |

## Navigation chrome parts (single source)

Recurring map / shell header chrome lives in **`Templates/Parts/Navigation/`** and is composed into `*Screen.uxml` with **`ui:Template` + `ui:Instance`** (same pattern as task templates — see [`docs/task-type-ui-guide.md`](../docs/task-type-ui-guide.md)):

| Part | Role |
|------|------|
| `Navigation/NavigationWalletHudPart.uxml` | Pizza + backpack badges (`wallet-pizza`, `wallet-backpack`) |
| `Navigation/NavigationPageHeaderWithWalletPart.uxml` | `lg-page-header` + `title-label` + `header-actions-host` + wallet instance + `pause-menu-button` |
| `Navigation/NavigationPageHeaderMinimalPart.uxml` | Header without wallet (e.g. Leaderboard) |

**Styling:** edit the part in UI Builder (USS `lg-*` on part nodes, especially `components-hud.uss`). Screen-specific buttons (Avatar, Refresh, Broschüre) go in **`header-actions-host`** via instance overrides on the screen UXML.

**Runtime:** screens load once via `UIDocument` — no `ClearHost` for chrome. Wallet values: [`WalletHudBinder`](../Assets/Scripts/Presentation/WalletHudBinder.cs) + [`WalletUiTotals`](../Assets/Scripts/Presentation/WalletUiTotals.cs). Pause: [`LearningToolkitPauseChromeBinder`](../Assets/Scripts/Presentation/LearningToolkitPauseChromeBinder.cs) (quest shell uses [`QuestShellSharedRuntime`](../Assets/Scripts/Presentation/QuestShellSharedRuntime.cs)).

Paths: [`ToolkitNavigationTemplatePaths`](../Assets/Scripts/Presentation/ToolkitNavigationTemplatePaths.cs). After moving parts: **Tools → Learning Toolkit → Validate UXML Template References**.

## USS layering (`Assets/Resources/UI/LearningToolkit/`)

| File | Role |
|------|------|
| [`tokens-primitives.uss`](../Assets/Resources/UI/LearningToolkit/tokens-primitives.uss) | Raw design tokens |
| [`tokens-semantics.uss`](../Assets/Resources/UI/LearningToolkit/tokens-semantics.uss) | Semantic token aliases |
| [`theme-learn.uss`](../Assets/Resources/UI/LearningToolkit/theme-learn.uss) | App shell theme rules |
| [`components-typography.uss`](../Assets/Resources/UI/LearningToolkit/components-typography.uss) | Text styles |
| [`components-buttons-fields.uss`](../Assets/Resources/UI/LearningToolkit/components-buttons-fields.uss) | Inputs / buttons |
| [`components-cards-lists.uss`](../Assets/Resources/UI/LearningToolkit/components-cards-lists.uss) | Lists / cards |
| [`components-overlays-empty.uss`](../Assets/Resources/UI/LearningToolkit/components-overlays-empty.uss) | Empty states / overlays |
| [`components-hud.uss`](../Assets/Resources/UI/LearningToolkit/components-hud.uss) | Wallet / HUD chips |
| [`special-screen-messenger.uss`](../Assets/Resources/UI/LearningToolkit/special-screen-messenger.uss) etc. | Special-screen chrome variants |
| [`task-templates.uss`](../Assets/Resources/UI/LearningToolkit/task-templates.uss) | Shared quest step template chrome |

`LearningMenusTheme.tss` should **@import** the USS stack — adjust there when adding new stylesheets.

## Scriptable tokens (`UiDesignTokens`)

[`UiDesignTokens.cs`](../Assets/Scripts/Presentation/UiDesignTokens.cs) / optional default asset **`Resources/UI/UiDesignTokens_Default`** ([AGENTS.md](../AGENTS.md)): spacing, palette, typography **object fields** for **`UiThemeProvider`**. Use when C# or legacy surfaces need shared colours/sizes; **quest/menu Toolkit styling should stay in USS** unless you deliberately bridge tokens in code.

## Practical workflow

1. Change **USS** → verify via affected `*Screen.uxml` in Play Mode.
2. Add **global class** (e.g. `lg-text-body`) in typography/components USS, reuse in UXML / C# `AddToClassList`.
3. Keep Special Screen chrome styles in the dedicated `special-screen-*.uss` files to isolate composite layouts.
4. **Overlays:** edit layout/sample copy in `Templates/Overlays/*.uxml` (fixture text uses `lg-preview-sample`); runtime loads via `Presentation/Overlays/LearningToolkit*.cs` + `ToolkitOverlayTemplatePaths`. Do not rebuild overlay DOM in C#.
