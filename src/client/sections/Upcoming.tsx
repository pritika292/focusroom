// Small "what's next" panel on the landing. Tells visitors focusroom is
// a living product with a roadmap, not a finished demo. Lives under the
// PromptForm + PersonaGrid in the empty state.

const ITEMS = [
  {
    label: "Bigger model.",
    body: "GPT-5 / 4.1-large for richer persona voices that hold their personality longer.",
  },
  {
    label: "Bring your own persona.",
    body: "Define a demographic + voice prompt and add it to the room for your next sim.",
  },
  {
    label: "Persona filters.",
    body: "Run the sim against a subset (only Gen Z, only EU, only software engineers).",
  },
  {
    label: "Shareable sims.",
    body: "Generate a permalink to revisit any past simulation, no account needed.",
  },
];

export function Upcoming() {
  return (
    <section className="max-w-page mx-auto px-6 lg:px-8 pt-2 pb-16">
      <div className="max-w-content">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">
          On the roadmap
        </p>
        <div className="fr-upcoming">
          <ul className="fr-upcoming__list">
            {ITEMS.map((it) => (
              <li key={it.label}>
                <span>
                  <span className="fr-upcoming__label">{it.label}</span>{" "}
                  <span className="text-muted">{it.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
