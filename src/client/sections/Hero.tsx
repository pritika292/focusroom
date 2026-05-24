export function Hero() {
  return (
    <section className="relative">
      <div className="hero-mesh" aria-hidden />
      <div className="relative max-w-page mx-auto px-6 pt-16 pb-10 md:pt-20 md:pb-12">
        <h1 className="font-display font-semibold text-[clamp(40px,7vw,72px)] leading-[0.95] tracking-tight max-w-content">
          Drop a post. Watch 20 strangers react.
        </h1>
        <p className="mt-6 max-w-content leading-relaxed text-muted">
          FocusRoom is an audience simulator. Twenty hardcoded personas, each with a fixed
          demographic and voice, get sixty chances to comment on your message. Original takes,
          replies, the occasional silent scroll. Useful for marketers, founders, and anyone wanting
          to see reactions before going live.
        </p>
      </div>
    </section>
  );
}
