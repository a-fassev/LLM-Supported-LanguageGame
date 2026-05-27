-- Balanced red/blue team assignment for student_accounts (registration + backfill).

alter table public.student_accounts
  add column if not exists team text;

comment on column public.student_accounts.team is
  'Classroom team color: blue or red. Assigned automatically on insert.';

-- Backfill existing rows with alternating teams (stable order by id).
with ordered_accounts as (
  select
    id,
    row_number() over (order by id) as rn
  from public.student_accounts
  where team is null
)
update public.student_accounts sa
set team = case when (oa.rn % 2) = 1 then 'blue' else 'red' end
from ordered_accounts oa
where sa.id = oa.id;

create or replace function public.assign_balanced_student_team()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  blue_count integer;
  red_count integer;
begin
  -- Serialize team picks during concurrent registration bursts.
  perform pg_advisory_xact_lock(4815162342);

  select
    count(*) filter (where team = 'blue'),
    count(*) filter (where team = 'red')
  into blue_count, red_count
  from public.student_accounts
  where team is not null;

  if blue_count < red_count then
    return 'blue';
  end if;

  if red_count < blue_count then
    return 'red';
  end if;

  if random() < 0.5 then
    return 'blue';
  end if;

  return 'red';
end;
$$;

comment on function public.assign_balanced_student_team() is
  'Picks blue or red for a new account: smaller team first; random on tie.';

create or replace function public.student_accounts_set_team_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.team is null or new.team = '' then
    new.team := public.assign_balanced_student_team();
  end if;

  return new;
end;
$$;

drop trigger if exists student_accounts_team_before_insert on public.student_accounts;

create trigger student_accounts_team_before_insert
before insert on public.student_accounts
for each row
execute function public.student_accounts_set_team_on_insert();

alter table public.student_accounts
  drop constraint if exists student_accounts_team_check;

alter table public.student_accounts
  add constraint student_accounts_team_check check (team in ('blue', 'red'));

alter table public.student_accounts
  alter column team set not null;

create index if not exists student_accounts_team_idx on public.student_accounts (team);
