// Prints the last 24h of FocusRoom simulations sorted by suspicious-ness.
// Run with: npm run abuse-review

import "dotenv/config";
import pg from "pg";

interface Row {
  id: string;
  ip: string | null;
  started_at: Date;
  status: string;
  blocked_by_shield: boolean;
  post_count: number;
  dropped_count: number;
  total_cost_cents: number;
  prompt: string;
}

async function main(): Promise<void> {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<Row>(
      `SELECT id, ip::text AS ip, started_at, status, blocked_by_shield,
              post_count, dropped_count, total_cost_cents,
              substring(prompt for 60) AS prompt
         FROM focusroom.simulations
        WHERE started_at > now() - interval '24 hours'
        ORDER BY blocked_by_shield DESC, dropped_count DESC, total_cost_cents DESC,
                 started_at DESC
        LIMIT 200`,
    );
    if (rows.length === 0) {
      console.log("No simulations in the last 24h.");
      return;
    }
    const header = [
      "id".padEnd(36),
      "ip".padEnd(16),
      "started_at".padEnd(20),
      "status".padEnd(22),
      "shld",
      "posts",
      "drop",
      "cost¢",
      "prompt",
    ].join(" | ");
    console.log(header);
    console.log("-".repeat(header.length));
    for (const r of rows) {
      console.log(
        [
          r.id,
          (r.ip ?? "?").padEnd(16),
          r.started_at.toISOString().slice(0, 19).padEnd(20),
          r.status.padEnd(22),
          r.blocked_by_shield ? " Y  " : " .  ",
          String(r.post_count).padStart(5),
          String(r.dropped_count).padStart(4),
          String(r.total_cost_cents).padStart(5),
          r.prompt,
        ].join(" | "),
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
