-- Greenfield Chapter -> Quest -> Steps schema.
-- Legacy compatibility is intentionally removed.
--
-- PRODUCTION / existing data WARNING:
-- Running this migration on a populated database DROPS game tables/functions and wipes player progress rows
-- touched by CASCADE. Prefer `supabase db reset` locally; for hosted projects use explicit backup + migration
-- strategy — never blindly apply against real student data without a recovery plan.

-- Clean out legacy game schema.
drop function if exists public.complete_game_task(uuid, uuid, uuid, int);
drop function if exists public.complete_quest_step_task(uuid, uuid, uuid, int);
drop function if exists public.complete_quest_step_task(uuid, uuid, uuid);

drop table if exists public.player_step_attempts cascade;
drop table if exists public.player_quest_runs cascade;
drop table if exists public.game_quest_steps cascade;
drop table if exists public.game_quests cascade;
drop table if exists public.game_chapters cascade;

drop table if exists public.player_task_attempts cascade;
drop table if exists public.player_level_runs cascade;
drop table if exists public.game_level_steps cascade;
drop table if exists public.game_tasks cascade;
drop table if exists public.game_levels cascade;

create table if not exists public.game_chapters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  order_index int not null unique,
  theme_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_chapters_order_nonneg check (order_index >= 0)
);

create table if not exists public.game_quests (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.game_chapters(id) on delete cascade,
  slug text not null,
  display_name text not null,
  order_index int not null,
  unlock_rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug),
  unique (chapter_id, order_index),
  constraint game_quests_order_nonneg check (order_index >= 0)
);

create table if not exists public.game_quest_steps (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.game_quests(id) on delete cascade,
  order_index int not null,
  step_kind text not null,
  task_type text,
  template_key text not null default '',
  logical_task_key text,
  content_payload jsonb not null default '{}'::jsonb,
  reward_rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quest_id, order_index),
  constraint game_quest_steps_order_nonneg check (order_index >= 0),
  constraint game_quest_steps_kind_chk check (step_kind in ('cutscene', 'task')),
  constraint game_quest_steps_task_shape_chk check (
    (step_kind = 'task' and task_type is not null and length(task_type) > 0) or
    (step_kind = 'cutscene' and task_type is null)
  )
);

create index if not exists game_quests_active_idx
  on public.game_quests (chapter_id, is_active, order_index);

create index if not exists game_quest_steps_active_idx
  on public.game_quest_steps (quest_id, is_active, order_index);

create table if not exists public.player_wallets (
  account_id uuid not null references public.student_accounts(id) on delete cascade,
  total_slices int not null default 0,
  total_backpack_pieces int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (account_id),
  constraint player_wallets_total_slices_nonneg check (total_slices >= 0),
  constraint player_wallets_total_backpack_nonneg check (total_backpack_pieces >= 0)
);

create table if not exists public.player_quest_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.student_accounts(id) on delete cascade,
  chapter_id uuid not null references public.game_chapters(id) on delete cascade,
  quest_id uuid not null references public.game_quests(id) on delete cascade,
  status text not null check (status in ('in_progress', 'completed', 'abandoned')),
  current_step_order_index int not null default 0,
  current_task_order_index int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint player_quest_runs_step_nonneg check (current_step_order_index >= 0),
  constraint player_quest_runs_task_nonneg check (current_task_order_index >= 0)
);

create unique index if not exists player_quest_runs_one_active_per_account_idx
  on public.player_quest_runs (account_id)
  where status = 'in_progress';

create index if not exists player_quest_runs_account_status_idx
  on public.player_quest_runs (account_id, status, started_at desc);

