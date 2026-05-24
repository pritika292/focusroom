import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
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
import { publish, subscriberCount } from "../../src/server/services/sseHub.js";

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

interface SseEvent {
  event: string;
  data: string;
}

function parseSse(chunk: string, target: SseEvent[]) {
  // SSE events are separated by blank lines; each event has lines
  // beginning with "event:" or "data:".
  for (const block of chunk.split("\n\n")) {
    if (!block.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length > 0) target.push({ event, data: dataLines.join("\n") });
  }
}

async function openSse(
  server: http.Server,
  simId: string,
): Promise<{
  events: SseEvent[];
  buffer: { current: string };
  close: () => void;
  res: http.IncomingMessage;
}> {
  const addr = server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  const events: SseEvent[] = [];
  const buffer = { current: "" };

  return await new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: addr.port,
        path: `/api/sim/${simId}/stream`,
        method: "GET",
        headers: { Accept: "text/event-stream" },
      },
      (res) => {
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          buffer.current += chunk;
          // Parse complete blocks and trim them from the buffer.
          const lastSep = buffer.current.lastIndexOf("\n\n");
          if (lastSep >= 0) {
            const complete = buffer.current.slice(0, lastSep + 2);
            buffer.current = buffer.current.slice(lastSep + 2);
            parseSse(complete, events);
          }
        });
        resolve({
          events,
          buffer,
          close: () => req.destroy(),
          res,
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("GET /api/sim/:id/stream", () => {
  it("returns 400 for an invalid sim id", async () => {
    const app = createApp();
    const server = app.listen(0);
    try {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no address");
      const result = await fetch(`http://127.0.0.1:${addr.port}/api/sim/not-a-uuid/stream`);
      expect(result.status).toBe(400);
    } finally {
      server.close();
    }
  });

  it("returns 404 for an unknown sim id", async () => {
    const app = createApp();
    const server = app.listen(0);
    try {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no address");
      const result = await fetch(
        `http://127.0.0.1:${addr.port}/api/sim/00000000-0000-0000-0000-000000000000/stream`,
      );
      expect(result.status).toBe(404);
    } finally {
      server.close();
    }
  });

  it("sends 'hello' + backlog of post events on connect", async () => {
    const simId = await insertSim("hello-test prompt");
    await insertPost(simId, "alex-chen", "first reply");
    await insertPost(simId, "maya-iyer", "second reply");

    const app = createApp();
    const server = app.listen(0);
    try {
      const conn = await openSse(server, simId);
      // Wait for backlog to arrive.
      for (let i = 0; i < 20 && conn.events.length < 3; i++) await sleep(50);
      conn.close();

      const types = conn.events.map((e) => e.event);
      expect(types[0]).toBe("hello");
      expect(types.filter((t) => t === "post")).toHaveLength(2);
    } finally {
      server.close();
    }
  });

  it("delivers a live-published post event to a connected subscriber", async () => {
    const simId = await insertSim("live-event prompt");

    const app = createApp();
    const server = app.listen(0);
    try {
      const conn = await openSse(server, simId);
      // Wait for hello to arrive and subscription to register.
      for (let i = 0; i < 20 && subscriberCount(simId) === 0; i++) await sleep(50);
      expect(subscriberCount(simId)).toBe(1);

      publish(simId, "post", { id: "live-1", body: "fresh post" });

      for (let i = 0; i < 20 && !conn.events.some((e) => e.event === "post"); i++) await sleep(50);

      const post = conn.events.find((e) => e.event === "post");
      expect(post).toBeDefined();
      expect(JSON.parse(post!.data)).toEqual({ id: "live-1", body: "fresh post" });

      conn.close();
      for (let i = 0; i < 20 && subscriberCount(simId) > 0; i++) await sleep(50);
      expect(subscriberCount(simId)).toBe(0);
    } finally {
      server.close();
    }
  });

  it("ends the response with sim_complete when status is already complete", async () => {
    const simId = await insertSim("already-done prompt");
    await markSimComplete(simId, 3, 2);

    const app = createApp();
    const server = app.listen(0);
    try {
      const conn = await openSse(server, simId);
      for (let i = 0; i < 30 && !conn.events.some((e) => e.event === "sim_complete"); i++)
        await sleep(50);

      const complete = conn.events.find((e) => e.event === "sim_complete");
      expect(complete).toBeDefined();
      const data = JSON.parse(complete!.data);
      expect(data.simId).toBe(simId);
      expect(data.postCount).toBe(3);
      expect(data.silentTurns).toBe(2);
    } finally {
      server.close();
    }
  });
});
