ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS meso_balance BIGINT,
  ADD COLUMN IF NOT EXISTS meso_balance_updated_at TIMESTAMPTZ;
