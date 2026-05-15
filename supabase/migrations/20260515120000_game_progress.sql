-- Game progress, tasks, runs, and pizza wallet (Supabase Postgres).
-- FK to existing student_accounts assumed UUID pk.

create table if not exists public.game_levels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  order_index int not null unique,
  required_total_slices int not null default 0,
  is_active boolean not null default true,
  constraint game_levels_required_slices_nonneg check (required_total_slices >= 0)
);

create table if not exists public.game_tasks (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.game_levels (id) on delete cascade,
  order_index int not null,
  task_type text not null,
  prompt_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  unique (level_id, order_index)
);

create table if not exists public.player_wallets (
  account_id uuid not null references public.student_accounts (id) on delete cascade,
  total_slices int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (account_id),
  constraint player_wallets_slices_nonneg check (total_slices >= 0)
);

create table if not exists public.player_level_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.student_accounts (id) on delete cascade,
  level_id uuid not null references public.game_levels (id) on delete cascade,
  status text not null,
  current_task_order_index int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint player_level_runs_status_chk check (
    status in ('in_progress', 'completed', 'abandoned')
  ),
  constraint player_level_runs_task_index_nonneg check (current_task_order_index >= 0)
);

create index if not exists player_level_runs_account_level_status_idx
  on public.player_level_runs (account_id, level_id, status);

create index if not exists player_level_runs_account_in_progress_idx
  on public.player_level_runs (account_id)
  where status = 'in_progress';

create table if not exists public.player_task_attempts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.player_level_runs (id) on delete cascade,
  task_id uuid not null references public.game_tasks (id) on delete restrict,
  awarded_slices int not null,
  completed_at timestamptz not null default now(),
  constraint player_task_attempts_slices_chk check (
    awarded_slices >= 0 and awarded_slices <= 5
  )
);

-- Seed levels (slugs match Unity CityMapView defaults)
insert into public.game_levels (slug, display_name, order_index, required_total_slices)
values
  ('level-test-1', 'Test Level A (all task types)', 0, 0),
  ('level-test-2', 'Test Level B', 1, 5),
  ('level-test-3', 'Test Level C', 2, 10)
on conflict (slug) do nothing;

-- Level 1 tasks (8)
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 0, 'ErrorSpotting', '{"placeholderLabel":"Placeholder — ErrorSpotting"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 0
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 1, 'DragDrop', '{"placeholderLabel":"Placeholder — DragDrop"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 1
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 2, 'ClozeText', '{"placeholderLabel":"Placeholder — ClozeText"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 2
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 3, 'Matching', '{"placeholderLabel":"Placeholder — Matching"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 3
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 4, 'MultipleChoice', '{"placeholderLabel":"Placeholder — MultipleChoice"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 4
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 5, 'FreeText', '{"placeholderLabel":"Placeholder — FreeText"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 5
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 6, 'RelativeClause', '{"placeholderLabel":"Placeholder — RelativeClause"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 6
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 7, 'ErrorSpotting', '{"placeholderLabel":"Placeholder — ErrorSpotting (repeat)"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-1'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 7
  );

-- Level 2 tasks (4)
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 0, 'ClozeText', '{"placeholderLabel":"Placeholder — ClozeText"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-2'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 0
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 1, 'FreeText', '{"placeholderLabel":"Placeholder — FreeText"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-2'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 1
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 2, 'DragDrop', '{"placeholderLabel":"Placeholder — DragDrop"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-2'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 2
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 3, 'MultipleChoice', '{"placeholderLabel":"Placeholder — MultipleChoice"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-2'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 3
  );

-- Level 3 tasks (5)
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 0, 'RelativeClause', '{"placeholderLabel":"Placeholder — RelativeClause"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-3'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 0
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 1, 'Matching', '{"placeholderLabel":"Placeholder — Matching"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-3'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 1
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 2, 'ErrorSpotting', '{"placeholderLabel":"Placeholder — ErrorSpotting"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-3'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 2
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 3, 'ClozeText', '{"placeholderLabel":"Placeholder — ClozeText"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-3'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 3
  );
insert into public.game_tasks (level_id, order_index, task_type, prompt_payload)
select gl.id, 4, 'DragDrop', '{"placeholderLabel":"Placeholder — DragDrop"}'::jsonb
from public.game_levels gl
where gl.slug = 'level-test-3'
  and not exists (
    select 1 from public.game_tasks t where t.level_id = gl.id and t.order_index = 4
  );
