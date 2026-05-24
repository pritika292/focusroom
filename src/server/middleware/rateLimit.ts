import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

// Sliding-window IP rate limiter, 10 sims per hour by default. In-memory
// only; resets on container restart (acceptable for this workload, see
// the plan's Security Model section for the trade-off).

const LIMIT_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

const submissions = new Map<string, number[]>();
const denyList = new Set(config.FOCUSROOM_IP_DENYLIST);

// Sweep idle IPs out of the map once a minute so memory stays bounded.
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of submissions) {
    const kept = timestamps.filter((t) => t >= cutoff);
    if (kept.length === 0) submissions.delete(ip);
    else submissions.set(ip, kept);
  }
}, 60_000).unref();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "unknown";

  if (denyList.has(ip)) {
    res.status(403).json({ error: "request denied" });
    return;
  }

  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const recent = (submissions.get(ip) ?? []).filter((t) => t >= cutoff);
  const remaining = Math.max(0, LIMIT_PER_HOUR - recent.length);
  const resetAt = recent[0] ? Math.ceil((recent[0] + WINDOW_MS) / 1000) : Math.ceil(now / 1000);

  res.setHeader("X-RateLimit-Limit", String(LIMIT_PER_HOUR));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(resetAt));

  if (recent.length >= LIMIT_PER_HOUR) {
    res.status(429).json({
      error: `You can run ${LIMIT_PER_HOUR} simulations per hour. Try again later.`,
    });
    return;
  }

  recent.push(now);
  submissions.set(ip, recent);
  next();
}
