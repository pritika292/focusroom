-- 002_ai_daily_usage.sql -- global daily AI run cap.
-- One row per UTC day; run_count is incremented atomically per accepted
-- simulation (see src/server/services/dailyLimit.ts). The cap protects
-- Azure OpenAI spend independent of the per-IP rate limit and USD budget.
-- Old rows are harmless (one per day) and can be pruned if ever desired.

CREATE TABLE IF NOT EXISTS focusroom.ai_daily_usage (
  usage_date  DATE PRIMARY KEY DEFAULT (now() AT TIME ZONE 'UTC')::date,
  run_count   INTEGER NOT NULL DEFAULT 0
);