create table if not exists public.player_step_attempts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.student_accounts(id) on delete cascade,
  run_id uuid not null references public.player_quest_runs(id) on delete cascade,
  step_id uuid not null references public.game_quest_steps(id) on delete restrict,
  logical_task_key text,
  awarded_slices int not null default 0,
  awarded_backpack_pieces int not null default 0,
  completed_at timestamptz not null default now(),
  constraint player_step_attempts_award_slices_chk check (awarded_slices >= 0 and awarded_slices <= 5),
  constraint player_step_attempts_award_backpack_chk check (awarded_backpack_pieces >= 0 and awarded_backpack_pieces <= 1)
);

create unique index if not exists player_step_attempts_backpack_once_idx
  on public.player_step_attempts (account_id, logical_task_key)
  where logical_task_key is not null and awarded_backpack_pieces > 0;

create index if not exists player_step_attempts_run_idx
  on public.player_step_attempts (run_id, completed_at desc);

-- Task completion RPC (pizza + backpack from reward_rules) is defined in migration
-- 20260518141500_complete_quest_step_task_slices_from_reward_rules.sql (next file in order).

alter table public.game_chapters enable row level security;
alter table public.game_quests enable row level security;
alter table public.game_quest_steps enable row level security;
alter table public.player_wallets enable row level security;
alter table public.player_quest_runs enable row level security;
alter table public.player_step_attempts enable row level security;

-- RLS is enabled without policies for anon/authenticated: Supabase Row Level Security denies those roles
-- unless policies are added. The Next.js API uses the service role, which bypasses RLS — do not expose
-- raw table access via the Supabase Data API without explicit policies.

-- Seed chapter and quest metadata.
insert into public.game_chapters (slug, display_name, order_index, theme_payload, is_active)
values
  ('chapter-01', 'Chapter 1: Citta', 0, '{"background":"chapter1-bg","music":"chapter1-theme","paletteKey":"chapter1"}'::jsonb, true),
  ('chapter-02', 'Chapter 2: Scuola', 1, '{"background":"chapter2-bg","music":"chapter2-theme","paletteKey":"chapter2"}'::jsonb, true)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  order_index = excluded.order_index,
  theme_payload = excluded.theme_payload,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.game_quests (chapter_id, slug, display_name, order_index, unlock_rules, is_active)
select c.id, q.slug, q.display_name, q.order_index, q.unlock_rules::jsonb, true
from public.game_chapters c
join (
  values
    ('chapter-01', 'quest-01', 'Quest 1: Arrivo', 0, '{"requiredTotalSlices":0,"prerequisiteQuestSlugs":[],"prerequisiteLogicalTaskKeys":[]}' ),
    ('chapter-01', 'quest-02', 'Quest 2: Mercato', 1, '{"requiredTotalSlices":4,"prerequisiteQuestSlugs":["quest-01"],"prerequisiteLogicalTaskKeys":[]}' ),
    ('chapter-02', 'quest-03', 'Quest 3: Classe', 0, '{"requiredTotalSlices":8,"prerequisiteQuestSlugs":["quest-02"],"prerequisiteLogicalTaskKeys":[]}' ),
    ('chapter-02', 'quest-04', 'Quest 4: Esame', 1, '{"requiredTotalSlices":12,"prerequisiteQuestSlugs":["quest-03"],"prerequisiteLogicalTaskKeys":[]}' )
) as q(chapter_slug, slug, display_name, order_index, unlock_rules)
  on c.slug = q.chapter_slug
on conflict (chapter_id, slug) do update
set
  display_name = excluded.display_name,
  order_index = excluded.order_index,
  unlock_rules = excluded.unlock_rules,
  is_active = excluded.is_active,
  updated_at = now();

