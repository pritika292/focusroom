// Fire-and-forget reporter that POSTs per-call usage to controlroom's
// /api/ai-usage/focusroom endpoint. controlroom aggregates calls / tokens
// / est cost across the family and surfaces them on the public dashboard.
//
// Best-effort. Never blocks the caller and swallows transport errors.

const INGEST_URL = "https://controlroom.pritika.studio/api/ai-usage/focusroom";

// Per-1M-token prices in USD as of 2026 for the deployments we run.
// Best-effort estimates; controlroom stores what we report so price
// changes here automatically update the dashboard's cost tile.
const PRICE_PER_M_USD: Record<string, { prompt: number; completion: number }> = {
  "gpt-4.1-mini": { prompt: 0.4, completion: 1.6 },
  "gpt-4o-mini": { prompt: 0.15, completion: 0.6 },
  "gpt-4o": { prompt: 2.5, completion: 10.0 },
};

const FALLBACK_PRICE = { prompt: 0.4, completion: 1.6 };

function estCostCents(model: string, promptTokens: number, completionTokens: number): number {
  const price = PRICE_PER_M_USD[model] ?? FALLBACK_PRICE;
  const dollars =
    (promptTokens / 1_000_000) * price.prompt + (completionTokens / 1_000_000) * price.completion;
  return dollars * 100;
}

export function reportAiUsage(model: string, promptTokens: number, completionTokens: number): void {
  if (process.env["NODE_ENV"] === "test") return;
  if (promptTokens < 0 || completionTokens < 0) return;

  const body = JSON.stringify({
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    est_cost_cents: estCostCents(model, promptTokens, completionTokens),
  });

  void fetch(INGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {
    // Swallow. Telemetry must not crash the caller.
  });
}
