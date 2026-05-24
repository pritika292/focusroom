import { Router, type Request, type Response } from "express";
import { getPool } from "../db/pool.js";
import { subscribe } from "../services/sseHub.js";
import { publicPersonaShape } from "../personas.js";

export const streamRouter = Router();

interface SimRow {
  id: string;
  status: string;
  post_count: number;
  silent_turns: number;
  started_at: Date;
  completed_at: Date | null;
}

interface PostRow {
  id: string;
  sim_id: string;
  persona_id: string;
  parent_post_id: string | null;
  body: string;
  created_at: Date;
}

streamRouter.get("/api/sim/:simId/stream", async (req: Request, res: Response) => {
  const raw = req.params.simId;
  const simId = typeof raw === "string" ? raw : undefined;
  if (!simId || !/^[0-9a-f-]{36}$/i.test(simId)) {
    res.status(400).json({ error: "invalid sim id" });
    return;
  }

  const pool = getPool();
  const { rows: simRows } = await pool.query<SimRow>(
    `SELECT id, status, post_count, silent_turns, started_at, completed_at
       FROM focusroom.simulations
      WHERE id = $1`,
    [simId],
  );
  const sim = simRows[0];
  if (!sim) {
    res.status(404).json({ error: "sim not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, simId })}\n\n`);

  const { rows: postRows } = await pool.query<PostRow>(
    `SELECT id, sim_id, persona_id, parent_post_id, body, created_at
       FROM focusroom.posts
      WHERE sim_id = $1
      ORDER BY created_at ASC`,
    [simId],
  );
  for (const row of postRows) {
    res.write(
      `event: post\ndata: ${JSON.stringify({
        id: row.id,
        simId: row.sim_id,
        personaId: row.persona_id,
        parentId: row.parent_post_id,
        body: row.body,
        createdAt: row.created_at,
        persona: publicPersonaShape(row.persona_id),
      })}\n\n`,
    );
  }

  if (sim.status === "complete") {
    res.write(
      `event: sim_complete\ndata: ${JSON.stringify({
        simId: sim.id,
        postCount: sim.post_count,
        silentTurns: sim.silent_turns,
      })}\n\n`,
    );
    res.end();
    return;
  }

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const unsubscribe = subscribe({
    id: clientId,
    simId,
    send(event, data) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
  });

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 15_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});
