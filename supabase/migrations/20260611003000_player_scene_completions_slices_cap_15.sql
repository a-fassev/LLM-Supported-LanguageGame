-- Align player_scene_completions.awarded_slices with scored pizza tiers (5/10/15).
-- Greenfield schema capped at 5; content retier (bb5716e) allows up to 15 per scene.

ALTER TABLE public.player_scene_completions
  DROP CONSTRAINT IF EXISTS player_scene_completions_awarded_slices_check;

ALTER TABLE public.player_scene_completions
  ADD CONSTRAINT player_scene_completions_awarded_slices_check
  CHECK (awarded_slices >= 0 AND awarded_slices <= 15);
