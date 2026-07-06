import { getPool } from "../db/pool.js";
import { config } from "../config.js";

// Global daily AI-run cap, backed by Postgres so it survives container
// restarts (unlike an in-memory counter). One simulation = one run.
//
// The reservation is a single atomic UPSERT: it increments today's counter
// only while it is below the limit, and reports whether a slot was granted.
// Counting happens BEFORE the persona AI runs, so a slot is a hard ceiling
// on Azure OpenAI spend. The counter keys on the UTC date and resets at UTC
// midnight (matching the daily-budget convention in cost.ts).

export async function reserveDailyAiRun(): Promise<boolean> {
  // A limit of 0 (or less) disables the cap entirely.
  if (config.AI_DAILY_LIMIT <= 0) return true;

  const pool = getPool();
  const { rowCount } = await pool.query(
    `INSERT INTO focusroom.ai_daily_usage (usage_date, run_count)
     VALUES ((now() AT TIME ZONE 'UTC')::date, 1)
     ON CONFLICT (usage_date)
     DO UPDATE SET run_count = focusroom.ai_daily_usage.run_count + 1
       WHERE focusroom.ai_daily_usage.run_count < $1
     RETURNING run_count`,
    [config.AI_DAILY_LIMIT],
  );

  // rowCount === 1 → the row was inserted/updated (slot granted).
  // rowCount === 0 → the WHERE guard failed: the cap is already reached.
  return rowCount === 1;
}
