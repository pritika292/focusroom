import pg from "pg";
import { migrate } from "../../src/server/db/migrate.js";
import { closePool, getPool } from "../../src/server/db/pool.js";

// Spins up the focusroom schema in the test database, runs migrations,
// hands callers a helper to wipe rows between tests without dropping the
// schema (cheaper than re-migrating per test).

export async function setupTestSchema(): Promise<void> {
  const conn = process.env.DATABASE_URL;
  if (!conn) throw new Error("DATABASE_URL must be set for integration tests");

  const client = new pg.Client({ connectionString: conn });
  await client.connect();
  try {
    await client.query("CREATE SCHEMA IF NOT EXISTS focusroom");
    await migrate(client);
  } finally {
    await client.end();
  }
}

export async function truncateAll(): Promise<void> {
  const pool = getPool();
  await pool.query("TRUNCATE focusroom.posts, focusroom.simulations RESTART IDENTITY CASCADE");
}

export async function dropTestSchema(): Promise<void> {
  const conn = process.env.DATABASE_URL;
  if (!conn) return;
  await closePool();
  const client = new pg.Client({ connectionString: conn });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS focusroom CASCADE");
  } finally {
    await client.end();
  }
}

export async function insertSim(prompt: string, ip = "127.0.0.1"): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO focusroom.simulations (prompt, ip, status) VALUES ($1, $2, 'running') RETURNING id`,
    [prompt, ip],
  );
  return rows[0]!.id;
}

export async function insertPost(
  simId: string,
  personaId: string,
  body: string,
  parentPostId: string | null = null,
): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO focusroom.posts (sim_id, persona_id, parent_post_id, body)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [simId, personaId, parentPostId, body],
  );
  return rows[0]!.id;
}

export async function markSimComplete(
  simId: string,
  postCount = 0,
  silentTurns = 0,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE focusroom.simulations
        SET status='complete', completed_at=NOW(), post_count=$2, silent_turns=$3
      WHERE id=$1`,
    [simId, postCount, silentTurns],
  );
}
