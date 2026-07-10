ALTER TABLE public.hunt_records
  ADD COLUMN IF NOT EXISTS sol_erda_fragments INTEGER NOT NULL DEFAULT 0;
