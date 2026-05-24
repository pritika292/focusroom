// About page: 3-pane layout matching the family convention
// (pg-inspector #123). Left column = story; middle column = tech +
// architecture diagram; right column = author contact + portfolio links.

const EMAIL = "pritikaapriyadarshini@gmail.com";
const GITHUB = "https://github.com/pritika292/focusroom";
const LINKEDIN = "https://www.linkedin.com/in/pritika-priyadarshini/";
const PORTFOLIO = "https://pritika.studio/";
const RESUME = "https://pritika.studio/resume.pdf";

const TECH = [
  {
    name: "Express 5 + TypeScript",
    rationale: "Thin HTTP layer; the interesting code lives in services, not routes.",
  },
  {
    name: "React 19 + Vite + Tailwind",
    rationale: "SPA with SSE-driven live posts; Vite for instant dev startup.",
  },
  {
    name: "Postgres (focusroom schema)",
    rationale: "Two tables: simulations + posts. Threaded via parent_post_id.",
  },
  {
    name: "Azure OpenAI gpt-4.1-mini",
    rationale: "Auth via DefaultAzureCredential (Managed Identity), no API keys.",
  },
  {
    name: "Azure AI Content Safety Prompt Shields",
    rationale: "Microsoft-trained prompt-injection classifier; fails safe on error.",
  },
  {
    name: "Server-Sent Events (SSE)",
    rationale: "Half-duplex push for live post events; per-simId pub/sub hub.",
  },
  {
    name: "Vitest + supertest",
    rationale: "93 tests (77 unit + 16 integration), real Postgres in CI.",
  },
];

export function About() {
  return (
    <section className="max-w-page mx-auto px-6 lg:px-8 pt-10 pb-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-12">
        <Story />
        <TechAndDiagram />
        <Contact />
      </div>
    </section>
  );
}

function Story() {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">The story</p>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-6">
        Twenty strangers, one prompt, ninety seconds.
      </h1>
      <div className="space-y-4 text-[15.5px] leading-relaxed">
        <p>
          FocusRoom is an audience simulator. A visitor types one message, a tagline, a product
          name, a hot take, a question, and twenty hardcoded AI personas react in real time.
          Threaded comments stream in as the orchestrator runs through sixty turns.
        </p>
        <p>
          Each persona has a fixed demographic and voice: an ICU nurse in Toronto, a soybean farmer
          in Missouri, a marine biologist in Sydney, a sleep-deprived CS undergrad in Bangalore.
          They argue, agree, scroll past, or pile on, the way a real comment section does.
        </p>
        <p>
          The point is audience simulation before you publish. Founders A/B-test taglines, marketers
          gauge reactions to copy, designers run lightweight focus groups. The engineering point is
          multi-agent orchestration with five layers of prompt-injection defense and Azure Managed
          Identity throughout (no API keys anywhere).
        </p>
        <p>
          Built by{" "}
          <a
            href={PORTFOLIO}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pritika Priyadarshini
          </a>{" "}
          as part of the pritika.studio family. Source on{" "}
          <a
            href={GITHUB}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function TechAndDiagram() {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">
        How it's built
      </p>
      <div className="fr-arch-card mb-6">
        <ArchitectureDiagram />
      </div>
      <ul className="space-y-3">
        {TECH.map((t) => (
          <li key={t.name} className="text-[14.5px] leading-snug">
            <span className="font-semibold">{t.name}</span>
            <span className="text-muted"> — {t.rationale}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Contact() {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">
        Get in touch
      </p>
      <div className="flex flex-col gap-2.5">
        <a
          href={`mailto:${EMAIL}`}
          className="fr-about-link fr-about-link--primary"
          aria-label={`Email ${EMAIL}`}
        >
          <span className="fr-about-link__label">Email</span>
          <span className="fr-about-link__value font-mono">{EMAIL}</span>
        </a>
        <a href={RESUME} className="fr-about-link" target="_blank" rel="noopener noreferrer">
          <span className="fr-about-link__label">Resume</span>
          <span className="fr-about-link__value">PDF download</span>
        </a>
        <a href={LINKEDIN} className="fr-about-link" target="_blank" rel="noopener noreferrer">
          <span className="fr-about-link__label">LinkedIn</span>
          <span className="fr-about-link__value">in/pritika-priyadarshini</span>
        </a>
        <a href={GITHUB} className="fr-about-link" target="_blank" rel="noopener noreferrer">
          <span className="fr-about-link__label">GitHub</span>
          <span className="fr-about-link__value">pritika292/focusroom</span>
        </a>
        <a href={PORTFOLIO} className="fr-about-link" target="_blank" rel="noopener noreferrer">
          <span className="fr-about-link__label">Portfolio</span>
          <span className="fr-about-link__value">pritika.studio</span>
        </a>
      </div>
    </div>
  );
}

function ArchitectureDiagram() {
  // Hand-positioned SVG. Static, no library, no auto-layout, no Mermaid.
  return (
    <svg
      viewBox="0 0 360 280"
      width="100%"
      role="img"
      aria-label="focusroom architecture: browser -> Express -> orchestrator -> Postgres + Azure OpenAI + Prompt Shields, with SSE back to browser"
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="currentColor" />
        </marker>
      </defs>
      <g stroke="currentColor" strokeWidth="1.2" fill="none" style={{ color: "var(--muted)" }}>
        {/* Browser */}
        <rect x="120" y="10" width="120" height="38" rx="4" />
        {/* Express */}
        <rect x="120" y="100" width="120" height="50" rx="4" />
        {/* Orchestrator */}
        <rect x="120" y="180" width="120" height="38" rx="4" />
        {/* Postgres */}
        <rect x="10" y="180" width="92" height="38" rx="4" />
        {/* Azure */}
        <rect x="258" y="180" width="92" height="60" rx="4" />
        {/* Arrows */}
        <line x1="180" y1="48" x2="180" y2="100" markerEnd="url(#arrowhead)" />
        <line x1="180" y1="150" x2="180" y2="180" markerEnd="url(#arrowhead)" />
        <line x1="170" y1="218" x2="105" y2="200" markerEnd="url(#arrowhead)" />
        <line x1="240" y1="200" x2="258" y2="200" markerEnd="url(#arrowhead)" />
        {/* SSE back */}
        <path
          d="M 158 100 C 70 90 70 50 130 48"
          markerEnd="url(#arrowhead)"
          strokeDasharray="3 3"
        />
      </g>
      <g
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="10"
        style={{ fill: "var(--text)" }}
        textAnchor="middle"
      >
        <text x="180" y="32">
          Browser (SPA)
        </text>
        <text x="180" y="121">
          Express :3016
        </text>
        <text x="180" y="140" style={{ fill: "var(--muted)" }}>
          POST /api/sim · GET /api/sim/:id/stream
        </text>
        <text x="180" y="202">
          Orchestrator (60 turns)
        </text>
        <text x="56" y="202">
          Postgres
        </text>
        <text x="56" y="215" style={{ fill: "var(--muted)" }}>
          focusroom
        </text>
        <text x="304" y="202">
          Azure OpenAI
        </text>
        <text x="304" y="215" style={{ fill: "var(--muted)" }}>
          gpt-4.1-mini
        </text>
        <text x="304" y="230" style={{ fill: "var(--muted)" }}>
          + Prompt Shields
        </text>
      </g>
      <g
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="9"
        style={{ fill: "var(--accent)" }}
      >
        <text x="92" y="78">
          SSE
        </text>
      </g>
    </svg>
  );
}
