import { useCallback, useEffect, useRef, useState } from "react";
import { usePersonas } from "../lib/usePersonas.js";
import type { PublicPersona } from "../lib/types.js";

const CYCLE_MS = 5000;

export function PersonaGrid() {
  const personas = usePersonas();

  return (
    <section className="max-w-page mx-auto px-6 lg:px-8 py-12 md:py-16 border-t border-border">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
        <h2 className="section-heading">Meet the room</h2>
      </div>
      {personas === null ? <Skeleton /> : <Loaded personas={personas} />}
    </section>
  );
}

function Skeleton() {
  return (
    <>
      {/* Mobile / sub-lg fallback: the existing simple grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="persona-card persona-card--skeleton" />
        ))}
      </div>
      {/* Desktop: 10x2 tiles on left, big detail card on right */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-8">
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="persona-tile persona-tile--skeleton" />
          ))}
        </div>
        <div className="fr-persona-detail fr-persona-detail--skeleton" />
      </div>
    </>
  );
}

function Loaded({ personas }: { personas: PublicPersona[] }) {
  return (
    <>
      {/* Mobile / sub-lg: keep the simple grid; tap opens the existing
          PersonaPanel slide-in via the Feed when the sim is running. On
          the landing surface the tiles are purely informational at <lg. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:hidden">
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

      {/* Desktop: 2-column layout — 10x2 tile grid + big rotating detail */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-8">
        <Cycler personas={personas} />
      </div>
    </>
  );
}

function Cycler({ personas }: { personas: PublicPersona[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  // Auto-cycle every CYCLE_MS unless the user is hovering. Uses recursive
  // setTimeout so a slow tick can't overlap with the next (same pattern
  // as the controlroom health poller).
  useEffect(() => {
    let handle: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      handle = setTimeout(() => {
        if (!pinnedRef.current) {
          setActiveIdx((i) => (i + 1) % personas.length);
        }
        schedule();
      }, CYCLE_MS);
    }
    schedule();
    return () => {
      if (handle) clearTimeout(handle);
    };
  }, [personas.length]);

  const handlePoint = useCallback((idx: number) => {
    setActiveIdx(idx);
    setPinned(true);
  }, []);

  const handleRelease = useCallback(() => {
    setPinned(false);
  }, []);

  const active = personas[activeIdx];

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5" onMouseLeave={handleRelease}>
        {personas.map((p, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={p.id}
              type="button"
              className={`persona-tile${isActive ? " persona-tile--active" : ""}`}
              onMouseEnter={() => handlePoint(i)}
              onFocus={() => handlePoint(i)}
              onClick={() => handlePoint(i)}
              aria-label={`Show ${p.name}'s profile`}
              aria-pressed={isActive}
            >
              <span className="persona-tile__avatar" style={{ backgroundColor: p.avatar.bg }}>
                {p.avatar.initials}
              </span>
              <span className="persona-tile__body">
                <span className="persona-tile__name">{p.name}</span>
                <span className="persona-tile__meta">
                  {p.age} · {p.location}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Detail persona={active} pinned={pinned} />
    </>
  );
}

function Detail({ persona, pinned }: { persona: PublicPersona | undefined; pinned: boolean }) {
  if (!persona) return null;
  return (
    <article className="fr-persona-detail" key={persona.id} aria-live="polite">
      <header className="fr-persona-detail__hero">
        <div
          className="fr-persona-detail__avatar"
          style={{ backgroundColor: persona.avatar.bg }}
          aria-hidden
        >
          {persona.avatar.initials}
        </div>
        <div className="fr-persona-detail__heading">
          <h3 className="fr-persona-detail__name">{persona.name}</h3>
          <p className="fr-persona-detail__handle font-mono">{persona.handle}</p>
        </div>
        <span
          className={`fr-persona-detail__chip${pinned ? " fr-persona-detail__chip--pinned" : ""}`}
          aria-hidden
        >
          {pinned ? "pinned" : "auto"}
        </span>
      </header>
      <dl className="fr-persona-detail__dl">
        <Row label="Age" value={String(persona.age)} />
        <Row label="Location" value={persona.location} />
        <Row label="Occupation" value={persona.occupation} />
        <Row label="Bio" value={persona.bio} />
        <Row label="Voice" value={persona.voice} />
      </dl>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
