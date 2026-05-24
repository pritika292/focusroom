import { useEffect, useState } from "react";
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
  onSubmit: (simId: string) => void;
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

  useEffect(() => {
    if (simId) onSubmit(simId);
  }, [simId, onSubmit]);

  const submitDisabled = submitting || value.trim().length < 5 || value.trim().length > 500;

  return (
    <section className="max-w-page mx-auto px-6 py-8">
      <form
        className="max-w-content"
        onSubmit={(e) => {
          e.preventDefault();
          if (submitDisabled) return;
          void submit(value.trim());
        }}
      >
        <label htmlFor="prompt" className="sr-only">
          Your post
        </label>
        <textarea
          id="prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={EXAMPLES[placeholderIdx] ?? ""}
          maxLength={500}
          rows={3}
          className="w-full bg-card border border-border px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-y font-sans text-[16px] leading-relaxed"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted font-mono">
          <span>{value.length} / 500</span>
          {rateLimitRemaining !== null && (
            <span>{rateLimitRemaining}/10 simulations remaining this hour</span>
          )}
        </div>
        <button
          type="submit"
          disabled={submitDisabled}
          className="mt-4 px-5 py-2 bg-accent text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {submitting ? "Starting..." : "Run simulation"}
        </button>
        {error && (
          <p className="mt-3 text-[14px] text-accent" role="alert">
            {error}
          </p>
        )}
      </form>
      <div className="mt-6 max-w-content">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-2">
          Try one of these
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.slice(0, 4).map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setValue(ex)}
              className="text-left px-3 py-1.5 border border-border hover:border-accent text-[13px] transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
