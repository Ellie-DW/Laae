-- period_month는 레거시 컬럼. D-day 목표 전환 후 nullable 허용
ALTER TABLE goals ALTER COLUMN period_month DROP NOT NULL;

UPDATE goals
SET period_month = to_char(start_date, 'YYYY-MM')
WHERE period_month IS NULL;
