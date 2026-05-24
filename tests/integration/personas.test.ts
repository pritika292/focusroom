import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server/app.js";
import { setupTestSchema, dropTestSchema } from "../helpers/testDb.js";
import { closePool } from "../../src/server/db/pool.js";

beforeAll(async () => {
  await setupTestSchema();
});
afterAll(async () => {
  await closePool();
  await dropTestSchema();
});

describe("GET /api/personas", () => {
  it("returns 20 personas with the public shape", async () => {
    const app = createApp();
    const r = await request(app).get("/api/personas");
    expect(r.status).toBe(200);
    expect(r.body.personas).toHaveLength(20);
    for (const p of r.body.personas) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("handle");
      expect(p).toHaveProperty("avatar");
      expect(p).toHaveProperty("bio");
      expect(p).toHaveProperty("voice");
      expect(p).not.toHaveProperty("systemPrompt");
    }
  });
});
