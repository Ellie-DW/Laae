ALTER TABLE public.yield_daily_records
  DROP COLUMN IF EXISTS okx_start,
  DROP COLUMN IF EXISTS okx_end,
  DROP COLUMN IF EXISTS bitget_start,
  DROP COLUMN IF EXISTS bitget_end;
