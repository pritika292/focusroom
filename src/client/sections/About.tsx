// About page: 3-pane layout matching the family convention
// (pg-inspector #123). The architecture diagram now spans the full page
// width above the 3-column grid so the distributed-systems topology
// reads as substantial; the column is just the tech-with-rationale list.

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
      {/* Full-width architecture diagram. Promoted out of the middle
          column so the topology reads at a normal viewport width. */}
      <div className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">
          Architecture
        </p>
        <div className="fr-arch-card">
          <ArchitectureDiagram />
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-12">
        <Story />
        <Tech />
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

function Tech() {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-3">
        How it's built
      </p>
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

// Dense distributed-systems topology. Hand-positioned SVG; no library.
// Boxes grouped by tier with an Azure-VM subgraph frame so the picture
// reads as real infrastructure, not a marketing flowchart. Sized for
// full-width About display.
function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 1200 760"
      className="block w-full h-auto"
      role="img"
      aria-label="focusroom architecture: visitor browser POSTs through Caddy on an Azure VM into Express; four input gates run in order (rate limit, zod validate, Azure Prompt Shields, daily budget) before the orchestrator launches; each of 60 turns rolls 33/33/33 (original/reply/skip), calls Azure OpenAI with Managed Identity, sanitizes, runs output safety, inserts into Postgres, and publishes to a per-simId SSE hub which fans out to the browser; per-call token usage is fire-and-forget reported to controlroom; deploys land via GitHub Actions + OIDC + az vm run-command."
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
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
        </marker>
      </defs>

      {/* EXTERNAL (left column) */}
      <GroupLabel x={100} y={32} label="EXTERNAL" />
      <Box x={20} y={50} w={200} h={56} label="visitor browser" sub="React 19 · EventSource SSE" />
      <Box
        x={20}
        y={130}
        w={200}
        h={56}
        label="controlroom"
        sub="POST /api/ai-usage/focusroom"
        dashed
      />
      <Box x={20} y={210} w={200} h={56} label="GitHub Actions" sub="OIDC token exchange" dashed />

      {/* VM subgraph */}
      <VmFrame x={280} y={20} w={620} h={720} label="Azure VM · B2as_v2 · northcentralus" />

      {/* EDGE */}
      <GroupLabel x={420} y={62} label="EDGE" />
      <Box x={310} y={80} w={220} h={56} label="Caddy" sub="TLS · focusroom.pritika.studio" />

      {/* APP */}
      <GroupLabel x={420} y={170} label="APP · focusroom :3016" />
      <Box
        x={310}
        y={190}
        w={220}
        h={62}
        label="Express 5 · Node 24"
        sub="helmet · 32kb body · CSP"
        accent
      />

      {/* INPUT GATES · in order */}
      <GroupLabel x={420} y={280} label="INPUT GATES · sequential" />
      <Box
        x={310}
        y={300}
        w={220}
        h={50}
        label="Layer 1 · IP rate limit"
        sub="10 / hour · sliding window"
      />
      <Box
        x={310}
        y={360}
        w={220}
        h={50}
        label="Layer 2 · zod validate"
        sub="length · slur · PII · regex"
      />
      <Box
        x={310}
        y={420}
        w={220}
        h={50}
        label="Layer 3 · Prompt Shields"
        sub="Azure Content Safety · MI auth"
      />
      <Box
        x={310}
        y={480}
        w={220}
        h={50}
        label="Layer 4 · budget gate"
        sub="503 + Retry-After if exceeded"
      />

      {/* ORCHESTRATOR · per-sim loop */}
      <GroupLabel x={420} y={560} label="ORCHESTRATOR · async, per simId" />
      <Box x={310} y={580} w={220} h={56} label="60-turn loop" sub="20 personas × 3 chances" />
      <Box x={310} y={648} w={220} h={50} label="33 / 33 / 33 dice" sub="original · reply · skip" />

      {/* DATA PLANE (right column) */}
      <GroupLabel x={730} y={62} label="DATA PLANE · pritika network" />
      <Box
        x={620}
        y={80}
        w={260}
        h={70}
        label="Postgres 16 · focusroom"
        sub="simulations · posts (parent_post_id self-FK)"
      />
      <Box
        x={620}
        y={170}
        w={260}
        h={56}
        label="SSE hub · in-process"
        sub="Map<simId, Set<client>> · fan-out"
      />

      {/* PER-TURN PIPELINE */}
      <GroupLabel x={730} y={258} label="PER-TURN PIPELINE" />
      <Box
        x={620}
        y={278}
        w={260}
        h={50}
        label="context builder"
        sub="DFS thread walk · parent chain"
      />
      <Box x={620} y={338} w={260} h={50} label="sanitize" sub="strip em / en dashes" />
      <Box
        x={620}
        y={398}
        w={260}
        h={50}
        label="output safety scanner"
        sub="slur regex · prompt-leak heuristic"
      />
      <Box
        x={620}
        y={458}
        w={260}
        h={50}
        label="record spend → aiUsageEmit"
        sub="tokens in/out · daily total"
        dashed
      />

      {/* AZURE */}
      <GroupLabel x={730} y={528} label="AZURE" />
      <Box x={620} y={548} w={260} h={56} label="Azure OpenAI" sub="gpt-4.1-mini · pritika-ai" />
      <Box
        x={620}
        y={618}
        w={260}
        h={50}
        label="Managed Identity"
        sub="VM system-assigned · CSU role"
        dashed
      />
      <Box
        x={620}
        y={680}
        w={260}
        h={50}
        label="Azure Key Vault"
        sub="Postgres creds · boot only"
        dashed
      />

      {/* CONTROL PLANE (far right) */}
      <GroupLabel x={1020} y={32} label="CONTROL PLANE" />
      <Box
        x={920}
        y={50}
        w={260}
        h={56}
        label="GitHub · pritika292/focusroom"
        sub="ci · deploy · OIDC"
        dashed
      />
      <Box
        x={920}
        y={120}
        w={260}
        h={56}
        label="Azure Entra ID"
        sub="federated identity credential"
        dashed
      />
      <Box
        x={920}
        y={190}
        w={260}
        h={56}
        label="Azure RBAC"
        sub="CSU on pritika-ai · VM Contributor"
        dashed
      />
      <Box
        x={920}
        y={260}
        w={260}
        h={56}
        label="az vm run-command"
        sub="git pull · compose up"
        dashed
      />

      {/* Edges */}
      {/* Browser <-> Caddy/Express */}
      <Edge from={[220, 78]} to={[310, 108]} both />
      <Edge from={[420, 138]} to={[420, 190]} />

      {/* Express -> input gates (sequential) */}
      <Edge from={[420, 252]} to={[420, 300]} />
      <Edge from={[420, 350]} to={[420, 360]} />
      <Edge from={[420, 410]} to={[420, 420]} />
      <Edge from={[420, 470]} to={[420, 480]} />

      {/* Layer 4 -> orchestrator (spawn) */}
      <Edge from={[420, 530]} to={[420, 580]} />
      {/* 60-turn loop -> dice */}
      <Edge from={[420, 636]} to={[420, 648]} />

      {/* Orchestrator/dice -> per-turn pipeline (context → sanitize → safety → spend) */}
      <Edge from={[530, 663]} to={[620, 303]} />
      <Edge from={[620, 303]} to={[620, 338]} />
      <Edge from={[620, 363]} to={[620, 398]} />
      <Edge from={[620, 423]} to={[620, 458]} />

      {/* Pipeline -> Postgres (INSERT post) + SSE hub (publish) */}
      <Edge from={[620, 423]} to={[620, 150]} />
      <Edge from={[620, 423]} to={[620, 198]} />

      {/* SSE hub -> browser (async push) */}
      <Edge from={[620, 198]} to={[220, 78]} dashed />

      {/* AI client -> Azure OpenAI via MI */}
      <Edge from={[620, 458]} to={[620, 548]} />
      <Edge from={[620, 576]} to={[620, 618]} dashed />
      {/* MI -> Prompt Shields (also auth path) */}
      <Edge from={[750, 618]} to={[530, 445]} dashed />
      {/* MI -> Key Vault */}
      <Edge from={[750, 668]} to={[750, 680]} dashed />

      {/* aiUsageEmit -> controlroom */}
      <Edge from={[620, 483]} to={[220, 158]} dashed />

      {/* Deploy: GitHub -> Entra ID -> RBAC -> run-command -> Express */}
      <Edge from={[920, 78]} to={[920, 148]} dashed />
      <Edge from={[920, 148]} to={[920, 218]} dashed />
      <Edge from={[920, 218]} to={[920, 288]} dashed />
      <Edge from={[920, 288]} to={[530, 240]} dashed />

      {/* Caption */}
      <text
        x="600"
        y="742"
        textAnchor="middle"
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="12"
        fill="var(--muted)"
      >
        ── solid: synchronous request / write · - - dashed: async push · auth · telemetry · deploy
      </text>
    </svg>
  );
}

function GroupLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="ui-monospace, SF Mono, Menlo, monospace"
      fontSize="11"
      letterSpacing="2"
      fill="var(--muted)"
      style={{ textTransform: "uppercase" }}
    >
      {label}
    </text>
  );
}

function VmFrame({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        ry={10}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <text
        x={x + 14}
        y={y + 14}
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize="10"
        letterSpacing="2"
        fill="var(--muted)"
        style={{ textTransform: "uppercase" }}
      >
        {label}
      </text>
    </g>
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
        rx={6}
        fill="none"
        stroke={accent ? "var(--accent)" : "var(--muted)"}
        strokeWidth={accent ? 1.5 : 1.25}
        strokeDasharray={dashed ? "6 4" : undefined}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2 + 5}
        textAnchor="middle"
        fontFamily="ui-monospace, SF Mono, Menlo, monospace"
        fontSize={accent ? "16" : "14"}
        fontWeight={accent ? 600 : 500}
        fill={accent ? "var(--accent)" : "var(--text)"}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          fontFamily="ui-monospace, SF Mono, Menlo, monospace"
          fontSize="11"
          fill="var(--muted)"
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
      strokeWidth={1.5}
      strokeDasharray={dashed ? "6 4" : undefined}
      markerEnd="url(#fr-arrow)"
      markerStart={both ? "url(#fr-arrow)" : undefined}
    />
  );
}
