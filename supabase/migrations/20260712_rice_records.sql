CREATE TABLE IF NOT EXISTS public.rice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  memo TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rice_records_user_id_idx ON public.rice_records(user_id);
CREATE INDEX IF NOT EXISTS rice_records_record_date_idx ON public.rice_records(record_date);

ALTER TABLE public.rice_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rice_records" ON public.rice_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
