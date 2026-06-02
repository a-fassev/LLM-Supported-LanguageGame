-- Auth + wallet foundation for fresh environments.
-- Keeps game catalog out of Postgres; only account/session/progress persistence lives here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.student_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  team text NOT NULL CHECK (team IN ('blue', 'red')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

ALTER TABLE IF EXISTS public.student_accounts
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS team text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

UPDATE public.student_accounts
SET
  created_at = COALESCE(created_at, now()),
  team = CASE
    WHEN team IN ('blue', 'red') THEN team
    ELSE CASE WHEN random() < 0.5 THEN 'blue' ELSE 'red' END
  END,
  username = CASE
    WHEN username IS NULL OR btrim(username) = '' THEN 'student-' || substr(id::text, 1, 8)
    ELSE username
  END;

ALTER TABLE public.student_accounts
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_accounts_team_check'
      AND conrelid = 'public.student_accounts'::regclass
  ) THEN
    ALTER TABLE public.student_accounts
      ADD CONSTRAINT student_accounts_team_check CHECK (team IN ('blue', 'red'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS student_accounts_username_idx
  ON public.student_accounts (username);

CREATE TABLE IF NOT EXISTS public.student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.student_accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.student_sessions
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public.student_sessions
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

ALTER TABLE public.student_sessions
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS student_sessions_account_idx
  ON public.student_sessions (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_sessions_expiry_idx
  ON public.student_sessions (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS student_sessions_token_hash_idx
  ON public.student_sessions (token_hash);

CREATE TABLE IF NOT EXISTS public.player_wallets (
  account_id uuid PRIMARY KEY REFERENCES public.student_accounts(id) ON DELETE CASCADE,
  total_slices int NOT NULL DEFAULT 0 CHECK (total_slices >= 0),
  total_backpack_pieces int NOT NULL DEFAULT 0 CHECK (total_backpack_pieces >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.player_wallets
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS total_slices int,
  ADD COLUMN IF NOT EXISTS total_backpack_pieces int,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.player_wallets
SET
  total_slices = COALESCE(total_slices, 0),
  total_backpack_pieces = COALESCE(total_backpack_pieces, 0),
  updated_at = COALESCE(updated_at, now());

ALTER TABLE public.player_wallets
  ALTER COLUMN total_slices SET DEFAULT 0,
  ALTER COLUMN total_backpack_pieces SET DEFAULT 0,
  ALTER COLUMN updated_at SET DEFAULT now();

CREATE OR REPLACE FUNCTION public.assign_balanced_student_team()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  blue_count integer;
  red_count integer;
BEGIN
  IF NEW.team IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO blue_count FROM public.student_accounts WHERE team = 'blue';
  SELECT count(*) INTO red_count FROM public.student_accounts WHERE team = 'red';

  IF blue_count < red_count THEN
    NEW.team := 'blue';
  ELSIF red_count < blue_count THEN
    NEW.team := 'red';
  ELSE
    NEW.team := CASE WHEN random() < 0.5 THEN 'blue' ELSE 'red' END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_accounts_assign_team_trigger ON public.student_accounts;
CREATE TRIGGER student_accounts_assign_team_trigger
  BEFORE INSERT ON public.student_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_balanced_student_team();
