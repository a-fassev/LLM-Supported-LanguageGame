# Game authoring docs

Authoritative game content lives in **Supabase** (`game_chapters`, `game_quests`, `game_quest_steps`). Unity loads it via **`apps/web`** (`/api/game/*`). Optional local JSON under `Assets/Data/` is not the live source of truth unless your pipeline says otherwise.

| Doc | Audience | Contents |
|-----|----------|----------|
| [01-game-configuration.md](01-game-configuration.md) | Everyone | Hierarchy chapter → quest → step; API fields; progress indices; task-type overview |
| [02-steps-and-rewards.md](02-steps-and-rewards.md) | Authors + dev | `content_payload` / `contentJson` per step kind; `reward_rules`; limits |
| [03-styling.md](03-styling.md) | UI dev | UI Toolkit USS theme, UXML screens, tokens |

Code anchors: [`GameProgressContracts.cs`](../Assets/Scripts/Application/GameProgressContracts.cs), [`ToolkitStepContentDtos.cs`](../Assets/Scripts/Presentation/Steps/ToolkitStepContentDtos.cs), [`ToolkitStepFactory.cs`](../Assets/Scripts/Presentation/Steps/ToolkitStepFactory.cs), [`pizzaReward.ts`](../apps/web/lib/game/scoring/pizzaReward.ts), [`evaluateTaskAttempt.ts`](../apps/web/lib/game/scoring/evaluateTaskAttempt.ts).
