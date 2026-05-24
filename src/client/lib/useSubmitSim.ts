import { useCallback, useState } from "react";

export interface SubmitState {
  simId: string | null;
  submitting: boolean;
  error: string | null;
  rateLimitRemaining: number | null;
}

const INITIAL: SubmitState = {
  simId: null,
  submitting: false,
  error: null,
  rateLimitRemaining: null,
};

export function useSubmitSim(): SubmitState & {
  submit: (prompt: string) => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<SubmitState>(INITIAL);

  const submit = useCallback(async (prompt: string) => {
    setState((s) => ({ ...s, submitting: true, error: null }));
    try {
      const res = await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const remainingHeader = res.headers.get("X-RateLimit-Remaining");
      const remaining = remainingHeader ? Number.parseInt(remainingHeader, 10) : null;

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setState({
          simId: null,
          submitting: false,
          error: body.error ?? `Request failed (${res.status})`,
          rateLimitRemaining: remaining,
        });
        return;
      }

      const body = (await res.json()) as { simId: string };
      setState({
        simId: body.simId,
        submitting: false,
        error: null,
        rateLimitRemaining: remaining,
      });
    } catch (err) {
      setState({
        simId: null,
        submitting: false,
        error: (err as Error).message,
        rateLimitRemaining: null,
      });
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, submit, reset };
}
