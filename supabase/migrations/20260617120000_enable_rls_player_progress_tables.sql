-- Block PostgREST access for anon/authenticated; server uses service_role (bypasses RLS).
ALTER TABLE public.player_quest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_scene_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_task_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_scene_materializations ENABLE ROW LEVEL SECURITY;

-- Harden trigger function search_path (advisor: function_search_path_mutable).
ALTER FUNCTION public.assign_balanced_student_team() SET search_path = public;

-- Trigger-only helper must not be callable via PostgREST RPC (advisor: anon/authenticated SECURITY DEFINER).
REVOKE ALL ON FUNCTION public.student_accounts_set_team_on_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.student_accounts_set_team_on_insert() FROM anon;
REVOKE ALL ON FUNCTION public.student_accounts_set_team_on_insert() FROM authenticated;
