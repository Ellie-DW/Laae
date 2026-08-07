ALTER TABLE public.yield_daily_records
  ADD COLUMN IF NOT EXISTS withdrawal_upbit BIGINT,
  ADD COLUMN IF NOT EXISTS withdrawal_binance NUMERIC(18, 2);

COMMENT ON COLUMN public.yield_daily_records.withdrawal_upbit IS '당일 업비트 인출액 (KRW)';
COMMENT ON COLUMN public.yield_daily_records.withdrawal_binance IS '당일 바이낸스 인출액 (USD)';
