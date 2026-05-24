import { describe, it, expect, beforeEach } from "vitest";
import { subscribe, publish, subscriberCount } from "../../src/server/services/sseHub.js";

function makeClient(simId: string) {
  const received: { event: string; data: unknown }[] = [];
  const client = {
    id: `c-${Math.random().toString(36).slice(2)}`,
    simId,
    send(event: string, data: unknown) {
      received.push({ event, data });
    },
  };
  return { client, received };
}

describe("sseHub", () => {
  beforeEach(() => {
    // Hub state is module-level — pick a unique simId per test to avoid
    // cross-contamination.
  });

  it("delivers an event only to subscribers of that simId", () => {
    const simA = "sim-a-" + Math.random();
    const simB = "sim-b-" + Math.random();
    const { client: ca, received: ra } = makeClient(simA);
    const { client: cb, received: rb } = makeClient(simB);
    const unsubA = subscribe(ca);
    const unsubB = subscribe(cb);

    publish(simA, "post", { id: 1 });

    expect(ra).toEqual([{ event: "post", data: { id: 1 } }]);
    expect(rb).toEqual([]);

    unsubA();
    unsubB();
  });

  it("delivers to all subscribers on the same simId", () => {
    const simId = "sim-multi-" + Math.random();
    const { client: c1, received: r1 } = makeClient(simId);
    const { client: c2, received: r2 } = makeClient(simId);
    const u1 = subscribe(c1);
    const u2 = subscribe(c2);

    publish(simId, "post", { id: "x" });

    expect(r1).toEqual([{ event: "post", data: { id: "x" } }]);
    expect(r2).toEqual([{ event: "post", data: { id: "x" } }]);

    u1();
    u2();
  });

  it("unsubscribe removes the client from future events", () => {
    const simId = "sim-unsub-" + Math.random();
    const { client, received } = makeClient(simId);
    const unsub = subscribe(client);
    unsub();
    publish(simId, "post", { id: "ignored" });
    expect(received).toEqual([]);
  });

  it("subscriberCount tracks per-sim and total", () => {
    const simId = "sim-count-" + Math.random();
    const before = subscriberCount(simId);
    expect(before).toBe(0);
    const { client } = makeClient(simId);
    const unsub = subscribe(client);
    expect(subscriberCount(simId)).toBe(1);
    expect(subscriberCount()).toBeGreaterThanOrEqual(1);
    unsub();
    expect(subscriberCount(simId)).toBe(0);
  });

  it("publish to a sim with no subscribers is a no-op", () => {
    expect(() => publish("nobody-here", "post", {})).not.toThrow();
  });

  it("a throwing client does not break delivery to siblings", () => {
    const simId = "sim-throw-" + Math.random();
    const thrower = {
      id: "t",
      simId,
      send: () => {
        throw new Error("boom");
      },
    };
    const { client, received } = makeClient(simId);
    const u1 = subscribe(thrower);
    const u2 = subscribe(client);
    expect(() => publish(simId, "post", { id: 1 })).not.toThrow();
    expect(received).toEqual([{ event: "post", data: { id: 1 } }]);
    u1();
    u2();
  });
});
