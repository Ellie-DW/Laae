ALTER TABLE public.yield_settings
  ADD COLUMN IF NOT EXISTS initial_principal_usd NUMERIC(18, 2);

COMMENT ON COLUMN public.yield_settings.initial_principal_usd IS '투자 시작 원금 (USD, 선택)';
