-- 전역 캐릭터명 중복 방지 (대소문자·앞뒤 공백 무시)
CREATE OR REPLACE FUNCTION public.is_character_name_taken(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.characters
    WHERE lower(trim(name)) = lower(trim(p_name))
      AND trim(p_name) <> ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_character_name_taken(text) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS characters_name_normalized_unique
  ON public.characters (lower(trim(name)))
  WHERE trim(name) <> '';
