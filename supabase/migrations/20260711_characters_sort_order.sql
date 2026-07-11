-- 캐릭터 표시 순서 컬럼 추가
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 기존 데이터: created_at 순으로 backfill
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS rn
  FROM public.characters
)
UPDATE public.characters c
SET sort_order = r.rn
FROM ranked r
WHERE c.id = r.id;

CREATE INDEX IF NOT EXISTS characters_user_sort_idx ON public.characters(user_id, sort_order);
