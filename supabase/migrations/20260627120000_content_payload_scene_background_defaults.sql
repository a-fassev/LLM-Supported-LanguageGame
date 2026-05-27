-- Idempotent: default sceneBackgroundAsset for active task/cutscene steps missing the field.
UPDATE public.game_quest_steps AS s
SET content_payload = jsonb_set(
  COALESCE(s.content_payload, '{}'::jsonb),
  '{sceneBackgroundAsset}',
  to_jsonb(
    CASE
      WHEN s.step_kind = 'cutscene' THEN 'static/cutscene-backgrounds/ph-st-cutscene-bg-default'
      ELSE 'static/task-scene-backgrounds/ph-st-task-bg-default'
    END
  ),
  true
)
WHERE s.step_kind IN ('task', 'cutscene')
  AND s.is_active IS TRUE
  AND (
    s.content_payload IS NULL
    OR NOT (s.content_payload ? 'sceneBackgroundAsset')
    OR COALESCE(s.content_payload->>'sceneBackgroundAsset', '') = ''
  );
