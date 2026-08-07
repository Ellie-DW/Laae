CREATE TABLE IF NOT EXISTS public.yield_access_grants (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS yield_access_grants_granted_by_idx ON public.yield_access_grants(granted_by);

ALTER TABLE public.yield_access_grants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.yield_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  invested_meso BIGINT NOT NULL CHECK (invested_meso > 0),
  returned_meso BIGINT NOT NULL DEFAULT 0 CHECK (returned_meso >= 0),
  memo TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS yield_records_user_id_idx ON public.yield_records(user_id);
CREATE INDEX IF NOT EXISTS yield_records_record_date_idx ON public.yield_records(record_date);

ALTER TABLE public.yield_records ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_is_yield_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.app_settings s ON s.key = 'yield_owner_email'
    WHERE p.id = auth.uid()
      AND lower(p.email) = lower(s.value)
  )
  OR public.user_is_rice_owner();
$$;

CREATE OR REPLACE FUNCTION public.user_has_yield_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_is_yield_owner()
    OR EXISTS (
      SELECT 1 FROM public.yield_access_grants g WHERE g.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.grant_yield_access(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id UUID;
BEGIN
  IF NOT public.user_is_yield_owner() THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  SELECT id INTO v_target_id
  FROM public.profiles
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION '해당 이메일의 사용자를 찾을 수 없습니다.';
  END IF;

  INSERT INTO public.yield_access_grants (user_id, granted_by)
  VALUES (v_target_id, auth.uid())
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_yield_access(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_is_yield_owner() THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  DELETE FROM public.yield_access_grants WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_yield_access_grants()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.user_id, p.email, p.full_name, g.created_at
  FROM public.yield_access_grants g
  LEFT JOIN public.profiles p ON p.id = g.user_id
  WHERE public.user_is_yield_owner()
  ORDER BY g.created_at DESC;
$$;

CREATE POLICY "Users read own yield grant" ON public.yield_access_grants
  FOR SELECT
  USING (auth.uid() = user_id OR public.user_is_yield_owner());

CREATE POLICY "Yield users manage own yield_records" ON public.yield_records
  FOR ALL
  USING (auth.uid() = user_id AND public.user_has_yield_access())
  WITH CHECK (auth.uid() = user_id AND public.user_has_yield_access());

GRANT EXECUTE ON FUNCTION public.user_is_yield_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_yield_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_yield_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_yield_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_yield_access_grants() TO authenticated;
