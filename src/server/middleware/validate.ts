import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Cheap input pre-filter. Runs BEFORE the Prompt Shields call to save
// $0.00075 of API spend on obvious garbage.
//
// Layer 1 of the security model. The slurs list is intentionally tiny;
// real slur coverage lives in the output filter (since the model could
// produce them regardless of input).

const SLUR_RE = /(slur-placeholder-1|slur-placeholder-2)/i;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
const PHONE_RE = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const CC_RE = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,4}\b/;
const INJECTION_RE =
  /(ignore\s+(previous|prior|above)\s+instructions|\b(system|assistant|user)\s*:|<\/?(persona|system|instruction|prompt)\b|\[(INST|\/INST|SYSTEM|ASSISTANT)\])/i;

const SubmitSchema = z.object({
  prompt: z.string().trim().min(5, "prompt too short").max(500, "prompt too long"),
});

export interface ValidatedSubmit {
  prompt: string;
}

export function validateSubmit(req: Request, res: Response, next: NextFunction): void {
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid body" });
    return;
  }
  const { prompt } = parsed.data;

  if (SLUR_RE.test(prompt)) {
    res.status(400).json({ error: "try a different prompt" });
    return;
  }
  if (EMAIL_RE.test(prompt) || PHONE_RE.test(prompt) || CC_RE.test(prompt)) {
    res.status(400).json({ error: "no personal info please" });
    return;
  }
  if (INJECTION_RE.test(prompt)) {
    res.status(400).json({ error: "try a different prompt" });
    return;
  }

  (req as Request & { validated?: ValidatedSubmit }).validated = { prompt };
  next();
}
