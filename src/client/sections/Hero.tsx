export function Hero() {
  return (
    <section className="relative">
      <div className="hero-mesh" aria-hidden />
      <div className="relative max-w-page mx-auto px-6 lg:px-8 pt-14 pb-6 md:pt-20 md:pb-8">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          Audience simulator
        </p>
        <h1 className="font-display font-semibold text-[clamp(40px,6.5vw,68px)] leading-[0.98] tracking-tight max-w-content">
          Drop a post.
          <br />
          Watch <span className="text-accent">20 strangers</span> react.
        </h1>
        <p className="mt-6 max-w-content text-[17px] leading-relaxed text-muted">
          Twenty distinct voices, from a Bangalore CS grad to a Houston petroleum engineer to a
          retired Boston history teacher, ready to weigh in on anything you drop in front of them.
          Test taglines, product copy, hot takes, or pitches before they go live anywhere else.
        </p>
      </div>
    </section>
  );
}
