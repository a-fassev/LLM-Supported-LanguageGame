# Documentation index

Authoritative **game content** lives in **Supabase** (`game_chapters`, `game_quests`, `game_quest_steps`). Unity loads it via **`apps/web`** (`/api/game/*`). Repo-wide agent conventions: [`AGENTS.md`](../AGENTS.md).

## Authoring (game config, JSON, rewards)

| Doc | Audience | Contents |
|-----|----------|----------|
| [01-game-configuration.md](authoring/01-game-configuration.md) | Everyone | Hierarchy chapter → quest → step; API fields; progress indices; task-type overview |
| [02-steps-and-rewards.md](authoring/02-steps-and-rewards.md) | Authors + dev | `content_payload` / `contentJson` per step kind; `reward_rules`; limits |
| [03-styling.md](authoring/03-styling.md) | UI dev | UI Toolkit USS theme, UXML screens, tokens |

Code anchors: [`GameProgressContracts.cs`](../Assets/Scripts/Application/GameProgressContracts.cs), [`ToolkitStepContentDtos.cs`](../Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs), [`ToolkitStepFactory.cs`](../Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs), [`pizzaReward.ts`](../apps/web/lib/game/scoring/pizzaReward.ts), [`evaluateTaskAttempt.ts`](../apps/web/lib/game/scoring/evaluateTaskAttempt.ts).

## Narrative (story source markdown)

Story drafts before seeding into `supabase/migrations/`:

| File | Status |
|------|--------|
| [chapter-1.md](narrative/chapter-1.md) | Seeded (Chapter 1) |
| [chapter-2.md](narrative/chapter-2.md) | Seeded (Chapter 2) |
| [chapter-3.md](narrative/chapter-3.md) | Seeded (Chapter 3) |
| [chapter-4.md](narrative/chapter-4.md) | Placeholder (author later) |
| [chapter-5.md](narrative/chapter-5.md) | Placeholder (author later) |
| [chapter-6.md](narrative/chapter-6.md) | Placeholder (author later) |

Seeding workflow: [`.cursor/skills/supabase-chapter-content-seeding/SKILL.md`](../.cursor/skills/supabase-chapter-content-seeding/SKILL.md).

### QA solutions (fast playthrough without Italian)

| Doc | Contents |
|-----|----------|
| [solutions/README.md](narrative/solutions/README.md) | Index + how to use |
| [chapter-01-solutions.md](narrative/solutions/chapter-01-solutions.md) … [chapter-06-solutions.md](narrative/solutions/chapter-06-solutions.md) | Per-quest answer keys from migration JSON |

## Unity (UI Toolkit inventory)

| Doc | Contents |
|-----|----------|
| [ui-learning-toolkit-inventory.md](unity/ui-learning-toolkit-inventory.md) | Screens, shells, templates, parts, task types (maintainer inventory) |

New task-type UI: [`.cursor/skills/unity-task-type-ui/SKILL.md`](../.cursor/skills/unity-task-type-ui/SKILL.md). Special Screen composite steps: [`.cursor/skills/unity-special-screen-ui/SKILL.md`](../.cursor/skills/unity-special-screen-ui/SKILL.md).
