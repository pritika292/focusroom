import { describe, it, expect } from "vitest";
import {
  PERSONAS,
  allPersonas,
  getPersona,
  publicPersonaShape,
  shuffledPersonas,
} from "../../src/server/personas.js";

describe("personas roster", () => {
  it("exposes exactly 20 personas", () => {
    expect(PERSONAS).toHaveLength(20);
    expect(allPersonas()).toHaveLength(20);
  });

  it("all persona ids are unique", () => {
    const ids = PERSONAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(PERSONAS.length);
  });

  it("every persona has the required fields", () => {
    for (const p of PERSONAS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.handle).toMatch(/^@/);
      expect(p.avatar.initials).toMatch(/^[A-Z]{2}$/);
      expect(p.avatar.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(p.age).toBeGreaterThan(0);
      expect(p.location).toBeTruthy();
      expect(p.occupation).toBeTruthy();
      expect(p.bio).toBeTruthy();
      expect(p.voice).toBeTruthy();
      expect(p.systemPrompt.length).toBeGreaterThan(50);
    }
  });

  it("system prompt includes the dominant-trait line and shared rules", () => {
    for (const p of PERSONAS) {
      expect(p.systemPrompt).toContain("Your dominant trait right now");
      expect(p.systemPrompt).toContain("HARD RULES");
      expect(p.systemPrompt).toContain("STYLE");
    }
  });
});

describe("getPersona", () => {
  it("returns the persona for a known id", () => {
    const p = getPersona("alex-chen");
    expect(p).toBeDefined();
    expect(p!.name).toBe("Alex Chen");
  });

  it("returns undefined for an unknown id", () => {
    expect(getPersona("does-not-exist")).toBeUndefined();
  });
});

describe("publicPersonaShape", () => {
  it("strips the systemPrompt", () => {
    const pub = publicPersonaShape("alex-chen");
    expect(pub).toBeDefined();
    expect(pub).not.toHaveProperty("systemPrompt");
  });

  it("preserves bio, voice, occupation, age, location", () => {
    const pub = publicPersonaShape("alex-chen")!;
    const full = getPersona("alex-chen")!;
    expect(pub.bio).toBe(full.bio);
    expect(pub.voice).toBe(full.voice);
    expect(pub.occupation).toBe(full.occupation);
    expect(pub.age).toBe(full.age);
    expect(pub.location).toBe(full.location);
  });

  it("returns undefined for unknown id", () => {
    expect(publicPersonaShape("nope")).toBeUndefined();
  });
});

describe("shuffledPersonas", () => {
  it("returns the same set of personas (no drop)", () => {
    const a = shuffledPersonas(1);
    const b = shuffledPersonas(2);
    expect(a).toHaveLength(PERSONAS.length);
    expect(new Set(a.map((p) => p.id))).toEqual(new Set(PERSONAS.map((p) => p.id)));
    expect(new Set(b.map((p) => p.id))).toEqual(new Set(PERSONAS.map((p) => p.id)));
  });

  it("is deterministic for a given seed", () => {
    const a = shuffledPersonas(42).map((p) => p.id);
    const b = shuffledPersonas(42).map((p) => p.id);
    expect(a).toEqual(b);
  });

  it("produces different orders for different seeds", () => {
    const a = shuffledPersonas(1).map((p) => p.id);
    const b = shuffledPersonas(999).map((p) => p.id);
    expect(a).not.toEqual(b);
  });
});
