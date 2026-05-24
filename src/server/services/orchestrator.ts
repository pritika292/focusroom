import { getPool } from "../db/pool.js";
import { PERSONAS, getPersona, publicPersonaShape } from "../personas.js";
import { chat } from "./ai.js";
import { buildContext, type PostNode, type Decision } from "./context.js";
import { isSafe } from "./outputSafety.js";
import { recordSpend } from "./cost.js";
import { publish } from "./sseHub.js";

const TURNS_PER_PERSONA = 3;
const SLEEP_MIN_MS = 800;
const SLEEP_MAX_MS = 1500;

/**
 * Drives a single simulation. Runs exactly TURNS_PER_PERSONA * PERSONAS.length
 * turns. Each turn picks a random persona from the pool with remaining
 * turns, then rolls 33/33/33 for original | reply | skip. Skip just
 * fires a turn_skipped SSE event and decrements the counter (zero LLM
 * cost). Original and reply both call the LLM; output safety drops
 * unsafe posts silently but still consumes the turn.
 */
export async function startSim(simId: string, visitorPrompt: string): Promise<void> {
  void run(simId, visitorPrompt).catch((err) => {
    console.error(`[orchestrator] sim ${simId} crashed:`, err);
    void markErrored(simId);
  });
}

async function run(simId: string, visitorPrompt: string): Promise<void> {
  const pool = getPool();
  const turnsRemaining = new Map<string, number>();
  for (const p of PERSONAS) turnsRemaining.set(p.id, TURNS_PER_PERSONA);

  const liveSnapshot: PostNode[] = [];
  let postCount = 0;
  let silentTurns = 0;

  console.log(
    `[orchestrator] sim ${simId} starting, ${turnsRemaining.size} personas x ${TURNS_PER_PERSONA} turns`,
  );

  while (anyTurnsLeft(turnsRemaining)) {
    const personaId = pickPersona(turnsRemaining);
    const persona = getPersona(personaId);
    if (!persona) {
      // shouldn't happen; defensive
      turnsRemaining.delete(personaId);
      continue;
    }

    const decision = pickDecision(liveSnapshot);

    try {
      if (decision === "skip") {
        silentTurns += 1;
        publish(simId, "turn_skipped", {
          simId,
          personaId,
          persona: publicPersonaShape(personaId),
        });
      } else {
        const parentPostId = decision === "reply" ? pickReplyTarget(liveSnapshot) : undefined;
        const userMessage = buildContext({
          visitorPrompt,
          persona,
          decision,
          parentPostId,
          posts: liveSnapshot,
          personaName: (id) => getPersona(id)?.name ?? "someone",
          personaLocation: (id) => getPersona(id)?.location ?? "",
        });

        const result = await chat(persona.systemPrompt, userMessage);
        await recordSpend(simId, result.tokensIn, result.tokensOut);

        const safety = isSafe(result.text);
        if (!safety.safe || !result.text) {
          await incrementDropped(simId);
        } else {
          const { rows } = await pool.query<{ id: string; created_at: Date }>(
            `INSERT INTO focusroom.posts
              (sim_id, persona_id, parent_post_id, body, tokens_in, tokens_out)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [
              simId,
              persona.id,
              parentPostId ?? null,
              result.text,
              result.tokensIn,
              result.tokensOut,
            ],
          );
          const r = rows[0];
          if (r) {
            const node: PostNode = {
              id: r.id,
              personaId: persona.id,
              parentPostId: parentPostId ?? null,
              body: result.text,
              createdAt: r.created_at,
            };
            liveSnapshot.push(node);
            postCount += 1;
            publish(simId, "post", {
              id: r.id,
              simId,
              personaId: persona.id,
              parentId: parentPostId ?? null,
              body: result.text,
              createdAt: r.created_at,
              persona: publicPersonaShape(persona.id),
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[orchestrator] sim ${simId} persona ${personaId} turn failed:`, err);
      // turn still consumed; loop continues
    }

    turnsRemaining.set(personaId, (turnsRemaining.get(personaId) ?? 1) - 1);
    if ((turnsRemaining.get(personaId) ?? 0) <= 0) {
      turnsRemaining.delete(personaId);
    }
    await sleep(SLEEP_MIN_MS + Math.random() * (SLEEP_MAX_MS - SLEEP_MIN_MS));
  }

  await pool.query(
    `UPDATE focusroom.simulations
        SET status = 'complete',
            completed_at = NOW(),
            post_count = $2,
            silent_turns = $3
      WHERE id = $1`,
    [simId, postCount, silentTurns],
  );

  publish(simId, "sim_complete", { simId, postCount, silentTurns });
  console.log(`[orchestrator] sim ${simId} complete: ${postCount} posts, ${silentTurns} silent`);
}

function anyTurnsLeft(turnsRemaining: Map<string, number>): boolean {
  for (const v of turnsRemaining.values()) {
    if (v > 0) return true;
  }
  return false;
}

function pickPersona(turnsRemaining: Map<string, number>): string {
  const ids: string[] = [];
  for (const [id, n] of turnsRemaining) {
    if (n > 0) ids.push(id);
  }
  const idx = Math.floor(Math.random() * ids.length);
  return ids[idx] ?? ids[0] ?? "";
}

function pickDecision(posts: PostNode[]): Decision {
  const r = Math.random();
  if (r < 1 / 3) return "original";
  if (r < 2 / 3) {
    return posts.length === 0 ? "original" : "reply";
  }
  return "skip";
}

function pickReplyTarget(posts: PostNode[]): string {
  if (posts.length === 0) throw new Error("pickReplyTarget called with no posts");
  const idx = Math.floor(Math.random() * posts.length);
  const picked = posts[idx] ?? posts[0];
  if (!picked) throw new Error("pickReplyTarget unreachable");
  return picked.id;
}

async function incrementDropped(simId: string): Promise<void> {
  try {
    await getPool().query(
      `UPDATE focusroom.simulations SET dropped_count = dropped_count + 1 WHERE id = $1`,
      [simId],
    );
  } catch (err) {
    console.warn(`[orchestrator] dropped-count update failed for ${simId}:`, err);
  }
}

async function markErrored(simId: string): Promise<void> {
  try {
    await getPool().query(
      `UPDATE focusroom.simulations SET status = 'error', completed_at = NOW() WHERE id = $1`,
      [simId],
    );
  } catch (err) {
    console.warn(`[orchestrator] error-mark failed for ${simId}:`, err);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
