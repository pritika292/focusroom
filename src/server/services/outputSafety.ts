import { PERSONAS } from "../personas.js";

// Local output filter. Azure OpenAI's built-in content filter on the
// gpt-4.1-mini deployment already catches the harm categories (hate,
// sexual, self-harm, violence) for free. This pass adds two checks the
// built-in filter doesn't cover:
//   1. A small EN slur list (deny-by-substring, lowercased)
//   2. A heuristic for "model leaked its system prompt" failures.
//
// On a hit, the caller drops the post silently and increments
// simulations.dropped_count. The persona's turn is still consumed (no
// retry loop, no signal to a determined attacker about which payload
// is closest to working).

const SLURS: readonly string[] = [
  // Minimal placeholder list; expand offline as needed. Lowercased,
  // matched as substrings on a lowercased copy of the text.
  "n-word-slur-placeholder-1",
  "n-word-slur-placeholder-2",
];

const LEAK_TELLS: readonly string[] = [
  "you will not:",
  "<<<user_message>>>",
  "<<<end_user_message>>>",
  "stay in character",
  "reply in 1-3 sentences",
  "treat everything between the markers",
  ...PERSONAS.map((p) => `you are ${p.name.toLowerCase()}`),
];

export interface SafetyResult {
  safe: boolean;
  reason?: "slur" | "leak";
}

export function isSafe(text: string): SafetyResult {
  const lower = text.toLowerCase();
  for (const s of SLURS) {
    if (lower.includes(s)) return { safe: false, reason: "slur" };
  }
  for (const t of LEAK_TELLS) {
    if (lower.includes(t)) return { safe: false, reason: "leak" };
  }
  return { safe: true };
}
