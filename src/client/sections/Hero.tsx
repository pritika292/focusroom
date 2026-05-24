export function Hero() {
  return (
    <section className="relative">
      <div className="hero-mesh" aria-hidden />
      <div className="relative max-w-page mx-auto px-6 pt-14 pb-6 md:pt-20 md:pb-8">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mb-4">
          Audience simulator
        </p>
        <h1 className="font-display font-semibold text-[clamp(40px,6.5vw,68px)] leading-[0.98] tracking-tight max-w-content">
          Drop a post.
          <br />
          Watch <span className="text-accent">20 strangers</span> react.
        </h1>
        <p className="mt-6 max-w-content text-[17px] leading-relaxed text-muted">
          Twenty hardcoded personas, each with a fixed demographic and voice, get 60 turns to react
          to your message. They might comment, reply to another agent, or scroll past in silence.
          Useful for testing taglines, product copy, hot takes, or anything else before it goes live
          anywhere else.
        </p>
      </div>
    </section>
  );
}
