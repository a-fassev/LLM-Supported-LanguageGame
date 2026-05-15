-- One completion row per (run, task). Apply only if no duplicate pairs exist; dedupe first if needed.

alter table public.player_task_attempts
  add constraint player_task_attempts_run_id_task_id_key unique (run_id, task_id);
