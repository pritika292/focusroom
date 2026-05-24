import { getPool } from "../db/pool.js";
import { config } from "../config.js";

// gpt-4.1-mini pricing: $0.40 / $1.60 per 1M tokens (input / output).
// Stored as integer cents to avoid float drift.
const INPUT_CENTS_PER_M = 40;
const OUTPUT_CENTS_PER_M = 160;

/**
 * Cost in cents for a given token count. NEVER call this per-LLM-call —
 * a single call costs a fraction of a cent and Math.ceil rounds it up to
 * 1 cent, which inflated the per-sim cost ~12x in the v1 implementation.
 * Always call it on aggregated tokens (per-sim or daily totals).
 */
export function costCentsFromTokens(tokensIn: number, tokensOut: number): number {
  return Math.ceil((tokensIn * INPUT_CENTS_PER_M + tokensOut * OUTPUT_CENTS_PER_M) / 1_000_000);
}

/**
 * Record token spend on a single LLM call. Updates the per-sim running
 * totals of tokens_in / tokens_out. Cost is no longer computed per-call
 * (see costCentsFromTokens above) — it's derived from the token totals
 * when needed.
 *
 * total_cost_cents is still maintained for the schema's sake, but it's
 * computed as ceil(running-token-cost) so it stays close to truth instead
 * of inflating monotonically.
 */
export async function recordSpend(
  simId: string,
  tokensIn: number,
  tokensOut: number,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE focusroom.simulations
        SET total_tokens_in  = total_tokens_in  + $2,
            total_tokens_out = total_tokens_out + $3,
            total_cost_cents = CEIL(
              ((total_tokens_in + $2) * ${INPUT_CENTS_PER_M}
              + (total_tokens_out + $3) * ${OUTPUT_CENTS_PER_M}) / 1000000.0
            )
      WHERE id = $1`,
    [simId, tokensIn, tokensOut],
  );
}

/**
 * Today's total spend in cents, computed from the sum of tokens across
 * all of today's sims. One ceil applied to the aggregate, not per call.
 */
export async function dailySpendCents(): Promise<number> {
  try {
    const pool = getPool();
    const { rows } = await pool.query<{ in_total: string | null; out_total: string | null }>(
      `SELECT COALESCE(SUM(total_tokens_in), 0)::text  AS in_total,
              COALESCE(SUM(total_tokens_out), 0)::text AS out_total
         FROM focusroom.simulations
        WHERE started_at >= date_trunc('day', now() AT TIME ZONE 'UTC')`,
    );
    const tIn = Number.parseInt(rows[0]?.in_total ?? "0", 10) || 0;
    const tOut = Number.parseInt(rows[0]?.out_total ?? "0", 10) || 0;
    return costCentsFromTokens(tIn, tOut);
  } catch {
    return 0;
  }
}

export function dailyBudgetCents(): number {
  return config.FOCUSROOM_DAILY_BUDGET_USD * 100;
}

/**
 * Daily budget check. Returns false when FOCUSROOM_DAILY_BUDGET_USD is
 * set to 0 (or negative) — the cap is disabled and the only spending
 * controls left are the per-IP rate limit and the Azure subscription
 * cap. Otherwise compares today's actual spend (computed from token
 * totals) against the configured cap.
 */
export async function isDailyBudgetExceeded(): Promise<boolean> {
  const cap = dailyBudgetCents();
  if (cap <= 0) return false;
  return (await dailySpendCents()) >= cap;
}

export function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}
