CREATE TABLE IF NOT EXISTS public.player_room_items (
  account_id uuid NOT NULL REFERENCES public.student_accounts(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, item_id)
);

CREATE INDEX IF NOT EXISTS player_room_items_account_idx
  ON public.player_room_items (account_id);
