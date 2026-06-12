# Chapter sandbox migration (chapter-01 → chapter-00)

The full task-type **sandbox** moved from `chapter-01` to **`chapter-00`** (`reference: true`). Learner-facing **`chapter-01`** is a new minimal placeholder for future narrative content.

## Local development

Fastest path: delete test accounts or clear `player_quest_runs` / related rows for your account.

## Existing Supabase data

Apply [`supabase/migrations/20260603180000_migrate_sandbox_chapter_01_to_00.sql`](../supabase/migrations/20260603180000_migrate_sandbox_chapter_01_to_00.sql) **once**, right after deploying the catalog change. **Do not re-run** after players have started the new learner `chapter-01` (scene ids share the `chapter-01-` prefix).

**In-progress** runs on old scene ids cannot be resumed; restart the quest in `chapter-00`.

## Tutorial rewrite (sandbox → learner tutorial)

Apply [`supabase/migrations/20260612140000_abandon_stale_chapter_00_runs.sql`](../supabase/migrations/20260612140000_abandon_stale_chapter_00_runs.sql) **once** when deploying the new `chapter-00` tutorial catalog. It marks all `in_progress` `chapter-00` runs as `abandoned` so test accounts are not stuck on deleted scene ids.

Qualified quest completion ids (`chapterId:questId`) are derived from completed runs; expect sandbox completion to reset unless players replay `chapter-00`.

## Removing chapter-00 later (team sandbox no longer needed)

When the real curriculum ships and you delete `lib/content/chapters/chapter-00/`:

1. **Renumber `order`** on remaining chapters so they stay contiguous from **0** (e.g. `chapter-01` → `order: 0`, `chapter-02` → `order: 1`, …). The catalog loader fails if order `0` is missing.
2. **Update tests:** `lib/game/content/chapter-00-smoke-content.test.ts` (delete or move fixtures), `catalog-chapters.test.ts` (expect six ids, not seven).
3. **Update docs:** `AGENTS.md`, `docs/quest-scene-content-format.md`, `.cursor/skills/web-task-type-ui/SKILL.md` — point task fixtures at production chapters.
4. **Optional DB cleanup:** delete or ignore rows with `chapter_id = 'chapter-00'` / scene ids `chapter-00-*`.
5. **Code (optional):** `reference` in `chapter.json` and `lib/game/chapter-progression.ts` can stay; they are harmless when no chapter sets `reference: true`.

No change to unlock or run APIs is required beyond content and `order`.
