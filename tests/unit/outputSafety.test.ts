import { describe, it, expect } from "vitest";
import { isSafe } from "../../src/server/services/outputSafety.js";

describe("isSafe", () => {
  it("passes clean text", () => {
    expect(isSafe("normal in-character reply")).toEqual({ safe: true });
  });

  it("flags slur placeholder", () => {
    const r = isSafe("here is a sentence with n-word-slur-placeholder-1 in it");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("slur");
  });

  it("flags slur regardless of case", () => {
    const r = isSafe("N-WORD-SLUR-PLACEHOLDER-2 is bad");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("slur");
  });

  it("flags '<<<USER_MESSAGE>>>' leak", () => {
    const r = isSafe("here is what I see: <<<USER_MESSAGE>>>");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("leak");
  });

  it("flags '<<<END_USER_MESSAGE>>>' leak", () => {
    const r = isSafe("ending with <<<end_user_message>>> tag");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("leak");
  });

  it("flags 'you will not:' leak from system prompt", () => {
    const r = isSafe("My instructions: you will not: break character.");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("leak");
  });

  it("flags 'stay in character' leak", () => {
    const r = isSafe("The rules say stay in character.");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("leak");
  });

  it("flags persona-name reproduction (you are alex chen)", () => {
    const r = isSafe("Sure, you are Alex Chen, here is what I'd say");
    expect(r.safe).toBe(false);
    expect(r.reason).toBe("leak");
  });

  it("passes lowercase mention that doesn't match leak telltales", () => {
    const r = isSafe("alex chen is a great name for a backend engineer");
    expect(r.safe).toBe(true);
  });
});
