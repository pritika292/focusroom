import { Router, type Request, type Response } from "express";
import { getPool } from "../db/pool.js";
import { getPersona, publicPersonaShape } from "../personas.js";

export const transcriptsRouter = Router();

interface SimRow {
  id: string;
  prompt: string;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  post_count: number;
  silent_turns: number;
  dropped_count: number;
}

interface PostRow {
  id: string;
  persona_id: string;
  parent_post_id: string | null;
  body: string;
  created_at: Date;
}

async function loadSim(simId: string): Promise<{ sim: SimRow; posts: PostRow[] } | undefined> {
  const pool = getPool();
  const { rows: simRows } = await pool.query<SimRow>(
    `SELECT id, prompt, status, started_at, completed_at, post_count, silent_turns, dropped_count
       FROM focusroom.simulations
      WHERE id = $1`,
    [simId],
  );
  const sim = simRows[0];
  if (!sim) return undefined;
  const { rows: posts } = await pool.query<PostRow>(
    `SELECT id, persona_id, parent_post_id, body, created_at
       FROM focusroom.posts
      WHERE sim_id = $1
      ORDER BY created_at ASC`,
    [simId],
  );
  return { sim, posts };
}

function narrowSimId(raw: string | string[] | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  if (!/^[0-9a-f-]{36}$/i.test(raw)) return undefined;
  return raw;
}

transcriptsRouter.get("/api/sim/:simId/transcript.json", async (req: Request, res: Response) => {
  const simId = narrowSimId(req.params.simId);
  if (!simId) {
    res.status(400).json({ error: "invalid sim id" });
    return;
  }
  const data = await loadSim(simId);
  if (!data) {
    res.status(404).json({ error: "sim not found" });
    return;
  }
  const { sim, posts } = data;

  const personaIdsInSim = new Set(posts.map((p) => p.persona_id));
  const personas = [...personaIdsInSim]
    .map((id) => publicPersonaShape(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="focusroom-${simId}.json"`);
  res.json({
    simulation: {
      id: sim.id,
      prompt: sim.prompt,
      status: sim.status,
      startedAt: sim.started_at,
      completedAt: sim.completed_at,
      postCount: sim.post_count,
      silentTurns: sim.silent_turns,
      droppedCount: sim.dropped_count,
    },
    personas,
    posts: posts.map((p) => ({
      id: p.id,
      personaId: p.persona_id,
      parentId: p.parent_post_id,
      body: p.body,
      createdAt: p.created_at,
    })),
  });
});

transcriptsRouter.get("/api/sim/:simId/transcript.md", async (req: Request, res: Response) => {
  const simId = narrowSimId(req.params.simId);
  if (!simId) {
    res.status(400).json({ error: "invalid sim id" });
    return;
  }
  const data = await loadSim(simId);
  if (!data) {
    res.status(404).json({ error: "sim not found" });
    return;
  }
  const { sim, posts } = data;

  const byId = new Map<string, PostRow>();
  const childrenOf = new Map<string | null, PostRow[]>();
  for (const p of posts) {
    byId.set(p.id, p);
    const arr = childrenOf.get(p.parent_post_id) ?? [];
    arr.push(p);
    childrenOf.set(p.parent_post_id, arr);
  }

  const lines: string[] = [];
  lines.push("# FocusRoom simulation\n");
  lines.push(`> ${sim.prompt}\n`);
  lines.push(
    `_Simulation ${sim.id} · started ${sim.started_at.toISOString()} · ${sim.post_count} posts, ${sim.silent_turns} silent turns_\n`,
  );
  lines.push("---\n");

  function render(post: PostRow, depth: number): void {
    const indent = "  ".repeat(depth);
    const arrow = depth === 0 ? "" : "↳ ";
    const persona = getPersona(post.persona_id);
    const name = persona?.name ?? post.persona_id;
    const handle = persona?.handle ?? "";
    const location = persona?.location ?? "";
    const header = handle && location ? `(${handle}, ${location})` : handle || location;
    lines.push(`${indent}${arrow}**${name}** ${header}:`);
    for (const line of post.body.split("\n")) {
      lines.push(`${indent}  ${line}`);
    }
    lines.push("");
    const children = childrenOf.get(post.id) ?? [];
    for (const c of children) render(c, depth + 1);
  }

  const topLevel = childrenOf.get(null) ?? [];
  for (const p of topLevel) render(p, 0);

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="focusroom-${simId}.md"`);
  res.send(lines.join("\n"));
});