with quest_refs as (
  select q.id, q.slug
  from public.game_quests q
),
seed_steps as (
  select
    qr.id as quest_id,
    s.order_index,
    s.step_kind,
    s.task_type,
    s.template_key,
    s.logical_task_key,
    s.content_payload::jsonb,
    s.reward_rules::jsonb
  from quest_refs qr
  join (
    values
      ('quest-01', 0, 'cutscene', null::text, 'cutscene.intro', null::text, '{"title":"Benvenuto","body":"Iniziamo la tua avventura."}', '{}'),
      ('quest-01', 1, 'task', 'ErrorSpotting', 'task.error-spotting', 'quest-01-task-01', '{"prompt":"Trova gli errori."}', '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-01', 2, 'task', 'ClozeText', 'task.cloze-text', 'quest-01-task-02', '{"prompt":"Completa il testo."}', '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-01', 3, 'cutscene', null::text, 'cutscene.outro', null::text, '{"title":"Ottimo","body":"Hai finito la prima quest."}', '{}'),

      ('quest-02', 0, 'cutscene', null::text, 'cutscene.intro', null::text, '{"title":"Mercato","body":"Andiamo al mercato."}', '{}'),
      ('quest-02', 1, 'task', 'DragDrop', 'task.drag-drop', 'quest-02-task-01', '{"prompt":"Ordina gli elementi."}', '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-02', 2, 'task', 'Matching', 'task.matching', 'quest-02-task-02', '{"prompt":"Abbina le coppie."}', '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-02', 3, 'task', 'MultipleChoice', 'task.multiple-choice', 'quest-02-task-03', '{"prompt":"Scegli la risposta corretta."}', '{"pizza":{"mode":"flat","value":3},"backpack":{"mode":"first_completion","value":1}}'),

      ('quest-03', 0, 'cutscene', null::text, 'cutscene.intro', null::text, '{"title":"Scuola","body":"Entriamo in classe."}', '{}'),
      ('quest-03', 1, 'task', 'FreeText', 'task.free-text', 'quest-03-task-01', '{"prompt":"Scrivi una frase."}', '{"pizza":{"mode":"flat","value":3},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-03', 2, 'task', 'RelativeClause', 'task.relative-clause', 'quest-03-task-02', '{"prompt":"Completa la frase relativa."}', '{"pizza":{"mode":"flat","value":3},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-03', 3, 'cutscene', null::text, 'cutscene.bridge', null::text, '{"title":"Continua","body":"Quasi alla fine."}', '{}'),
      ('quest-03', 4, 'task', 'ErrorSpotting', 'task.error-spotting', 'quest-03-task-03', '{"prompt":"Correggi il testo."}', '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'),

      ('quest-04', 0, 'cutscene', null::text, 'cutscene.intro', null::text, '{"title":"Esame","body":"Ultima prova."}', '{}'),
      ('quest-04', 1, 'task', 'ClozeText', 'task.cloze-text', 'quest-04-task-01', '{"prompt":"Riempi gli spazi."}', '{"pizza":{"mode":"flat","value":4},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-04', 2, 'task', 'MultipleChoice', 'task.multiple-choice', 'quest-04-task-02', '{"prompt":"Scegli bene."}', '{"pizza":{"mode":"flat","value":4},"backpack":{"mode":"first_completion","value":1}}'),
      ('quest-04', 3, 'cutscene', null::text, 'cutscene.outro', null::text, '{"title":"Complimenti","body":"Hai completato il chapter!"}', '{}')
  ) as s(quest_slug, order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules)
    on s.quest_slug = qr.slug
)
insert into public.game_quest_steps (
  quest_id,
  order_index,
  step_kind,
  task_type,
  template_key,
  logical_task_key,
  content_payload,
  reward_rules,
  is_active
)
select
  ss.quest_id,
  ss.order_index,
  ss.step_kind,
  ss.task_type,
  ss.template_key,
  ss.logical_task_key,
  ss.content_payload,
  ss.reward_rules,
  true
from seed_steps ss
on conflict (quest_id, order_index) do update
set
  step_kind = excluded.step_kind,
  task_type = excluded.task_type,
  template_key = excluded.template_key,
  logical_task_key = excluded.logical_task_key,
  content_payload = excluded.content_payload,
  reward_rules = excluded.reward_rules,
  is_active = excluded.is_active,
  updated_at = now();
