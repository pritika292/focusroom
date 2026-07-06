function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid env ${name}: ${raw}`);
  }
  return n;
}

// Like readNumber but accepts 0. Used for the daily-budget cap, where 0
// disables the cap entirely (relying on the per-IP rate limit and the
// Azure subscription cap as the only spending controls).
function readNonNegativeNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid env ${name}: ${raw}`);
  }
  return n;
}

function readString(name: string, fallback?: string): string {
  const raw = process.env[name];
  if (raw) return raw;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env ${name}`);
}

function optString(name: string): string | undefined {
  return process.env[name];
}

export const config = {
  PORT: readNumber("PORT", 3016),
  NODE_ENV: readString("NODE_ENV", "development"),
  DATABASE_URL: optString("DATABASE_URL"),
  AZURE_OPENAI_ENDPOINT: optString("AZURE_OPENAI_ENDPOINT"),
  AZURE_OPENAI_DEPLOYMENT: readString("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1-mini"),
  FOCUSROOM_CONTENT_SAFETY_ENDPOINT: optString("FOCUSROOM_CONTENT_SAFETY_ENDPOINT"),
  // Daily budget cap in USD. Set to 0 to disable the cap entirely (relies
  // on the per-IP rate limit + the Azure subscription cap as the only
  // spending controls). Default 0 (disabled) — was 2 in v1 but the
  // per-call cost rounding bug made $2 trip after ~4 sims.
  FOCUSROOM_DAILY_BUDGET_USD: readNonNegativeNumber("FOCUSROOM_DAILY_BUDGET_USD", 0),
  // Global hard cap on AI runs (simulations) per UTC day, backed by
  // Postgres (see services/dailyLimit.ts). 0 disables the cap. Default 50.
  AI_DAILY_LIMIT: readNonNegativeNumber("AI_DAILY_LIMIT", 50),
  FOCUSROOM_IP_DENYLIST: (optString("FOCUSROOM_IP_DENYLIST") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
} as const;
