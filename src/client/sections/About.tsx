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
      <div className="space-y-4 text-[15.5px] leading-relaxed text-justify hyphens-auto">
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
  // 540x320 viewBox matches pg-inspector + shortlive density so the
  // diagram reads as substantial at column width rather than sparse.
  return (
    <svg
      viewBox="0 0 540 320"
      className="block w-full h-auto"
      role="img"
      aria-label="focusroom flow: browser POSTs to Express; rate-limit + validate + Prompt Shields gate the input; orchestrator runs 60 turns; per turn it calls Azure OpenAI with Managed Identity, sanitizes, runs output safety, INSERTs a post, and publishes an SSE event back to the browser via the in-process hub."
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="fr-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>

      {/* Browser */}
      <Box x={10} y={130} w={110} h={50} label="browser" sub="React + EventSource" />

      {/* Express */}
      <Box x={170} y={130} w={140} h={50} label="Express :3016" sub="route + middleware" accent />

      {/* Three security layers, stacked along the right rail */}
      <Box x={360} y={10} w={170} h={48} label="layer 1" sub="rate-limit + validate" />
      <Box x={360} y={68} w={170} h={48} label="layer 2" sub="Prompt Shields (Azure)" />
      <Box x={360} y={126} w={170} h={48} label="layer 3" sub="orchestrator + output safety" />

      {/* Bottom row: Azure + Postgres */}
      <Box x={360} y={200} w={170} h={48} label="Azure OpenAI" sub="gpt-4.1-mini" dashed />
      <Box x={360} y={258} w={170} h={48} label="Postgres" sub="focusroom schema" dashed />

      {/* Auth + SSE side annotations */}
      <Box x={10} y={10} w={120} h={48} label="Managed Identity" sub="no API keys" dashed />
      <Box x={10} y={258} w={120} h={48} label="SSE hub" sub="per-simId pub/sub" />

      {/* Edges: browser <-> express */}
      <Edge from={[120, 155]} to={[170, 155]} both />

      {/* express -> 3 layers */}
      <Edge from={[310, 145]} to={[360, 35]} />
      <Edge from={[310, 152]} to={[360, 92]} />
      <Edge from={[310, 159]} to={[360, 150]} />

      {/* layer 3 -> postgres + azure (the work it does each turn) */}
      <Edge from={[445, 174]} to={[445, 200]} dashed />
      <Edge from={[445, 174]} to={[445, 258]} dashed />

      {/* Managed Identity -> Express (used to mint Azure bearer) */}
      <Edge from={[70, 58]} to={[200, 135]} dashed />

      {/* Express -> SSE hub -> browser (asynchronous push) */}
      <Edge from={[200, 180]} to={[70, 258]} dashed />
      <Edge from={[70, 282]} to={[65, 180]} dashed />

      {/* Labels */}
      <g
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="9.5"
        style={{ fill: "var(--accent)" }}
      >
        <text x="145" y="148">
          POST /sim
        </text>
        <text x="142" y="167">
          GET stream
        </text>
      </g>

      {/* Caption */}
      <text
        x="270"
        y="316"
        textAnchor="middle"
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="9.5"
        style={{ fill: "var(--muted)" }}
      >
        solid: request path · dashed: side-flows (auth, persistence, async push)
      </text>
    </svg>
  );
}

function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  accent,
  dashed,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  accent?: boolean;
  dashed?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill="none"
        stroke={accent ? "var(--accent)" : "var(--muted)"}
        strokeWidth={accent ? 1.4 : 1.1}
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 2 : y + h / 2 + 4}
        textAnchor="middle"
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="11"
        style={{ fill: accent ? "var(--accent)" : "var(--text)" }}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          fontFamily="ui-monospace, SF Mono, Menlo, monospace"
          fontSize="9"
          style={{ fill: "var(--muted)" }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Edge({
  from,
  to,
  dashed,
  both,
}: {
  from: [number, number];
  to: [number, number];
  dashed?: boolean;
  both?: boolean;
}) {
  return (
    <line
      x1={from[0]}
      y1={from[1]}
      x2={to[0]}
      y2={to[1]}
      stroke="var(--muted)"
      strokeWidth={1.1}
      strokeDasharray={dashed ? "4 3" : undefined}
      markerEnd="url(#fr-arrow)"
      markerStart={both ? "url(#fr-arrow)" : undefined}
    />
  );
}
