CREATE TABLE IF NOT EXISTS public.premium_character_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premium_character_groups_user_sort_idx
  ON public.premium_character_groups(user_id, sort_order);

ALTER TABLE public.premium_character_groups ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS premium_group_id UUID
  REFERENCES public.premium_character_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS characters_premium_group_id_idx ON public.characters(premium_group_id);

CREATE POLICY "Premium users manage own premium groups" ON public.premium_character_groups
  FOR ALL
  USING (auth.uid() = user_id AND public.user_has_premium_access())
  WITH CHECK (auth.uid() = user_id AND public.user_has_premium_access());

CREATE POLICY "Premium users update own character group" ON public.characters
  FOR UPDATE
  USING (auth.uid() = user_id AND public.user_has_premium_access())
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_premium_access()
    AND (
      premium_group_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.premium_character_groups g
        WHERE g.id = premium_group_id
          AND g.user_id = auth.uid()
      )
    )
  );
