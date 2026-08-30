CREATE TABLE IF NOT EXISTS public.alert_access_grants (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alert_access_grants_granted_by_idx ON public.alert_access_grants(granted_by);

ALTER TABLE public.alert_access_grants ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value)
SELECT 'alert_owner_email', value
FROM public.app_settings
WHERE key = 'rice_owner_email'
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.user_is_alert_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.app_settings s ON s.key = 'alert_owner_email'
    WHERE p.id = auth.uid()
      AND lower(p.email) = lower(s.value)
  )
  OR public.user_is_rice_owner();
$$;

CREATE OR REPLACE FUNCTION public.user_has_alert_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_is_alert_owner()
    OR EXISTS (
      SELECT 1 FROM public.alert_access_grants g WHERE g.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.grant_alert_access(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id UUID;
BEGIN
  IF NOT public.user_is_alert_owner() THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  SELECT id INTO v_target_id
  FROM public.profiles
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION '해당 이메일의 사용자를 찾을 수 없습니다.';
  END IF;

  INSERT INTO public.alert_access_grants (user_id, granted_by)
  VALUES (v_target_id, auth.uid())
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_alert_access(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_is_alert_owner() THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  DELETE FROM public.alert_access_grants WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_alert_access_grants()
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
  FROM public.alert_access_grants g
  LEFT JOIN public.profiles p ON p.id = g.user_id
  WHERE public.user_is_alert_owner()
  ORDER BY g.created_at DESC;
$$;

CREATE POLICY "Users read own alert grant" ON public.alert_access_grants
  FOR SELECT
  USING (auth.uid() = user_id OR public.user_is_alert_owner());

GRANT EXECUTE ON FUNCTION public.user_is_alert_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_alert_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_alert_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_alert_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_alert_access_grants() TO authenticated;
