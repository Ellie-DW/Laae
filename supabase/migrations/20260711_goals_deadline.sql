-- 목표: 월(period_month) → 기간(start_date ~ end_date) 기반으로 전환

ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_date date;

UPDATE goals
SET
  start_date = COALESCE(start_date, (period_month || '-01')::date),
  end_date = COALESCE(
    end_date,
    ((date_trunc('month', (period_month || '-01')::date) + interval '1 month' - interval '1 day')::date)
  )
WHERE start_date IS NULL OR end_date IS NULL;

ALTER TABLE goals ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE goals ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_character_id_period_month_key;
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_character_period_unique;

-- 캐릭터(또는 계정)당 활성 목표 1개
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_scope_unique
  ON goals (user_id, COALESCE(character_id, '00000000-0000-0000-0000-000000000000'::uuid));
