CREATE TABLE IF NOT EXISTS public.yield_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_principal BIGINT NOT NULL CHECK (initial_principal > 0),
  start_date DATE,
  memo TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.yield_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yield users manage own yield_settings" ON public.yield_settings
  FOR ALL
  USING (auth.uid() = user_id AND public.user_has_yield_access())
  WITH CHECK (auth.uid() = user_id AND public.user_has_yield_access());
