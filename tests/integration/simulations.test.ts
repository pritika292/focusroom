import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server/app.js";
import { setupTestSchema, dropTestSchema, truncateAll } from "../helpers/testDb.js";
import { closePool, getPool } from "../../src/server/db/pool.js";
import { shieldMock, aiMock } from "../setup.server.js";

beforeAll(async () => {
  await setupTestSchema();
});
afterAll(async () => {
  await closePool();
  await dropTestSchema();
});
beforeEach(async () => {
  await truncateAll();
  shieldMock.reset();
  aiMock.reset();
});

function uniqueIp(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return `172.30.${(h >> 8) & 0xff}.${h & 0xff}`;
}

describe("POST /api/sim", () => {
  it("returns 201 + simId on a valid prompt", async () => {
    const app = createApp();
    const r = await request(app)
      .post("/api/sim")
      .set("X-Forwarded-For", uniqueIp("happy"))
      .send({ prompt: "launching an app for remote teams" });
    expect(r.status).toBe(201);
    expect(r.body.simId).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.body.sseUrl).toMatch(/^\/api\/sim\/[0-9a-f-]{36}\/stream$/);

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT prompt, status FROM focusroom.simulations WHERE id=$1",
      [r.body.simId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].prompt).toBe("launching an app for remote teams");
    // status may already be 'complete' if the orchestrator races to finish,
    // but immediately after POST it should be 'running' or 'complete'.
    expect(["running", "complete"]).toContain(rows[0].status);
  });

  it("returns 400 when prompt is too short", async () => {
    const app = createApp();
    const r = await request(app)
      .post("/api/sim")
      .set("X-Forwarded-For", uniqueIp("short"))
      .send({ prompt: "hi" });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/short/i);
  });

  it("returns 400 when prompt contains an email", async () => {
    const app = createApp();
    const r = await request(app)
      .post("/api/sim")
      .set("X-Forwarded-For", uniqueIp("pii"))
      .send({ prompt: "contact me at someone@example.com please" });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/personal info/i);
  });

  it("returns 400 + records blocked_prompt_shield row when shield flags the prompt", async () => {
    shieldMock.setAttackDetected(true);
    const app = createApp();
    const r = await request(app)
      .post("/api/sim")
      .set("X-Forwarded-For", uniqueIp("shield"))
      .send({ prompt: "this is a normal-looking prompt for the shield test" });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/break the simulation/i);

    const pool = getPool();
    const { rows } = await pool.query<{ status: string; blocked_by_shield: boolean }>(
      "SELECT status, blocked_by_shield FROM focusroom.simulations WHERE prompt = $1",
      ["this is a normal-looking prompt for the shield test"],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("blocked_prompt_shield");
    expect(rows[0].blocked_by_shield).toBe(true);
  });

  it("returns 429 after 10 submissions from the same IP within the hour", async () => {
    const app = createApp();
    const ip = uniqueIp("burst");
    for (let i = 0; i < 10; i++) {
      const r = await request(app)
        .post("/api/sim")
        .set("X-Forwarded-For", ip)
        .send({ prompt: `valid prompt number ${i} for the burst test` });
      expect(r.status).toBe(201);
    }
    const r11 = await request(app)
      .post("/api/sim")
      .set("X-Forwarded-For", ip)
      .send({ prompt: "one more after the limit" });
    expect(r11.status).toBe(429);
  });

  it("returns 429 when the global daily AI run cap is reached", async () => {
    const app = createApp();
    const pool = getPool();
    // Preset today's global counter above any reasonable limit so the next
    // run is rejected regardless of the configured AI_DAILY_LIMIT.
    await pool.query(
      `INSERT INTO focusroom.ai_daily_usage (usage_date, run_count)
       VALUES ((now() AT TIME ZONE 'UTC')::date, 1000000)
       ON CONFLICT (usage_date) DO UPDATE SET run_count = 1000000`,
    );
    const r = await request(app)
      .post("/api/sim")
      .set("X-Forwarded-For", uniqueIp("daily-cap"))
      .send({ prompt: "this run should be blocked by the daily cap" });
    expect(r.status).toBe(429);
    expect(r.body.error).toMatch(/daily/i);
  });
});
