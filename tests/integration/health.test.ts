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

describe("GET /health", () => {
  it("returns {ok:true, service:'focusroom'}", async () => {
    const app = createApp();
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true, service: "focusroom" });
  });
});
