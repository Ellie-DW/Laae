ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS nexon_ocid TEXT,
  ADD COLUMN IF NOT EXISTS nexon_profile JSONB,
  ADD COLUMN IF NOT EXISTS nexon_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS characters_nexon_ocid_idx ON public.characters(nexon_ocid)
  WHERE nexon_ocid IS NOT NULL;
