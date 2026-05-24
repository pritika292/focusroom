import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { rateLimit } from "../../src/server/middleware/rateLimit.js";

// Set denylist BEFORE importing rateLimit so the module-level Set picks
// it up. The actual env var is read once by config.ts. The test setup
// file already sets FOCUSROOM_IP_DENYLIST=9.9.9.9.
beforeAll(() => {
  expect(process.env.FOCUSROOM_IP_DENYLIST).toBe("9.9.9.9");
});

function makeApp() {
  const app = express();
  app.set("trust proxy", true);
  app.post("/api/sim", rateLimit, (_req, res) => {
    res.status(201).json({ ok: true });
  });
  return app;
}

// Use a unique IP per test so module-level state from earlier tests
// doesn't leak in (the rate-limit Map is per-IP and bounded to
// 10/hour). Generate from the test name's hash.
function uniqueIp(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const a = (h >> 8) & 0xff;
  const b = h & 0xff;
  return `10.20.${a}.${b}`;
}

describe("rateLimit", () => {
  it("sets X-RateLimit-* headers on every response", async () => {
    const ip = uniqueIp("headers");
    const app = makeApp();
    const res = await request(app).post("/api/sim").set("X-Forwarded-For", ip).send({});
    expect(res.status).toBe(201);
    expect(res.headers["x-ratelimit-limit"]).toBe("10");
    expect(res.headers["x-ratelimit-remaining"]).toBe("9");
    expect(res.headers["x-ratelimit-reset"]).toMatch(/^\d+$/);
  });

  it("decrements remaining count over successive calls", async () => {
    const ip = uniqueIp("decrement");
    const app = makeApp();
    const r1 = await request(app).post("/api/sim").set("X-Forwarded-For", ip).send({});
    const r2 = await request(app).post("/api/sim").set("X-Forwarded-For", ip).send({});
    const r3 = await request(app).post("/api/sim").set("X-Forwarded-For", ip).send({});
    expect(r1.headers["x-ratelimit-remaining"]).toBe("9");
    expect(r2.headers["x-ratelimit-remaining"]).toBe("8");
    expect(r3.headers["x-ratelimit-remaining"]).toBe("7");
  });

  it("returns 429 after 10 submissions in the window", async () => {
    const ip = uniqueIp("threshold");
    const app = makeApp();
    for (let i = 0; i < 10; i++) {
      const r = await request(app).post("/api/sim").set("X-Forwarded-For", ip).send({});
      expect(r.status).toBe(201);
    }
    const r11 = await request(app).post("/api/sim").set("X-Forwarded-For", ip).send({});
    expect(r11.status).toBe(429);
    expect(r11.body.error).toMatch(/per hour/i);
  });

  it("returns 403 for denylisted IP without consuming budget", async () => {
    const app = makeApp();
    const r = await request(app).post("/api/sim").set("X-Forwarded-For", "9.9.9.9").send({});
    expect(r.status).toBe(403);
    expect(r.body.error).toMatch(/denied/i);
  });

  it("tracks separately for separate IPs", async () => {
    const app = makeApp();
    const a = uniqueIp("separate-a");
    const b = uniqueIp("separate-b");
    const ra = await request(app).post("/api/sim").set("X-Forwarded-For", a).send({});
    const rb = await request(app).post("/api/sim").set("X-Forwarded-For", b).send({});
    expect(ra.headers["x-ratelimit-remaining"]).toBe("9");
    expect(rb.headers["x-ratelimit-remaining"]).toBe("9");
  });
});
