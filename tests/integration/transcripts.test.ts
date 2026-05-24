import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server/app.js";
import {
  setupTestSchema,
  dropTestSchema,
  truncateAll,
  insertSim,
  insertPost,
  markSimComplete,
} from "../helpers/testDb.js";
import { closePool } from "../../src/server/db/pool.js";

beforeAll(async () => {
  await setupTestSchema();
});
afterAll(async () => {
  await closePool();
  await dropTestSchema();
});
beforeEach(async () => {
  await truncateAll();
});

describe("transcripts route", () => {
  it("returns 400 for a non-UUID sim id (JSON)", async () => {
    const app = createApp();
    const r = await request(app).get("/api/sim/not-a-uuid/transcript.json");
    expect(r.status).toBe(400);
  });

  it("returns 404 for an unknown sim id", async () => {
    const app = createApp();
    const r = await request(app).get(
      "/api/sim/00000000-0000-0000-0000-000000000000/transcript.json",
    );
    expect(r.status).toBe(404);
  });

  it("renders JSON with simulation + personas + posts", async () => {
    const simId = await insertSim("test prompt for transcript");
    const root = await insertPost(simId, "alex-chen", "top-level body");
    await insertPost(simId, "maya-iyer", "reply to alex", root);
    await markSimComplete(simId, 2, 1);

    const app = createApp();
    const r = await request(app).get(`/api/sim/${simId}/transcript.json`);
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toMatch(/application\/json/);
    expect(r.headers["content-disposition"]).toContain(`focusroom-${simId}.json`);

    expect(r.body.simulation.id).toBe(simId);
    expect(r.body.simulation.prompt).toBe("test prompt for transcript");
    expect(r.body.simulation.postCount).toBe(2);
    expect(r.body.simulation.silentTurns).toBe(1);
    expect(r.body.simulation.status).toBe("complete");

    expect(r.body.personas).toHaveLength(2);
    expect(r.body.personas.map((p: { id: string }) => p.id).sort()).toEqual([
      "alex-chen",
      "maya-iyer",
    ]);

    expect(r.body.posts).toHaveLength(2);
    const first = r.body.posts[0];
    expect(first.personaId).toBe("alex-chen");
    expect(first.body).toBe("top-level body");
    expect(first.parentId).toBeNull();
  });

  it("renders Markdown with the visitor prompt, threading, and a Content-Disposition", async () => {
    const simId = await insertSim("the visitor's pitch");
    const root = await insertPost(simId, "alex-chen", "alex's take");
    await insertPost(simId, "maya-iyer", "maya's reply", root);
    await markSimComplete(simId, 2, 0);

    const app = createApp();
    const r = await request(app).get(`/api/sim/${simId}/transcript.md`);
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toMatch(/text\/markdown/);
    expect(r.headers["content-disposition"]).toContain(`focusroom-${simId}.md`);

    const body = r.text;
    expect(body).toContain("# FocusRoom simulation");
    expect(body).toContain("> the visitor's pitch");
    expect(body).toContain("**Alex Chen**");
    expect(body).toContain("**Maya Iyer**");
    expect(body).toContain("alex's take");
    expect(body).toContain("maya's reply");
    expect(body).toContain("↳");
  });
});
