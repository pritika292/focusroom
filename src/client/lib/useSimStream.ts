import { useEffect, useState } from "react";
import type { PostEvent, SimCompleteEvent, TurnSkippedEvent } from "./types.js";

export interface SimStreamState {
  posts: PostEvent[];
  skippedCount: number;
  complete: boolean;
  postCount: number;
  silentTurns: number;
  error: string | null;
}

const INITIAL: SimStreamState = {
  posts: [],
  skippedCount: 0,
  complete: false,
  postCount: 0,
  silentTurns: 0,
  error: null,
};

export function useSimStream(simId: string | null): SimStreamState {
  const [state, setState] = useState<SimStreamState>(INITIAL);

  useEffect(() => {
    if (!simId) {
      setState(INITIAL);
      return;
    }

    setState(INITIAL);
    const es = new EventSource(`/api/sim/${simId}/stream`);

    es.addEventListener("post", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as PostEvent;
        setState((s) => ({ ...s, posts: [...s.posts, data] }));
      } catch {
        // ignore parse failures
      }
    });

    es.addEventListener("turn_skipped", (e) => {
      try {
        JSON.parse((e as MessageEvent).data) as TurnSkippedEvent;
        setState((s) => ({ ...s, skippedCount: s.skippedCount + 1 }));
      } catch {
        // ignore
      }
    });

    es.addEventListener("sim_complete", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SimCompleteEvent;
        setState((s) => ({
          ...s,
          complete: true,
          postCount: data.postCount,
          silentTurns: data.silentTurns,
        }));
      } catch {
        // ignore
      }
      es.close();
    });

    es.onerror = () => {
      setState((s) => ({ ...s, error: "Stream closed" }));
      es.close();
    };

    return () => {
      es.close();
    };
  }, [simId]);

  return state;
}
