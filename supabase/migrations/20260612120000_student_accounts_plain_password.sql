-- Store student passwords in plaintext for classroom recovery via Supabase dashboard.
ALTER TABLE public.student_accounts
  RENAME COLUMN password_hash TO password;
