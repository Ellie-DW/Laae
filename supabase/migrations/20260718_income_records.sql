CREATE TABLE IF NOT EXISTS public.income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('trade', 'sale', 'reward', 'other')),
  amount BIGINT NOT NULL CHECK (amount > 0),
  memo TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS income_records_user_id_idx ON public.income_records(user_id);
CREATE INDEX IF NOT EXISTS income_records_record_date_idx ON public.income_records(record_date);
CREATE INDEX IF NOT EXISTS income_records_character_id_idx ON public.income_records(character_id);

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own income_records" ON public.income_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
