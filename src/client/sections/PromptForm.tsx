import { useEffect, useRef, useState } from "react";
import { useSubmitSim } from "../lib/useSubmitSim.js";

const EXAMPLES = [
  "Our new app launches Tuesday for remote teams planning offsites",
  "$80 wireless earbuds, sound better than AirPods Pro",
  "What do you think of AI replacing software engineering jobs?",
  "A subscription box for fresh pasta delivered weekly",
  "We're raising prices on our SaaS by 30% next month",
  "Tech layoffs are mostly a good thing in the long run",
];

interface Props {
  onSubmit: (simId: string, prompt: string) => void;
}

export function PromptForm({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const { submit, submitting, error, rateLimitRemaining, simId } = useSubmitSim();

  useEffect(() => {
    if (value) return;
    const interval = setInterval(() => setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length), 4000);
    return () => clearInterval(interval);
  }, [value]);

  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    if (simId) onSubmit(simId, valueRef.current.trim());
  }, [simId, onSubmit]);

  const trimmedLen = value.trim().length;
  const submitDisabled = submitting || trimmedLen < 5 || trimmedLen > 500;

  return (
    <section className="max-w-page mx-auto px-6 lg:px-8 pt-2 pb-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
        <form
          className="fr-prompt-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (submitDisabled) return;
            void submit(value.trim());
          }}
        >
          <label htmlFor="prompt" className="sr-only">
            Your post
          </label>
          <div className="fr-prompt-shell">
            <textarea
              id="prompt"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={EXAMPLES[placeholderIdx] ?? ""}
              maxLength={500}
              rows={5}
              className="fr-prompt-input"
            />
            <div className="fr-prompt-bar">
              <span className="fr-prompt-count font-mono">
                <span className={trimmedLen >= 5 && trimmedLen <= 500 ? "text-text" : "text-muted"}>
                  {trimmedLen}
                </span>
                <span className="text-muted"> / 500</span>
              </span>
              {rateLimitRemaining !== null && (
                <span className="fr-prompt-rate font-mono">
                  {rateLimitRemaining}/10 sims left this hour
                </span>
              )}
              <button type="submit" disabled={submitDisabled} className="fr-btn-primary">
                {submitting ? (
                  <span className="fr-btn-spinner" aria-hidden />
                ) : (
                  <>
                    <span>Run simulation</span>
                    <span aria-hidden>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-[14px] text-accent" role="alert">
              {error}
            </p>
          )}
        </form>
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">
            Or try one of these
          </p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.slice(0, 4).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setValue(ex)}
                className="fr-example-strip"
                aria-label={`Use example: ${ex}`}
              >
                <span className="fr-example-strip__text">{ex}</span>
                <span className="fr-example-strip__arrow" aria-hidden>
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
