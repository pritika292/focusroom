import { usePersonas } from "../lib/usePersonas.js";

export function PersonaGrid() {
  const personas = usePersonas();

  return (
    <section className="max-w-page mx-auto px-6 lg:px-8 py-12 md:py-16 border-t border-border">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
        <h2 className="section-heading">Meet the room</h2>
        <p className="text-[13px] text-muted">
          Twenty hardcoded personas, fixed demographics, fixed voices.
        </p>
      </div>

      {personas === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="persona-card persona-card--skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {personas.map((p, i) => (
            <article key={p.id} className="persona-card" style={{ animationDelay: `${i * 25}ms` }}>
              <div className="persona-card__avatar" style={{ backgroundColor: p.avatar.bg }}>
                {p.avatar.initials}
              </div>
              <div className="persona-card__body">
                <h3 className="persona-card__name">{p.name}</h3>
                <p className="persona-card__meta">
                  {p.age} · {p.location}
                </p>
                <p className="persona-card__occ">{p.occupation}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
