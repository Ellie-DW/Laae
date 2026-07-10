ALTER TABLE public.drop_records
  ADD COLUMN IF NOT EXISTS acquired_date DATE,
  ADD COLUMN IF NOT EXISTS sold_date DATE;

UPDATE public.drop_records
SET
  acquired_date = COALESCE(acquired_date, record_date),
  sold_date = COALESCE(sold_date, CASE WHEN meso > 0 THEN record_date ELSE NULL END)
WHERE acquired_date IS NULL;

ALTER TABLE public.drop_records
  ALTER COLUMN acquired_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS drop_records_acquired_date_idx ON public.drop_records(acquired_date);
CREATE INDEX IF NOT EXISTS drop_records_sold_date_idx ON public.drop_records(sold_date);
