CREATE TABLE IF NOT EXISTS public.diary_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  memo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diary_notes_user_id_idx ON public.diary_notes(user_id);
CREATE INDEX IF NOT EXISTS diary_notes_record_date_idx ON public.diary_notes(record_date);

ALTER TABLE public.diary_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own diary_notes" ON public.diary_notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
