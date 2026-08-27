ALTER TABLE public.drop_records
  ADD COLUMN IF NOT EXISTS boss_id TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT;

ALTER TABLE public.drop_records
  DROP CONSTRAINT IF EXISTS drop_records_difficulty_check;

ALTER TABLE public.drop_records
  ADD CONSTRAINT drop_records_difficulty_check
  CHECK (difficulty IS NULL OR difficulty IN ('EASY', 'NORMAL', 'HARD', 'EXTREME', 'CHAOS'));

CREATE INDEX IF NOT EXISTS drop_records_boss_id_idx ON public.drop_records(boss_id);
