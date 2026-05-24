import { describe, it, expect } from "vitest";
import { sanitize } from "../../src/server/services/orchestrator.js";

describe("sanitize", () => {
  it("replaces em dashes with '. '", () => {
    expect(sanitize("this is fine — actually not")).toBe("this is fine. actually not");
  });

  it("replaces en dashes with ', '", () => {
    expect(sanitize("a – b – c")).toBe("a, b, c");
  });

  it("handles em dashes with no surrounding whitespace", () => {
    expect(sanitize("yes—no—maybe")).toBe("yes. no. maybe");
  });

  it("collapses runs of whitespace introduced by replacement", () => {
    expect(sanitize("hello   world")).toBe("hello world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitize("   text   ")).toBe("text");
  });

  it("passes clean text through unchanged", () => {
    expect(sanitize("normal sentence, with commas. and periods.")).toBe(
      "normal sentence, with commas. and periods.",
    );
  });

  it("handles empty input", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles multiple dash types in one string", () => {
    expect(sanitize("alpha — beta – gamma")).toBe("alpha. beta, gamma");
  });
});
