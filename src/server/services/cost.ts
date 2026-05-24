import { getPool } from "../db/pool.js";
import { config } from "../config.js";

// gpt-4.1-mini pricing: $0.40 / $1.60 per 1M tokens
// All amounts tracked in integer CENTS to avoid float drift.
const INPUT_CENTS_PER_M = 40;
const OUTPUT_CENTS_PER_M = 160;

function calcCostCents(tokensIn: number, tokensOut: number): number {
  return Math.ceil((tokensIn * INPUT_CENTS_PER_M + tokensOut * OUTPUT_CENTS_PER_M) / 1_000_000);
}

interface DayBucket {
  utcDay: string;
  spendCents: number;
}

let bucket: DayBucket | undefined;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadFromDb(): Promise<number> {
  try {
    const pool = getPool();
    const { rows } = await pool.query<{ sum: string | null }>(
      `SELECT COALESCE(SUM(total_cost_cents), 0)::text AS sum
       FROM focusroom.simulations
       WHERE started_at >= date_trunc('day', now() AT TIME ZONE 'UTC')`,
    );
    return Number.parseInt(rows[0]?.sum ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

async function ensureBucket(): Promise<DayBucket> {
  const day = utcDay();
  if (!bucket || bucket.utcDay !== day) {
    const spendCents = await loadFromDb();
    bucket = { utcDay: day, spendCents };
  }
  return bucket;
}

export async function recordSpend(
  simId: string,
  tokensIn: number,
  tokensOut: number,
): Promise<void> {
  const cents = calcCostCents(tokensIn, tokensOut);
  const b = await ensureBucket();
  b.spendCents += cents;
  const pool = getPool();
  await pool.query(
    `UPDATE focusroom.simulations
        SET total_tokens_in  = total_tokens_in  + $2,
            total_tokens_out = total_tokens_out + $3,
            total_cost_cents = total_cost_cents + $4
      WHERE id = $1`,
    [simId, tokensIn, tokensOut, cents],
  );
}

export async function dailySpendCents(): Promise<number> {
  const b = await ensureBucket();
  return b.spendCents;
}

export function dailyBudgetCents(): number {
  return config.FOCUSROOM_DAILY_BUDGET_USD * 100;
}

export async function isDailyBudgetExceeded(): Promise<boolean> {
  return (await dailySpendCents()) >= dailyBudgetCents();
}

export function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}
