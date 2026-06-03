-- ONE-TIME migration: sandbox content moved from chapter-01 to chapter-00.
-- Run once immediately after deploying the chapter-00 catalog change.
-- Do NOT re-run after players have progress in the new learner chapter-01 (same scene id prefix).
-- Fresh dev DBs: skip this file and delete test accounts instead.

UPDATE player_quest_runs
SET
  chapter_id = 'chapter-00',
  current_scene_id = replace(current_scene_id, 'chapter-01-', 'chapter-00-')
WHERE chapter_id = 'chapter-01';

UPDATE player_scene_completions
SET
  chapter_id = 'chapter-00',
  scene_id = replace(scene_id, 'chapter-01-', 'chapter-00-')
WHERE chapter_id = 'chapter-01';

UPDATE player_task_attempts ta
SET scene_id = replace(ta.scene_id, 'chapter-01-', 'chapter-00-')
FROM player_scene_completions sc
INNER JOIN player_quest_runs r ON r.id = sc.run_id
WHERE ta.completion_id = sc.id
  AND r.chapter_id = 'chapter-00'
  AND sc.chapter_id = 'chapter-00'
  AND ta.scene_id LIKE 'chapter-01-%';

UPDATE player_scene_materializations m
SET scene_id = replace(m.scene_id, 'chapter-01-', 'chapter-00-')
FROM player_quest_runs r
WHERE m.run_id = r.id
  AND r.chapter_id = 'chapter-00'
  AND m.scene_id LIKE 'chapter-01-%';

-- Completed-quest keys are derived from completed runs, not stored separately.
