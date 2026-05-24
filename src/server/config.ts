function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
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
  FOCUSROOM_DAILY_BUDGET_USD: readNumber("FOCUSROOM_DAILY_BUDGET_USD", 2),
  FOCUSROOM_IP_DENYLIST: (optString("FOCUSROOM_IP_DENYLIST") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
} as const;
