CREATE TABLE IF NOT EXISTS public.drop_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  meso BIGINT NOT NULL,
  memo TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drop_records_user_id_idx ON public.drop_records(user_id);
CREATE INDEX IF NOT EXISTS drop_records_record_date_idx ON public.drop_records(record_date);

ALTER TABLE public.drop_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drop_records" ON public.drop_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
