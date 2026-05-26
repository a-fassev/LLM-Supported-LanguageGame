# UI styling (Learning Toolkit)

Navigation + quest shell use **UI Toolkit** only — see [AGENTS.md](../AGENTS.md). Prefer **USS + theme** over hard-coded C# styles.

## Bootstrap wiring

[`LearningToolkitBootstrap`](../Assets/Scripts/Presentation/LearningToolkitBootstrap.cs) attaches:

| Resource | Path | Role |
|----------|------|------|
| Panel settings | `Resources/UI/LearningMenusPanelSettings` | Scale / panel defaults |
| Theme stylesheet | `Resources/UI/LearningToolkit/LearningMenusTheme` | Imports **default unity-theme + app USS** |
| Text settings | `Resources/UI/LearningMenusPanelTextSettings` | Fonts / text defaults |

Layouts load from `Resources/UI/LearningToolkit/{ScreenName}` **without extension**.

## UXML screens

| File | Loaded by |
|------|-----------|
| `AuthScreen.uxml` | [`AuthView`](../Assets/Scripts/Presentation/AuthView.cs) |
| `MainMenuScreen.uxml` | [`MainMenuView`](../Assets/Scripts/Presentation/MainMenuView.cs) |
| `ChapterOverviewScreen.uxml` | [`ChapterOverviewView`](../Assets/Scripts/Presentation/ChapterOverviewView.cs) |
| `QuestOverviewScreen.uxml` | [`QuestOverviewView`](../Assets/Scripts/Presentation/QuestOverviewView.cs) |
| `QuestShellScreen.uxml` | [`QuestShellView`](../Assets/Scripts/Presentation/QuestShellView.cs) |
| `AvatarShopScreen.uxml` | [`AvatarShopView`](../Assets/Scripts/Presentation/AvatarShopView.cs) |
| `SpecialScreenHost.uxml` | Special screen composite step host |
| `Templates/Tasks/*.uxml` | Per-task-type layouts (UI Builder) |
| `Templates/Cutscenes/*.uxml` | Cutscene host + beat presentation layouts |
| `ToolkitPreviewScreen.uxml` | Editor / preview tooling |

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
