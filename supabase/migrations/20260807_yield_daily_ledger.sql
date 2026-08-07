DROP POLICY IF EXISTS "Yield users manage own yield_snapshots" ON public.yield_snapshots;
DROP POLICY IF EXISTS "Yield users manage own yield_portfolios" ON public.yield_portfolios;

DROP TABLE IF EXISTS public.yield_snapshots;
DROP TABLE IF EXISTS public.yield_portfolios;

CREATE TABLE IF NOT EXISTS public.yield_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  usd_krw_rate INTEGER NOT NULL CHECK (usd_krw_rate > 0),
  upbit_start BIGINT,
  upbit_end BIGINT,
  binance_start NUMERIC(18, 2),
  binance_end NUMERIC(18, 2),
  okx_start NUMERIC(18, 2),
  okx_end NUMERIC(18, 2),
  bitget_start NUMERIC(18, 2),
  bitget_end NUMERIC(18, 2),
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, record_date)
);

CREATE INDEX IF NOT EXISTS yield_daily_records_user_date_idx
  ON public.yield_daily_records(user_id, record_date DESC);

ALTER TABLE public.yield_daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yield users manage own yield_daily_records" ON public.yield_daily_records
  FOR ALL
  USING (auth.uid() = user_id AND public.user_has_yield_access())
  WITH CHECK (auth.uid() = user_id AND public.user_has_yield_access());
