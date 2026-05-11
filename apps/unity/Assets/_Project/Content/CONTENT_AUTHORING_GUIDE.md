# Content Authoring Guide (WP4 Handover)

This guide is for creating new level JSON files without code changes.

## Source of Truth

- Level schema: `Assets/_Project/Content/Schemas/level-content.schema.json`
- Contract notes: `.cursor/plans/config-contract.md`
- Full example level: `Assets/_Project/Content/Levels/examples/level-a2-school-sequence.example.json`
- Task templates: `Assets/_Project/Content/TaskTemplates/*.example.json`

## Versioning and Breaking Changes

- Field `version` is an **integer**. For the current game build only **`version: 1`** is accepted at runtime.
- `ContentValidator.SupportedLevelContentVersions` in code defines which versions load; newer formats must bump this list and usually add a migration path before authors ship `version: 2` files.
- The JSON Schema may allow broader patterns than the runtime; **parity**: treat validator errors as authoritative for shipping content. Validate locally with the schema (IDE / CLI) and always dry-run in Unity once per level.

## Where New Level Files Go

- Put new level JSON files into `Assets/_Project/Content/Levels/`.
- Keep filenames stable and descriptive, e.g. `level-a2-family-sequence.json`.

## Required Top-Level Fields

Every level file must contain:

- `levelId`
- `version` (use `1` in V1)
- `displayName`
- `difficulty` (`easy | medium | hard`)
- `taskOrder` (task IDs in play order)
- `levelCompletionRule` (`all_required` or `min_score`)
- `tasks` (array of task objects)

## Task Authoring Rules

- Each `taskId` must be unique in the file.
- `taskOrder` may only reference task IDs that exist in `tasks`.
- Each task must include base fields:
  - `taskId`
  - `taskType`
  - `prompt`
  - `scoring`
- Add the task-type-specific required fields from the schema/templates:
  - `multiple_choice`: `question`, `choices[]`, `correctChoiceId`
  - `matching`: `leftItems[]`, `rightItems[]`, `correctPairs[]`
  - `cloze_text`: `templateText`, `gaps[]`
  - `error_hunt`: `textWithError`, `acceptedCorrections[]`
  - `drag_drop`: `tokens[]`, `correctOrder[]`
  - `llm_free_text`: `evaluationCriteria[]`, `targetStructures[]`
  - `llm_word_guess`: `targetWord`, `maxGuessAttempts`

## Scoring and Completion

- Set per-task scoring in `scoring`:
  - `policy`: `strict_binary | partial_points | threshold_pass`
  - `maxPoints`: integer >= 1
  - `passThreshold`: 0..1
- Set level completion:
  - `{ "mode": "all_required" }` or
  - `{ "mode": "min_score", "minScorePercent": <0..100> }`

## How Unity Discovers and Loads Levels

1. Level entries come from `LevelCatalog` (`Resources/LevelCatalog`) if present.
2. If no catalog is found, Unity uses fallback descriptors in `LevelCatalogProvider`.
3. Each descriptor points to `contentRelativePath`.
4. `LevelContentLoader` reads JSON from disk and parses it.
5. `ContentValidator` enforces required fields and task correctness.
6. Invalid content is rejected with a content error; the player remains recoverable via hub navigation.

Relevant runtime files:

- `Assets/_Project/Runtime/Game/Levels/LevelCatalogProvider.cs`
- `Assets/_Project/Runtime/Game/Content/LevelContentLoader.cs`
- `Assets/_Project/Runtime/Game/Content/ContentValidator.cs`

## Persistence providers (progress & profile)

Level JSON does **not** configure persistence. Runtime progress and `PlayerProfile` are stored via repositories (`IProgressRepository`, `IPlayerProfileRepository`). V1 uses local JSON through `PersistenceRepositoryFactory`; `ITBL_PERSISTENCE_PROVIDER` selects the provider (`local` default). `supabase` is reserved: it currently falls back to local with a warning until Supabase-backed repositories exist. Optional default-when-env-unset: `GameRuntimeConfig.persistenceProviderWhenEnvUnset` (see `AGENTS.md`).

## Authoring Checklist Before Handover

- JSON validates against `level-content.schema.json`.
- No duplicate `taskId`.
- `taskOrder` matches existing tasks and desired order.
- Scoring/threshold values are in valid ranges.
- At least one dry run is done in Unity with expected sequence behavior.
- LLM task entries include all required LLM fields.

## Common Validation Errors

- `taskOrder references unknown taskId`: task ID typo or missing task object.
- `unknown taskType`: unsupported `taskType` string.
- `missing scoring config` / invalid threshold: scoring object is missing or out of range.
- Task-specific field missing (e.g. `correctChoiceId`, `targetWord`, `gaps`).
