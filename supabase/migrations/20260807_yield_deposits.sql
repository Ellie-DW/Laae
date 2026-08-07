ALTER TABLE public.yield_daily_records
  ADD COLUMN IF NOT EXISTS deposit_upbit BIGINT,
  ADD COLUMN IF NOT EXISTS deposit_binance NUMERIC(18, 2);

COMMENT ON COLUMN public.yield_daily_records.deposit_upbit IS '당일 업비트 입금액 (KRW)';
COMMENT ON COLUMN public.yield_daily_records.deposit_binance IS '당일 바이낸스 입금액 (USD)';
