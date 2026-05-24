// Per-simulation pub/sub. Built around Map<simId, Set<SseClient>> for O(1)
// per-event fanout. Lifted in spirit from controlroom's sseHub.ts, but
// keyed by simId so a subscriber only receives events for the one
// simulation they're watching.

export interface SseClient {
  id: string;
  simId: string;
  send: (event: string, data: unknown) => void;
}

const clientsBySim = new Map<string, Set<SseClient>>();

export function subscribe(client: SseClient): () => void {
  let set = clientsBySim.get(client.simId);
  if (!set) {
    set = new Set();
    clientsBySim.set(client.simId, set);
  }
  set.add(client);

  return () => {
    const s = clientsBySim.get(client.simId);
    if (s) {
      s.delete(client);
      if (s.size === 0) {
        clientsBySim.delete(client.simId);
      }
    }
  };
}

export function publish(simId: string, event: string, data: unknown): void {
  const set = clientsBySim.get(simId);
  if (!set) return;
  for (const client of set) {
    try {
      client.send(event, data);
    } catch {
      // best-effort; a disconnecting client gets pruned by req.on('close')
    }
  }
}

export function subscriberCount(simId?: string): number {
  if (simId) return clientsBySim.get(simId)?.size ?? 0;
  let n = 0;
  for (const s of clientsBySim.values()) n += s.size;
  return n;
}
