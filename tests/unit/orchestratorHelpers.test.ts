import { describe, it, expect, vi, afterEach } from "vitest";
import {
  anyTurnsLeft,
  pickPersona,
  pickDecision,
  pickReplyTarget,
} from "../../src/server/services/orchestrator.js";
import type { PostNode } from "../../src/server/services/context.js";

function post(id: string, parentId: string | null = null): PostNode {
  return {
    id,
    personaId: "alex-chen",
    parentPostId: parentId,
    body: "x",
    createdAt: new Date(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("anyTurnsLeft", () => {
  it("returns true when any persona has turns remaining", () => {
    const m = new Map([
      ["a", 0],
      ["b", 1],
    ]);
    expect(anyTurnsLeft(m)).toBe(true);
  });

  it("returns false when every persona is at zero", () => {
    const m = new Map([
      ["a", 0],
      ["b", 0],
    ]);
    expect(anyTurnsLeft(m)).toBe(false);
  });

  it("returns false on an empty map", () => {
    expect(anyTurnsLeft(new Map())).toBe(false);
  });
});

describe("pickPersona", () => {
  it("never returns the just-posted persona when others are available", () => {
    const m = new Map([
      ["a", 3],
      ["b", 3],
      ["c", 3],
    ]);
    for (let i = 0; i < 50; i++) {
      const picked = pickPersona(m, "a");
      expect(picked).not.toBe("a");
      expect(["b", "c"]).toContain(picked);
    }
  });

  it("falls back to the excluded persona when they're the only one left", () => {
    const m = new Map([["a", 3]]);
    expect(pickPersona(m, "a")).toBe("a");
  });

  it("never returns a persona with zero turns", () => {
    const m = new Map([
      ["a", 0],
      ["b", 2],
      ["c", 0],
    ]);
    for (let i = 0; i < 30; i++) {
      expect(pickPersona(m, null)).toBe("b");
    }
  });

  it("returns empty string when pool is empty", () => {
    expect(pickPersona(new Map(), null)).toBe("");
  });

  it("picks uniformly when no exclusion", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const m = new Map([
      ["a", 1],
      ["b", 1],
      ["c", 1],
    ]);
    const picked = pickPersona(m, null);
    expect(["a", "b", "c"]).toContain(picked);
  });
});

describe("pickDecision", () => {
  it("returns 'original' when random is in [0, 1/3)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    expect(pickDecision([])).toBe("original");
  });

  it("returns 'reply' when random is in [1/3, 2/3) and posts exist", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(pickDecision([post("p1")])).toBe("reply");
  });

  it("falls 'reply' back to 'original' when no posts exist", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(pickDecision([])).toBe("original");
  });

  it("returns 'skip' when random is in [2/3, 1)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    expect(pickDecision([post("p1")])).toBe("skip");
  });

  it("distributes roughly evenly over many samples", () => {
    const counts = { original: 0, reply: 0, skip: 0 };
    const posts = [post("p1"), post("p2")];
    for (let i = 0; i < 6000; i++) {
      const d = pickDecision(posts);
      counts[d]++;
    }
    for (const v of Object.values(counts)) {
      expect(v).toBeGreaterThan(1500);
      expect(v).toBeLessThan(2500);
    }
  });
});

describe("pickReplyTarget", () => {
  it("returns one of the post ids", () => {
    const posts = [post("p1"), post("p2"), post("p3")];
    const picked = pickReplyTarget(posts);
    expect(["p1", "p2", "p3"]).toContain(picked);
  });

  it("throws when given an empty array", () => {
    expect(() => pickReplyTarget([])).toThrow(/no posts/);
  });

  it("can pick the only post when length is 1", () => {
    expect(pickReplyTarget([post("only")])).toBe("only");
  });
});
