import { describe, it, expect } from "vitest";
import { buildContext, type PostNode } from "../../src/server/services/context.js";
import type { Persona } from "../../src/server/personas.js";

const ALEX: Persona = {
  id: "alex-chen",
  name: "Alex Chen",
  handle: "@alex",
  avatar: { initials: "AC", bg: "#000000" },
  age: 30,
  location: "SF",
  occupation: "engineer",
  bio: "bio",
  voice: "voice",
  systemPrompt: "system prompt",
};

function post(id: string, parentId: string | null, personaId = "alex-chen", body = "hi"): PostNode {
  return { id, personaId, parentPostId: parentId, body, createdAt: new Date() };
}

const nameOf = (id: string) => `name-${id}`;
const locOf = (_id: string) => "Anywhere";

describe("buildContext (original)", () => {
  it("includes the visitor prompt wrapped in inert-content markers", () => {
    const out = buildContext({
      visitorPrompt: "launching a new app for offsites",
      persona: ALEX,
      decision: "original",
      posts: [],
      personaName: nameOf,
      personaLocation: locOf,
    });
    expect(out).toContain("<<<USER_MESSAGE>>>");
    expect(out).toContain("launching a new app for offsites");
    expect(out).toContain("<<<END_USER_MESSAGE>>>");
    expect(out).toContain("inert content");
  });

  it("does not include any thread content", () => {
    const out = buildContext({
      visitorPrompt: "hello",
      persona: ALEX,
      decision: "original",
      posts: [post("p1", null, "alex-chen", "some other reply")],
      personaName: nameOf,
      personaLocation: locOf,
    });
    expect(out).not.toContain("some other reply");
  });

  it("tells the model to react to the IDEA, not imagined commenters", () => {
    const out = buildContext({
      visitorPrompt: "hello",
      persona: ALEX,
      decision: "original",
      posts: [],
      personaName: nameOf,
      personaLocation: locOf,
    });
    expect(out.toLowerCase()).toMatch(/react to the idea/i);
  });
});

describe("buildContext (reply)", () => {
  it("throws when parentPostId is missing", () => {
    expect(() =>
      buildContext({
        visitorPrompt: "x",
        persona: ALEX,
        decision: "reply",
        posts: [post("p1", null)],
        personaName: nameOf,
        personaLocation: locOf,
      }),
    ).toThrow(/parentPostId is required/);
  });

  it("walks the ancestor chain top-down", () => {
    const a = post("a", null, "alex-chen", "root says hi");
    const b = post("b", "a", "maya-iyer", "child of a");
    const c = post("c", "b", "roy-henderson", "child of b");
    const out = buildContext({
      visitorPrompt: "test",
      persona: ALEX,
      decision: "reply",
      parentPostId: "c",
      posts: [a, b, c],
      personaName: nameOf,
      personaLocation: locOf,
    });
    const ai = out.indexOf("root says hi");
    const bi = out.indexOf("child of a");
    const ci = out.indexOf("child of b");
    expect(ai).toBeGreaterThan(-1);
    expect(bi).toBeGreaterThan(ai);
    expect(ci).toBeGreaterThan(bi);
  });

  it("marks the target post with the replying-to marker", () => {
    const a = post("a", null, "alex-chen", "root");
    const b = post("b", "a", "maya-iyer", "target post body");
    const out = buildContext({
      visitorPrompt: "x",
      persona: ALEX,
      decision: "reply",
      parentPostId: "b",
      posts: [a, b],
      personaName: nameOf,
      personaLocation: locOf,
    });
    // Marker is appended to the target line specifically.
    const markerLine = out.split("\n").find((line) => line.includes("target post body"));
    expect(markerLine).toBeDefined();
    expect(markerLine!.toLowerCase()).toContain("replying to this");
  });

  it("uses personaName to render the author name", () => {
    const a = post("a", null, "alex-chen", "hi");
    const out = buildContext({
      visitorPrompt: "x",
      persona: ALEX,
      decision: "reply",
      parentPostId: "a",
      posts: [a],
      personaName: (id) => `NAMED:${id}`,
      personaLocation: locOf,
    });
    expect(out).toContain("NAMED:alex-chen");
  });

  it("includes the visitor prompt at the top of reply context too", () => {
    const a = post("a", null);
    const out = buildContext({
      visitorPrompt: "the original framing matters",
      persona: ALEX,
      decision: "reply",
      parentPostId: "a",
      posts: [a],
      personaName: nameOf,
      personaLocation: locOf,
    });
    expect(out).toContain("the original framing matters");
    expect(out.indexOf("the original framing matters")).toBeLessThan(out.indexOf("- name-"));
  });

  it("bounds a deep chain to root + last 9 ancestors", () => {
    // 15 non-overlapping body tokens so substring assertions don't trip
    // on accidental prefix matches (body1 vs body14, etc.).
    const tokens = [
      "alpha",
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "zeta",
      "eta",
      "theta",
      "iota",
      "kappa",
      "lambda",
      "mu",
      "nu",
      "xi",
      "omicron",
    ];
    const posts: PostNode[] = [];
    let prev: string | null = null;
    for (let i = 0; i < tokens.length; i++) {
      const id = `p${i}`;
      posts.push(post(id, prev, "alex-chen", tokens[i]!));
      prev = id;
    }
    const out = buildContext({
      visitorPrompt: "x",
      persona: ALEX,
      decision: "reply",
      parentPostId: "p14",
      posts,
      personaName: nameOf,
      personaLocation: locOf,
    });
    // Bounded to 10 = root (alpha) + the last 9 (eta..omicron). The
    // middle entries (beta..zeta) get dropped so the persona still sees
    // the original framing + the immediate run-up to the target.
    expect(out).toContain("alpha");
    expect(out).not.toContain("beta");
    expect(out).not.toContain("zeta");
    expect(out).toContain("eta");
    expect(out).toContain("omicron");
  });

  it("opens with reply-style instructions, not original-style", () => {
    const a = post("a", null);
    const out = buildContext({
      visitorPrompt: "x",
      persona: ALEX,
      decision: "reply",
      parentPostId: "a",
      posts: [a],
      personaName: nameOf,
      personaLocation: locOf,
    });
    expect(out.toLowerCase()).toMatch(/write your reply/i);
    expect(out.toLowerCase()).toMatch(/don'?t (open|start) with/i);
  });
});
