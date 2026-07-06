import { Router, type Request, type Response } from "express";
import { getPool } from "../db/pool.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateSubmit, type ValidatedSubmit } from "../middleware/validate.js";
import { shieldPrompt } from "../services/promptShield.js";
import { isDailyBudgetExceeded, secondsUntilUtcMidnight } from "../services/cost.js";
import { reserveDailyAiRun } from "../services/dailyLimit.js";
import { startSim } from "../services/orchestrator.js";

export const simulationsRouter = Router();

simulationsRouter.post(
  "/api/sim",
  rateLimit,
  validateSubmit,
  async (req: Request, res: Response) => {
    const { prompt } = (req as Request & { validated?: ValidatedSubmit }).validated ?? {
      prompt: "",
    };
    if (!prompt) {
      res.status(400).json({ error: "invalid body" });
      return;
    }

    if (await isDailyBudgetExceeded()) {
      res.setHeader("Retry-After", String(secondsUntilUtcMidnight()));
      res.status(503).json({
        error: "Daily budget exceeded. The simulator resets at UTC midnight.",
      });
      return;
    }

    const shield = await shieldPrompt(prompt);
    if (shield.attackDetected) {
      const pool = getPool();
      await pool.query(
        `INSERT INTO focusroom.simulations
           (prompt, ip, status, blocked_by_shield)
         VALUES ($1, $2, 'blocked_prompt_shield', TRUE)`,
        [prompt, req.ip ?? null],
      );
      res.status(400).json({
        error: "That prompt looks like it's trying to break the simulation. Try a different one.",
      });
      return;
    }

    // Global daily AI-run cap (protects Azure OpenAI spend). Reserve a slot
    // before the persona AI runs; shield-blocked prompts never reach here so
    // they don't consume the daily quota.
    if (!(await reserveDailyAiRun())) {
      res.setHeader("Retry-After", String(secondsUntilUtcMidnight()));
      res.status(429).json({
        error:
          "Daily demo limit reached — FocusRoom runs 50 simulations per day. Resets at UTC midnight.",
      });
      return;
    }

    const pool = getPool();
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO focusroom.simulations (prompt, ip, status)
       VALUES ($1, $2, 'running')
       RETURNING id`,
      [prompt, req.ip ?? null],
    );
    const simId = rows[0]?.id;
    if (!simId) {
      res.status(500).json({ error: "failed to create simulation" });
      return;
    }

    void startSim(simId, prompt);

    res.status(201).json({
      simId,
      sseUrl: `/api/sim/${simId}/stream`,
    });
  },
);
