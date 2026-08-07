DROP POLICY IF EXISTS "Yield users manage own yield_records" ON public.yield_records;

DROP TABLE IF EXISTS public.yield_records;

CREATE TABLE IF NOT EXISTS public.yield_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'crypto')),
  initial_amount BIGINT NOT NULL CHECK (initial_amount > 0),
  start_date DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS yield_portfolios_user_id_idx ON public.yield_portfolios(user_id);

ALTER TABLE public.yield_portfolios ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.yield_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.yield_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL CHECK (balance >= 0),
  record_date DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (portfolio_id, record_date)
);

CREATE INDEX IF NOT EXISTS yield_snapshots_user_id_idx ON public.yield_snapshots(user_id);
CREATE INDEX IF NOT EXISTS yield_snapshots_portfolio_date_idx ON public.yield_snapshots(portfolio_id, record_date);

ALTER TABLE public.yield_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yield users manage own yield_portfolios" ON public.yield_portfolios
  FOR ALL
  USING (auth.uid() = user_id AND public.user_has_yield_access())
  WITH CHECK (auth.uid() = user_id AND public.user_has_yield_access());

CREATE POLICY "Yield users manage own yield_snapshots" ON public.yield_snapshots
  FOR ALL
  USING (auth.uid() = user_id AND public.user_has_yield_access())
  WITH CHECK (auth.uid() = user_id AND public.user_has_yield_access());
