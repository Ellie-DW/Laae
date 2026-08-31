CREATE TABLE IF NOT EXISTS public.site_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT (CURRENT_DATE),
  title TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read site_updates" ON public.site_updates;
CREATE POLICY "Authenticated read site_updates"
  ON public.site_updates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner write site_updates" ON public.site_updates;
CREATE POLICY "Owner write site_updates"
  ON public.site_updates
  FOR ALL
  TO authenticated
  USING (public.user_is_rice_owner())
  WITH CHECK (public.user_is_rice_owner());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_updates TO authenticated;
